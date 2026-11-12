// ==========================================
// 1. Operations Registry, Parameters & Code
// ==========================================
const OPERATIONS = {
  // --- Noise & Point Operations ---
  gaussian_noise: {
    title: "Gaussian noise",
    params: [
      {
        id: "sigma",
        label: "Sigma (σ)",
        desc: "Standard deviation of the bell-curve noise; higher values add stronger random grain.",
        type: "range",
        min: 1,
        max: 100,
        step: 1,
        default: 25
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg")
mean = 0
sigma = ${p.sigma}

# Generate Gaussian noise and add to image
noise = np.random.normal(mean, sigma, img.shape).astype(np.float32)
noisy = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

cv2.imwrite("output_gaussian_noise.jpg", noisy)`
  },

  salt_pepper: {
    title: "Salt & pepper",
    params: [
      {
        id: "amount",
        label: "Noise Density (%)",
        desc: "Percentage of total pixels randomly replaced with pure white (salt) or black (pepper).",
        type: "range",
        min: 1,
        max: 30,
        step: 1,
        default: 5
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg")
prob = ${(p.amount / 100).toFixed(2)}
output = img.copy()

# Generate random mask for salt (white) and pepper (black)
rand = np.random.rand(*img.shape[:2])
output[rand < (prob / 2)] = 0          # Pepper
output[rand > 1 - (prob / 2)] = 255    # Salt

cv2.imwrite("output_salt_pepper.jpg", output)`
  },

  gamma: {
    title: "Gamma correction",
    params: [
      {
        id: "gamma",
        label: "Gamma (γ)",
        desc: "Non-linear luminance exponent; γ > 1 brightens shadows, while γ < 1 darkens midtones.",
        type: "range",
        min: 0.1,
        max: 3.5,
        step: 0.1,
        default: 1.8
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg")
gamma = ${p.gamma}

# Build lookup table for fast gamma mapping: O = 255 * (I / 255) ^ (1 / gamma)
inv_gamma = 1.0 / gamma
table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
corrected = cv2.LUT(img, table)

cv2.imwrite("output_gamma.jpg", corrected)`
  },

  brightness_contrast: {
    title: "Brightness / contrast",
    params: [
      {
        id: "alpha",
        label: "Contrast (α)",
        desc: "Multiplicative gain; stretches (> 1.0) or compresses (< 1.0) the intensity range.",
        type: "range",
        min: 0.2,
        max: 3.0,
        step: 0.1,
        default: 1.3
      },
      {
        id: "beta",
        label: "Brightness (β)",
        desc: "Additive offset; shifts all pixel intensities uniformly brighter (+) or darker (-).",
        type: "range",
        min: -100,
        max: 100,
        step: 5,
        default: 20
      }
    ],
    code: (p) => `import cv2

img = cv2.imread("input.jpg")
alpha = ${p.alpha}  # Contrast control (1.0-3.0)
beta = ${p.beta}     # Brightness control (-100 to 100)

# Apply linear transform: g(x) = alpha * f(x) + beta
adjusted = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)

cv2.imwrite("output_brightness_contrast.jpg", adjusted)`
  },

  log_transform: {
    title: "Log transform",
    params: [
      {
        id: "gain",
        label: "Scale Gain",
        desc: "Output multiplier that expands dark-pixel detail while compressing bright highlights.",
        type: "range",
        min: 0.5,
        max: 2.0,
        step: 0.1,
        default: 1.0
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg").astype(np.float32)

# s = c * log(1 + r)
c = (255.0 / np.log(1 + np.max(img))) * ${p.gain}
log_transformed = np.clip(c * np.log(1 + img), 0, 255).astype(np.uint8)

cv2.imwrite("output_log.jpg", log_transformed)`
  },

  inverse: {
    title: "Inverse (negative)",
    params: [],
    code: () => `import cv2

img = cv2.imread("input.jpg")

# Bitwise NOT inverts all pixel intensities (255 - pixel)
negative = cv2.bitwise_not(img)

cv2.imwrite("output_negative.jpg", negative)`
  },

  // --- Filtering & Sharpening ---
  gaussian_blur: {
    title: "Gaussian blur",
    params: [
      {
        id: "ksize",
        label: "Kernel Size (odd)",
        desc: "Width and height of the smoothing window; larger kernels blur over a wider neighborhood.",
        type: "range",
        min: 1,
        max: 25,
        step: 2,
        default: 7
      },
      {
        id: "sigma",
        label: "Sigma X",
        desc: "Gaussian spread; higher values smooth more strongly (0 auto-calculates from kernel size).",
        type: "range",
        min: 0,
        max: 15,
        step: 0.5,
        default: 2.0
      }
    ],
    code: (p) => `import cv2

img = cv2.imread("input.jpg")
ksize = (${p.ksize}, ${p.ksize})
sigma_x = ${p.sigma}

blurred = cv2.GaussianBlur(img, ksize, sigmaX=sigma_x)

cv2.imwrite("output_gaussian_blur.jpg", blurred)`
  },

  box_blur: {
    title: "Box blur",
    params: [
      {
        id: "ksize",
        label: "Kernel Size",
        desc: "Size of the uniform averaging window; larger sizes produce heavier box-like smoothing.",
        type: "range",
        min: 1,
        max: 25,
        step: 2,
        default: 7
      }
    ],
    code: (p) => `import cv2

img = cv2.imread("input.jpg")
ksize = (${p.ksize}, ${p.ksize})

# Normalized box filter
blurred = cv2.blur(img, ksize)

cv2.imwrite("output_box_blur.jpg", blurred)`
  },

  median_blur: {
    title: "Median blur",
    params: [
      {
        id: "ksize",
        label: "Kernel Size (odd)",
        desc: "Neighborhood size used to pick the median pixel; removes salt & pepper noise while keeping edges.",
        type: "range",
        min: 1,
        max: 15,
        step: 2,
        default: 5
      }
    ],
    code: (p) => `import cv2

img = cv2.imread("input.jpg")
ksize = ${p.ksize}

# Effective against salt-and-pepper noise
median = cv2.medianBlur(img, ksize)

cv2.imwrite("output_median_blur.jpg", median)`
  },

  unsharp_mask: {
    title: "Unsharp mask",
    params: [
      {
        id: "amount",
        label: "Sharpen Strength",
        desc: "Weight of the high-frequency edge mask added back to boost local edge crispness.",
        type: "range",
        min: 0.2,
        max: 3.0,
        step: 0.1,
        default: 1.5
      },
      {
        id: "radius",
        label: "Blur Kernel (odd)",
        desc: "Gaussian blur size subtracted from the original; larger kernels accentuate coarser edges.",
        type: "range",
        min: 3,
        max: 15,
        step: 2,
        default: 5
      }
    ],
    code: (p) => `import cv2

img = cv2.imread("input.jpg")
blurred = cv2.GaussianBlur(img, (${p.radius}, ${p.radius}), 0)

# Sharpened = Original + amount * (Original - Blurred)
amount = ${p.amount}
sharpened = cv2.addWeighted(img, 1.0 + amount, blurred, -amount, 0)

cv2.imwrite("output_unsharp_mask.jpg", sharpened)`
  },

  // --- Edges & Thresholding ---
  sobel: {
    title: "Sobel edges",
    params: [
      {
        id: "ksize",
        label: "Kernel Size",
        desc: "Derivative filter size; larger kernels smooth out fine noise before computing gradients.",
        type: "range",
        min: 1,
        max: 7,
        step: 2,
        default: 3
      }
    ],
    code: (p) => `import cv2
import numpy as np

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)
ksize = ${p.ksize}

grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize)
grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize)

# Compute gradient magnitude
magnitude = cv2.magnitude(grad_x, grad_y)
sobel_edges = np.clip(magnitude, 0, 255).astype(np.uint8)

cv2.imwrite("output_sobel.jpg", sobel_edges)`
  },

  canny: {
    title: "Canny edges",
    params: [
      {
        id: "low",
        label: "Lower Threshold",
        desc: "Minimum gradient strength for weak edges; kept only if connected to a strong edge.",
        type: "range",
        min: 0,
        max: 250,
        step: 5,
        default: 60
      },
      {
        id: "high",
        label: "Upper Threshold",
        desc: "Gradient cutoff above which pixels are immediately classified as strong edges.",
        type: "range",
        min: 10,
        max: 255,
        step: 5,
        default: 150
      }
    ],
    code: (p) => `import cv2

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)
edges = cv2.Canny(gray, threshold1=${p.low}, threshold2=${p.high})

cv2.imwrite("output_canny.jpg", edges)`
  },

  binary_thresh: {
    title: "Binary threshold",
    params: [
      {
        id: "thresh",
        label: "Threshold Value",
        desc: "Intensity cutoff (0–255); pixels brighter than this become white (255), others black (0).",
        type: "range",
        min: 0,
        max: 255,
        step: 1,
        default: 127
      }
    ],
    code: (p) => `import cv2

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)
_, binary = cv2.threshold(gray, ${p.thresh}, 255, cv2.THRESH_BINARY)

cv2.imwrite("output_binary_thresh.jpg", binary)`
  },

  otsu_thresh: {
    title: "Otsu's threshold",
    params: [],
    code: () => `import cv2

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)

# Automatically calculates optimal threshold value from bimodal histogram
otsu_val, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
print(f"Computed Otsu threshold: {otsu_val}")

cv2.imwrite("output_otsu.jpg", binary)`
  },

  // --- Tone & Morphology ---
  grayscale: {
    title: "Grayscale",
    params: [],
    code: () => `import cv2

img = cv2.imread("input.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

cv2.imwrite("output_grayscale.jpg", gray)`
  },

  hist_eq: {
    title: "Histogram equalization",
    params: [],
    code: () => `import cv2

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)

# Global contrast enhancement via CDF mapping
equalized = cv2.equalizeHist(gray)

cv2.imwrite("output_hist_eq.jpg", equalized)`
  },

  bit_plane: {
    title: "Bit-plane slicing",
    params: [
      {
        id: "bit",
        label: "Bit Plane (0=LSB, 7=MSB)",
        desc: "Selects which binary bit (0–7) to isolate; bit 7 holds main structure, bit 0 holds fine noise.",
        type: "range",
        min: 0,
        max: 7,
        step: 1,
        default: 7
      }
    ],
    code: (p) => `import cv2
import numpy as np

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)
bit = ${p.bit}

# Extract specific bit plane and scale to 0 or 255 for visibility
bit_plane = ((gray >> bit) & 1) * 255

cv2.imwrite(f"output_bit_plane_{bit}.jpg", bit_plane.astype(np.uint8))`
  },

  clahe: {
    title: "CLAHE",
    params: [
      {
        id: "clip",
        label: "Clip Limit",
        desc: "Caps local histogram peaks to boost contrast without over-amplifying background noise.",
        type: "range",
        min: 1.0,
        max: 10.0,
        step: 0.5,
        default: 2.5
      },
      {
        id: "grid",
        label: "Tile Grid Size",
        desc: "Number of rows/columns the image is split into for local adaptive equalization.",
        type: "range",
        min: 2,
        max: 16,
        step: 2,
        default: 8
      }
    ],
    code: (p) => `import cv2

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)

# Contrast Limited Adaptive Histogram Equalization
clahe = cv2.createCLAHE(clipLimit=${p.clip}, tileGridSize=(${p.grid}, ${p.grid}))
result = clahe.apply(gray)

cv2.imwrite("output_clahe.jpg", result)`
  },

  morphology: {
    title: "Morphology",
    params: [
      {
        id: "morphOp",
        label: "Operation",
        desc: "Erode shrinks bright regions, Dilate expands them, Open removes specks, Close fills holes.",
        type: "select",
        options: [
          { value: "erode", label: "Erosion (cv2.erode)" },
          { value: "dilate", label: "Dilation (cv2.dilate)" },
          { value: "open", label: "Opening (MORPH_OPEN)" },
          { value: "close", label: "Closing (MORPH_CLOSE)" }
        ],
        default: "dilate"
      },
      {
        id: "ksize",
        label: "Structuring Kernel",
        desc: "Size of the sliding morphological structuring element; larger sizes cause stronger shape changes.",
        type: "range",
        min: 3,
        max: 15,
        step: 2,
        default: 5
      }
    ],
    code: (p) => {
      const opMap = {
        erode: `result = cv2.erode(img, kernel, iterations=1)`,
        dilate: `result = cv2.dilate(img, kernel, iterations=1)`,
        open: `result = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)`,
        close: `result = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)`
      };
      return `import cv2
import numpy as np

img = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)
kernel = np.ones((${p.ksize}, ${p.ksize}), np.uint8)

${opMap[p.morphOp]}

cv2.imwrite("output_morphology.jpg", result)`;
    }
  }
};

// ==========================================
// 2. Application State & DOM References
// ==========================================
let currentOp = "gaussian_noise";
let currentParams = {};
let originalImageData = null;

const origCanvas = document.getElementById("originalCanvas");
const procCanvas = document.getElementById("processedCanvas");
const origCtx = origCanvas.getContext("2d", { willReadFrequently: true });
const procCtx = procCanvas.getContext("2d", { willReadFrequently: true });

const paramsContainer = document.getElementById("paramsContainer");
const processedTitle = document.getElementById("processedTitle");
const origDimensions = document.getElementById("origDimensions");
const pythonCodeBlock = document.getElementById("pythonCodeBlock");

// ==========================================
// 3. Built-in Sample Image Generators
// ==========================================
function loadBuiltInSample(type) {
  const w = 520;
  const h = 360;
  origCanvas.width = w;
  origCanvas.height = h;
  procCanvas.width = w;
  procCanvas.height = h;

  if (type === "shapes") {
    const grad = origCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(0.5, "#334155");
    grad.addColorStop(1, "#0f766e");
    origCtx.fillStyle = grad;
    origCtx.fillRect(0, 0, w, h);

    const barGrad = origCtx.createLinearGradient(30, 0, w - 30, 0);
    barGrad.addColorStop(0, "#000000");
    barGrad.addColorStop(1, "#ffffff");
    origCtx.fillStyle = barGrad;
    origCtx.fillRect(30, h - 55, w - 60, 28);

    origCtx.fillStyle = "#f59e0b";
    origCtx.beginPath();
    origCtx.arc(140, 145, 65, 0, Math.PI * 2);
    origCtx.fill();

    origCtx.fillStyle = "#ef4444";
    origCtx.fillRect(250, 80, 115, 115);

    origCtx.strokeStyle = "#38bdf8";
    origCtx.lineWidth = 6;
    origCtx.beginPath();
    origCtx.moveTo(410, 195);
    origCtx.lineTo(455, 80);
    origCtx.lineTo(495, 195);
    origCtx.closePath();
    origCtx.stroke();

    origCtx.fillStyle = "#ffffff";
    origCtx.font = "bold 20px sans-serif";
    origCtx.fillText("OpenCV Playground Sample", 32, 42);
  } else if (type === "landscape") {
    origCtx.fillStyle = "#5b6470";
    origCtx.fillRect(0, 0, w, h);

    const sky = origCtx.createRadialGradient(380, 90, 15, 380, 90, 180);
    sky.addColorStop(0, "#9aa5b1");
    sky.addColorStop(1, "#616e7c");
    origCtx.fillStyle = sky;
    origCtx.fillRect(0, 0, w, 220);

    origCtx.fillStyle = "#4b5563";
    origCtx.beginPath();
    origCtx.moveTo(0, 230);
    origCtx.lineTo(130, 115);
    origCtx.lineTo(270, 220);
    origCtx.lineTo(390, 130);
    origCtx.lineTo(w, 235);
    origCtx.lineTo(w, h);
    origCtx.lineTo(0, h);
    origCtx.fill();

    origCtx.fillStyle = "#3e4652";
    origCtx.beginPath();
    origCtx.ellipse(220, 320, 340, 105, 0, Math.PI, 0);
    origCtx.fill();
  } else if (type === "grid") {
    origCtx.fillStyle = "#ffffff";
    origCtx.fillRect(0, 0, w, h);

    const tile = 20;
    origCtx.fillStyle = "#111827";
    for (let y = 20; y < h - 20; y += tile) {
      for (let x = 20; x < 240; x += tile) {
        if (((x + y) / tile) % 2 === 0) {
          origCtx.fillRect(x, y, tile, tile);
        }
      }
    }

    origCtx.strokeStyle = "#0f6b63";
    origCtx.lineWidth = 4;
    for (let r = 15; r <= 120; r += 18) {
      origCtx.beginPath();
      origCtx.arc(380, 180, r, 0, Math.PI * 2);
      origCtx.stroke();
    }
  }

  originalImageData = origCtx.getImageData(0, 0, w, h);
  origDimensions.textContent = `${w} × ${h}`;
  runPipeline();
}

// Handle User Upload
document.getElementById("imageUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 640;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      origCanvas.width = w;
      origCanvas.height = h;
      procCanvas.width = w;
      procCanvas.height = h;

      origCtx.drawImage(img, 0, 0, w, h);
      originalImageData = origCtx.getImageData(0, 0, w, h);
      origDimensions.textContent = `${w} × ${h}`;

      document.querySelectorAll(".sample-btn").forEach((b) => b.classList.remove("active"));
      runPipeline();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Sample Buttons
document.querySelectorAll(".sample-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sample-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadBuiltInSample(btn.dataset.sample);
  });
});

document.getElementById("randomSampleBtn").addEventListener("click", () => {
  const sampleBtns = Array.from(document.querySelectorAll(".sample-btn"));
  const currentActive = document.querySelector(".sample-btn.active");
  const candidates = sampleBtns.filter((b) => b !== currentActive);
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  chosen.click();
});

// ==========================================
// 4. Dynamic Controls & Operation Switching
// ==========================================
function selectOperation(opKey) {
  currentOp = opKey;
  const spec = OPERATIONS[opKey];
  currentParams = {};

  document.querySelectorAll(".pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.op === opKey);
  });

  processedTitle.textContent = `Processed: ${spec.title}`;
  paramsContainer.innerHTML = "";

  if (spec.params.length === 0) {
    paramsContainer.innerHTML = `<span class="no-params-msg">No adjustable parameters for ${spec.title}.</span>`;
  } else {
    spec.params.forEach((param) => {
      currentParams[param.id] = param.default;

      const wrapper = document.createElement("div");
      wrapper.className = "param-control";

      const descHtml = param.desc
        ? `<small class="param-desc" style="color: var(--text-muted); font-size: 0.78rem; line-height: 1.35;">${param.desc}</small>`
        : "";

      if (param.type === "range") {
        wrapper.innerHTML = `
          <div class="param-label-row">
            <label for="param_${param.id}">${param.label}</label>
            <span class="param-val" id="val_${param.id}">${param.default}</span>
          </div>
          <input type="range" id="param_${param.id}"
            min="${param.min}" max="${param.max}" step="${param.step}" value="${param.default}" />
          ${descHtml}
        `;
        const input = wrapper.querySelector("input");
        const valSpan = wrapper.querySelector(".param-val");
        input.addEventListener("input", () => {
          const v = parseFloat(input.value);
          currentParams[param.id] = v;
          valSpan.textContent = v;
          runPipeline();
        });
      } else if (param.type === "select") {
        const optsHtml = param.options
          .map((o) => `<option value="${o.value}" ${o.value === param.default ? "selected" : ""}>${o.label}</option>`)
          .join("");
        wrapper.innerHTML = `
          <div class="param-label-row">
            <label for="param_${param.id}">${param.label}</label>
          </div>
          <select class="param-select" id="param_${param.id}">${optsHtml}</select>
          ${descHtml}
        `;
        const select = wrapper.querySelector("select");
        select.addEventListener("change", () => {
          currentParams[param.id] = select.value;
          runPipeline();
        });
      }

      paramsContainer.appendChild(wrapper);
    });

    const resetWrapper = document.createElement("div");
    resetWrapper.style.marginLeft = "auto";
    resetWrapper.style.alignSelf = "center";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "btn btn-sm btn-outline";
    resetBtn.textContent = "Reset Values";
    resetBtn.title = "Reset parameters to default values";
    resetBtn.addEventListener("click", () => selectOperation(opKey));

    resetWrapper.appendChild(resetBtn);
    paramsContainer.appendChild(resetWrapper);
  }

  runPipeline();
}

