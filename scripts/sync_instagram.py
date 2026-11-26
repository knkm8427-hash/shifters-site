#!/usr/bin/env python3
"""@ssshifters 인스타그램 게시물을 가져와 data/works.json 과 썸네일을 갱신합니다.

- Instagram API (Instagram 로그인 방식) 를 사용합니다. 크리에이터/비즈니스 계정 필요.
- 환경변수 IG_ACCESS_TOKEN 에 장기 액세스 토큰이 있어야 합니다.
- 이미 있는 작업의 제목·분류는 건드리지 않습니다(직접 고친 제목이 유지됨).
- 새 게시물은 캡션 첫 줄을 제목으로 씁니다.
- 인스타에서 삭제·보관된 게시물은 홈페이지에서도 빠집니다.
- 썸네일은 media/posters/<shortcode>.jpg 로 저장해서, 인스타 이미지 주소가 만료돼도 깨지지 않습니다.
- 영상 주소는 인스타 쪽에서 며칠 뒤 만료되므로 실행할 때마다 새로 받아 둡니다.
"""
from __future__ import annotations

import datetime as dt
import io
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "works.json"
POSTERS = ROOT / "media" / "posters"
SITE = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
CFG = SITE["instagram"]
API = "https://graph.instagram.com/v21.0"
KST = dt.timezone(dt.timedelta(hours=9))
FIELDS = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp"


def get_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


def fetch_all(token: str) -> list[dict]:
    url = f"{API}/me/media?" + urllib.parse.urlencode(
        {"fields": FIELDS, "limit": 50, "access_token": token}
    )
    out: list[dict] = []
    while url:
        page = get_json(url)
        out.extend(page.get("data", []))
        url = page.get("paging", {}).get("next")
    return out


def shortcode(permalink: str) -> str:
    return [p for p in urllib.parse.urlparse(permalink).path.split("/") if p][-1]


def make_title(caption: str | None) -> str:
    lines = [l.strip() for l in (caption or "").splitlines() if l.strip()]
    title = lines[0] if lines else "SHIFTERS Project"
    limit = int(CFG.get("title_max_length", 200))
    return title[:limit]


def save_poster(url: str, path: Path) -> None:
    with urllib.request.urlopen(url, timeout=60) as r:
        im = Image.open(io.BytesIO(r.read())).convert("RGB")
    if im.width > 720:
        im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "JPEG", quality=82, optimize=True)


def main() -> int:
    token = os.environ.get("IG_ACCESS_TOKEN")
    if not token:
        print("IG_ACCESS_TOKEN 이 없습니다.", file=sys.stderr)
        return 1

    data = json.loads(DATA.read_text(encoding="utf-8"))
    existing = {i["shortcode"]: i for i in data["items"]}
    media = fetch_all(token)
    if CFG.get("only_reels", True):
        media = [m for m in media if m.get("media_product_type") == "REELS" or m.get("media_type") == "VIDEO"]
    total = len(media)
    skip_codes = set(CFG.get("exclude_shortcodes", []))
    skip_words = [w for w in CFG.get("exclude_if_caption_contains", []) if w]
    media = [
        m for m in media
        if shortcode(m["permalink"]) not in skip_codes
        and not any(w in (m.get("caption") or "") for w in skip_words)
    ]
    print(f"제외 설정으로 뺀 게시물 {total - len(media)}개")
    if not media:
        print("가져온 게시물이 0개라서 기존 목록을 그대로 둡니다.", file=sys.stderr)
        return 1

    items, added = [], 0
    for m in media:
        code = shortcode(m["permalink"])
        ts = dt.datetime.fromisoformat(m["timestamp"].replace("+0000", "+00:00")).astimezone(KST)
        item = existing.get(code) or {
            "shortcode": code,
            "title": make_title(m.get("caption")),
            "category": "FILM / REEL" if m.get("media_type") == "VIDEO" else "PHOTO",
        }
        if code not in existing:
            added += 1
        video = m.get("media_url") if m.get("media_type") == "VIDEO" else None
        item.update(
            {
                "permalink": m["permalink"],
                "date": ts.strftime("%Y.%m.%d"),
                "timestamp": ts.isoformat(),
                "caption": (m.get("caption") or "").strip(),
                "has_video": bool(video),
                "video_url": video,
                "poster": f"media/posters/{code}.jpg",
            }
        )
        poster_path = ROOT / item["poster"]
        poster_src = m.get("thumbnail_url") or (m.get("media_url") if m.get("media_type") != "VIDEO" else None)
        if not poster_path.exists() and poster_src:
            try:
                save_poster(poster_src, poster_path)
            except Exception as e:  # 썸네일 하나 실패해도 전체는 계속
                print(f"poster 실패 {code}: {e}", file=sys.stderr)
        items.append(item)

    removed = sorted(set(existing) - {i["shortcode"] for i in items})
    data["items"] = items
    data["updated"] = dt.datetime.now(KST).isoformat(timespec="minutes")
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"총 {len(items)}개 / 새로 추가 {added}개 / 빠진 게시물 {len(removed)}개 {removed}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
