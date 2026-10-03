/**
 * Toolbar & Export Actions
 * Handles PNG, SVG, CSS exports, bookmarks, frame overlay toggle, share link, and live preview modal.
 */

window.ToolbarActions = (function () {

  // Export High-Res PNG
  function exportPng() {
    const config = window.StudioEditor.getConfig();
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1920;
    offCanvas.height = 1080;

    window.GradientRenderer.render(offCanvas, config, 0);

    const link = document.createElement('a');
    link.download = `gradient_${config.mode}_${Date.now()}.png`;
    link.href = offCanvas.toDataURL('image/png');
    link.click();
    window.showToast("Exported High-Resolution 1920x1080 PNG!");
  }

  // Generate SVG Code String
  function generateSvgString(config) {
    const mode = config.mode || 'mesh';
    const colors = config.colors || ['#6366f1', '#a855f7'];

    let svgContent = '';
    if (mode === 'sky' || mode === 'aurora') {
      const stops = colors.map((col, idx) => `<stop offset="${(idx / (colors.length - 1)) * 100}%" stop-color="${col}" />`).join('\n      ');
      svgContent = `
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        ${stops}
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#skyGrad)" />`;
    } else {
      // Mesh / Radial Spheres layered SVG elements for Figma compatibility
      const defs = colors.map((col, idx) => `
      <radialGradient id="grad${idx}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${col}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${col}" stop-opacity="0" />
      </radialGradient>`).join('\n');

      const circles = colors.map((col, idx) => {
        const angle = (idx / colors.length) * Math.PI * 2;
        const cx = 50 + Math.cos(angle) * 25;
        const cy = 50 + Math.sin(angle) * 25;
        return `<circle cx="${cx}%" cy="${cy}%" r="45%" fill="url(#grad${idx})" />`;
      }).join('\n    ');

      svgContent = `
    <defs>
      ${defs}
    </defs>
    <rect width="100%" height="100%" fill="${colors[0]}" />
    ${circles}`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  ${svgContent}
</svg>`;
  }

  // Export SVG File
  function exportSvg() {
    const config = window.StudioEditor.getConfig();
    const svgCode = generateSvgString(config);
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `gradient_${config.mode}_${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    window.showToast("Exported Editable SVG File!");
  }

  // Generate CSS snippet
  function generateCssCode(config) {
    const colors = config.colors || ['#6366f1', '#a855f7'];
    if (config.mode === 'glow') {
      return `/* Gradient Studio Prism Glow CSS */
background: #050508;
background-image:
  radial-gradient(at 20% 20%, ${colors[0]} 0px, transparent 50%),
  radial-gradient(at 80% 30%, ${colors[1] || colors[0]} 0px, transparent 50%),
  radial-gradient(at 50% 80%, ${colors[2] || colors[0]} 0px, transparent 50%);
filter: blur(${config.blur || 50}px);`;
    } else {
      const stops = colors.join(', ');
      return `/* Gradient Studio Linear Blend CSS */
background: ${colors[0]};
background: linear-gradient(135deg, ${stops});`;
    }
  }

  // Open CSS Modal
  function showCssModal() {
    const config = window.StudioEditor.getConfig();
    const code = generateCssCode(config);
    const block = document.getElementById('cssCodeSnippet');
    if (block) block.textContent = code;

    const modal = document.getElementById('cssModal');
    if (modal) modal.classList.add('active');
  }

  // Bookmark Save
  function saveBookmark() {
    const config = window.StudioEditor.getConfig();
    const saved = JSON.parse(localStorage.getItem('saved_gradients') || '[]');
    const item = {
      id: Date.now(),
      title: `${config.mode.toUpperCase()} Design ${saved.length + 1}`,
      config: config,
      date: new Date().toLocaleDateString()
    };
    saved.unshift(item);
    localStorage.setItem('saved_gradients', JSON.stringify(saved));
    window.showToast("Saved to Bookmarks!");
    if (window.SavedTab) window.SavedTab.renderSaved();
  }

  // Share Link
  function shareLink() {
    const config = window.StudioEditor.getConfig();
    const encoded = encodeURIComponent(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}#preset=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      window.showToast("Shareable link copied to clipboard!");
    }).catch(() => {
      window.showToast("Copied share URL!");
    });
  }

  // Toggle Frame Overlay
  function toggleFrameOverlay() {
    const frame = document.getElementById('frameOverlay');
    if (frame) {
      const isVisible = frame.style.display !== 'none';
      frame.style.display = isVisible ? 'none' : 'flex';
      window.showToast(isVisible ? "Frame overlay disabled" : "Frame overlay enabled");
    }
  }

  // Live Preview Modal
  function openLivePreview() {
    const config = window.StudioEditor.getConfig();
    const modal = document.getElementById('previewModal');
    const previewCanvas = document.getElementById('previewCanvas');
    if (modal && previewCanvas) {
      previewCanvas.width = 1280;
      previewCanvas.height = 720;
      window.GradientRenderer.render(previewCanvas, config, 0);
      modal.classList.add('active');
    }
  }

  // Init Event Listeners
  function init() {
    const pngBtn = document.getElementById('exportPngBtn');
    if (pngBtn) pngBtn.addEventListener('click', exportPng);

    const svgBtn = document.getElementById('exportSvgBtn');
    if (svgBtn) svgBtn.addEventListener('click', exportSvg);

    const cssBtn = document.getElementById('exportCssBtn');
    if (cssBtn) cssBtn.addEventListener('click', showCssModal);

    const copyCssBtn = document.getElementById('copyCssCodeBtn');
    if (copyCssBtn) {
      copyCssBtn.addEventListener('click', () => {
        const text = document.getElementById('cssCodeSnippet').textContent;
        navigator.clipboard.writeText(text);
        window.showToast("CSS code copied to clipboard!");
      });
    }

    const bookmarkBtn = document.getElementById('saveBookmarkBtn');
    if (bookmarkBtn) bookmarkBtn.addEventListener('click', saveBookmark);

    const shareBtn = document.getElementById('shareLinkBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareLink);

    const frameBtn = document.getElementById('toggleFrameBtn');
    if (frameBtn) frameBtn.addEventListener('click', toggleFrameOverlay);

    const previewBtn = document.getElementById('livePreviewBtn');
    if (previewBtn) previewBtn.addEventListener('click', openLivePreview);

    // Video Export Modal Handlers
    const exportVideoBtn = document.getElementById('exportVideoBtn');
    const videoModal = document.getElementById('videoModal');
    const closeVideoModalBtn = document.getElementById('closeVideoModalBtn');
    const startRecordBtn = document.getElementById('startRecordBtn');

    if (exportVideoBtn && videoModal) {
      exportVideoBtn.addEventListener('click', () => {
        videoModal.classList.add('active');
      });
    }

    if (closeVideoModalBtn && videoModal) {
      closeVideoModalBtn.addEventListener('click', () => {
        videoModal.classList.remove('active');
      });
    }

    if (startRecordBtn) {
      startRecordBtn.addEventListener('click', () => {
        const studioCanvas = document.getElementById('studioCanvas');
        if (!studioCanvas) return;

        const durationSec = parseInt(document.getElementById('videoDurationSelect').value, 10) || 5;
        const fps = parseInt(document.getElementById('videoFpsSelect').value, 10) || 60;
        const format = document.getElementById('videoFormatSelect').value || 'mp4';

        const progressContainer = document.getElementById('videoProgressContainer');
        const progressBar = document.getElementById('videoProgressBar');
        const progressVal = document.getElementById('videoProgressVal');

        if (progressContainer) progressContainer.style.display = 'block';
        startRecordBtn.disabled = true;
        startRecordBtn.textContent = '🎥 Recording Canvas...';

        const recorder = new window.CanvasVideoRecorder(studioCanvas);
        recorder.startRecording({
          fps: fps,
          durationSec: durationSec,
          format: format,
          onProgress: (percent, remainingSec) => {
            if (progressBar) progressBar.style.width = percent + '%';
            if (progressVal) progressVal.textContent = percent + '% (' + remainingSec + 's left)';
          },
          onComplete: (result) => {
            startRecordBtn.disabled = false;
            startRecordBtn.textContent = '🎬 Record & Export Video';
            if (progressContainer) progressContainer.style.display = 'none';
            if (videoModal) videoModal.classList.remove('active');

            const link = document.createElement('a');
            link.download = `gradient_animation_${Date.now()}.${result.ext}`;
            link.href = result.url;
            link.click();
            window.showToast(`Exported Animated ${result.ext.toUpperCase()} Video!`);
          },
          onError: (err) => {
            startRecordBtn.disabled = false;
            startRecordBtn.textContent = '🎬 Record & Export Video';
            if (progressContainer) progressContainer.style.display = 'none';
            window.showToast('Video recording error: ' + err.message);
          }
        });
      });
    }
  }

  return {
    init: init,
    generateSvgString: generateSvgString
  };

})();
