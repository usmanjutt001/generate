import os
import sys
import socket
import webbrowser
import threading
import time
from http.server import SimpleHTTPRequestHandler, HTTPServer

class QuietHTTPRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress standard HTTP request logging for quiet background server
        pass

def find_open_port(start_port=8080, max_attempts=50):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            res = sock.connect_ex(('127.0.0.1', port))
            if res != 0:
                return port
    raise RuntimeError(f"Could not find an open port in range {start_port}-{start_port + max_attempts}")

def get_base_dir():
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def main():
    base_dir = get_base_dir()
    os.chdir(base_dir)

    port = find_open_port(8080)
    server_address = ('127.0.0.1', port)

    httpd = HTTPServer(server_address, QuietHTTPRequestHandler)

    url = f"http://localhost:{port}"
    print(f"Gradient Studio Launcher running at {url}")
    print("Press Ctrl+C to shut down server.")

    # Open browser automatically after a short delay
    def open_browser():
        time.sleep(0.5)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Gradient Studio server...")
        httpd.shutdown()
        httpd.server_close()
        sys.exit(0)

if __name__ == '__main__':
    main()
