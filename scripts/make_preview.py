#!/usr/bin/env python3
"""dist/ 를 복사해 미리보기용(하위 경로에서도 열리도록 링크를 상대 경로로 바꾼) preview/ 를 만듭니다."""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST, OUT = ROOT / "dist", ROOT / "preview"
if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(DIST, OUT)
MAP = {"/works": "works.html", "/about": "about.html", "/contact": "contact.html", "/": "index.html"}
for f in list(OUT.glob("*.html")) + [OUT / "js" / "works-pagination.js"]:
    t = f.read_text(encoding="utf-8")
    for k, v in MAP.items():
        t = t.replace(f'href="{k}"', f'href="{v}"')
    t = t.replace('href="/favicon.png"', 'href="favicon.png"')
    t = t.replace('p === 0 ? "/works" : `/works?page=${p}`', 'p === 0 ? "works.html" : `works.html?page=${p}`')
    f.write_text(t, encoding="utf-8")
print("preview ready")
