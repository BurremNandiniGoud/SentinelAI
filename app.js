let MODEL_URL = null;
const MODEL_INPUT_SIZE = 256;
const DETECTION_INTERVAL_MS = 420;
const EDGE_THRESHOLD = 0.015; // tuned for typical note texture vs plain background
const VARIANCE_THRESHOLD = 750; // tuned for printed note vs uniform surfaces

let model = null;
let modelLoaded = false;
let cameraReady = false;
let modelLoadTimeout = null;

class Normalization extends tf.layers.Layer {
  constructor(config) {
    super(config);
    this.axis = config.axis;
    this.mean = config.mean == null ? null : tf.tensor(config.mean, undefined, 'float32');
    this.variance = config.variance == null ? null : tf.tensor(config.variance, undefined, 'float32');
    this.invert = !!config.invert;
  }

  call(inputs) {
    const input = Array.isArray(inputs) ? inputs[0] : inputs;
    if (this.mean == null || this.variance == null) {
      return input;
    }
    const eps = 1e-6;
    if (this.invert) {
      return input.mul(tf.sqrt(this.variance)).add(this.mean);
    }
    const denom = tf.sqrt(this.variance.add(eps));
    return input.sub(this.mean).div(denom);
  }

  getConfig() {
    return Object.assign(super.getConfig(), {
      axis: this.axis,
      mean: this.mean == null ? null : this.mean.arraySync(),
      variance: this.variance == null ? null : this.variance.arraySync(),
      invert: this.invert,
    });
  }

  static get className() {
    return 'Normalization';
  }
}

tf.serialization.registerClass(Normalization);

class Rescaling extends tf.layers.Layer {
  constructor(config) {
    super(config);
    this.scale = config.scale;
    this.offset = config.offset == null ? 0.0 : config.offset;
  }

  call(inputs) {
    const input = Array.isArray(inputs) ? inputs[0] : inputs;
    const scale = Array.isArray(this.scale)
      ? tf.tensor(this.scale, undefined, 'float32')
      : typeof this.scale === 'number'
      ? tf.scalar(this.scale)
      : this.scale;
    const offset = typeof this.offset === 'number' ? tf.scalar(this.offset) : this.offset;
    return input.mul(scale).add(offset);
  }

  getConfig() {
    return Object.assign(super.getConfig(), {
      scale: Array.isArray(this.scale)
        ? this.scale
        : this.scale.arraySync ? this.scale.arraySync() : this.scale,
      offset: typeof this.offset === 'number' ? this.offset : this.offset.arraySync ? this.offset.arraySync() : this.offset,
    });
  }

  static get className() {
    return 'Rescaling';
  }
}

tf.serialization.registerClass(Rescaling);

function loadModelMainThread(modelUrl) {
  console.log('loadModelMainThread:', modelUrl);
  showStatus('Loading TF model... please wait', null);
  modelLoadTimeout = setTimeout(() => {
    showStatus('Loading TF model... this may take 30+ seconds', null);
  }, 10000);

  tf.ready()
    .then(() => {
      console.log('TF ready on main thread, loading model', modelUrl);
      return tf.loadLayersModel(modelUrl, {
        onProgress: (fraction) => {
          const percent = Math.round((fraction || 0) * 100);
          console.log('model load progress', percent, '%');
          showStatus(`Loading model... ${percent}%`, null);
        },
      });
    })
    .then((loadedModel) => {
      clearTimeout(modelLoadTimeout);
      modelLoaded = true;
      model = loadedModel;
      console.log('Model loaded:', model.modelName, 'layers=', model.layers.length);
      showStatus(cameraReady ? 'No note detected' : 'Loading camera...', null);
      maybeStartDetection();
    })
    .catch((error) => {
      clearTimeout(modelLoadTimeout);
      console.error('Main thread model load failed:', error);
      showStatus('Unable to start app', null);
      confidenceEl.textContent = `Model load error: ${error.message || error}`;
    });
}

window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error || event.message);
  showStatus('App error', null);
  confidenceEl.textContent = String(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  showStatus('App error', null);
  confidenceEl.textContent = String(event.reason);
});

async function predictScore(bitmap) {
  const imgTensor = tf.browser.fromPixels(bitmap)
    .resizeBilinear([MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])
    .toFloat()
    .div(255.0)
    .expandDims(0);

  const prediction = model.predict(imgTensor);
  const data = await prediction.data();

  imgTensor.dispose();
  prediction.dispose();
  bitmap.close?.();

  return data[0];
}

const camera = document.getElementById('camera');
const overlay = document.getElementById('overlay');
const statusEl = document.getElementById('status');
const confidenceEl = document.getElementById('confidence');
let detectInterval = null;
let hiddenCtx = null;
let hiddenCanvas = null;

