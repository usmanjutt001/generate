/**
 * Gallery, Palette, and Saved Tabs Controller
 * Features Traditional Japanese Color Sets & 10 FeralUI Gradient Presets
 */

window.GalleryTab = (function () {
  const CURATED_PRESETS = [
    { name: "Sakura Blossom (桜)", mode: "mesh", colors: ["#ffb7c5", "#e056fd", "#f7f6f0", "#33a3a4"], category: "japanese" },
    { name: "Matcha Mist (抹茶)", mode: "grainy", colors: ["#556b2f", "#5dbb63", "#f7f6f0"], category: "japanese" },
    { name: "Fuji Sunset (富士)", mode: "sky", colors: ["#162447", "#5f27cd", "#b7282e", "#ffa400"], category: "japanese" },
    { name: "Indigo Wave (藍)", mode: "wave", colors: ["#162447", "#33a3a4", "#f7f6f0"], category: "japanese" },
    { name: "Cyber Tokyo", mode: "glow", colors: ["#b7282e", "#33a3a4", "#5f27cd", "#1c1c1c"], category: "modern" },
    { name: "8-Bit Arcade", mode: "pixel", colors: ["#ffa400", "#b7282e", "#556b2f", "#162447"], category: "modern" },
    { name: "Zen Garden", mode: "forms", colors: ["#f7f6f0", "#556b2f", "#ca6f1e"], category: "japanese" },
    { name: "Aurora Shimmer", mode: "aurora", colors: ["#33a3a4", "#5dbb63", "#5f27cd"], category: "modern" },
    { name: "Conic Sunrise", mode: "conic", colors: ["#b7282e", "#ffa400", "#f7f6f0", "#162447"], category: "japanese" },
    { name: "Opal Radial", mode: "radial", colors: ["#f7f6f0", "#ffb7c5", "#33a3a4"], category: "modern" }
  ];

  function renderCuratedGallery(filter = "") {
    const grid = document.getElementById('curatedGalleryGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = CURATED_PRESETS.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.mode.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'asset-card';
      card.innerHTML = `
        <div class="asset-preview">
          <canvas id="curatedCanvas_${index}" width="320" height="180"></canvas>
        </div>
        <div class="asset-info">
          <div class="asset-title">${item.name}</div>
          <div class="asset-meta">
            <span>Mode: ${item.mode.toUpperCase()}</span>
            <span class="badge badge-accent">${item.category}</span>
          </div>
          <div class="asset-actions">
            <button class="btn btn-primary btn-sm load-preset-btn" data-index="${index}">Load into Studio</button>
          </div>
        </div>
      `;
      grid.appendChild(card);

      setTimeout(() => {
        const c = document.getElementById(`curatedCanvas_${index}`);
        if (c) window.GradientRenderer.render(c, item, 0);
      }, 10);
    });

    grid.querySelectorAll('.load-preset-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const item = filtered[idx];
        window.StudioEditor.setConfig({
          mode: item.mode,
          colors: [...item.colors]
        });
        const studioTabBtn = document.querySelector('.nav-tab-btn[data-tab="studio"]');
        if (studioTabBtn) studioTabBtn.click();
        window.showToast(`Loaded ${item.name} into Studio Editor`);
      });
    });
  }

  function init() {
    const searchInput = document.getElementById('gallerySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderCuratedGallery(e.target.value);
      });
    }
    renderCuratedGallery();
  }

  return { init: init, render: renderCuratedGallery };
})();

