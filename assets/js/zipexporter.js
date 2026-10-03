/**
 * ZIP Exporter Engine
 * Renders batch assets on hidden high-resolution offscreen canvases and packages PNG files & metadata.json using JSZip.
 */

window.ZipExporter = (function () {

  async function downloadBatchZip() {
    const batch = window.BulkGenerator.getGeneratedBatch();
    if (!batch || batch.length === 0) {
      window.showToast("No batch assets to download!");
      return;
    }

    if (typeof JSZip === 'undefined') {
      window.showToast("JSZip library not loaded!");
      return;
    }

    const downloadZipBtn = document.getElementById('downloadZipBtn');
    if (downloadZipBtn) {
      downloadZipBtn.disabled = true;
      downloadZipBtn.textContent = '⏳ Rendering & Zipping...';
    }

    try {
      const zip = new JSZip();
      const assetsFolder = zip.folder('assets');
      const metadataList = [];

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const offCanvas = document.createElement('canvas');

        // Set high-res dimensions
        if (item.aspectRatio === '9:16') { offCanvas.width = 1080; offCanvas.height = 1920; }
        else if (item.aspectRatio === '1:1') { offCanvas.width = 1080; offCanvas.height = 1080; }
        else if (item.aspectRatio === '4:5') { offCanvas.width = 1080; offCanvas.height = 1350; }
        else { offCanvas.width = 1920; offCanvas.height = 1080; }

        // Render high-res gradient
        window.GradientRenderer.render(offCanvas, item, 0);

        // Convert data URL base64 to Blob/ArrayBuffer
        const dataUrl = offCanvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");

        const filename = `${item.title.toLowerCase().replace(/\s+/g, '_')}.png`;
        assetsFolder.file(filename, base64Data, { base64: true });

        metadataList.push({
          id: item.id,
          title: item.title,
          filename: filename,
          mode: item.mode,
          colors: item.colors,
          aspectRatio: item.aspectRatio,
          resolution: `${offCanvas.width}x${offCanvas.height}`,
          noiseIntensity: item.noise,
          blurAmount: item.blur
        });
      }

      // Add metadata.json to zip root
      const metadataContent = JSON.stringify({
        generatedAt: new Date().toISOString(),
        totalAssets: batch.length,
        uniquenessThreshold: "Delta E (CIEDE2000) >= 35",
        assets: metadataList
      }, null, 2);

      zip.file('metadata.json', metadataContent);

      // Generate zip archive blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      const link = document.createElement('a');
      link.download = `gradient_batch_${batch.length}_assets.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);

      window.showToast(`Successfully exported ${batch.length} assets to ZIP archive!`);
    } catch (err) {
      console.error("ZIP Generation Error:", err);
      window.showToast("Failed to create ZIP file.");
    } finally {
      if (downloadZipBtn) {
        downloadZipBtn.disabled = false;
        downloadZipBtn.textContent = '📦 Download All as ZIP (.zip)';
      }
    }
  }

  function init() {
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    if (downloadZipBtn) {
      downloadZipBtn.addEventListener('click', downloadBatchZip);
    }
  }

  return {
    init: init,
    downloadBatchZip: downloadBatchZip
  };

})();
