// const logo = document.getElementById("SHIFTERS-editable-source");
// const prompt = document.getElementById("PRESS-THE-SHIFT-KEY");

// const logoMask = document.getElementById("logo-mask");
// const promptMask = document.getElementById("prompt-mask");
// const caret = document.getElementById("animated-caret");
(() => {
    "use strict";

    const logo = document.getElementById("SHIFTERS-editable-source");
    const prompt = document.getElementById("PRESS-THE-SHIFT-KEY");
    const logoMask = document.getElementById("logo-mask");
    const promptMask = document.getElementById("prompt-mask");
    const caret = document.getElementById("animated-caret");

    // 첫 화면의 요소가 없는 페이지에서는 실행하지 않습니다.
    if (!logo || !prompt || !logoMask || !promptMask || !caret) {
        return;
    }

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const timing = {
        logoStart: 180,
        logoInterval: 190,
        promptStart: 1850,
        promptInterval: 48,
        finish: 3000
    };

    let animationFrame = 0;
    let startedAt = 0;
    let lifecycleVersion = 0;

    let logoMetrics;
    let promptMetrics;

    // 글자별 위치와 실제 글자 높이를 측정
    function measure(node) {
        const box = node.getBBox();
        const count = node.getNumberOfChars();

        const edges = Array.from({ length: count }, (_, index) => {
            const character = node.getExtentOfChar(index);
            return character.x + character.width;
        });

        return {
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            count,
            edges
        };
    }

    function updateMetrics() {
        logoMetrics = measure(logo);
        promptMetrics = measure(prompt);
    }

    // 마스크를 넓혀 정해진 개수의 글자를 보여줌
    function reveal(mask, metrics, count) {
        mask.setAttribute("x", metrics.left - 2);
        mask.setAttribute("y", metrics.top - 4);
        mask.setAttribute("height", metrics.height + 8);

        let width = 0;

        if (count >= metrics.count) {
            width = metrics.width + 4;
        } else if (count > 0) {
            width = metrics.edges[count - 1] - metrics.left + 2;
        }

        mask.setAttribute("width", Math.max(0, width));
    }

    function visibleCount(time, start, interval, total) {
        if (time < start) {
            return 0;
        }

        return Math.min(
            total,
            Math.floor((time - start) / interval) + 1
        );
    }

    // 변경된 로고 크기에 맞춰 커서 크기도 자동 조정
    function positionCaret(metrics, count) {
        const right = count > 0
            ? metrics.edges[count - 1]
            : metrics.left;

        caret.setAttribute("x", right + 6);
        caret.setAttribute("y", metrics.top);
        caret.setAttribute("height", metrics.height);
        caret.setAttribute(
            "width",
            Math.max(2, metrics.height * 0.045)
        );

        caret.style.visibility = "visible";
    }

    function stopAnimation() {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
    }

    // 재생 완료 후 글자를 그대로 유지하고 커서는 숨김
    function showComplete() {
        stopAnimation();

        reveal(logoMask, logoMetrics, logoMetrics.count);
        reveal(promptMask, promptMetrics, promptMetrics.count);

        caret.style.visibility = "hidden";
    }

    function draw(time) {
        const logoCount = visibleCount(
            time,
            timing.logoStart,
            timing.logoInterval,
            logoMetrics.count
        );

        const promptCount = visibleCount(
            time,
            timing.promptStart,
            timing.promptInterval,
            promptMetrics.count
        );

        reveal(logoMask, logoMetrics, logoCount);
        reveal(promptMask, promptMetrics, promptCount);

        if (time >= timing.promptStart) {
            positionCaret(promptMetrics, promptCount);
        } else {
            positionCaret(logoMetrics, logoCount);
        }
    }

    function tick(now) {
        const elapsed = now - startedAt;

        if (elapsed >= timing.finish) {
            showComplete();
            return;
        }

        draw(elapsed);
        animationFrame = requestAnimationFrame(tick);
    }

    function playOnce() {
        stopAnimation();
        updateMetrics();

        if (reducedMotion.matches) {
            showComplete();
            return;
        }

        draw(0);
        startedAt = performance.now();
        animationFrame = requestAnimationFrame(tick);
    }

    // 첫 화면이 표시되기 전에 타이핑 대상만 숨
    // 새로고침이나 움직임 감소 설정에서는 완성 상태를 유지
    if (!reducedMotion.matches) {
        logoMask.setAttribute("width", "0");
        promptMask.setAttribute("width", "0");
    }

    // 일반 진입과 브라우저 뒤로 가기로 복귀한 경우를 처리
    // pageshow는 스크롤이나 단순한 탭 전환에는 발생하지 않음
    window.addEventListener("pageshow", async () => {
        const version = ++lifecycleVersion;
        await document.fonts.ready;

        if (version !== lifecycleVersion) {
            return;
        }

        updateMetrics();

        if (reducedMotion.matches) {
            showComplete();
        } else {
            playOnce();
        }
    });

    // 다른 페이지로 떠날 때 실행 중인 애니메이션을 정리
    window.addEventListener("pagehide", () => {
        lifecycleVersion++;
        stopAnimation();
    });

    // 사용자가 실행 도중 움직임 감소 설정을 켜면 즉시 완성
    reducedMotion.addEventListener("change", (event) => {
        if (event.matches && logoMetrics && promptMetrics) {
            showComplete();
        }
    });
})();