document.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", () => selectOperation(pill.dataset.op));
});

// ==========================================
// 5. Image Processing Engine (Pixel Kernels)
// ==========================================
function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function toGrayscaleArray(data, width, height) {
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  return gray;
}

function grayToImageData(gray, width, height) {
  const out = new ImageData(width, height);
  for (let i = 0, j = 0; j < gray.length; i += 4, j++) {
    const v = gray[j];
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = 255;
  }
  return out;
}

function randGaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function convolveSeparableRGBA(src, w, h, kernel) {
  const half = Math.floor(kernel.length / 2);
  const temp = new Float32Array(src.length);
  const dst = new Uint8ClampedArray(src.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = -half; k <= half; k++) {
        const sx = Math.min(w - 1, Math.max(0, x + k));
        const idx = (y * w + sx) * 4;
        const weight = kernel[k + half];
        r += src[idx] * weight;
        g += src[idx + 1] * weight;
        b += src[idx + 2] * weight;
      }
      const dIdx = (y * w + x) * 4;
      temp[dIdx] = r;
      temp[dIdx + 1] = g;
      temp[dIdx + 2] = b;
      temp[dIdx + 3] = 255;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = -half; k <= half; k++) {
        const sy = Math.min(h - 1, Math.max(0, y + k));
        const idx = (sy * w + x) * 4;
        const weight = kernel[k + half];
        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
      }
      const dIdx = (y * w + x) * 4;
      dst[dIdx] = clamp(Math.round(r));
      dst[dIdx + 1] = clamp(Math.round(g));
      dst[dIdx + 2] = clamp(Math.round(b));
      dst[dIdx + 3] = 255;
    }
  }
  return dst;
}

