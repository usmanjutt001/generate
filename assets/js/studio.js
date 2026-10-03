/**
 * Studio Editor Controller
 * Handles dynamic color pickers, WCAG contrast calculation, presets, sliders, and canvas rendering.
 */

window.StudioEditor = (function () {

  // Preset Gradients List
  const PRESETS = [
    { name: "Iridescent Cloud", mode: "mesh", colors: ["#a855f7", "#ec4899", "#3b82f6", "#e0e7ff"] },
    { name: "Opal", mode: "forms", colors: ["#cbd5e1", "#f1f5f9", "#93c5fd", "#f472b6"] },
    { name: "Lagoon", mode: "mesh", colors: ["#06b6d4", "#3b82f6", "#10b981", "#67e8f9"] },
    { name: "Emerald", mode: "aurora", colors: ["#059669", "#10b981", "#34d399", "#064e3b"] },
    { name: "Solar Flare", mode: "glow", colors: ["#f97316", "#ef4444", "#eab308", "#7c2d12"] },
    { name: "Orchid", mode: "forms", colors: ["#d946ef", "#8b5cf6", "#ec4899", "#f472b6"] },
    { name: "Peach Glow", mode: "mesh", colors: ["#fb923c", "#f43f5e", "#fed7aa", "#f472b6"] },
    { name: "Electric Tide", mode: "aurora", colors: ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4"] },
    { name: "Sunset", mode: "sky", colors: ["#0f172a", "#4c1d95", "#c026d3", "#fb923c", "#fde047"] },
    { name: "Mint Ice", mode: "mesh", colors: ["#a7f3d0", "#6ee7b7", "#38bdf8", "#f0fdf4"] },
    { name: "Midnight Bloom", mode: "glow", colors: ["#1e1b4b", "#4338ca", "#6d28d9", "#be185d"] },
    { name: "Rose Gold", mode: "sky", colors: ["#f43f5e", "#fb7185", "#fecdd3", "#e11d48"] }
  ];

  let config = {
    mode: "mesh",
    colors: ["#6366f1", "#a855f7", "#ec4899"],
    noise: 15,
    blur: 50,
    speed: 0
  };

  let animationFrameId = null;
  let startTime = Date.now();

  // Helper: Calculate luminance for WCAG contrast
  function getLuminance(hex) {
    const rgb = window.GradientRenderer.hexToRgb(hex);
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  // Calculate contrast ratio against white & dark text
  function getContrastBadge(hex) {
    const lum = getLuminance(hex);
    const contrastWhite = (1.0 + 0.05) / (lum + 0.05);
    const contrastBlack = (lum + 0.05) / (0.0 + 0.05);
    const maxContrast = Math.max(contrastWhite, contrastBlack);

    if (maxContrast >= 7.0) {
      return '<span class="contrast-badge pass" title="WCAG AAA Compliant">AAA</span>';
    } else if (maxContrast >= 4.5) {
      return '<span class="contrast-badge pass" title="WCAG AA Compliant">AA</span>';
    } else {
      return '<span class="contrast-badge fail" title="Low Contrast Ratio">FAIL</span>';
    }
  }

  // Render color pickers UI
  function renderColorControls() {
    const list = document.getElementById('colorsList');
    if (!list) return;

    list.innerHTML = '';
    config.colors.forEach((col, index) => {
      const row = document.createElement('div');
      row.className = 'color-row';
      row.innerHTML = `
        <input type="color" class="color-input" value="${col}" data-index="${index}">
        <input type="text" class="color-hex" value="${col}" data-index="${index}" maxlength="7">
        ${getContrastBadge(col)}
        ${config.colors.length > 2 ? `<button class="btn btn-sm btn-danger remove-color-btn" data-index="${index}" style="padding:0.2rem 0.4rem;">&times;</button>` : ''}
      `;
      list.appendChild(row);
    });

    // Attach event listeners
    list.querySelectorAll('.color-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        config.colors[idx] = e.target.value;
        const hexInput = list.querySelector(`.color-hex[data-index="${idx}"]`);
        if (hexInput) hexInput.value = e.target.value;
        renderCanvas();
      });
    });

    list.querySelectorAll('.color-hex').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
          config.colors[idx] = val;
          const colorInput = list.querySelector(`.color-input[data-index="${idx}"]`);
          if (colorInput) colorInput.value = val;
          renderCanvas();
        }
      });
    });

    list.querySelectorAll('.remove-color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (config.colors.length > 2) {
          config.colors.splice(idx, 1);
          renderColorControls();
          renderCanvas();
        }
      });
    });
  }

  // Render preset buttons
  function renderPresets() {
    const container = document.getElementById('presetPillsList');
    if (!container) return;

    container.innerHTML = '';
    PRESETS.forEach(p => {
      const pill = document.createElement('button');
      pill.className = 'preset-pill';
      pill.textContent = p.name;
      pill.addEventListener('click', () => {
        config.mode = p.mode;
        config.colors = [...p.colors];

        // Update active mode card UI
        document.querySelectorAll('.mode-card').forEach(card => {
          card.classList.toggle('active', card.dataset.mode === p.mode);
        });

        renderColorControls();
        renderCanvas();
      });
      container.appendChild(pill);
    });
  }

  // Render Studio Canvas
  function renderCanvas() {
    const canvas = document.getElementById('studioCanvas');
    if (!canvas) return;

    const viewport = document.getElementById('canvasViewport');
    if (viewport) {
      canvas.width = viewport.clientWidth || 800;
      canvas.height = viewport.clientHeight || 500;
    }

    const elapsed = config.speed > 0 ? (Date.now() - startTime) * (config.speed / 20) : 0;
    window.GradientRenderer.render(canvas, config, elapsed);
  }

  // Animation Loop for live flow
  function startAnimationLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    function loop() {
      if (config.speed > 0) {
        renderCanvas();
      }
      animationFrameId = requestAnimationFrame(loop);
    }
    loop();
  }

  // Randomize colors helper
  function getRandomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  // Init Studio Controls & Event Listeners
  function init() {
    const canvas = document.getElementById('studioCanvas');
    if (!canvas) return;

    // Mode Selector listeners
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        config.mode = card.dataset.mode;
        renderCanvas();
      });
    });

    // Add Color Button
    const addColorBtn = document.getElementById('addColorBtn');
    if (addColorBtn) {
      addColorBtn.addEventListener('click', () => {
        if (config.colors.length < 5) {
          config.colors.push(getRandomHex());
          renderColorControls();
          renderCanvas();
        } else {
          window.showToast("Maximum of 5 colors allowed.");
        }
      });
    }

    // Reset Colors Button
    const resetBtn = document.getElementById('resetColorsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        config.colors = ["#6366f1", "#a855f7", "#ec4899"];
        renderColorControls();
        renderCanvas();
      });
    }

    // Shuffle Colors Button
    const shuffleBtn = document.getElementById('shuffleColorsBtn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        config.colors = config.colors.map(() => getRandomHex());
        renderColorControls();
        renderCanvas();
      });
    }

    // Sliders
    const noiseSlider = document.getElementById('noiseSlider');
    if (noiseSlider) {
      noiseSlider.addEventListener('input', (e) => {
        config.noise = parseInt(e.target.value);
        document.getElementById('noiseVal').textContent = `${config.noise}%`;
        renderCanvas();
      });
    }

    const blurSlider = document.getElementById('blurSlider');
    if (blurSlider) {
      blurSlider.addEventListener('input', (e) => {
        config.blur = parseInt(e.target.value);
        document.getElementById('blurVal').textContent = `${config.blur}px`;
        renderCanvas();
      });
    }

    const speedSlider = document.getElementById('speedSlider');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        config.speed = parseInt(e.target.value);
        document.getElementById('speedVal').textContent = config.speed > 0 ? `${config.speed}%` : 'Static';
      });
    }

    renderColorControls();
    renderPresets();
    renderCanvas();
    startAnimationLoop();

    window.addEventListener('resize', renderCanvas);
  }

  return {
    init: init,
    getConfig: () => ({ ...config }),
    setConfig: (newCfg) => {
      config = { ...config, ...newCfg };
      renderColorControls();
      renderCanvas();
    },
    renderCanvas: renderCanvas,
    PRESETS: PRESETS
  };

})();
