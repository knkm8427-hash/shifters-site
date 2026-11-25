(() => {
  'use strict';
  const dialog = document.querySelector('#work-dialog');
  if (!dialog) return;
  const player = dialog.querySelector('.work-dialog__video');
  const title = dialog.querySelector('#work-dialog-title');
  const status = dialog.querySelector('.work-dialog__status');
  const playButton = dialog.querySelector('.work-dialog__play');
  const instagram = dialog.querySelector('.work-dialog__instagram');
  const previews = [...document.querySelectorAll('.work-card__preview')];
  const visible = new Set();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opener = null;
  let session = 0;

  const canPreview = video => visible.has(video) && !dialog.open
    && !document.hidden && !reducedMotion.matches && !navigator.connection?.saveData;

  function updatePreview(video) {
    if (!canPreview(video)) { video.pause(); return; }
    if (!video.getAttribute('src')) video.src = video.dataset.previewSrc;
    video.muted = true;
    video.play().then(() => {
      if (!canPreview(video)) video.pause();
    }).catch(() => { /* A blocked preview keeps its poster; clicking still opens the modal. */ });
  }
  function updatePreviews() { previews.forEach(updatePreview); }

  previews.forEach(video => {
    video.addEventListener('timeupdate', () => {
      if (video.currentTime >= 10) video.currentTime = 0;
    });
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      updatePreview(video);
    });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
        updatePreview(entry.target);
      });
    }, { threshold: 0.25 });
    previews.forEach(video => observer.observe(video));
  }
  // Older browsers retain posters instead of downloading every offscreen video.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) player.pause();
    updatePreviews();
  });
  reducedMotion.addEventListener('change', updatePreviews);

  function attemptPlayback() {
    const currentSession = session;
    player.play().then(() => {
      if (currentSession !== session || !dialog.open) return;
      playButton.hidden = true;
      status.textContent = '';
    }).catch(() => {
      if (currentSession !== session || !dialog.open) return;
      playButton.hidden = false;
      status.textContent = '자동 재생이 제한되었습니다. 재생 버튼을 눌러 주세요.';
    });
  }

  document.querySelectorAll('.work-card__open').forEach(button => {
    button.addEventListener('click', () => {
      if (dialog.open) return;
      opener = button;
      session++;
      title.textContent = button.dataset.title || '작업 영상';
      dialog.querySelector('.work-dialog__date').textContent = button.dataset.date || '';
      status.textContent = '';
      playButton.hidden = true;
      instagram.hidden = !button.dataset.permalink;
      if (button.dataset.permalink) instagram.href = button.dataset.permalink;
      else instagram.removeAttribute('href');
      player.hidden = !button.dataset.video;
      if (button.dataset.poster) player.poster = button.dataset.poster;
      else player.removeAttribute('poster');
      dialog.showModal();
      document.body.classList.add('work-dialog-open');
      updatePreviews();
      if (button.dataset.video) {
        player.muted = false;
        player.src = button.dataset.video;
        player.load(); // A fresh source starts the full video from the beginning.
        attemptPlayback();
      } else {
        status.textContent = '이 영상은 Instagram에서 시청할 수 있습니다. 아래 링크를 눌러 주세요.';
      }
    });
  });

  playButton.addEventListener('click', attemptPlayback);
  player.addEventListener('error', () => {
    if (!dialog.open || !player.getAttribute('src')) return;
    status.textContent = '영상을 불러오지 못했습니다. Instagram 원문을 확인해 주세요.';
    playButton.hidden = true;
  });
  dialog.querySelector('.work-dialog__close').addEventListener('click', () => dialog.close());
  let backdropPress = false;
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropPress = outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropPress && outside(event)) dialog.close();
    backdropPress = false;
  });
  // Native dialog handles Escape, focus containment and background inertness.
  dialog.addEventListener('close', () => {
    session++;
    player.pause();
    player.removeAttribute('src');
    player.removeAttribute('poster');
    player.load();
    document.body.classList.remove('work-dialog-open');
    opener?.focus({ preventScroll: true });
    updatePreviews();
  });
})();