function makeGaussianKernel(size, sigma) {
  const s = sigma <= 0 ? 0.3 * ((size - 1) * 0.5 - 1) + 0.8 : sigma;
  const half = Math.floor(size / 2);
  const kernel = new Float32Array(size);
  let sum = 0;
  for (let i = -half; i <= half; i++) {
    const val = Math.exp(-(i * i) / (2 * s * s));
    kernel[i + half] = val;
    sum += val;
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}

function processPixels(srcImageData, op, p) {
  const w = srcImageData.width;
  const h = srcImageData.height;
  const src = srcImageData.data;
  const out = new ImageData(w, h);
  const dst = out.data;

  switch (op) {
    case "gaussian_noise": {
      const sigma = p.sigma;
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = clamp(src[i] + randGaussian() * sigma);
        dst[i + 1] = clamp(src[i + 1] + randGaussian() * sigma);
        dst[i + 2] = clamp(src[i + 2] + randGaussian() * sigma);
        dst[i + 3] = 255;
      }
      return out;
    }

    case "salt_pepper": {
      const prob = p.amount / 100;
      for (let i = 0; i < src.length; i += 4) {
        const r = Math.random();
        if (r < prob / 2) {
          dst[i] = dst[i + 1] = dst[i + 2] = 0;
        } else if (r > 1 - prob / 2) {
          dst[i] = dst[i + 1] = dst[i + 2] = 255;
        } else {
          dst[i] = src[i];
          dst[i + 1] = src[i + 1];
          dst[i + 2] = src[i + 2];
        }
        dst[i + 3] = 255;
      }
      return out;
    }

    case "gamma": {
      const invGamma = 1.0 / p.gamma;
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) lut[i] = Math.pow(i / 255, invGamma) * 255;
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = lut[src[i]];
        dst[i + 1] = lut[src[i + 1]];
        dst[i + 2] = lut[src[i + 2]];
        dst[i + 3] = 255;
      }
      return out;
    }

    case "brightness_contrast": {
      const { alpha, beta } = p;
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = clamp(alpha * src[i] + beta);
        dst[i + 1] = clamp(alpha * src[i + 1] + beta);
        dst[i + 2] = clamp(alpha * src[i + 2] + beta);
        dst[i + 3] = 255;
      }
      return out;
    }

    case "log_transform": {
      const c = (255 / Math.log(256)) * p.gain;
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = clamp(c * Math.log(1 + src[i]));
        dst[i + 1] = clamp(c * Math.log(1 + src[i + 1]));
        dst[i + 2] = clamp(c * Math.log(1 + src[i + 2]));
        dst[i + 3] = 255;
      }
      return out;
    }

    case "inverse": {
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = 255 - src[i];
        dst[i + 1] = 255 - src[i + 1];
        dst[i + 2] = 255 - src[i + 2];
        dst[i + 3] = 255;
      }
      return out;
    }

    case "gaussian_blur": {
      const kernel = makeGaussianKernel(p.ksize, p.sigma);
      dst.set(convolveSeparableRGBA(src, w, h, kernel));
      return out;
    }

    case "box_blur": {
      const kernel = new Float32Array(p.ksize).fill(1 / p.ksize);
      dst.set(convolveSeparableRGBA(src, w, h, kernel));
      return out;
    }

    case "median_blur": {
      const half = Math.floor(p.ksize / 2);
      const rArr = [], gArr = [], bArr = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          rArr.length = gArr.length = bArr.length = 0;
          for (let dy = -half; dy <= half; dy++) {
            const sy = Math.min(h - 1, Math.max(0, y + dy));
            for (let dx = -half; dx <= half; dx++) {
              const sx = Math.min(w - 1, Math.max(0, x + dx));
              const idx = (sy * w + sx) * 4;
              rArr.push(src[idx]);
              gArr.push(src[idx + 1]);
              bArr.push(src[idx + 2]);
            }
          }
          rArr.sort((a, b) => a - b);
          gArr.sort((a, b) => a - b);
          bArr.sort((a, b) => a - b);
          const mid = rArr.length >> 1;
          const dIdx = (y * w + x) * 4;
          dst[dIdx] = rArr[mid];
          dst[dIdx + 1] = gArr[mid];
          dst[dIdx + 2] = bArr[mid];
          dst[dIdx + 3] = 255;
        }
      }
      return out;
    }

    case "unsharp_mask": {
      const kernel = makeGaussianKernel(p.radius, 0);
      const blurred = convolveSeparableRGBA(src, w, h, kernel);
      const amt = p.amount;
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = clamp(src[i] + amt * (src[i] - blurred[i]));
        dst[i + 1] = clamp(src[i + 1] + amt * (src[i + 1] - blurred[i + 1]));
        dst[i + 2] = clamp(src[i + 2] + amt * (src[i + 2] - blurred[i + 2]));
        dst[i + 3] = 255;
      }
      return out;
    }

    case "sobel": {
      const gray = toGrayscaleArray(src, w, h);
      const res = new Uint8ClampedArray(w * h);
      const scale = p.ksize === 1 ? 1 : p.ksize === 3 ? 1 : p.ksize === 5 ? 0.12 : 0.02;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const tl = gray[(y - 1) * w + (x - 1)];
          const tc = gray[(y - 1) * w + x];
          const tr = gray[(y - 1) * w + (x + 1)];
          const ml = gray[y * w + (x - 1)];
          const mr = gray[y * w + (x + 1)];
          const bl = gray[(y + 1) * w + (x - 1)];
          const bc = gray[(y + 1) * w + x];
          const br = gray[(y + 1) * w + (x + 1)];

          const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
          const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
          res[y * w + x] = clamp(Math.hypot(gx, gy) * scale);
        }
      }
      return grayToImageData(res, w, h);
    }

    case "canny": {
      const kernel = makeGaussianKernel(5, 1.4);
      const smoothRGBA = convolveSeparableRGBA(src, w, h, kernel);
      const gray = toGrayscaleArray(smoothRGBA, w, h);

      const mag = new Float32Array(w * h);
      const dir = new Uint8Array(w * h);

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const gx =
            -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)] -
            2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)] -
            gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];
          const gy =
            -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)] +
            gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];

          mag[idx] = Math.hypot(gx, gy);
          let angle = (Math.atan2(gy, gx) * 180) / Math.PI;
          if (angle < 0) angle += 180;
          if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) dir[idx] = 0;
          else if (angle >= 22.5 && angle < 67.5) dir[idx] = 45;
          else if (angle >= 67.5 && angle < 112.5) dir[idx] = 90;
          else dir[idx] = 135;
        }
      }

      const edges = new Uint8ClampedArray(w * h);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const m = mag[idx];
          let n1 = 0, n2 = 0;
          if (dir[idx] === 0) { n1 = mag[idx - 1]; n2 = mag[idx + 1]; }
          else if (dir[idx] === 45) { n1 = mag[(y - 1) * w + x + 1]; n2 = mag[(y + 1) * w + x - 1]; }
          else if (dir[idx] === 90) { n1 = mag[(y - 1) * w + x]; n2 = mag[(y + 1) * w + x]; }
          else { n1 = mag[(y - 1) * w + x - 1]; n2 = mag[(y + 1) * w + x + 1]; }

          if (m >= n1 && m >= n2) {
            if (m >= p.high) edges[idx] = 255;
            else if (m >= p.low) edges[idx] = 128;
          }
        }
      }

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (edges[idx] === 128) {
            let hasStrong = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (edges[(y + dy) * w + (x + dx)] === 255) hasStrong = true;
              }
            }
            edges[idx] = hasStrong ? 255 : 0;
          }
        }
      }
      return grayToImageData(edges, w, h);
    }

    case "binary_thresh": {
      const gray = toGrayscaleArray(src, w, h);
      for (let i = 0; i < gray.length; i++) gray[i] = gray[i] > p.thresh ? 255 : 0;
      return grayToImageData(gray, w, h);
    }

    case "otsu_thresh": {
      const gray = toGrayscaleArray(src, w, h);
      const hist = new Int32Array(256);
      for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

      const total = gray.length;
      let sum = 0;
      for (let t = 0; t < 256; t++) sum += t * hist[t];

      let sumB = 0, wB = 0, maxVar = 0, threshold = 0;
      for (let t = 0; t < 256; t++) {
        wB += hist[t];
        if (wB === 0) continue;
        const wF = total - wB;
        if (wF === 0) break;

        sumB += t * hist[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const betweenVar = wB * wF * (mB - mF) * (mB - mF);
        if (betweenVar > maxVar) {
          maxVar = betweenVar;
          threshold = t;
        }
      }

      for (let i = 0; i < gray.length; i++) gray[i] = gray[i] > threshold ? 255 : 0;
      return grayToImageData(gray, w, h);
    }

    case "grayscale": {
      return grayToImageData(toGrayscaleArray(src, w, h), w, h);
    }

    case "hist_eq": {
      const gray = toGrayscaleArray(src, w, h);
      const hist = new Int32Array(256);
      for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

      const cdf = new Int32Array(256);
      cdf[0] = hist[0];
      for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + hist[i];

      const cdfMin = cdf.find((v) => v > 0) || 0;
      const denom = gray.length - cdfMin || 1;
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) {
        lut[i] = Math.round(((cdf[i] - cdfMin) / denom) * 255);
      }
      for (let i = 0; i < gray.length; i++) gray[i] = lut[gray[i]];
      return grayToImageData(gray, w, h);
    }

    case "bit_plane": {
      const gray = toGrayscaleArray(src, w, h);
      const bit = p.bit;
      for (let i = 0; i < gray.length; i++) {
        gray[i] = ((gray[i] >> bit) & 1) * 255;
      }
      return grayToImageData(gray, w, h);
    }

    case "clahe": {
      const gray = toGrayscaleArray(src, w, h);
      const grid = p.grid;
      const tileW = Math.ceil(w / grid);
      const tileH = Math.ceil(h / grid);
      const luts = Array.from({ length: grid }, () => Array(grid));

      for (let ty = 0; ty < grid; ty++) {
        for (let tx = 0; tx < grid; tx++) {
          const x0 = tx * tileW;
          const y0 = ty * tileH;
          const x1 = Math.min(w, x0 + tileW);
          const y1 = Math.min(h, y0 + tileH);
          const hist = new Float32Array(256);
          let count = 0;

          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              hist[gray[y * w + x]]++;
              count++;
            }
          }

          const clipLimit = Math.max(1, (p.clip * count) / 256);
          let excess = 0;
          for (let i = 0; i < 256; i++) {
            if (hist[i] > clipLimit) {
              excess += hist[i] - clipLimit;
              hist[i] = clipLimit;
            }
          }
          const redist = excess / 256;
          for (let i = 0; i < 256; i++) hist[i] += redist;

          const lut = new Uint8ClampedArray(256);
          let cdf = 0;
          for (let i = 0; i < 256; i++) {
            cdf += hist[i];
            lut[i] = clamp(Math.round((cdf / (count || 1)) * 255));
          }
          luts[ty][tx] = lut;
        }
      }

      const res = new Uint8ClampedArray(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const val = gray[y * w + x];
          const gx = (x + 0.5) / tileW - 0.5;
          const gy = (y + 0.5) / tileH - 0.5;
          const tx1 = Math.max(0, Math.min(grid - 1, Math.floor(gx)));
          const ty1 = Math.max(0, Math.min(grid - 1, Math.floor(gy)));
          const tx2 = Math.min(grid - 1, tx1 + 1);
          const ty2 = Math.min(grid - 1, ty1 + 1);
          const fx = Math.max(0, Math.min(1, gx - tx1));
          const fy = Math.max(0, Math.min(1, gy - ty1));

          const top = (1 - fx) * luts[ty1][tx1][val] + fx * luts[ty1][tx2][val];
          const bot = (1 - fx) * luts[ty2][tx1][val] + fx * luts[ty2][tx2][val];
          res[y * w + x] = Math.round((1 - fy) * top + fy * bot);
        }
      }
      return grayToImageData(res, w, h);
    }

    case "morphology": {
      const gray = toGrayscaleArray(src, w, h);
      const half = Math.floor(p.ksize / 2);

      const erode = (buf) => {
        const res = new Uint8ClampedArray(w * h);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let minVal = 255;
            for (let dy = -half; dy <= half; dy++) {
              const sy = Math.min(h - 1, Math.max(0, y + dy));
              for (let dx = -half; dx <= half; dx++) {
                const sx = Math.min(w - 1, Math.max(0, x + dx));
                const v = buf[sy * w + sx];
                if (v < minVal) minVal = v;
              }
            }
            res[y * w + x] = minVal;
          }
        }
        return res;
      };

      const dilate = (buf) => {
        const res = new Uint8ClampedArray(w * h);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let maxVal = 0;
            for (let dy = -half; dy <= half; dy++) {
              const sy = Math.min(h - 1, Math.max(0, y + dy));
              for (let dx = -half; dx <= half; dx++) {
                const sx = Math.min(w - 1, Math.max(0, x + dx));
                const v = buf[sy * w + sx];
                if (v > maxVal) maxVal = v;
              }
            }
            res[y * w + x] = maxVal;
          }
        }
        return res;
      };

      let resultGray;
      if (p.morphOp === "erode") resultGray = erode(gray);
      else if (p.morphOp === "dilate") resultGray = dilate(gray);
      else if (p.morphOp === "open") resultGray = dilate(erode(gray));
      else resultGray = erode(dilate(gray));

      return grayToImageData(resultGray, w, h);
    }

    default:
      return srcImageData;
  }
}

