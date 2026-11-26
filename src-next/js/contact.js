/* 클릭, 터치, 키보드로 Shift 키를 눌러볼 수 있습니다. */
(() => {
    "use strict";
    const key = document.querySelector(".contact-shift-key");
    if (!key) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation;
    key.addEventListener("click", () => {
        if (reducedMotion.matches || !key.animate) return;
        animation?.cancel();
        animation = key.animate([
            { transform: "translateY(0)", offset: 0 },
            { transform: "translateY(0.07em)", offset: 0.35 },
            { transform: "translateY(0)", offset: 1 }
        ], { duration: 240, easing: "ease-out" });
    });
})();
