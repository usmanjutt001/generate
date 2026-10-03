/**
 * Canvas Gradient Renderer Module
 * Renders high-definition mesh gradients, forms, aurora waves, sky blends, and prism glows with noise overlays.
 */

window.GradientRenderer = (function () {

  // Helper: Hex to RGB object
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

  // Helper: Add noise overlay to canvas
  function applyNoiseOverlay(ctx, width, height, intensity) {
    if (intensity <= 0) return;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const factor = (intensity / 100) * 50;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * factor;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Render Engine Main Function
  function render(canvas, config, timeOffset = 0) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const colors = (config.colors && config.colors.length >= 2) ? config.colors : ['#6366f1', '#a855f7', '#ec4899'];
    const mode = config.mode || 'mesh';
    const noise = config.noise !== undefined ? config.noise : 15;
    const blur = config.blur !== undefined ? config.blur : 50;

    ctx.clearRect(0, 0, width, height);

    switch (mode) {
      case 'mesh':
        renderMeshMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'forms':
        renderFormsMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'sky':
        renderSkyMode(ctx, width, height, colors, timeOffset);
        break;
      case 'aurora':
        renderAuroraMode(ctx, width, height, colors, blur, timeOffset);
        break;
      case 'glow':
        renderGlowMode(ctx, width, height, colors, blur, timeOffset);
        break;
      default:
        renderMeshMode(ctx, width, height, colors, blur, timeOffset);
        break;
    }

    if (noise > 0) {
      applyNoiseOverlay(ctx, width, height, noise);
    }
  }

  // Mode 1: Organic Mesh Blend
  function renderMeshMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `blur(${blur * (width / 1000)}px)`;

    const numPoints = colors.length;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 + (time * 0.001);
      const radius = Math.min(width, height) * 0.35;
      const x = width / 2 + Math.cos(angle) * radius + Math.sin(time * 0.0015 + i) * (width * 0.1);
      const y = height / 2 + Math.sin(angle) * radius + Math.cos(time * 0.0012 + i) * (height * 0.1);
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

  // Mode 2: Forms / Geometric Soft Spheres
  function renderFormsMode(ctx, width, height, colors, blur, time) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `blur(${blur * 0.5 * (width / 1000)}px)`;

    colors.forEach((col, idx) => {
      const t = time * 0.0008 + idx * 1.5;
      const x = (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t))) * width;
      const y = (0.2 + 0.6 * (0.5 + 0.5 * Math.cos(t * 0.8))) * height;
      const radius = (0.25 + 0.15 * Math.sin(t * 1.2)) * Math.min(width, height);

      const grad = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
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

  // Mode 3: Sky / Multi-Stop Linear & Radial Gradient
  function renderSkyMode(ctx, width, height, colors, time) {
    const angle = (45 + Math.sin(time * 0.0005) * 30) * (Math.PI / 180);
    const x1 = width / 2 - Math.cos(angle) * width / 2;
    const y1 = height / 2 - Math.sin(angle) * height / 2;
    const x2 = width / 2 + Math.cos(angle) * width / 2;
    const y2 = height / 2 + Math.sin(angle) * height / 2;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((col, idx) => {
      const stop = idx / (colors.length - 1);
      grad.addColorStop(stop, col);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Overlay soft sun/moon glow
    const cx = width * (0.5 + 0.2 * Math.cos(time * 0.0007));
    const cy = height * (0.3 + 0.1 * Math.sin(time * 0.0007));
    const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.4);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Mode 4: Aurora Shimmering Waves
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
      for (let x = 0; x <= width; x += 20) {
        const y = height * 0.5 +
          Math.sin(x * 0.005 + time * 0.001 + i) * (height * 0.2) +
          Math.cos(x * 0.003 - time * 0.0008) * (height * 0.15);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Mode 5: Glow & Prism Effects
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

  return {
    render: render,
    hexToRgb: hexToRgb
  };

})();