function runPipeline() {
  if (!originalImageData) return;
  const processed = processPixels(originalImageData, currentOp, currentParams);
  procCtx.putImageData(processed, 0, 0);
  pythonCodeBlock.textContent = OPERATIONS[currentOp].code(currentParams);
}

// ==========================================
// 6. Collapsible Notebook Code & Download
// ==========================================
const codeToggleBtn = document.getElementById("codeToggleBtn");
const notebookBody = document.getElementById("notebookBody");
const codeChevron = document.getElementById("codeChevron");

codeToggleBtn.addEventListener("click", () => {
  const isCollapsed = notebookBody.classList.toggle("collapsed");
  codeChevron.classList.toggle("open", !isCollapsed);
  codeToggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
});

codeToggleBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    codeToggleBtn.click();
  }
});

const copyCodeBtn = document.getElementById("copyCodeBtn");
copyCodeBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(pythonCodeBlock.textContent);
    const prev = copyCodeBtn.textContent;
    copyCodeBtn.textContent = "Copied!";
    setTimeout(() => (copyCodeBtn.textContent = prev), 1500);
  } catch {
    copyCodeBtn.textContent = "Copy failed";
  }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `processed_${currentOp}.png`;
  link.href = procCanvas.toDataURL("image/png");
  link.click();
});

// ==========================================
// 7. Initialize App
// ==========================================
loadBuiltInSample("shapes");
selectOperation("gaussian_noise");
