// Node Build Script to aggregate and validate production bundle output
const fs = require('fs');
const path = require('path');

console.log('Running Gradient Studio distribution build...');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Verify essential offline assets exist
const requiredAssets = [
  'index.html',
  'assets/css/style.css',
  'assets/js/jszip.min.js',
  'assets/js/cielab.js',
  'assets/js/recorder.js',
  'assets/js/renderer.js',
  'assets/js/studio.js',
  'assets/js/toolbar.js',
  'assets/js/bulk.js',
  'assets/js/zipexporter.js',
  'assets/js/tabs.js',
  'assets/js/app.js'
];

let allValid = true;
requiredAssets.forEach(file => {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) {
    console.error(`Missing required asset: ${file}`);
    allValid = false;
  }
});

if (allValid) {
  console.log('All standalone offline static assets verified successfully!');
} else {
  process.exit(1);
}
