from http.server import BaseHTTPRequestHandler
import json
import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from datetime import timedelta, datetime
import re
from urllib.parse import parse_qs, urlparse

# Configuracion del correo Yandex
YANDEX_USER = 'netflixmyhg@yandex.com'
YANDEX_APP_PASSWORD = 'dccvunwyiszhvvim'
IMAP_SERVER = 'imap.yandex.com'
IMAP_PORT = 993

# Filtros de correos de Netflix
FILTER_SUBJECTS = [
    'Importante: Como actualizar tu Hogar con Netflix',
    'Tu codigo de acceso temporal de Netflix',
    'Importante: Como cambiar tu hogar Netflix',
    'Netflix: Tu codigo de inicio de sesion'
]

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query parameters
            parsed_path = urlparse(self.path)
            params = parse_qs(parsed_path.query)
            user_email = params.get('email', [''])[0]
            
            # Connect to mail
            mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
            mail.login(YANDEX_USER, YANDEX_APP_PASSWORD)
            mail.select("inbox")
            
            # Get recent emails
            status, messages = mail.search(None, 'ALL')
            email_ids = messages[0].split()
            last_emails_ids = email_ids[-10:] if len(email_ids) >= 10 else email_ids
            
            emails = []
            now = datetime.now()
            
            for email_id in reversed(last_emails_ids):
                try:
                    status, msg_data = mail.fetch(email_id, "(RFC822)")
                    msg = email.message_from_bytes(msg_data[0][1])
                    
                    # Decode subject
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    
                    # Filter Netflix emails
                    if any(filtro.lower() in subject.lower() for filtro in FILTER_SUBJECTS):
                        date_str = msg["Date"]
                        try:
                            date_received = parsedate_to_datetime(date_str)
                            date_received_peru = date_received - timedelta(hours=5)
                            time_diff = now - date_received_peru.replace(tzinfo=None)
                            if time_diff.total_seconds() / 60 > 15:
                                continue
                            formatted_date = date_received_peru.strftime("%d/%m/%Y %H:%M")
                        except:
                            formatted_date = date_str
                        
                        to_address = msg.get("To", "No especificado")
                        content = self.get_mail_content(msg)
                        code = self.extract_code(content)
                        link = self.extract_link(content)
                        
                        emails.append({
                            "subject": subject,
                            "to": to_address,
                            "date": formatted_date,
                            "code": code,
                            "link": link
                        })
                except:
                    continue
            
            mail.logout()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {
                'success': True,
                'codes': emails,
                'count': len(emails),
                'userEmail': user_email
            }
            
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_data = {
                'success': False,
                'error': str(e)
            }
            
            self.wfile.write(json.dumps(error_data).encode())
    
    def get_mail_content(self, msg):
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        return part.get_payload(decode=True).decode()
                    except:
                        return ""
        else:
            try:
                return msg.get_payload(decode=True).decode()
            except:
                return ""
        return ""
    
    def extract_code(self, text):
        patterns = [
            r'codigo.*?(\d{4})',
            r'code.*?(\d{4})',
            r'(?:^|\s)(\d{4})(?:\s|$)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    def extract_link(self, text):
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
            msg = email.message_from_bytes(msg_data[0][1])
            
            # Decodificar asunto
            subject, encoding = decode_header(msg["Subject"])[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding if encoding else "utf-8")
            
            # Verificar si es un correo de Netflix con los asuntos filtrados
            if any(filtro.lower() in subject.lower() for filtro in FILTER_SUBJECTS):
                # Obtener fecha
                date_str = msg["Date"]
                try:
                    date_received = parsedate_to_datetime(date_str)
                    # Ajustar a hora de Perú (UTC-5)
                    date_received_peru = date_received - timedelta(hours=5)
                    
                    # Verificar si el correo es de los últimos X minutos
                    time_diff = now - date_received_peru.replace(tzinfo=None)
                    if time_diff.total_seconds() / 60 > minutes:
                        continue
                    
                    formatted_date = date_received_peru.strftime("%d/%m/%Y %H:%M")
                except:
                    formatted_date = date_str
                
                # Obtener destinatario
                to_address = msg.get("To", "No especificado")
                
                # Extraer contenido
                content = get_mail_content(msg)
                
                # Extraer código y/o enlace
                code = extract_code(content)
                link = extract_link(content)
                
                emails.append({
                    "subject": subject,
                    "to": to_address,
                    "date": formatted_date,
                    "code": code,
                    "link": link
                })
        except Exception as e:
            continue
    
    return emails

def get_mail_content(msg):
    """Extraer contenido del correo"""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                try:
                    return part.get_payload(decode=True).decode()
                except:
                    return ""
    else:
        try:
            return msg.get_payload(decode=True).decode()
        except:
            return ""
    return ""

def extract_code(text):
    """Extraer código de 4 dígitos del correo"""
    # Buscar patrones de código de 4 dígitos
    patterns = [
        r'código.*?(\d{4})',
        r'code.*?(\d{4})',
        r'(?:^|\s)(\d{4})(?:\s|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def extract_link(text):
    """Extraer enlace de verificación del correo"""
    patterns = [
        r'Sí, la envié yo.*?(https?://[^\s]+)',
        r'Obtener código.*?(https?://[^\s]+)',
        r'Solicitar código.*?(https?://[^\s]+)',
        r'Sí, lo solicité yo.*?(https?://[^\s]+)',
        r'(https://www\.netflix\.com/account/[^\s]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            link = match.group(1)
            # Limpiar el enlace de caracteres extraños
            link = link.strip('>,;')
            return link
    
    return None

def handler(request):
    """Handler principal para Vercel - Compatible con Web Standard API"""
    try:
        # Obtener parámetros de la URL
        from urllib.parse import urlparse, parse_qs
        url_parts = urlparse(request.url) if hasattr(request, 'url') else None
        params = parse_qs(url_parts.query) if url_parts else {}
        user_email = params.get('email', [''])[0] if params else ''
        
        # Conectar al servidor de correo
        mail = connect_to_mail()
        
        # Obtener correos recientes
        emails = get_recent_emails(mail, minutes=15)
        
        # Cerrar conexión
        mail.logout()
        
        # Retornar respuesta JSON
        from http.server import BaseHTTPRequestHandler
        import json
        
        response_data = {
            'success': True,
            'codes': emails,
            'count': len(emails),
            'userEmail': user_email
        }
        
        return json.dumps(response_data)
    
    except Exception as e:
        import json
        return json.dumps({
            'success': False,
            'error': str(e)
        })
