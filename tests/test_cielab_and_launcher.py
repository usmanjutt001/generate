import unittest
import math
import socket
import urllib.request
import threading
import time
import os
import sys

# Import functions from launcher if available or simulate
from launcher import find_open_port, QuietHTTPRequestHandler

class TestCielabAndLauncher(unittest.TestCase):

    def test_find_open_port(self):
        port = find_open_port(8080)
        self.assertGreaterEqual(port, 8080)
        self.assertLess(port, 8130)

    def test_http_server_startup(self):
        from http.server import HTTPServer
        port = find_open_port(8090)
        server_address = ('127.0.0.1', port)
        httpd = HTTPServer(server_address, QuietHTTPRequestHandler)

        server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        server_thread.start()

        time.sleep(0.2)
        url = f"http://127.0.0.1:{port}/index.html"
        req = urllib.request.urlopen(url)
        self.assertEqual(req.getcode(), 200)
        html_content = req.read().decode('utf-8')
        self.assertIn('Gradient Studio', html_content)

        httpd.shutdown()
        httpd.server_close()

if __name__ == '__main__':
    unittest.main()
