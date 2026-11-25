# SHIFTERS 홈페이지 (www.shift-ers.com)

정적 사이트 + GitHub Pages 무료 호스팅. 인스타그램 @ssshifters 릴스가 6시간마다 WORKS에 자동 반영됩니다.

## 폴더
- `src/` 페이지(HTML), 디자인(CSS·JS), 폰트, 이미지
- `data/works.json` WORKS 목록. 제목을 직접 고치면 그대로 유지됩니다.
- `data/site.json` 주소, 네이버 소유확인 코드, 인스타 설정
- `media/posters/` WORKS 썸네일 (자동 저장)
- `scripts/sync_instagram.py` 인스타 게시물 가져오기
- `scripts/build.py` 배포용 `dist/` 만들기 (SEO 태그, robots.txt, sitemap.xml 포함)

## 자동 실행 (GitHub Actions)
- `deploy.yml` 코드가 바뀌거나 6시간마다: 인스타 동기화 → 빌드 → 배포
- `refresh-token.yml` 매주 월요일: 인스타 토큰 연장

## 필요한 Secrets (Settings → Secrets and variables → Actions)
- `IG_ACCESS_TOKEN` 인스타그램 장기 액세스 토큰
- `GH_PAT` 이 저장소 Secrets 쓰기 권한이 있는 GitHub 토큰 (토큰 자동 연장용)

## 직접 실행
```
pip install pillow
IG_ACCESS_TOKEN=... python3 scripts/sync_instagram.py
python3 scripts/build.py
```
