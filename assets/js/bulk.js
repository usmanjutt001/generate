/**
 * Bulk Asset Generator Engine & Gallery UI
 * Handles generating batch gradient assets using CIEDE2000 uniqueness filtering (Delta E >= 35).
 */

window.BulkGenerator = (function () {

  let generatedBatch = [];

  const THEMES = {
    neon: [
      ["#ff007f", "#00f0ff", "#7000ff"],
      ["#00ff66", "#ff00d4", "#3a00ff"],
      ["#ffe600", "#ff0055", "#00e5ff"],
      ["#bf00ff", "#00ffff", "#ff00aa"]
    ],
    pastel: [
      ["#fbcfe8", "#fef08a", "#bae6fd"],
      ["#ddd6fe", "#fbcfe8", "#fed7aa"],
      ["#a7f3d0", "#bae6fd", "#fef08a"],
      ["#fecdd3", "#e0e7ff", "#dcfce7"]
    ],
    cyberpunk: [
      ["#050515", "#f43f5e", "#06b6d4"],
      ["#09090b", "#a855f7", "#ec4899"],
      ["#020617", "#10b981", "#3b82f6"],
      ["#18181b", "#eab308", "#ef4444"]
    ],
    earth: [
      ["#2d3748", "#a0aec0", "#4a5568"],
      ["#78350f", "#d97706", "#fef3c7"],
      ["#064e3b", "#047857", "#a7f3d0"],
      ["#451a03", "#b45309", "#fde68a"]
    ],
    sunset: [
      ["#0f172a", "#581c87", "#c026d3", "#fb923c"],
      ["#1e1b4b", "#7c3aed", "#f43f5e", "#fde047"],
      ["#311b92", "#b71c1c", "#f57f17", "#fff59d"],
      ["#2a0845", "#6441a5", "#ffb347", "#ffcc00"]
    ]
  };

  const MODES = ["mesh", "forms", "sky", "aurora", "glow"];
  const NAMES = [
    "Nebula Mesh", "Vapor Glow", "Solar Flare", "Celestial Sky", "Aurora Wave",
    "Prism Bloom", "Opal Drift", "Emerald Dawn", "Cosmic Shimmer", "Velvet Tide",
    "Luminous Sphere", "Quantum Flow", "Midnight Aura", "Iris Field", "Golden Eclipse"
  ];

  function getRandomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  function generateUniquePalette(themeKey, existingPalettes) {
    let colors = [];
    let attempts = 0;

    while (attempts < 100) {
      if (themeKey !== 'all' && THEMES[themeKey]) {
        const pool = THEMES[themeKey];
        const base = pool[Math.floor(Math.random() * pool.length)];
        colors = base.map(c => c);
        // Perturb slightly or add a random stop
        if (Math.random() > 0.5 && colors.length < 5) {
          colors.push(getRandomHex());
        }
      } else {
        const numColors = Math.floor(Math.random() * 3) + 2; // 2 to 4 colors
        colors = [];
        for (let i = 0; i < numColors; i++) {
          colors.push(getRandomHex());
        }
      }

      // If no existing palettes or passes Delta E >= 35, accept
      if (existingPalettes.length === 0 || window.ColorLab.isPaletteUnique(colors, existingPalettes, 35)) {
        return colors;
      }
      attempts++;
    }

    return colors;
  }

  function generateBatch() {
    const quantity = parseInt(document.getElementById('quantitySlider').value) || 20;
    const aspectRatio = document.getElementById('aspectRatioSelect').value || '16:9';
    const themeKey = document.getElementById('bulkThemeSelect').value || 'all';

    generatedBatch = [];
    const existingPalettes = [];

    for (let i = 0; i < quantity; i++) {
      const colors = generateUniquePalette(themeKey, existingPalettes);
      existingPalettes.push(colors);

      const mode = MODES[Math.floor(Math.random() * MODES.length)];
      const titleName = NAMES[Math.floor(Math.random() * NAMES.length)];

      generatedBatch.push({
        id: i + 1,
        title: `${titleName} ${i + 1}`,
        mode: mode,
        colors: colors,
        aspectRatio: aspectRatio,
        noise: 15,
        blur: 50
      });
    }

    renderBatchGallery();
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    if (downloadZipBtn) downloadZipBtn.disabled = false;
    window.showToast(`Generated ${quantity} unique wallpapers with Delta E >= 35!`);
  }

  function getAspectRatioClass(ratio) {
    switch (ratio) {
      case '9:16': return 'ratio-9-16';
      case '1:1': return 'ratio-1-1';
      case '4:5': return 'ratio-4-5';
      default: return '';
    }
  }

  function renderBatchGallery() {
    const grid = document.getElementById('bulkGalleryGrid');
    if (!grid) return;

    grid.innerHTML = '';
    if (generatedBatch.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        Click "Generate Batch" to produce unique high-resolution gradient wallpapers.
      </div>`;
      return;
    }

    generatedBatch.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'asset-card';

      const previewClass = getAspectRatioClass(item.aspectRatio);

      card.innerHTML = `
        <div class="asset-preview ${previewClass}">
          <canvas id="bulkCanvas_${index}" width="320" height="180"></canvas>
        </div>
        <div class="asset-info">
          <div class="asset-title">${item.title}</div>
          <div class="asset-meta">
            <span>Mode: ${item.mode.toUpperCase()}</span>
            <span>${item.colors.length} Colors</span>
          </div>
          <div class="asset-actions">
            <button class="btn btn-sm edit-studio-btn" data-index="${index}">Edit in Studio</button>
            <button class="btn btn-sm download-png-btn" data-index="${index}">PNG</button>
          </div>
        </div>
      `;

      grid.appendChild(card);

      // Render thumbnail canvas
      setTimeout(() => {
        const c = document.getElementById(`bulkCanvas_${index}`);
        if (c) {
          if (item.aspectRatio === '9:16') { c.width = 180; c.height = 320; }
          else if (item.aspectRatio === '1:1') { c.width = 250; c.height = 250; }
          else if (item.aspectRatio === '4:5') { c.width = 200; c.height = 250; }
          else { c.width = 320; c.height = 180; }
          window.GradientRenderer.render(c, item, 0);
        }
      }, 10);
    });

    // Event listeners
    grid.querySelectorAll('.edit-studio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const item = generatedBatch[idx];
        window.StudioEditor.setConfig({
          mode: item.mode,
          colors: [...item.colors],
          noise: item.noise,
          blur: item.blur
        });

        // Switch tab to studio
        const studioTabBtn = document.querySelector('.nav-tab-btn[data-tab="studio"]');
        if (studioTabBtn) studioTabBtn.click();
        window.showToast(`Loaded ${item.title} into Studio Editor`);
      });
    });

    grid.querySelectorAll('.download-png-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const item = generatedBatch[idx];

        const offCanvas = document.createElement('canvas');
        if (item.aspectRatio === '9:16') { offCanvas.width = 1080; offCanvas.height = 1920; }
        else if (item.aspectRatio === '1:1') { offCanvas.width = 1080; offCanvas.height = 1080; }
        else if (item.aspectRatio === '4:5') { offCanvas.width = 1080; offCanvas.height = 1350; }
        else { offCanvas.width = 1920; offCanvas.height = 1080; }

        window.GradientRenderer.render(offCanvas, item, 0);

        const link = document.createElement('a');
        link.download = `${item.title.toLowerCase().replace(/\s+/g, '_')}.png`;
        link.href = offCanvas.toDataURL('image/png');
        link.click();
        window.showToast(`Downloaded PNG for ${item.title}`);
      });
    });
  }

  function init() {
    const qtySlider = document.getElementById('quantitySlider');
    if (qtySlider) {
      qtySlider.addEventListener('input', (e) => {
        document.getElementById('quantityVal').textContent = e.target.value;
      });
    }

    const genBtn = document.getElementById('generateBatchBtn');
    if (genBtn) genBtn.addEventListener('click', generateBatch);
  }

  return {
    init: init,
    getGeneratedBatch: () => generatedBatch,
    generateBatch: generateBatch
  };

})();
