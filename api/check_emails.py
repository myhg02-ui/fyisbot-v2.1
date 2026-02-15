import json
import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from datetime import timedelta, datetime
import re
from urllib.parse import parse_qs

# Configuración del correo Yandex
YANDEX_USER = 'netflixmyhg@yandex.com'
YANDEX_APP_PASSWORD = 'dccvunwyiszhvvim'
IMAP_SERVER = 'imap.yandex.com'
IMAP_PORT = 993

# Filtros de correos de Netflix
FILTER_SENDER = 'info@account.netflix.com'
FILTER_SUBJECTS = [
    'Importante: Cómo actualizar tu Hogar con Netflix',
    'Tu código de acceso temporal de Netflix',
    'Importante: Cómo cambiar tu hogar Netflix',
    'Netflix: Tu código de inicio de sesión'
]

def connect_to_mail():
    """Conectar al servidor IMAP de Yandex"""
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(YANDEX_USER, YANDEX_APP_PASSWORD)
        return mail
    except Exception as e:
        raise Exception(f"Error al conectar al servidor de correo: {str(e)}")

def get_recent_emails(mail, minutes=15):
    """Obtener correos recientes de Netflix"""
    mail.select("inbox")
    
    # Buscar todos los correos
    status, messages = mail.search(None, 'ALL')
    email_ids = messages[0].split()
    
    # Obtener los últimos correos
    last_emails_ids = email_ids[-10:] if len(email_ids) >= 10 else email_ids
    
    emails = []
    now = datetime.now()
    
    for email_id in reversed(last_emails_ids):
        try:
            status, msg_data = mail.fetch(email_id, "(RFC822)")
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
