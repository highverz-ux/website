// Load the real Home media elements so decoded images and buffered video are
// reused by the page. Do not download a second copy of each reel via fetch().
export const HOME_MEDIA_TIMEOUT = 12000;

export function preloadHomeMedia(onProgress = () => {}) {
  const images = [...document.querySelectorAll('img')];
  const videos = [...document.querySelectorAll('#page-content video')];
  const posters = [...new Set(videos.map(video => video.poster).filter(Boolean))];
  const total = images.length + videos.length + posters.length;
  const results = [];
  let settled = 0;

  function waitFor(element, events, ready, start, source) {
    return new Promise(resolve => {
      let done = false;
      const finish = status => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        events.forEach(event => element.removeEventListener(event, check));
        element.removeEventListener('error', fail);
        results.push({ source, status });
        onProgress(++settled / Math.max(total, 1));
        resolve();
      };
      const check = () => { if (ready()) finish('ready'); };
      const fail = () => finish('error');
      const timer = setTimeout(() => finish('timeout'), HOME_MEDIA_TIMEOUT);
      if (ready()) { finish('ready'); return; }
      events.forEach(event => element.addEventListener(event, check));
      element.addEventListener('error', fail);
      start(check, fail);
      check();
    });
  }

  function imageTask(image, source) {
    let decoded = false;
    return waitFor(image, ['load'], () => decoded, (check, fail) => {
      image.loading = 'eager';
      image.decoding = 'async';
      if (!image.src) image.src = source;
      image.decode().then(() => { decoded = true; check(); }, fail);
    }, source);
  }

  const tasks = images.map(image => imageTask(image, image.currentSrc || image.src));
  tasks.push(...posters.map(source => imageTask(new Image(), source)));
  tasks.push(...videos.map(video => waitFor(video, ['loadeddata', 'canplay', 'canplaythrough', 'progress', 'suspend'], () => {
    if (video.readyState < 3) return false;
    const needed = Math.min(2, Number.isFinite(video.duration) ? video.duration : 2);
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= video.currentTime &&
          video.buffered.end(i) >= video.currentTime + needed) return true;
    }
    return false;
  }, () => {
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
    // Restart the initial metadata-only request once with preload=auto.
    // Changing the property alone can leave a paused reel at its tiny metadata
    // buffer until the user finally sees it and playback begins.
    video.load();
  }, video.currentSrc || video.src || video.dataset.src)));

  return Promise.all(tasks).then(() => {
    window.__hvHomeMediaResult = results;
    window.dispatchEvent(new CustomEvent('hv:home-media-ready', { detail: results }));
    return results;
  });
}
