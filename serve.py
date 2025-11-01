from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for all routes
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200, "ok")
        self.end_headers()

if __name__ == '__main__':
    # Change to the directory where the script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Set up the server on port 8080
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print("Server running at http://localhost:8080")
    print("To access from other devices, use your local IP address (e.g., http://YOUR_IP:8080)")
    print("Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
