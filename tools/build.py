#!/usr/bin/env python3
"""Regenerate the content <script> list in index.html from assets/js/content/**.js.
Usage: python3 tools/build.py            (update index.html)
       python3 tools/build.py --single   (also write dist/dsa-py.html, one self-contained file)
       python3 tools/build.py --artifact (also write dist/artifact.html, no <html>/<head>/<body> wrapper)
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"

def content_files():
    files = []
    for sub in ("ds", "algo"):
        files += sorted((ROOT / "assets/js/content" / sub).glob("*.js"))
    return [f.relative_to(ROOT).as_posix() for f in files]

def update_index():
    html = INDEX.read_text()
    tags = "\n".join(f'<script src="{p}"></script>' for p in content_files())
    html = re.sub(r"<!-- CONTENT:START -->.*?<!-- CONTENT:END -->",
                  f"<!-- CONTENT:START -->\n{tags}\n<!-- CONTENT:END -->", html, flags=re.S)
    INDEX.write_text(html)
    return html

def inline(html):
    def css(m):
        return "<style>\n" + (ROOT / m.group(1)).read_text() + "\n</style>"
    def js(m):
        src = (ROOT / m.group(1)).read_text().replace("</script", "<\\/script")
        return "<script>\n" + src + "\n</script>"
    html = re.sub(r'<link rel="stylesheet" href="(assets/[^"]+)">', css, html)
    html = re.sub(r'<script src="(assets/[^"]+)"></script>', js, html)
    return html

if __name__ == "__main__":
    html = update_index()
    print(f"index.html: {len(content_files())} content files")
    dist = ROOT / "dist"
    if "--single" in sys.argv or "--artifact" in sys.argv:
        dist.mkdir(exist_ok=True)
        single = inline(html)
        if "--single" in sys.argv:
            (dist / "dsa-py.html").write_text(single)
            print("wrote dist/dsa-py.html", len(single) // 1024, "KB")
        if "--artifact" in sys.argv:
            head = re.search(r"<head>(.*?)</head>", single, re.S).group(1)
            body = re.search(r"<body>(.*)</body>", single, re.S).group(1)
            head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
            (dist / "artifact.html").write_text(head.strip() + "\n" + body.strip() + "\n")
            print("wrote dist/artifact.html")
