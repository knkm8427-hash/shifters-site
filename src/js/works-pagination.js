(() => {
  "use strict";
  // 모든 작업 카드는 HTML에 들어 있고(검색엔진 수집용), 화면에는 12개씩 나눠 보여줍니다.
  // 기존 주소 형식(/works?page=1 → 두 번째 페이지)을 그대로 따릅니다.
  const PER_PAGE = 12;
  const grid = document.querySelector(".work-grid");
  const nav = document.querySelector(".work-pagination");
  if (!grid || !nav) return;

  const cards = [...grid.querySelectorAll(".work-card")];
  const total = Math.max(1, Math.ceil(cards.length / PER_PAGE));
  const params = new URLSearchParams(window.location.search);
  let page = parseInt(params.get("page") || "0", 10);
  if (!Number.isFinite(page) || page < 0) page = 0;
  if (page > total - 1) page = total - 1;

  cards.forEach((card, i) => {
    card.hidden = Math.floor(i / PER_PAGE) !== page;
  });

  const link = (p, rel, label) => {
    const a = document.createElement("a");
    a.href = p === 0 ? "/works" : `/works?page=${p}`;
    a.rel = rel;
    a.textContent = label;
    return a;
  };

  nav.textContent = "";
  if (page > 0) nav.append(link(page - 1, "prev", "← PREV"));
  const span = document.createElement("span");
  span.textContent = `${page + 1} / ${total}`;
  nav.append(span);
  if (page < total - 1) nav.append(link(page + 1, "next", "NEXT →"));
})();
