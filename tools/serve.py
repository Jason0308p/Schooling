"""
本機開發伺服器：跟 `python -m http.server` 一樣，但加上「不要快取」標頭，
改完課程內容按 F5 就能看到新版本（瀏覽器預設會快取 JS 模組）。

用法：python tools/serve.py [port]   （start.bat 會自動呼叫）
"""
import http.server
import mimetypes
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/markdown; charset=utf-8", ".md")


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # 只印錯誤，避免視窗被洗版
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
        print(f"  SQL 實戰營 已啟動：http://localhost:{PORT}/  （關閉視窗即停止）")
        httpd.serve_forever()
