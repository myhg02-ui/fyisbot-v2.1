from http.server import BaseHTTPRequestHandler
import json
import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from datetime import timedelta, datetime
import re
from urllib.parse import parse_qs, urlparse

# Credenciales Yandex
YANDEX_USER = 'netflixmyhg@yandex.com'
YANDEX_PASSWORD = 'dccvunwyiszhvvim'
IMAP_SERVER = 'imap.yandex.com'
IMAP_PORT = 993

# Asuntos exactos de Netflix a filtrar
# Optimización v2.1.6-ultra
MAX_EMAILS_PROCESS = 10  # Procesar máximo 10 emails
MAX_AGE_MINUTES = 15     # Emails de últimos 15 minutos
MAX_RESULTS = 3          # Máximo 3 resultados

# Asuntos de Netflix a filtrar (7 patrones + crítico)
FILTER_SUBJECTS = [
    'Importante: Como actualizar tu Hogar con Netflix',
    'Tu codigo de acceso temporal de Netflix',
    'Importante: Como cambiar tu hogar Netflix',
    'Netflix: Tu codigo de inicio de sesion',
    'codigo de inicio',
    'codigo para iniciar sesion',
    'iniciar sesion',
    'Tu código de inicio de sesión'  # CRÍTICO
]

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Obtener email del query
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            user_email = params.get('email', [''])[0]
            
            # Conectar a Yandex
            mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
            mail.login(YANDEX_USER, YANDEX_PASSWORD)
            mail.select("inbox")
            
            # Buscar ultimos correos
            status, messages = mail.search(None, 'ALL')
            email_ids = messages[0].split()
            last_10 = email_ids[-10:] if len(email_ids) >= 10 else email_ids
            
            codes_list = []
            now = datetime.now()
            
            for eid in reversed(last_10):
                try:
                    status, data = mail.fetch(eid, '(RFC822)')
                    msg = email.message_from_bytes(data[0][1])
                    
                    # Obtener asunto
                    subject_header = decode_header(msg["Subject"])[0]
                    subject = subject_header[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(subject_header[1] or 'utf-8')
                    
                    # Filtrar solo asuntos especificos de Netflix
                    if not any(filtro.lower() in subject.lower() for filtro in FILTER_SUBJECTS):
                        continue
                    
                    # Obtener fecha
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
                    
                    # Obtener contenido
                    content = self.get_content(msg)
                    
                    # Extraer codigo de 4 digitos con patrones del bot original
                    code = self.extract_code(content)
                    
                    # Extraer link con patrones del bot original
                    link = self.extract_link(content)
                    
                    codes_list.append({
                        'subject': subject,
                        'to': msg.get("To", ""),
                        'date': formatted_date,
                        'code': code,
                        'link': link
                    })
                except:
                    continue
            
            mail.logout()
            
            # Enviar respuesta
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'codes': codes_list,
                'count': len(codes_list),
                'userEmail': user_email,
                'version': 'v2.1.6-ultra-optimized',
                'processed': processed,
                'max_age_minutes': MAX_AGE_MINUTES
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'success': False,
                'error': str(e),
                'codes': [],
                'count': 0
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
    
    def extract_code(self, text):
        """Extraer codigo de 4 digitos - Patrones mejorados"""
        patterns = [
            r'codigo.*?(\d{4})',
            r'code.*?(\d{4})',
            r'inicio de sesion.*?(\d{4})',  # CRÍTICO
            r'iniciar sesion.*?(\d{4})',
            r'(?:^|\s)(\d{4})(?:\s|$)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    def extract_link(self, text):
        """Extraer enlaces - Patrones del bot original"""
        patterns = [
            r'Si, la envie yo.*?(https?://[^\s]+)',
            r'Obtener codigo.*?(https?://[^\s]+)',
            r'Solicitar codigo.*?(https?://[^\s]+)',
            r'Si, lo solicite yo.*?(https?://[^\s]+)',
            r'(https://www\.netflix\.com/account/[^\s]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                link = match.group(1)
                link = link.strip('>,;')
                return link
        return None
