(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const navigation = document.querySelector("#site-navigation");
  const toggle = document.querySelector(".menu-toggle");

  if (!header || !navigation || !toggle) return;

  const toggleLabel = toggle.querySelector(".menu-toggle__label");
  const links = navigation.querySelectorAll(".site-nav__link");
  const mobileQuery = window.matchMedia("(max-width: 760px)");

  // 변경: 확장자 없는 링크와 기존 .html 주소 모두 현재 메뉴를 정확히 표시합니다.
  function normalizePath(pathname) {
    const path = pathname.replace(/\.html$/, "").replace(/\/+$/, "");
    if (path === "" || path === "/index") return "/";
    if (path === "/work") return "/works";
    return path;
  }

  const currentPath = normalizePath(window.location.pathname);

  links.forEach((link) => {
    const linkUrl = new URL(link.href, window.location.href);
    const isCurrentPage =
      linkUrl.origin === window.location.origin &&
      normalizePath(linkUrl.pathname) === currentPath;

    if (isCurrentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  function isMenuOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  function setMenuOpen(open, restoreFocus = false) {
    const expanded = mobileQuery.matches && open;

    toggle.setAttribute("aria-expanded", String(expanded));
    navigation.hidden = mobileQuery.matches && !expanded;

    if (toggleLabel) {
      toggleLabel.textContent = expanded ? "메뉴 닫기" : "메뉴 열기";
    }

    if (restoreFocus) {
      toggle.focus();
    }
  }

  function syncViewport() {
    const focusedElement = document.activeElement;

    toggle.hidden = !mobileQuery.matches;

    // 화면 크기가 바뀌면 모바일 메뉴를 닫힌 상태로 초기화합니다.
    setMenuOpen(false);

    // 숨겨진 요소에 키보드 포커스가 남지 않도록 처리합니다.
    if (mobileQuery.matches && navigation.contains(focusedElement)) {
      toggle.focus();
    } else if (!mobileQuery.matches && focusedElement === toggle) {
      links[0]?.focus();
    }
  }

  toggle.addEventListener("click", () => {
    setMenuOpen(!isMenuOpen());
  });

  navigation.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest("a")) return;

    if (mobileQuery.matches) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isMenuOpen()) return;

    setMenuOpen(false, true);
  });

  document.addEventListener("click", (event) => {
    if (!isMenuOpen() || header.contains(event.target)) return;

    setMenuOpen(false);
  });

  // Tab으로 헤더를 벗어나면 펼쳐진 모바일 메뉴를 닫습니다.
  header.addEventListener("focusout", (event) => {
    if (isMenuOpen() && !header.contains(event.relatedTarget)) {
      setMenuOpen(false);
    }
  });

  mobileQuery.addEventListener("change", syncViewport);

  syncViewport();
})();