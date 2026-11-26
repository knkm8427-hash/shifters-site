/* ARCHIVE 테마: 키캡 누르기 (클릭·터치·키보드 Shift) */
(() => {
  "use strict";
  const keys = document.querySelectorAll(".arc-key, .contact-shift-key");
  if (!keys.length) return;

  const press = (el) => {
    el.classList.remove("is-pressed");
    void el.offsetWidth;
    el.classList.add("is-pressed");
    window.setTimeout(() => el.classList.remove("is-pressed"), 260);
  };

  keys.forEach((el) => el.addEventListener("click", () => press(el)));

  // 키보드의 실제 Shift 키를 누르면 화면의 키캡도 눌립니다.
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Shift" || event.repeat) return;
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    keys.forEach(press);
  });
})();

/* 메인: 크레딧 문장을 타자기로 치는 것처럼 */
(() => {
  "use strict";
  const lines = [...document.querySelectorAll(".arc-typewriter [data-type]")];
  if (!lines.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { lines.forEach((el) => { el.textContent = el.dataset.type; }); return; }

  const caret = document.createElement("span");
  caret.className = "arc-caret";
  caret.setAttribute("aria-hidden", "true");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const jitter = (a, b) => a + Math.random() * (b - a);
  const put = (el, text) => { el.textContent = text; el.appendChild(caret); };

  async function loop() {
    await wait(600);
    for (;;) {
      for (const el of lines) {
        const word = el.dataset.type;
        for (let i = 1; i <= word.length; i++) {
          put(el, word.slice(0, i));
          await wait(word[i - 1] === " " ? jitter(120, 220) : jitter(55, 150));
        }
        await wait(380);
      }
      await wait(4200);
      for (const el of [...lines].reverse()) {
        const word = el.textContent;
        for (let i = word.length - 1; i >= 0; i--) {
          put(el, word.slice(0, i));
          await wait(22);
        }
        el.textContent = "";
      }
      put(lines[0], "");
      await wait(700);
    }
  }
  // 글자가 늘어나도 문장이 좌우로 흔들리지 않도록 완성된 폭을 미리 잡아둡니다.
  const fix = () => lines.forEach((el) => {
    const keep = el.textContent;
    el.style.width = "";
    el.textContent = el.dataset.type;
    el.style.width = Math.ceil(el.getBoundingClientRect().width + 12) + "px";
    el.textContent = keep;
  });
  lines.forEach((el) => { el.textContent = ""; });
  fix();
  window.addEventListener("resize", fix);
  put(lines[0], "");
  loop();
})();
