#!/usr/bin/env python3
"""쉬프터즈 홈페이지 빌드 스크립트.

src/ 의 페이지 + data/works.json + media/ 를 합쳐 dist/ 에 배포용 정적 사이트를 만듭니다.
검색 등록에 필요한 태그(네이버 소유확인, canonical, 공유 미리보기, 구조화 데이터)와
robots.txt, sitemap.xml 도 여기서 함께 만듭니다.

사용법:  python3 scripts/build.py
"""
from __future__ import annotations

import datetime as dt
import html
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
DATA = ROOT / "data" / "works.json"
SITE = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
BASE = SITE["base_url"].rstrip("/")

# 페이지별 주소와 검색 결과에 보일 제목·설명
PAGES = {
    "index.html": "/",
    "works.html": "/works",
    "about.html": "/about",
    "contact.html": "/contact",
}


def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def card_html(item: dict, no: int = 0, numbered: bool = False) -> str:
    title = esc(item["title"])
    poster = esc(item.get("poster") or "")
    video = item.get("video_url") if item.get("has_video") else None
    media = (
        f'<video class="work-card__preview" muted playsinline preload="none" aria-hidden="true" tabindex="-1"\n'
        f'           data-preview-src="{esc(video)}" poster="{poster}"></video>'
        if video
        else f'<img src="{poster}" alt="{title}" loading="lazy">'
        if (ROOT / (item.get("poster") or "_none_")).exists()
        else '<span class="work-card__placeholder">SHIFTERS</span>'
    )
    video_attr = f' data-video="{esc(video)}"' if video else ""
    return f"""<article class="work-card">
  <div class="work-card__media">
    {media}
    <span class="work-card__hint" aria-hidden="true">전체 영상 보기 ↗</span>
  </div>
  <div class="work-card__meta">{f'<span>{no:02d}</span>' if numbered else ''}<span>{esc(item.get("category") or "FILM / REEL")}</span><span>{esc(item["date"])}</span></div>
  <h3 class="work-card__title">{title}</h3>
  <button type="button" class="work-card__open" aria-haspopup="dialog" aria-controls="work-dialog"
          aria-label="{title} 전체 영상 보기"
          data-title="{title}"{video_attr} data-poster="{poster}" data-permalink="{esc(item["permalink"])}"
          data-caption="{esc(item.get("caption") or "")}"
          data-date="{esc(item["date"])}"></button>
</article>"""


def home_thumb(item: dict, no: int) -> str:
    title = esc(item["title"])
    poster = esc(item.get("poster") or "")
    return f"""<a class="arc-thumb" href="/works">
  <div class="arc-thumb__media"><img src="{poster}" alt="{title}" loading="lazy"></div>
  <div class="arc-thumb__meta"><span>No.{no:03d}</span><span>{esc(item["date"])}</span></div>
  <p class="arc-thumb__title">{title}</p>
</a>"""


def seo_head(page: str, text: str) -> str:
    """페이지의 <title>, description 을 읽어 검색·공유용 태그를 만듭니다."""
    import re

    path = PAGES[page]
    url = BASE + ("/" if path == "/" else path)
    title = re.search(r"<title>(.*?)</title>", text, re.S).group(1).strip()
    desc_m = re.search(r'<meta name="description" content="(.*?)">', text)
    desc = desc_m.group(1) if desc_m else SITE["description"]
    og_image = BASE + "/" + SITE["og_image"]

    tags = [
        f'<link rel="canonical" href="{url}">',
        f'<meta name="naver-site-verification" content="{SITE["naver_site_verification"]}">',
        '<meta name="robots" content="index,follow">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="SHIFTERS 쉬프터즈">',
        '<meta property="og:locale" content="ko_KR">',
        f'<meta property="og:title" content="{title}">',
        f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{og_image}">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<link rel="icon" href="/favicon.png" type="image/png">',
    ]
    if page == "index.html":
        org = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SHIFTERS",
            "alternateName": "쉬프터즈",
            "url": BASE + "/",
            "logo": og_image,
            "email": SITE["email"],
            "description": SITE["description"],
            "sameAs": SITE["same_as"],
        }
        tags.append(
            '<script type="application/ld+json">'
            + json.dumps(org, ensure_ascii=False)
            + "</script>"
        )
    return "\n    ".join(tags)


def render_pages(src: Path, out: Path, works: list, preview: bool) -> None:
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(src, out)
    total = len(works)
    for page in PAGES:
        p = out / page
        text = p.read_text(encoding="utf-8")
        if page == "works.html":
            text = text.replace("<!--WORKS_GRID-->", "".join(card_html(i, n + 1, True) for n, i in enumerate(works)))
        if page == "index.html":
            text = text.replace("<!--HOME_WORKS-->", "".join(home_thumb(i, total - n) for n, i in enumerate(works[:4])))
        text = text.replace("<!--WORKS_COUNT-->", str(total))
        # 수정한 디자인이 브라우저 캐시 때문에 늦게 보이지 않도록 버전 표시를 붙입니다.
        import re as _re
        stamp = dt.datetime.now().strftime("%Y%m%d%H%M")
        text = _re.sub(r'((?:href|src)="\./(?:css|js)/[^"?]+\.(?:css|js))"', lambda m: f'{m.group(1)}?v={stamp}"', text)
        if preview:
            # 디자인 확인용: 검색엔진 수집 안 함, 하위 경로에서도 열리도록 상대 링크
            text = text.replace("</title>", '</title>\n    <meta name="robots" content="noindex,nofollow">', 1)
            for k, v in {"/works": "works.html", "/about": "about.html", "/contact": "contact.html", "/": "index.html"}.items():
                text = text.replace(f'href="{k}"', f'href="{v}"')
            text = text.replace('src="media/', 'src="../media/').replace('poster="media/', 'poster="../media/').replace('data-poster="media/', 'data-poster="../media/').replace('data-preview-src="media/', 'data-preview-src="../media/').replace('data-video="media/', 'data-video="../media/')
        else:
            text = text.replace("</title>", "</title>\n    " + seo_head(page, text), 1)
        p.write_text(text, encoding="utf-8")
    if preview:
        js = out / "js" / "works-pagination.js"
        if js.exists():
            t = js.read_text(encoding="utf-8").replace('p === 0 ? "/works" : `/works?page=${p}`', 'p === 0 ? "works.html" : `works.html?page=${p}`')
            js.write_text(t, encoding="utf-8")


def build() -> None:
    works = json.loads(DATA.read_text(encoding="utf-8"))["items"]
    works.sort(key=lambda i: (i["date"], i.get("timestamp") or ""), reverse=True)

    render_pages(SRC, DIST, works, preview=False)
    media = ROOT / "media"
    if media.exists():
        shutil.copytree(media, DIST / "media")
    nxt = ROOT / "src-next"
    if nxt.exists():
        render_pages(nxt, DIST / "preview", works, preview=True)

    today = dt.date.today().isoformat()
    (DIST / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nDisallow: /preview/\n\nSitemap: {BASE}/sitemap.xml\n", encoding="utf-8"
    )
    urls = "\n".join(
        f"  <url>\n    <loc>{BASE + ('/' if path == '/' else path)}</loc>\n    <lastmod>{today}</lastmod>\n  </url>"
        for path in PAGES.values()
    )
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n",
        encoding="utf-8",
    )
    if SITE.get("custom_domain"):
        (DIST / "CNAME").write_text(SITE["custom_domain"] + "\n", encoding="utf-8")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    print(f"built {len(works)} works -> {DIST}")


if __name__ == "__main__":
    build()
