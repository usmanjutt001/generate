/**
 * CIELAB & CIEDE2000 Color Distance Module
 * Converts RGB to CIELAB and calculates Delta E distance for high uniqueness filtering.
 */

window.ColorLab = (function () {

  // Convert Hex string to RGB
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

  // Convert RGB to CIELAB (D65 illuminant, 2 degrees standard observer)
  function rgbToLab(rgb) {
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Convert RGB to XYZ
    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
    let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
    let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

    // D65 reference white
    const refX = 95.047;
    const refY = 100.000;
    const refZ = 108.883;

    x /= refX;
    y /= refY;
    z /= refZ;

    x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
    y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
    z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

    const L = (116 * y) - 16;
    const a = 500 * (x - y);
    const bColor = 200 * (y - z);

    return { L: L, a: a, b: bColor };
  }

  // Calculate CIEDE2000 Delta E color difference between two LAB colors
  function deltaE(lab1, lab2) {
    const kL = 1, kC = 1, kH = 1;
    const L1 = lab1.L, a1 = lab1.a, b1 = lab1.b;
    const L2 = lab2.L, a2 = lab2.a, b2 = lab2.b;

    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const C_bar = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Math.pow(C_bar, 7) / (Math.pow(C_bar, 7) + Math.pow(25, 7))));
    const a1_prime = (1 + G) * a1;
    const a2_prime = (1 + G) * a2;

    const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
    const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);

    let h1_prime = Math.atan2(b1, a1_prime) * (180 / Math.PI);
    if (h1_prime < 0) h1_prime += 360;

    let h2_prime = Math.atan2(b2, a2_prime) * (180 / Math.PI);
    if (h2_prime < 0) h2_prime += 360;

    const delta_L_prime = L2 - L1;
    const delta_C_prime = C2_prime - C1_prime;

    let delta_h_prime = 0;
    if (C1_prime * C2_prime !== 0) {
      if (Math.abs(h2_prime - h1_prime) <= 180) {
        delta_h_prime = h2_prime - h1_prime;
      } else if (h2_prime - h1_prime > 180) {
        delta_h_prime = h2_prime - h1_prime - 360;
      } else {
        delta_h_prime = h2_prime - h1_prime + 360;
      }
    }

    const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin((delta_h_prime / 2) * (Math.PI / 180));

    const L_bar_prime = (L1 + L2) / 2;
    const C_bar_prime = (C1_prime + C2_prime) / 2;

    let h_bar_prime = 0;
    if (C1_prime * C2_prime !== 0) {
      if (Math.abs(h1_prime - h2_prime) <= 180) {
        h_bar_prime = (h1_prime + h2_prime) / 2;
      } else if (h1_prime + h2_prime < 360) {
        h_bar_prime = (h1_prime + h2_prime + 360) / 2;
      } else {
        h_bar_prime = (h1_prime + h2_prime - 360) / 2;
      }
    }

    const T = 1 -
      0.17 * Math.cos((h_bar_prime - 30) * (Math.PI / 180)) +
      0.24 * Math.cos((2 * h_bar_prime) * (Math.PI / 180)) +
      0.32 * Math.cos((3 * h_bar_prime + 6) * (Math.PI / 180)) -
      0.20 * Math.cos((4 * h_bar_prime - 63) * (Math.PI / 180));

    const delta_theta = 30 * Math.exp(-Math.pow((h_bar_prime - 275) / 25, 2));
    const R_C = 2 * Math.sqrt(Math.pow(C_bar_prime, 7) / (Math.pow(C_bar_prime, 7) + Math.pow(25, 7)));

    const S_L = 1 + (0.015 * Math.pow(L_bar_prime - 50, 2)) / Math.sqrt(20 + Math.pow(L_bar_prime - 50, 2));
    const S_C = 1 + 0.045 * C_bar_prime;
    const S_H = 1 + 0.015 * C_bar_prime * T;
    const R_T = -Math.sin(2 * delta_theta * (Math.PI / 180)) * R_C;

    const termL = delta_L_prime / (kL * S_L);
    const termC = delta_C_prime / (kC * S_C);
    const termH = delta_H_prime / (kH * S_H);

    return Math.sqrt(termL * termL + termC * termC + termH * termH + R_T * termC * termH);
  }

  // Calculate average Delta E distance between two sets of hex colors
  function paletteDistance(hexList1, hexList2) {
    const labs1 = hexList1.map(h => rgbToLab(hexToRgb(h)));
    const labs2 = hexList2.map(h => rgbToLab(hexToRgb(h)));

    let total = 0;
    let count = 0;
    labs1.forEach(l1 => {
      labs2.forEach(l2 => {
        total += deltaE(l1, l2);
        count++;
      });
    });

    return count > 0 ? total / count : 0;
  }

  // Check if a candidate palette is unique compared to an existing set of palettes (threshold >= 35)
  function isPaletteUnique(candidateHexes, existingPalettes, threshold = 35) {
    for (let existing of existingPalettes) {
      const dist = paletteDistance(candidateHexes, existing);
      if (dist < threshold) {
        return false;
      }
    }
    return true;
  }

  return {
    hexToRgb: hexToRgb,
    rgbToLab: rgbToLab,
    deltaE: deltaE,
    paletteDistance: paletteDistance,
    isPaletteUnique: isPaletteUnique
  };

})();
