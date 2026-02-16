from http.server import BaseHTTPRequestHandler
import json
import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from datetime import timedelta, datetime
import re
from urllib.parse import parse_qs, urlparse

YANDEX_USER = "netflixmyhg@yandex.com"
YANDEX_PASSWORD = "dccvunwyiszhvvim"
IMAP_SERVER = "imap.yandex.com"
IMAP_PORT = 993

MAX_EMAILS_PROCESS = 10
MAX_AGE_MINUTES = 15
MAX_RESULTS = 3

FILTER_SUBJECTS = [
    "Importante: Cómo actualizar tu Hogar con Netflix",
    "Tu código de acceso temporal de Netflix",
    "Importante: Cómo cambiar tu hogar Netflix",
    "código de inicio",
    "código para iniciar sesión",
    "iniciar sesión",
    "Tu código de inicio de sesión"
]

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            user_email = params.get("email", [""])[0]

            if not user_email:
                self.send_error(400, "Email requerido")
                return

            mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
            mail.login(YANDEX_USER, YANDEX_PASSWORD)
            mail.select("inbox")

            status, messages = mail.search(None, "ALL")
            email_ids = messages[0].split()
            last_emails = email_ids[-MAX_EMAILS_PROCESS:] if len(email_ids) >= MAX_EMAILS_PROCESS else email_ids

            codes_list = []
            now = datetime.now()
            processed = 0

            for eid in reversed(last_emails):
                if len(codes_list) >= MAX_RESULTS:
                    break
                
                processed += 1
                
                try:
                    status, data = mail.fetch(eid, "(RFC822)")
                    msg = email.message_from_bytes(data[0][1])

                    subject_header = decode_header(msg["Subject"])[0]
                    subject = subject_header[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(subject_header[1] or "utf-8")

                    to_address = msg.get("To", "")
                    
                    if user_email.lower() not in to_address.lower():
                        continue

                    if not any(filtro.lower() in subject.lower() for filtro in FILTER_SUBJECTS):
                        continue

                    date_str = msg["Date"]
                    try:
                        date_obj = parsedate_to_datetime(date_str)
                        date_peru = date_obj - timedelta(hours=5)
                        minutes_ago = (now - date_peru.replace(tzinfo=None)).total_seconds() / 60
                        if minutes_ago > MAX_AGE_MINUTES:
                            continue
                        formatted_date = date_peru.strftime("%d/%m/%Y %H:%M")
                    except:
                        formatted_date = date_str

                    content = self.get_content(msg)
                    code = self.extract_code(content, subject)
                    link = self.extract_link(content)

                    email_type = "unknown"
                    if code and len(code) == 4:
                        if any(k in subject.lower() for k in ["código de inicio", "iniciar sesión", "inicio de sesión"]):
                            email_type = "login_code"
                        else:
                            email_type = "verification_code"
                    elif link:
                        email_type = "link"

                    codes_list.append({
                        "subject": subject,
                        "to": to_address,
                        "date": formatted_date,
                        "code": code,
                        "link": link,
                        "type": email_type
                    })
                except:
                    continue

            mail.logout()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            response = {
                "success": True,
                "codes": codes_list,
                "count": len(codes_list),
                "userEmail": user_email,
                "version": "v2.2.0-filtered",
                "processed": processed,
                "max_age_minutes": MAX_AGE_MINUTES
            }

            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            error_response = {
                "success": False,
                "error": str(e),
                "codes": [],
                "count": 0
            }

            self.wfile.write(json.dumps(error_response).encode())

    def get_content(self, msg):
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        return part.get_payload(decode=True).decode()
                    except:
                        pass
        else:
            try:
                return msg.get_payload(decode=True).decode()
            except:
                pass
        return ""

    def extract_code(self, text, subject):
        patterns = [
            r"código.*?(\d{4})",
            r"code.*?(\d{4})",
            r"inicio de sesión.*?(\d{4})",
            r"iniciar sesión.*?(\d{4})",
            r"(?:^|\s)(\d{4})(?:\s|$)"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def extract_link(self, text):
        patterns = [
            r"Sí, la envié yo.*?(https?://[^\s]+)",
            r"Obtener código.*?(https?://[^\s]+)",
            r"Solicitar código.*?(https?://[^\s]+)",
            r"Sí, lo solicité yo.*?(https?://[^\s]+)",
            r"(https://www\.netflix\.com/account/[^\s]+)"
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                link = match.group(1)
                link = link.strip(">")
                link = link.strip(",")
                link = link.strip(";")
                return link
        return None
