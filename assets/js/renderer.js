/**
 * Advanced Canvas Gradient Renderer Module
 * Supports 10 Gradient Types matching FeralUI Gradient Builder:
 * Mesh, Grainy Retro Blobs, Forms (Soft Spheres), Sky (Multi-stop), Aurora Waves,
 * Glow & Prism, Conic Angular Sweep, Pixel 8-Bit Grid, Wave Ribbons, Linear/Radial Falloff.
 */

window.GradientRenderer = (function () {

  // Traditional Japanese Color Palette Definitions for FeralUI Gradient Builder
  const JAPANESE_COLORS = [
    { name: "Sakura (桜)", hex: "#ffb7c5", kanji: "桜" },
    { name: "Matcha (抹茶)", hex: "#556b2f", kanji: "抹茶" },
    { name: "Ai (藍)", hex: "#162447", kanji: "藍" },
    { name: "Akane (茜)", hex: "#b7282e", kanji: "茜" },
    { name: "Asagi (浅葱)", hex: "#33a3a4", kanji: "浅葱" },
    { name: "Yamabuki (山吹)", hex: "#ffa400", kanji: "山吹" },
    { name: "Murasaki (紫)", hex: "#5f27cd", kanji: "紫" },
    { name: "Kohaku (琥珀)", hex: "#ca6f1e", kanji: "琥珀" },
    { name: "Sumi (墨)", hex: "#1c1c1c", kanji: "墨" },
    { name: "Shinjushiro (真珠色)", hex: "#f7f6f0", kanji: "真珠色" },
    { name: "Wakatake (若竹)", hex: "#5dbb63", kanji: "若竹" },
    { name: "Botan (牡丹)", hex: "#e056fd", kanji: "牡丹" }
  ];

  function hexToRgb(hex) {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  // Apply Film Grain / Noise Overlay
  function applyNoiseOverlay(ctx, width, height, intensity) {
    if (intensity <= 0) return;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const factor = (intensity / 100) * 60;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * factor;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Main Render Switch
  function render(canvas, config, timeOffset = 0) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const colors = (config.colors && config.colors.length >= 2) ? config.colors : ['#ffb7c5', '#5f27cd', '#33a3a4'];
    const mode = config.mode || 'mesh';
    const noise = config.noise !== undefined ? config.noise : 15;
    const blur = config.blur !== undefined ? config.blur : 50;
    const angle = config.angle !== undefined ? config.angle : 45;

    ctx.clearRect(0, 0, width, height);

    switch (mode) {
      case 'mesh':
        renderMeshMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'grainy':
        renderGrainyMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'forms':
        renderFormsMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'sky':
        renderSkyMode(ctx, width, height, colors, angle, timeOffset);
        break;
      case 'aurora':
        renderAuroraMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'glow':
        renderGlowMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'conic':
        renderConicMode(ctx, width, height, colors, angle, timeOffset);
        break;
      case 'pixel':
        renderPixelMode(ctx, width, height, colors, timeOffset);
        break;
      case 'wave':
        renderWaveRibbonsMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'radial':
        renderRadialMode(ctx, width, height, colors, timeOffset);
        break;
      default:
        renderMeshMode(ctx, width, height, colors, blur, timeOffset);
        break;
    }

    if (noise > 0) {
      applyNoiseOverlay(ctx, width, height, noise);
    }
  }

  // Mode 1: Mesh / Organic Fluid
  function renderMeshMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `blur(${blur * (width / 1000)}px)`;

    const numPoints = colors.length;
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2 + (time * 0.001);
      const radius = Math.min(width, height) * 0.35;
      const x = width / 2 + Math.cos(a) * radius + Math.sin(time * 0.0015 + i) * (width * 0.1);
      const y = height / 2 + Math.sin(a) * radius + Math.cos(time * 0.0012 + i) * (height * 0.1);
      const r = Math.min(width, height) * (0.4 + 0.1 * Math.sin(time * 0.002 + i));

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const rgb = hexToRgb(colors[i]);
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Mode 2: Grainy Retro Blobs
  function renderGrainyMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `blur(${blur * 0.6 * (width / 1000)}px)`;

    colors.forEach((col, idx) => {
      const t = time * 0.0009 + idx * 1.8;
      const x = width * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t)));
      const y = height * (0.2 + 0.6 * (0.5 + 0.5 * Math.cos(t * 0.9)));
      const r = Math.min(width, height) * (0.2 + 0.15 * Math.cos(t * 1.1));

      const grad = ctx.createRadialGradient(x, y, r * 0.05, x, y, r);
      const rgb = hexToRgb(col);
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
      grad.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Mode 3: Forms / Soft Spheres
  function renderFormsMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `blur(${blur * 0.4 * (width / 1000)}px)`;

    colors.forEach((col, idx) => {
      const t = time * 0.0008 + idx * 1.5;
      const x = (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t))) * width;
      const y = (0.25 + 0.5 * (0.5 + 0.5 * Math.cos(t * 0.8))) * height;
      const radius = (0.25 + 0.1 * Math.sin(t * 1.2)) * Math.min(width, height);

      const grad = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, radius * 0.05, x, y, radius);
      const rgb = hexToRgb(col);
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
      grad.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Mode 4: Sky / Multi-stop Linear & Sun
  function renderSkyMode(ctx, width, height, colors, angleDeg, time) {
    const rad = (angleDeg + Math.sin(time * 0.0004) * 15) * (Math.PI / 180);
    const x1 = width / 2 - Math.cos(rad) * width / 2;
    const y1 = height / 2 - Math.sin(rad) * height / 2;
    const x2 = width / 2 + Math.cos(rad) * width / 2;
    const y2 = height / 2 + Math.sin(rad) * height / 2;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((col, idx) => {
      grad.addColorStop(idx / (colors.length - 1), col);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Soft sun glow
    const cx = width * (0.5 + 0.2 * Math.cos(time * 0.0006));
    const cy = height * (0.35 + 0.1 * Math.sin(time * 0.0006));
    const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.45);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Mode 5: Aurora Waves
  function renderAuroraMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `blur(${blur * (width / 1000)}px)`;

    for (let i = 1; i < colors.length; i++) {
      ctx.beginPath();
      const rgb = hexToRgb(colors[i]);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.75)`;

      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 15) {
        const y = height * 0.55 +
          Math.sin(x * 0.006 + time * 0.001 + i) * (height * 0.22) +
          Math.cos(x * 0.004 - time * 0.0008) * (height * 0.18);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Mode 6: Glow & Prism
  function renderGlowMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = `blur(${blur * 1.2 * (width / 1000)}px)`;

    colors.forEach((col, idx) => {
      const t = time * 0.001 + idx * 2.0;
      const x = width * 0.5 + Math.cos(t) * (width * 0.35);
      const y = height * 0.5 + Math.sin(t * 1.3) * (height * 0.35);
      const r = Math.min(width, height) * 0.45;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const rgb = hexToRgb(col);
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
      grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // Mode 7: Conic Angular Sweep
  function renderConicMode(ctx, width, height, colors, angleDeg, time) {
    if (ctx.createConicGradient) {
      const startAngle = (angleDeg + time * 0.02) * (Math.PI / 180);
      const grad = ctx.createConicGradient(startAngle, width / 2, height / 2);
      colors.forEach((col, idx) => {
        grad.addColorStop(idx / (colors.length - 1), col);
      });
      grad.addColorStop(1, colors[0]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Fallback linear
      renderSkyMode(ctx, width, height, colors, angleDeg, time);
    }
  }

  // Mode 8: Pixel 8-Bit Grid
  function renderPixelMode(ctx, width, height, colors, time) {
    const cols = 16;
    const rows = 10;
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = Math.floor((c / cols + r / rows + Math.sin(time * 0.001 + c * 0.2) * 0.2) * colors.length) % colors.length;
        const color = colors[Math.abs(idx) % colors.length];
        ctx.fillStyle = color;
        ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
      }
    }
  }

  // Mode 9: Wave Ribbons
  function renderWaveRibbonsMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `blur(${blur * 0.5 * (width / 1000)}px)`;

    colors.forEach((col, idx) => {
      ctx.beginPath();
      const rgb = hexToRgb(col);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.65)`;

      const offset = (idx / colors.length) * height;
      ctx.moveTo(0, offset);
      for (let x = 0; x <= width; x += 20) {
        const y = offset + Math.sin(x * 0.008 + time * 0.0012 + idx) * (height * 0.15);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }

  // Mode 10: Radial Falloff
  function renderRadialMode(ctx, width, height, colors, time) {
    const cx = width / 2 + Math.cos(time * 0.0008) * (width * 0.1);
    const cy = height / 2 + Math.sin(time * 0.0008) * (height * 0.1);
    const radius = Math.max(width, height) * 0.7;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    colors.forEach((col, idx) => {
      grad.addColorStop(idx / (colors.length - 1), col);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  return {
    render: render,
    hexToRgb: hexToRgb,
    JAPANESE_COLORS: JAPANESE_COLORS
  };

})();
