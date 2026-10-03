/**
 * Studio Workbench Editor
 * Enhanced with Traditional Japanese Color Picker, Figma SVG copy, angle slider, and 10 render modes.
 */

window.StudioEditor = (function () {

  const PRESETS = [
    { name: "Sakura Blossom (桜)", mode: "mesh", colors: ["#ffb7c5", "#e056fd", "#f7f6f0", "#33a3a4"] },
    { name: "Matcha Mist (抹茶)", mode: "grainy", colors: ["#556b2f", "#5dbb63", "#f7f6f0"] },
    { name: "Fuji Sunset (富士)", mode: "sky", colors: ["#162447", "#5f27cd", "#b7282e", "#ffa400"] },
    { name: "Indigo Wave (藍)", mode: "wave", colors: ["#162447", "#33a3a4", "#f7f6f0"] },
    { name: "Cyber Tokyo", mode: "glow", colors: ["#b7282e", "#33a3a4", "#5f27cd", "#1c1c1c"] },
    { name: "8-Bit Arcade", mode: "pixel", colors: ["#ffa400", "#b7282e", "#556b2f", "#162447"] },
    { name: "Zen Garden", mode: "forms", colors: ["#f7f6f0", "#556b2f", "#ca6f1e"] },
    { name: "Aurora Shimmer", mode: "aurora", colors: ["#33a3a4", "#5dbb63", "#5f27cd"] },
    { name: "Conic Sunrise", mode: "conic", colors: ["#b7282e", "#ffa400", "#f7f6f0", "#162447"] },
    { name: "Opal Radial", mode: "radial", colors: ["#f7f6f0", "#ffb7c5", "#33a3a4"] }
  ];

  let config = {
    mode: "mesh",
    colors: ["#ffb7c5", "#5f27cd", "#33a3a4"],
    noise: 15,
    blur: 50,
    speed: 0,
    angle: 45
  };

  let animationFrameId = null;
  let startTime = Date.now();

  function getLuminance(hex) {
    const rgb = window.GradientRenderer.hexToRgb(hex);
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

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

  // Render Japanese Color Swatches Bar
  function renderJapaneseSwatches() {
    const container = document.getElementById('japaneseSwatchesList');
    if (!container) return;

    container.innerHTML = '';
    window.GradientRenderer.JAPANESE_COLORS.forEach(c => {
      const swatch = document.createElement('button');
      swatch.className = 'preset-pill';
      swatch.style.display = 'inline-flex';
      swatch.style.alignItems = 'center';
      swatch.style.gap = '0.3rem';
      swatch.innerHTML = `<span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${c.hex}; border:1px solid rgba(255,255,255,0.3);"></span> ${c.name}`;
      swatch.addEventListener('click', () => {
        if (config.colors.length < 5) {
          config.colors.push(c.hex);
          renderColorControls();
          renderCanvas();
        } else {
          window.showToast("Maximum 5 colors allowed");
        }
      });
      container.appendChild(swatch);
    });
  }

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

        document.querySelectorAll('.mode-card').forEach(card => {
          card.classList.toggle('active', card.dataset.mode === p.mode);
        });

        renderColorControls();
        renderCanvas();
      });
      container.appendChild(pill);
    });
  }

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

  function getRandomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  function init() {
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        config.mode = card.dataset.mode;
        renderCanvas();
      });
    });

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

    const resetBtn = document.getElementById('resetColorsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        config.colors = ["#ffb7c5", "#5f27cd", "#33a3a4"];
        renderColorControls();
        renderCanvas();
      });
    }

    const shuffleBtn = document.getElementById('shuffleColorsBtn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        config.colors = config.colors.map(() => getRandomHex());
        renderColorControls();
        renderCanvas();
      });
    }

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

    const angleSlider = document.getElementById('angleSlider');
    if (angleSlider) {
      angleSlider.addEventListener('input', (e) => {
        config.angle = parseInt(e.target.value);
        document.getElementById('angleVal').textContent = `${config.angle}°`;
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

    renderJapaneseSwatches();
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
