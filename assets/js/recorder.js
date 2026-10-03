// Video Recorder Module using MediaRecorder API on HTML5 Canvas
(function (global) {
  'use strict';

  function getSupportedMimeType(preferredFormat) {
    const types = preferredFormat === 'mp4' ? [
      'video/mp4;codecs=h264',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ] : [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=h264',
      'video/mp4'
    ];

    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  class CanvasVideoRecorder {
    constructor(canvas) {
      this.canvas = canvas;
      this.mediaRecorder = null;
      this.recordedChunks = [];
      this.isRecording = false;
      this.timerId = null;
      this.progressInterval = null;
    }

    startRecording({ fps = 60, durationSec = 5, format = 'mp4', onProgress, onComplete, onError }) {
      if (this.isRecording) {
        if (onError) onError(new Error('Recording already in progress'));
        return;
      }

      this.recordedChunks = [];
      const mimeType = getSupportedMimeType(format);

      let stream;
      try {
        stream = this.canvas.captureStream(fps);
      } catch (err) {
        if (onError) onError(new Error('Canvas captureStream not supported: ' + err.message));
        return;
      }

      const recorderOptions = mimeType ? { mimeType } : {};

      try {
        this.mediaRecorder = new MediaRecorder(stream, recorderOptions);
      } catch (err) {
        if (onError) onError(new Error('MediaRecorder initialization failed: ' + err.message));
        return;
      }

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        clearInterval(this.progressInterval);
        clearTimeout(this.timerId);

        const actualMime = this.mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: actualMime });
        const ext = actualMime.includes('mp4') ? 'mp4' : 'webm';

        if (onComplete) {
          onComplete({
            blob,
            url: URL.createObjectURL(blob),
            ext,
            mimeType: actualMime
          });
        }
      };

      this.mediaRecorder.onerror = (event) => {
        this.isRecording = false;
        clearInterval(this.progressInterval);
        clearTimeout(this.timerId);
        if (onError) onError(event.error || new Error('Recording error'));
      };

      this.isRecording = true;
      this.mediaRecorder.start(100); // chunk every 100ms

      const startTime = Date.now();
      const totalMs = durationSec * 1000;

      this.progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.floor((elapsed / totalMs) * 100));
        if (onProgress) onProgress(progress, Math.ceil((totalMs - elapsed) / 1000));
      }, 100);

      this.timerId = setTimeout(() => {
        this.stopRecording();
      }, totalMs);
    }

    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
      }
    }
  }

  global.CanvasVideoRecorder = CanvasVideoRecorder;
  global.getSupportedMimeType = getSupportedMimeType;

})(typeof window !== 'undefined' ? window : this);