function showStatus(label, confidence) {
  statusEl.className = 'status';
  if (label === 'No note detected') {
    statusEl.textContent = 'No note detected';
    statusEl.classList.add('idle');
    confidenceEl.textContent = '';
  } else if (label === 'REAL') {
    statusEl.textContent = `✅ REAL (${confidence}%)`;
    statusEl.classList.add('real');
    confidenceEl.textContent = `Confidence: ${confidence}%`;
  } else if (label === 'FAKE') {
    statusEl.textContent = `❌ FAKE (${confidence}%)`;
    statusEl.classList.add('fake');
    confidenceEl.textContent = `Confidence: ${confidence}%`;
  } else {
    statusEl.textContent = label;
    confidenceEl.textContent = confidence ? `Confidence: ${confidence}%` : '';
    statusEl.classList.add('idle');
  }
}

function setupHiddenCanvas(width, height) {
  hiddenCanvas = document.createElement('canvas');
  hiddenCanvas.width = width;
  hiddenCanvas.height = height;
  hiddenCtx = hiddenCanvas.getContext('2d');
}

function captureFrame() {
  hiddenCtx.drawImage(camera, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
  return hiddenCtx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
}

function maybeStartDetection() {
  if (!cameraReady || !modelLoaded || detectInterval) {
    return;
  }
  detectInterval = setInterval(runDetection, DETECTION_INTERVAL_MS);
  showStatus('No note detected', null);
}

function getCenterCrop(imageData, fraction = 0.6) {
  const width = imageData.width;
  const height = imageData.height;
  const cropWidth = Math.max(1, Math.floor(width * fraction));
  const cropHeight = Math.max(1, Math.floor(height * fraction));
  const offsetX = Math.floor((width - cropWidth) / 2);
  const offsetY = Math.floor((height - cropHeight) / 2);
  return hiddenCtx.getImageData(offsetX, offsetY, cropWidth, cropHeight);
}

function detectNotePresence(imageData) {
  const crop = getCenterCrop(imageData, 0.6);
  const data = crop.data;
  const width = crop.width;
  const height = crop.height;

  let sum = 0;
  let sumSq = 0;
  let edgeCount = 0;
  const brightness = new Float32Array(width * height);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    brightness[j] = gray;
    sum += gray;
    sumSq += gray * gray;
  }

  const mean = sum / brightness.length;
  const variance = sumSq / brightness.length - mean * mean;

  const threshold = 22;
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const idx = y * width + x;
      const right = brightness[idx + 1];
      const down = brightness[idx + width];
      if (Math.abs(brightness[idx] - right) > threshold || Math.abs(brightness[idx] - down) > threshold) {
        edgeCount += 1;
      }
    }
  }

  const edgeDensity = edgeCount / ((width - 1) * (height - 1));
  const notePresent = edgeDensity > EDGE_THRESHOLD && variance > VARIANCE_THRESHOLD;

  console.debug('presence gate', {
    edgeDensity: edgeDensity.toFixed(4),
    variance: variance.toFixed(1),
    notePresent,
  });

  return notePresent;
}

async function classifyNote(frameData) {
  const bitmap = await createImageBitmap(frameData);
  const score = await predictScore(bitmap);
  const isReal = score > 0.5;
  const confidence = ((isReal ? score : 1 - score) * 100).toFixed(1);
  return { label: isReal ? 'REAL' : 'FAKE', confidence };
}

async function runDetection() {
  if (!camera.videoWidth || !camera.videoHeight) {
    console.debug('runDetection skipped because video dimensions are not ready');
    return;
  }

  const frame = captureFrame();
  const present = detectNotePresence(frame);

  if (!present) {
    showStatus('No note detected', null);
    return;
  }

  showStatus('Checking note...', null);
  try {
    const result = await classifyNote(frame);
    showStatus(result.label, result.confidence);
  } catch (error) {
    console.error('Classification failed:', error);
    showStatus('Model error', null);
  }
}

async function startCamera() {
  console.log('startCamera: requesting camera permission');
  showStatus('Initializing camera...', null);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    console.log('startCamera: stream received', stream.getVideoTracks().map((t) => t.label));
    camera.srcObject = stream;

    camera.addEventListener('loadedmetadata', () => {
      console.log('camera metadata loaded', camera.videoWidth, camera.videoHeight);
    });
    camera.addEventListener('playing', () => {
      console.log('camera playing event fired', camera.videoWidth, camera.videoHeight);
    });
    camera.addEventListener('error', (event) => {
      console.error('Camera element error', event);
    });

    await camera.play();
    console.log('startCamera: camera.play() resolved');

    setupHiddenCanvas(camera.videoWidth, camera.videoHeight);
    overlay.width = camera.videoWidth;
    overlay.height = camera.videoHeight;

    cameraReady = true;
    showStatus(modelLoaded ? 'No note detected' : 'Loading TF model...', null);
    maybeStartDetection();
  } catch (error) {
    console.error('startCamera failed:', error);
    showStatus('Unable to start camera', null);
    confidenceEl.textContent = `Camera error: ${error.message || error}`;
    throw error;
  }
}

async function loadModelAndStart() {
  try {
    MODEL_URL = new URL('model.json', window.location.href).href;
    loadModelMainThread(MODEL_URL);
  } catch (error) {
    console.error(error);
    showStatus('Unable to start app', null);
    confidenceEl.textContent = `Model load error: ${error.message}`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadModelAndStart();
  startCamera().catch(error => {
    console.error(error);
    showStatus('Unable to start camera', null);
    confidenceEl.textContent = error.message;
  });
});
