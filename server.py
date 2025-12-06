#!/usr/bin/env python3
"""
FormForce Local Development Server
Serves the FormForce application on localhost:8000
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

PORT = 8000
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def log_message(self, format, *args):
        """Override to customize logging"""
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format%args))

def run_server():
    """Start the HTTP server"""
    handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"╔{'═'*50}╗")
        print(f"║ FormForce Server Started                       ║")
        print(f"║                                                ║")
        print(f"║ 🚀 Local: http://localhost:{PORT}                  ║")
        print(f"║ 📂 Serving: {str(DIRECTORY):<27} ║")
        print(f"║                                                ║")
        print(f"║ Press Ctrl+C to stop                           ║")
        print(f"╚{'═'*50}╝")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n⛔ Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    run_server()
