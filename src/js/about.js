(() => {
  "use strict";

  const page = document.querySelector(".about-page");

  if (!page) return;

  const services = Array.from(
    page.querySelectorAll(".about-service")
  );

  services.forEach((service) => {
    service.addEventListener("toggle", () => {
      if (!service.open) return;

      services.forEach((otherService) => {
        if (otherService !== service) {
          otherService.open = false;
        }
      });
    });
  });
})();

/* TOP 버튼: 일정 거리 아래로 이동했을 때만 표시 */
(() => {
    "use strict";

    const topButton = document.querySelector(".about-top-link");

    if (!topButton) return;

    let framePending = false;

    function updateVisibility() {
        const threshold = Math.min(400, window.innerHeight * 0.5);

        // 키보드로 버튼에 접근 중이면 갑자기 숨기지 않습니다.
        const hasFocus = topButton.contains(document.activeElement);

        topButton.classList.toggle(
            "is-visible",
            window.scrollY > threshold || hasFocus
        );

        framePending = false;
    }

    function scheduleUpdate() {
        if (framePending) return;

        framePending = true;
        window.requestAnimationFrame(updateVisibility);
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);

    topButton.addEventListener("focusout", scheduleUpdate);

    updateVisibility();
})();