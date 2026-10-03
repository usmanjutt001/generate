/**
 * Main Application Orchestrator & Navigation
 */

window.showToast = function (message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
};

document.addEventListener('DOMContentLoaded', () => {

  // Theme Toggle (Dark / Light Mode)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    if (themeIcon) themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('app_theme', newTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }
  }

  // Navigation Tabs Logic
  const navBtns = document.querySelectorAll('.nav-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetElement = document.getElementById(targetTab);
      if (targetElement) targetElement.classList.add('active');

      // Refresh canvas rendering when tab becomes visible
      if (targetTab === 'studio' && window.StudioEditor) {
        window.StudioEditor.renderCanvas();
      } else if (targetTab === 'gallery' && window.GalleryTab) {
        window.GalleryTab.render();
      } else if (targetTab === 'palette' && window.PaletteTab) {
        window.PaletteTab.init();
      } else if (targetTab === 'saved' && window.SavedTab) {
        window.SavedTab.renderSaved();
      }
    });
  });

  // Check URL hash for preset sharing
  if (window.location.hash.startsWith('#preset=')) {
    try {
      const jsonStr = decodeURIComponent(window.location.hash.replace('#preset=', ''));
      const parsedConfig = JSON.parse(jsonStr);
      if (parsedConfig && window.StudioEditor) {
        window.StudioEditor.setConfig(parsedConfig);
        window.showToast("Loaded shared gradient config from URL!");
      }
    } catch (e) {
      console.error("Failed to parse preset from hash:", e);
    }
  }

  // Initialize Modules
  if (window.StudioEditor) window.StudioEditor.init();
  if (window.ToolbarActions) window.ToolbarActions.init();
  if (window.BulkGenerator) window.BulkGenerator.init();
  if (window.ZipExporter) window.ZipExporter.init();
  if (window.GalleryTab) window.GalleryTab.init();
  if (window.PaletteTab) window.PaletteTab.init();
  if (window.SavedTab) window.SavedTab.init();

});