window.PaletteTab = (function () {
  const PALETTES = [
    { title: "Traditional Japanese - Spring Sakura (春の桜)", colors: ["#ffb7c5", "#e056fd", "#f7f6f0", "#162447"] },
    { title: "Traditional Japanese - Matcha Zen (抹茶)", colors: ["#556b2f", "#5dbb63", "#f7f6f0", "#1c1c1c"] },
    { title: "Traditional Japanese - Indigo Sea (藍色)", colors: ["#162447", "#33a3a4", "#f7f6f0", "#ca6f1e"] },
    { title: "Traditional Japanese - Akane Crimson (茜色)", colors: ["#b7282e", "#ffa400", "#1c1c1c", "#f7f6f0"] },
    { title: "Cyberpunk Tokyo Night", colors: ["#050515", "#f43f5e", "#06b6d4", "#a855f7"] },
    { title: "Pastel Meadow", colors: ["#fbcfe8", "#bae6fd", "#a7f3d0", "#fef08a"] }
  ];

  function renderPaletteExplorer() {
    const grid = document.getElementById('paletteExplorerGrid');
    if (!grid) return;

    grid.innerHTML = '';
    PALETTES.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'palette-card';

      const swatches = p.colors.map(col => `<div class="swatch-item" style="background:${col};" title="${col}"></div>`).join('');

      card.innerHTML = `
        <h3>${p.title}</h3>
        <div class="swatch-bar">${swatches}</div>
        <div style="display:flex; justify-style:space-between; align-items:center; margin-top:0.5rem;">
          <span style="font-size:0.8rem; font-family:monospace; color:var(--text-secondary);">${p.colors.join(', ')}</span>
          <button class="btn btn-sm apply-palette-btn" data-index="${idx}">Apply in Studio</button>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.apply-palette-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const p = PALETTES[idx];
        const currentCfg = window.StudioEditor.getConfig();
        window.StudioEditor.setConfig({
          mode: currentCfg.mode,
          colors: [...p.colors]
        });
        const studioTabBtn = document.querySelector('.nav-tab-btn[data-tab="studio"]');
        if (studioTabBtn) studioTabBtn.click();
        window.showToast(`Applied ${p.title} to Studio!`);
      });
    });
  }

  return { init: renderPaletteExplorer };
})();

window.SavedTab = (function () {
  function renderSaved() {
    const grid = document.getElementById('savedGrid');
    if (!grid) return;

    const saved = JSON.parse(localStorage.getItem('saved_gradients') || '[]');
    grid.innerHTML = '';

    if (saved.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        No saved gradient bookmarks yet. Click "Save Bookmark" in Studio!
      </div>`;
      return;
    }

    saved.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'asset-card';
      card.innerHTML = `
        <div class="asset-preview">
          <canvas id="savedCanvas_${index}" width="320" height="180"></canvas>
        </div>
        <div class="asset-info">
          <div class="asset-title">${item.title}</div>
          <div class="asset-meta">
            <span>Saved on ${item.date}</span>
            <span>${item.config.mode.toUpperCase()}</span>
          </div>
          <div class="asset-actions">
            <button class="btn btn-sm load-saved-btn" data-index="${index}">Load</button>
            <button class="btn btn-sm btn-danger delete-saved-btn" data-index="${index}">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);

      setTimeout(() => {
        const c = document.getElementById(`savedCanvas_${index}`);
        if (c) window.GradientRenderer.render(c, item.config, 0);
      }, 10);
    });

    grid.querySelectorAll('.load-saved-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const item = saved[idx];
        window.StudioEditor.setConfig(item.config);
        const studioTabBtn = document.querySelector('.nav-tab-btn[data-tab="studio"]');
        if (studioTabBtn) studioTabBtn.click();
        window.showToast(`Loaded saved gradient: ${item.title}`);
      });
    });

    grid.querySelectorAll('.delete-saved-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        saved.splice(idx, 1);
        localStorage.setItem('saved_gradients', JSON.stringify(saved));
        renderSaved();
        window.showToast("Bookmark deleted.");
      });
    });
  }

  function init() {
    const clearBtn = document.getElementById('clearSavedBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all saved bookmarks?")) {
          localStorage.removeItem('saved_gradients');
          renderSaved();
          window.showToast("All saved bookmarks cleared.");
        }
      });
    }
    renderSaved();
  }

  return { init: init, renderSaved: renderSaved };
})();
