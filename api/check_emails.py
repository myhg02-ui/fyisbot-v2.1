from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Respuesta de prueba
        response = {
            'success': True,
            'codes': [],
            'count': 0,
            'message': 'API funcionando correctamente'
        }
        
        self.wfile.write(json.dumps(response).encode())
        return
