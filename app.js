// ==========================================
// 1. Operations Registry, Parameters & Code
// ==========================================
const OPERATIONS = {
  // --- Noise & Point Operations ---
  gaussian_noise: {
    title: "Gaussian noise",
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
    params: [],
    code: () => `import cv2

img = cv2.imread("input.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

cv2.imwrite("output_grayscale.jpg", gray)`
  },

  hist_eq: {
    title: "Histogram equalization",
    lang: "python · opencv-python",
    params: [],
    code: () => `import cv2

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)

# Global contrast enhancement via CDF mapping
equalized = cv2.equalizeHist(gray)

cv2.imwrite("output_hist_eq.jpg", equalized)`
  },

  bit_plane: {
    title: "Bit-plane slicing",
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
    lang: "python · opencv-python",
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
  },

  // --- Traditional Segmentation ---
  kmeans_seg: {
    title: "K-Means clustering",
    lang: "python · opencv-python",
    params: [
      {
        id: "k",
        label: "Clusters (K)",
        desc: "Number of color/intensity partitions to group pixels into via unsupervised centroid clustering.",
        type: "range",
        min: 2,
        max: 10,
        step: 1,
        default: 4
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg")
Z = img.reshape((-1, 3)).astype(np.float32)

# Define criteria and apply K-Means clustering
K = ${p.k}
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
_, labels, centers = cv2.kmeans(Z, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

# Map each pixel back to its cluster centroid color
centers = np.uint8(centers)
segmented = centers[labels.flatten()].reshape(img.shape)

cv2.imwrite("output_kmeans.jpg", segmented)`
  },

  region_growing: {
    title: "Region growing",
    lang: "python · opencv-python",
    params: [
      {
        id: "seedX",
        label: "Seed X (%)",
        desc: "Horizontal starting coordinate (percentage of image width) for BFS region expansion.",
        type: "range",
        min: 5,
        max: 95,
        step: 1,
        default: 50
      },
      {
        id: "seedY",
        label: "Seed Y (%)",
        desc: "Vertical starting coordinate (percentage of image height) for BFS region expansion.",
        type: "range",
        min: 5,
        max: 95,
        step: 1,
        default: 50
      },
      {
        id: "tol",
        label: "Color Tolerance",
        desc: "Maximum Euclidean RGB distance from seed color allowed to merge neighboring pixels.",
        type: "range",
        min: 5,
        max: 120,
        step: 5,
        default: 35
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg")
h, w = img.shape[:2]
seed = (int(w * ${(p.seedX / 100).toFixed(2)}), int(h * ${(p.seedY / 100).toFixed(2)}))
tol = ${p.tol}

# Flood-fill region growing from seed using fixed-range tolerance
mask = np.zeros((h + 2, w + 2), np.uint8)
flags = 4 | (255 << 8) | cv2.FLOODFILL_FIXED_RANGE
cv2.floodFill(img.copy(), mask, seed, (0, 255, 180), (tol,)*3, (tol,)*3, flags)

# Overlay grown region mask onto original image
region = mask[1:-1, 1:-1] > 0
overlay = img.copy()
overlay[region] = (overlay[region] * 0.45 + np.array([0, 220, 160]) * 0.55).astype(np.uint8)

cv2.imwrite("output_region_growing.jpg", overlay)`
  },

  watershed: {
    title: "Watershed",
    lang: "python · opencv-python",
    params: [
      {
        id: "fgRatio",
        label: "Sure-FG Distance (%)",
        desc: "Distance-transform peak threshold separating touching objects into distinct watershed basins.",
        type: "range",
        min: 15,
        max: 75,
        step: 5,
        default: 40
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Noise removal & sure background
kernel = np.ones((3, 3), np.uint8)
opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
sure_bg = cv2.dilate(opening, kernel, iterations=3)

# Distance transform to isolate sure foreground markers
dist = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
_, sure_fg = cv2.threshold(dist, ${(p.fgRatio / 100).toFixed(2)} * dist.max(), 255, 0)
sure_fg = np.uint8(sure_fg)
unknown = cv2.subtract(sure_bg, sure_fg)

# Marker labelling and Watershed flooding
_, markers = cv2.connectedComponents(sure_fg)
markers = markers + 1
markers[unknown == 255] = 0
markers = cv2.watershed(img, markers)

# Draw watershed ridge boundaries in red
result = img.copy()
result[markers == -1] = [0, 0, 255]
cv2.imwrite("output_watershed.jpg", result)`
  },

  grabcut: {
    title: "GrabCut (foreground)",
    lang: "python · opencv-python",
    params: [
      {
        id: "margin",
        label: "ROI Border Margin (%)",
        desc: "Outer border assumed to be definite background; inner rectangle defines foreground search region.",
        type: "range",
        min: 5,
        max: 35,
        step: 5,
        default: 15
      }
    ],
    code: (p) => `import cv2
import numpy as np

img = cv2.imread("input.jpg")
h, w = img.shape[:2]
mx, my = int(w * ${(p.margin / 100).toFixed(2)}), int(h * ${(p.margin / 100).toFixed(2)})
rect = (mx, my, w - 2 * mx, h - 2 * my)

mask = np.zeros((h, w), np.uint8)
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)

# Iterative graph-cut Gaussian Mixture Model segmentation
cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
fg_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
foreground = img * fg_mask[:, :, np.newaxis]

cv2.imwrite("output_grabcut.jpg", foreground)`
  },

  // --- Segmentation Paradigms & SOTA ---
  semantic_seg: {
    title: "Semantic segmentation",
    lang: "python · torchvision (DeepLabV3+)",
    params: [
      {
        id: "classes",
        label: "Semantic Categories",
        desc: "Assigns every pixel a class label (e.g., background, object, gradient); merges same-class objects.",
        type: "range",
        min: 2,
        max: 6,
        step: 1,
        default: 4
      }
    ],
    code: () => `import torch
import torchvision.transforms as T
from torchvision.models.segmentation import deeplabv3_resnet50, DeepLabV3_ResNet50_Weights
from PIL import Image
import numpy as np

# Semantic Segmentation: Every pixel gets a class ID (no instance separation)
weights = DeepLabV3_ResNet50_Weights.DEFAULT
model = deeplabv3_resnet50(weights=weights).eval()
preprocess = weights.transforms()

img = Image.open("input.jpg").convert("RGB")
input_tensor = preprocess(img).unsqueeze(0)

with torch.no_grad():
    logits = model(input_tensor)["out"][0]          # [NumClasses, H, W]
    class_map = logits.argmax(0).byte().cpu().numpy()  # Pixel-wise class labels`
  },

  instance_seg: {
    title: "Instance segmentation",
    lang: "python · torchvision (Mask R-CNN)",
    params: [
      {
        id: "minArea",
        label: "Min Object Area (px)",
        desc: "Detects and assigns a unique ID & color mask to every individual object instance separately.",
        type: "range",
        min: 20,
        max: 400,
        step: 20,
        default: 80
      }
    ],
    code: () => `import torch
from torchvision.models.detection import maskrcnn_resnet50_fpn_v2, MaskRCNN_ResNet50_FPN_V2_Weights
from torchvision.transforms.functional import to_tensor
from PIL import Image

# Instance Segmentation: Separates individual countable objects (person_1, person_2...)
weights = MaskRCNN_ResNet50_FPN_V2_Weights.DEFAULT
model = maskrcnn_resnet50_fpn_v2(weights=weights).eval()

img = Image.open("input.jpg").convert("RGB")
with torch.no_grad():
    preds = model([to_tensor(img)])[0]

# Filter high-confidence object masks
keep = preds["scores"] > 0.75
instance_masks = preds["masks"][keep]   # [N_instances, 1, H, W]
instance_labels = preds["labels"][keep]`
  },

  panoptic_seg: {
    title: "Panoptic segmentation",
    lang: "python · transformers (Mask2Former)",
    params: [
      {
        id: "minArea",
        label: "Thing Min Size (px)",
        desc: "Unifies semantic 'stuff' (sky/background) with countable 'things' (each object gets unique ID).",
        type: "range",
        min: 20,
        max: 400,
        step: 20,
        default: 80
      }
    ],
    code: () => `import torch
from transformers import AutoImageProcessor, Mask2FormerForUniversalSegmentation
from PIL import Image

# Panoptic Segmentation = Semantic ("stuff": sky, road) + Instance ("things": cars, cells)
model_id = "facebook/mask2former-swin-large-coco-panoptic"
processor = AutoImageProcessor.from_pretrained(model_id)
model = Mask2FormerForUniversalSegmentation.from_pretrained(model_id).eval()

img = Image.open("input.jpg").convert("RGB")
inputs = processor(images=img, return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs)

panoptic = processor.post_process_panoptic_segmentation(outputs, target_sizes=[img.size[::-1]])[0]
seg_map = panoptic["segmentation"]       # Unique segment ID per pixel
segments_info = panoptic["segments_info"] # Class label + isthing flag`
  },

  unet_seg: {
    title: "U-Net (Encoder-Decoder)",
    lang: "python · PyTorch U-Net Architecture",
    params: [
      {
        id: "thresh",
        label: "Sigmoid Probability Cutoff",
        desc: "Foreground probability threshold on decoder output; skip connections preserve fine boundaries.",
        type: "range",
        min: 10,
        max: 90,
        step: 5,
        default: 50
      }
    ],
    code: (p) => `import torch
import torch.nn as nn

class DoubleConv(nn.Module):
    def __init__(self, in_c, out_c):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, padding=1), nn.BatchNorm2d(out_c), nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, 3, padding=1), nn.BatchNorm2d(out_c), nn.ReLU(inplace=True),
        )
    def forward(self, x): return self.net(x)

class UNet(nn.Module):
    def __init__(self, in_channels=3, out_classes=1):
        super().__init__()
        self.enc1 = DoubleConv(in_channels, 64)
        self.enc2 = DoubleConv(64, 128)
        self.pool = nn.MaxPool2d(2)
        self.bottleneck = DoubleConv(128, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.dec2 = DoubleConv(256, 128)  # Concatenates skip connection from enc2
        self.up1 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec1 = DoubleConv(128, 64)   # Concatenates skip connection from enc1
        self.head = nn.Conv2d(64, out_classes, kernel_size=1)

    def forward(self, x):
        s1 = self.enc1(x)
        s2 = self.enc2(self.pool(s1))
        b = self.bottleneck(self.pool(s2))
        d2 = self.dec2(torch.cat([self.up2(b), s2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), s1], dim=1))
        return torch.sigmoid(self.head(d1)) > ${(p.thresh / 100).toFixed(2)}`
  },

  sam_seg: {
    title: "SAM / SAM 3 (Promptable)",
    lang: "python · Meta SAM / SAM 3",
    params: [
      {
        id: "promptX",
        label: "Point Prompt X (%)",
        desc: "Horizontal coordinate of the interactive positive point prompt (+) clicked on a target object.",
        type: "range",
        min: 5,
        max: 95,
        step: 1,
        default: 50
      },
      {
        id: "promptY",
        label: "Point Prompt Y (%)",
        desc: "Vertical coordinate of the interactive positive point prompt (+) clicked on a target object.",
        type: "range",
        min: 5,
        max: 95,
        step: 1,
        default: 50
      }
    ],
    code: (p) => `import cv2
import numpy as np
from segment_anything import sam_model_registry, SamPredictor

# Promptable Foundation Segmentation (SAM / SAM 2 / SAM 3)
# SAM 3 also supports open-vocabulary text & exemplar prompts directly!
sam = sam_model_registry["vit_h"](checkpoint="sam_vit_h_4b8939.pth")
predictor = SamPredictor(sam)

image = cv2.cvtColor(cv2.imread("input.jpg"), cv2.COLOR_BGR2RGB)
h, w = image.shape[:2]
predictor.set_image(image)

# Positive point prompt (label=1) at user-selected coordinates
input_point = np.array([[int(w * ${(p.promptX / 100).toFixed(2)}), int(h * ${(p.promptY / 100).toFixed(2)})]])
input_label = np.array([1])

masks, scores, _ = predictor.predict(
    point_coords=input_point,
    point_labels=input_label,
    multimask_output=True,
)
best_mask = masks[np.argmax(scores)]`
  },

  oneformer_seg: {
    title: "OneFormer (Universal)",
    lang: "python · transformers (OneFormer)",
    params: [
      {
        id: "task",
        label: "Task Prompt Token",
        desc: "Single universal transformer switches between Semantic, Instance, or Panoptic via task token.",
        type: "select",
        options: [
          { value: "panoptic", label: 'Task: "the task is panoptic"' },
          { value: "instance", label: 'Task: "the task is instance"' },
          { value: "semantic", label: 'Task: "the task is semantic"' }
        ],
        default: "panoptic"
      }
    ],
    code: (p) => `import torch
from transformers import OneFormerProcessor, OneFormerForUniversalSegmentation
from PIL import Image

# OneFormer: Universal Transformer trained once for Semantic, Instance & Panoptic
model_id = "shi-labs/oneformer_coco_swin_large"
processor = OneFormerProcessor.from_pretrained(model_id)
model = OneFormerForUniversalSegmentation.from_pretrained(model_id).eval()

img = Image.open("input.jpg").convert("RGB")
inputs = processor(images=img, task_inputs=["${p.task}"], return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs)

result = processor.post_process_${p.task}_segmentation(outputs, target_sizes=[img.size[::-1]])[0]`
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
const codeLangTag = document.getElementById("codeLangTag");

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
  } else if (type === "cells") {
    // Dark microscopy-style background with overlapping bright objects (ideal for Watershed, Instance, Panoptic)
    origCtx.fillStyle = "#111827";
    origCtx.fillRect(0, 0, w, h);

    const blobs = [
      { x: 130, y: 120, r: 46, c: "#e2e8f0" },
      { x: 185, y: 145, r: 42, c: "#cbd5e1" }, // Touching pair 1
      { x: 340, y: 110, r: 50, c: "#f1f5f9" },
      { x: 395, y: 135, r: 40, c: "#cbd5e1" }, // Touching pair 2
      { x: 255, y: 245, r: 52, c: "#e2e8f0" },
      { x: 315, y: 265, r: 38, c: "#94a3b8" }, // Touching pair 3
      { x: 110, y: 270, r: 34, c: "#f8fafc" },
      { x: 435, y: 255, r: 36, c: "#e2e8f0" }
    ];

    blobs.forEach((b) => {
      const g = origCtx.createRadialGradient(b.x - 10, b.y - 10, 5, b.x, b.y, b.r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.75, b.c);
      g.addColorStop(1, "#475569");
      origCtx.fillStyle = g;
      origCtx.beginPath();
      origCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      origCtx.fill();
    });
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
  if (codeLangTag && spec.lang) codeLangTag.textContent = spec.lang;

  const activePill = document.querySelector(`.pill[data-op="${opKey}"]`);
  const activeOpBadge = document.getElementById("activeOpBadge");
  if (activeOpBadge && activePill) {
    const catName = activePill.closest(".category-block")?.querySelector("h3")?.textContent || "";
    activeOpBadge.textContent = catName ? `${catName} · ${spec.title}` : spec.title;
  }
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
// 5. Image Processing & Segmentation Engine
// ==========================================
const SEGMENT_PALETTE = [
  [15, 107, 99],   // Teal
  [239, 68, 68],   // Coral Red
  [245, 158, 11],  // Amber
  [59, 130, 246],  // Royal Blue
  [168, 85, 247],  // Violet
  [16, 185, 129],  // Emerald
  [236, 72, 153],  // Pink
  [14, 165, 233],  // Sky
  [234, 88, 12],   // Orange
  [132, 204, 22]   // Lime
];

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

function computeOtsuThreshold(gray) {
  const hist = new Int32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0, wB = 0, maxVar = 0, threshold = 127;
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
  return threshold;
}

function connectedComponents(binaryMask, w, h) {
  const labels = new Int32Array(w * h);
  const areas = [0];
  let currentLabel = 0;
  const queue = new Int32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    if (binaryMask[i] && labels[i] === 0) {
      currentLabel++;
      let head = 0, tail = 0;
      queue[tail++] = i;
      labels[i] = currentLabel;

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;

        const neighbors = [];
        if (x > 0) neighbors.push(idx - 1);
        if (x < w - 1) neighbors.push(idx + 1);
        if (y > 0) neighbors.push(idx - w);
        if (y < h - 1) neighbors.push(idx + w);

        for (let n = 0; n < neighbors.length; n++) {
          const nIdx = neighbors[n];
          if (binaryMask[nIdx] && labels[nIdx] === 0) {
            labels[nIdx] = currentLabel;
            queue[tail++] = nIdx;
          }
        }
      }
      areas.push(tail);
    }
  }
  return { labels, count: currentLabel, areas };
}

function drawBadgeOverlay(ctx, lines) {
  ctx.save();
  ctx.font = "600 12px -apple-system, BlinkMacSystemFont, sans-serif";
  const padX = 10, padY = 8, lineH = 18;
  const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const boxW = maxW + padX * 2;
  const boxH = lines.length * lineH + padY * 1.5;

  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.beginPath();
  ctx.roundRect(10, 10, boxW, boxH, 6);
  ctx.fill();

  ctx.fillStyle = "#f8fafc";
  lines.forEach((line, idx) => {
    ctx.fillText(line, 10 + padX, 10 + padY + 11 + idx * lineH);
  });
  ctx.restore();
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
      return { imageData: out };
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
      return { imageData: out };
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
      return { imageData: out };
    }

    case "brightness_contrast": {
      const { alpha, beta } = p;
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = clamp(alpha * src[i] + beta);
        dst[i + 1] = clamp(alpha * src[i + 1] + beta);
        dst[i + 2] = clamp(alpha * src[i + 2] + beta);
        dst[i + 3] = 255;
      }
      return { imageData: out };
    }

    case "log_transform": {
      const c = (255 / Math.log(256)) * p.gain;
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = clamp(c * Math.log(1 + src[i]));
        dst[i + 1] = clamp(c * Math.log(1 + src[i + 1]));
        dst[i + 2] = clamp(c * Math.log(1 + src[i + 2]));
        dst[i + 3] = 255;
      }
      return { imageData: out };
    }

    case "inverse": {
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = 255 - src[i];
        dst[i + 1] = 255 - src[i + 1];
        dst[i + 2] = 255 - src[i + 2];
        dst[i + 3] = 255;
      }
      return { imageData: out };
    }

    case "gaussian_blur": {
      const kernel = makeGaussianKernel(p.ksize, p.sigma);
      dst.set(convolveSeparableRGBA(src, w, h, kernel));
      return { imageData: out };
    }

    case "box_blur": {
      const kernel = new Float32Array(p.ksize).fill(1 / p.ksize);
      dst.set(convolveSeparableRGBA(src, w, h, kernel));
      return { imageData: out };
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
      return { imageData: out };
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
      return { imageData: out };
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
      return { imageData: grayToImageData(res, w, h) };
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
      return { imageData: grayToImageData(edges, w, h) };
    }

    case "binary_thresh": {
      const gray = toGrayscaleArray(src, w, h);
      for (let i = 0; i < gray.length; i++) gray[i] = gray[i] > p.thresh ? 255 : 0;
      return { imageData: grayToImageData(gray, w, h) };
    }

    case "otsu_thresh": {
      const gray = toGrayscaleArray(src, w, h);
      const threshold = computeOtsuThreshold(gray);
      for (let i = 0; i < gray.length; i++) gray[i] = gray[i] > threshold ? 255 : 0;
      return { imageData: grayToImageData(gray, w, h) };
    }

    case "grayscale": {
      return { imageData: grayToImageData(toGrayscaleArray(src, w, h), w, h) };
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
      return { imageData: grayToImageData(gray, w, h) };
    }

    case "bit_plane": {
      const gray = toGrayscaleArray(src, w, h);
      const bit = p.bit;
      for (let i = 0; i < gray.length; i++) {
        gray[i] = ((gray[i] >> bit) & 1) * 255;
      }
      return { imageData: grayToImageData(gray, w, h) };
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
      return { imageData: grayToImageData(res, w, h) };
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

      return { imageData: grayToImageData(resultGray, w, h) };
    }

    // --- Traditional Segmentation ---
    case "kmeans_seg": {
      const K = p.k;
      const nPix = w * h;
      // Deterministic evenly-spaced initial centroids
      const centroids = Array.from({ length: K }, (_, k) => {
        const idx = Math.floor(((k + 0.5) / K) * nPix) * 4;
        return [src[idx], src[idx + 1], src[idx + 2]];
      });
      const labels = new Uint8Array(nPix);

      for (let iter = 0; iter < 8; iter++) {
        const sums = Array.from({ length: K }, () => [0, 0, 0, 0]);
        for (let i = 0, pIdx = 0; i < src.length; i += 4, pIdx++) {
          const r = src[i], g = src[i + 1], b = src[i + 2];
          let bestK = 0, bestDist = Infinity;
          for (let k = 0; k < K; k++) {
            const dr = r - centroids[k][0];
            const dg = g - centroids[k][1];
            const db = b - centroids[k][2];
            const d = dr * dr + dg * dg + db * db;
            if (d < bestDist) {
              bestDist = d;
              bestK = k;
            }
          }
          labels[pIdx] = bestK;
          sums[bestK][0] += r;
          sums[bestK][1] += g;
          sums[bestK][2] += b;
          sums[bestK][3]++;
        }
        for (let k = 0; k < K; k++) {
          if (sums[k][3] > 0) {
            centroids[k][0] = sums[k][0] / sums[k][3];
            centroids[k][1] = sums[k][1] / sums[k][3];
            centroids[k][2] = sums[k][2] / sums[k][3];
          }
        }
      }

      for (let i = 0, pIdx = 0; i < src.length; i += 4, pIdx++) {
        const c = centroids[labels[pIdx]];
        dst[i] = Math.round(c[0]);
        dst[i + 1] = Math.round(c[1]);
        dst[i + 2] = Math.round(c[2]);
        dst[i + 3] = 255;
      }
      return {
        imageData: out,
        overlay: (ctx) => drawBadgeOverlay(ctx, [`K-Means Clustering (K = ${K})`])
      };
    }

    case "region_growing": {
      const sx = Math.floor((w * p.seedX) / 100);
      const sy = Math.floor((h * p.seedY) / 100);
      const seedIdx = (sy * w + sx) * 4;
      const sr = src[seedIdx], sg = src[seedIdx + 1], sb = src[seedIdx + 2];
      const tolSq = p.tol * p.tol;

      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0, tail = 0;
      const start = sy * w + sx;
      visited[start] = 1;
      queue[tail++] = start;

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;

        const neighbors = [];
        if (x > 0) neighbors.push(idx - 1);
        if (x < w - 1) neighbors.push(idx + 1);
        if (y > 0) neighbors.push(idx - w);
        if (y < h - 1) neighbors.push(idx + w);

        for (let n = 0; n < neighbors.length; n++) {
          const nIdx = neighbors[n];
          if (!visited[nIdx]) {
            const cIdx = nIdx * 4;
            const dr = src[cIdx] - sr;
            const dg = src[cIdx + 1] - sg;
            const db = src[cIdx + 2] - sb;
            if (dr * dr + dg * dg + db * db <= tolSq) {
              visited[nIdx] = 1;
              queue[tail++] = nIdx;
            }
          }
        }
      }

      for (let i = 0, pIdx = 0; i < src.length; i += 4, pIdx++) {
        if (visited[pIdx]) {
          dst[i] = clamp(Math.round(src[i] * 0.4 + 15 * 0.6));
          dst[i + 1] = clamp(Math.round(src[i + 1] * 0.4 + 210 * 0.6));
          dst[i + 2] = clamp(Math.round(src[i + 2] * 0.4 + 170 * 0.6));
        } else {
          dst[i] = Math.round(src[i] * 0.65);
          dst[i + 1] = Math.round(src[i + 1] * 0.65);
          dst[i + 2] = Math.round(src[i + 2] * 0.65);
        }
        dst[i + 3] = 255;
      }

      return {
        imageData: out,
        overlay: (ctx) => {
          // Draw seed crosshair
          ctx.save();
          ctx.strokeStyle = "#ef4444";
          ctx.fillStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          drawBadgeOverlay(ctx, [
            `Region Growing · Seed (${sx}, ${sy})`,
            `Grown Region: ${tail.toLocaleString()} px (${((tail / (w * h)) * 100).toFixed(1)}%)`
          ]);
        }
      };
    }

    case "watershed": {
      // Distance transform on Otsu foreground -> local peaks -> nearest-peak basin flooding
      const gray = toGrayscaleArray(src, w, h);
      const otsu = computeOtsuThreshold(gray);
      const fg = new Uint8Array(w * h);
      for (let i = 0; i < gray.length; i++) fg[i] = gray[i] > otsu ? 1 : 0;

      // Two-pass Manhattan/Chamfer distance transform
      const dist = new Float32Array(w * h);
      let maxDist = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (!fg[idx]) {
            dist[idx] = 0;
          } else {
            const top = y > 0 ? dist[(y - 1) * w + x] : 0;
            const left = x > 0 ? dist[y * w + (x - 1)] : 0;
            dist[idx] = Math.min(top, left) + 1;
          }
        }
      }
      for (let y = h - 1; y >= 0; y--) {
        for (let x = w - 1; x >= 0; x--) {
          const idx = y * w + x;
          if (fg[idx]) {
            const bot = y < h - 1 ? dist[(y + 1) * w + x] : 0;
            const right = x < w - 1 ? dist[y * w + (x + 1)] : 0;
            dist[idx] = Math.min(dist[idx], Math.min(bot, right) + 1);
            if (dist[idx] > maxDist) maxDist = dist[idx];
          }
        }
      }

      const seedThresh = Math.max(1, (p.fgRatio / 100) * maxDist);
      const sureFg = new Uint8Array(w * h);
      for (let i = 0; i < fg.length; i++) sureFg[i] = dist[i] >= seedThresh ? 1 : 0;

      const { labels: markers, count } = connectedComponents(sureFg, w, h);

      // Multi-source BFS flooding inside foreground mask
      const basin = new Int32Array(markers);
      const queue = new Int32Array(w * h);
      let head = 0, tail = 0;
      for (let i = 0; i < basin.length; i++) {
        if (basin[i] > 0) queue[tail++] = i;
      }

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;
        const lbl = basin[idx];

        const neighbors = [];
        if (x > 0) neighbors.push(idx - 1);
        if (x < w - 1) neighbors.push(idx + 1);
        if (y > 0) neighbors.push(idx - w);
        if (y < h - 1) neighbors.push(idx + w);

        for (let n = 0; n < neighbors.length; n++) {
          const nIdx = neighbors[n];
          if (fg[nIdx] && basin[nIdx] === 0) {
            basin[nIdx] = lbl;
            queue[tail++] = nIdx;
          }
        }
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const pIdx = y * w + x;
          const i = pIdx * 4;
          const lbl = basin[pIdx];
          if (lbl === 0) {
            dst[i] = Math.round(src[i] * 0.35);
            dst[i + 1] = Math.round(src[i + 1] * 0.35);
            dst[i + 2] = Math.round(src[i + 2] * 0.35);
          } else {
            const isRidge =
              (x > 0 && basin[pIdx - 1] > 0 && basin[pIdx - 1] !== lbl) ||
              (y > 0 && basin[pIdx - w] > 0 && basin[pIdx - w] !== lbl);
            if (isRidge) {
              dst[i] = 239;
              dst[i + 1] = 68;
              dst[i + 2] = 68;
            } else {
              const col = SEGMENT_PALETTE[(lbl - 1) % SEGMENT_PALETTE.length];
              dst[i] = Math.round(src[i] * 0.45 + col[0] * 0.55);
              dst[i + 1] = Math.round(src[i + 1] * 0.45 + col[1] * 0.55);
              dst[i + 2] = Math.round(src[i + 2] * 0.45 + col[2] * 0.55);
            }
          }
          dst[i + 3] = 255;
        }
      }

      return {
        imageData: out,
        overlay: (ctx) =>
          drawBadgeOverlay(ctx, [
            `Watershed Basins Found: ${count}`,
            `Red lines = topological ridge boundaries`
          ])
      };
    }

    case "grabcut": {
      // Interactive ROI border background model + foreground color distance refinement
      const mx = Math.floor((w * p.margin) / 100);
      const my = Math.floor((h * p.margin) / 100);

      let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (x < mx || x >= w - mx || y < my || y >= h - my) {
            const idx = (y * w + x) * 4;
            bgR += src[idx];
            bgG += src[idx + 1];
            bgB += src[idx + 2];
            bgCount++;
          }
        }
      }
      bgR /= bgCount || 1;
      bgG /= bgCount || 1;
      bgB /= bgCount || 1;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const insideRoi = x >= mx && x < w - mx && y >= my && y < h - my;
          const distBg = Math.hypot(src[i] - bgR, src[i + 1] - bgG, src[i + 2] - bgB);
          const isFg = insideRoi && distBg > 42;
          if (isFg) {
            dst[i] = src[i];
            dst[i + 1] = src[i + 1];
            dst[i + 2] = src[i + 2];
          } else {
            dst[i] = Math.round(src[i] * 0.18);
            dst[i + 1] = Math.round(src[i + 1] * 0.18);
            dst[i + 2] = Math.round(src[i + 2] * 0.18);
          }
          dst[i + 3] = 255;
        }
      }

      return {
        imageData: out,
        overlay: (ctx) => {
          ctx.save();
          ctx.strokeStyle = "#38bdf8";
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2;
          ctx.strokeRect(mx, my, w - 2 * mx, h - 2 * my);
          ctx.restore();
          drawBadgeOverlay(ctx, [`GrabCut ROI (${w - 2 * mx}×${h - 2 * my})`, `Dashed box = initial foreground ROI`]);
        }
      };
    }

    // --- Segmentation Paradigms & SOTA ---
    case "semantic_seg": {
      // Quantize into C semantic classes: ALL pixels of the same class share 1 color (no instance separation)
      const gray = toGrayscaleArray(src, w, h);
      const C = p.classes;
      for (let i = 0, pIdx = 0; i < src.length; i += 4, pIdx++) {
        const cls = Math.min(C - 1, Math.floor((gray[pIdx] / 256) * C));
        const col = SEGMENT_PALETTE[cls % SEGMENT_PALETTE.length];
        dst[i] = Math.round(src[i] * 0.25 + col[0] * 0.75);
        dst[i + 1] = Math.round(src[i + 1] * 0.25 + col[1] * 0.75);
        dst[i + 2] = Math.round(src[i + 2] * 0.25 + col[2] * 0.75);
        dst[i + 3] = 255;
      }
      return {
        imageData: out,
        overlay: (ctx) =>
          drawBadgeOverlay(ctx, [
            `Semantic Segmentation (${C} Classes)`,
            `Same class = same mask color (objects merged)`
          ])
      };
    }

    case "instance_seg": {
      // Isolate countable foreground objects; each individual object receives a distinct ID & color
      const gray = toGrayscaleArray(src, w, h);
      const otsu = computeOtsuThreshold(gray);
      const fg = new Uint8Array(w * h);
      for (let i = 0; i < gray.length; i++) fg[i] = gray[i] > otsu ? 1 : 0;

      const { labels, count, areas } = connectedComponents(fg, w, h);
      let validCount = 0;
      const validMap = new Int32Array(count + 1);
      for (let l = 1; l <= count; l++) {
        if (areas[l] >= p.minArea) validMap[l] = ++validCount;
      }

      for (let i = 0, pIdx = 0; i < src.length; i += 4, pIdx++) {
        const instId = validMap[labels[pIdx]];
        if (instId > 0) {
          const col = SEGMENT_PALETTE[(instId - 1) % SEGMENT_PALETTE.length];
          dst[i] = Math.round(src[i] * 0.3 + col[0] * 0.7);
          dst[i + 1] = Math.round(src[i + 1] * 0.3 + col[1] * 0.7);
          dst[i + 2] = Math.round(src[i + 2] * 0.3 + col[2] * 0.7);
        } else {
          // Background ignored in pure instance segmentation
          dst[i] = Math.round(src[i] * 0.35);
          dst[i + 1] = Math.round(src[i + 1] * 0.35);
          dst[i + 2] = Math.round(src[i + 2] * 0.35);
        }
        dst[i + 3] = 255;
      }

      return {
        imageData: out,
        overlay: (ctx) =>
          drawBadgeOverlay(ctx, [
            `Instance Segmentation: ${validCount} Objects Detected`,
            `Each countable "thing" gets a unique ID & color`
          ])
      };
    }

    case "panoptic_seg": {
      // Unified: Amorphous "stuff" (background) gets semantic class + countable "things" get unique instance IDs
      const gray = toGrayscaleArray(src, w, h);
      const otsu = computeOtsuThreshold(gray);
      const fg = new Uint8Array(w * h);
      for (let i = 0; i < gray.length; i++) fg[i] = gray[i] > otsu ? 1 : 0;

      const { labels, count, areas } = connectedComponents(fg, w, h);
      let thingCount = 0;
      const thingMap = new Int32Array(count + 1);
      for (let l = 1; l <= count; l++) {
        if (areas[l] >= p.minArea) thingMap[l] = ++thingCount;
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const pIdx = y * w + x;
          const i = pIdx * 4;
          const thingId = thingMap[labels[pIdx]];
          if (thingId > 0) {
            // Countable "Thing" instance
            const col = SEGMENT_PALETTE[thingId % SEGMENT_PALETTE.length];
            dst[i] = Math.round(src[i] * 0.25 + col[0] * 0.75);
            dst[i + 1] = Math.round(src[i + 1] * 0.25 + col[1] * 0.75);
            dst[i + 2] = Math.round(src[i + 2] * 0.25 + col[2] * 0.75);
          } else {
            // Uncountable "Stuff" semantic region (e.g., upper vs lower scene)
            const stuffCol = y < h * 0.5 ? [30, 58, 138] : [20, 83, 45];
            dst[i] = Math.round(src[i] * 0.45 + stuffCol[0] * 0.55);
            dst[i + 1] = Math.round(src[i + 1] * 0.45 + stuffCol[1] * 0.55);
            dst[i + 2] = Math.round(src[i + 2] * 0.45 + stuffCol[2] * 0.55);
          }
          dst[i + 3] = 255;
        }
      }

      return {
        imageData: out,
        overlay: (ctx) =>
          drawBadgeOverlay(ctx, [
            `Panoptic = Semantic "Stuff" + ${thingCount} "Thing" Instances`,
            `Every pixel assigned both class + instance ID`
          ])
      };
    }

    case "unet_seg": {
      // Simulates U-Net probability map + skip-connection crisp boundary contour
      const gray = toGrayscaleArray(src, w, h);
      const cutoff = Math.round((p.thresh / 100) * 255);
      const mask = new Uint8Array(w * h);
      for (let i = 0; i < gray.length; i++) mask[i] = gray[i] >= cutoff ? 1 : 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const pIdx = y * w + x;
          const i = pIdx * 4;
          const isBoundary =
            mask[pIdx] === 1 &&
            ((x > 0 && mask[pIdx - 1] === 0) ||
              (x < w - 1 && mask[pIdx + 1] === 0) ||
              (y > 0 && mask[pIdx - w] === 0) ||
              (y < h - 1 && mask[pIdx + w] === 0));

          if (isBoundary) {
            dst[i] = 56;
            dst[i + 1] = 189;
            dst[i + 2] = 248;
          } else if (mask[pIdx]) {
            dst[i] = Math.round(src[i] * 0.45 + 16 * 0.55);
            dst[i + 1] = Math.round(src[i + 1] * 0.45 + 185 * 0.55);
            dst[i + 2] = Math.round(src[i + 2] * 0.45 + 129 * 0.55);
          } else {
            dst[i] = Math.round(src[i] * 0.4);
            dst[i + 1] = Math.round(src[i + 1] * 0.4);
            dst[i + 2] = Math.round(src[i + 2] * 0.4);
          }
          dst[i + 3] = 255;
        }
      }

      return {
        imageData: out,
        overlay: (ctx) =>
          drawBadgeOverlay(ctx, [
            `U-Net Encoder-Decoder (Cutoff: ${(p.thresh / 100).toFixed(2)})`,
            `Cyan contour = skip-connection boundary preservation`
          ])
      };
    }

    case "sam_seg": {
      // Promptable segmentation from user point (promptX, promptY)
      const px = Math.floor((w * p.promptX) / 100);
      const py = Math.floor((h * p.promptY) / 100);
      const seedIdx = (py * w + px) * 4;
      const sr = src[seedIdx], sg = src[seedIdx + 1], sb = src[seedIdx + 2];

      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0, tail = 0;
      const start = py * w + px;
      visited[start] = 1;
      queue[tail++] = start;

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;
        const neighbors = [];
        if (x > 0) neighbors.push(idx - 1);
        if (x < w - 1) neighbors.push(idx + 1);
        if (y > 0) neighbors.push(idx - w);
        if (y < h - 1) neighbors.push(idx + w);

        for (let n = 0; n < neighbors.length; n++) {
          const nIdx = neighbors[n];
          if (!visited[nIdx]) {
            const cIdx = nIdx * 4;
            const d = Math.hypot(src[cIdx] - sr, src[cIdx + 1] - sg, src[cIdx + 2] - sb);
            if (d <= 55) {
              visited[nIdx] = 1;
              queue[tail++] = nIdx;
            }
          }
        }
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const pIdx = y * w + x;
          const i = pIdx * 4;
          const isEdge =
            visited[pIdx] === 1 &&
            ((x > 0 && !visited[pIdx - 1]) ||
              (x < w - 1 && !visited[pIdx + 1]) ||
              (y > 0 && !visited[pIdx - w]) ||
              (y < h - 1 && !visited[pIdx + w]));

          if (isEdge) {
            dst[i] = 255;
            dst[i + 1] = 255;
            dst[i + 2] = 255;
          } else if (visited[pIdx]) {
            dst[i] = Math.round(src[i] * 0.35 + 59 * 0.65);
            dst[i + 1] = Math.round(src[i + 1] * 0.35 + 130 * 0.65);
            dst[i + 2] = Math.round(src[i + 2] * 0.35 + 246 * 0.65);
          } else {
            dst[i] = Math.round(src[i] * 0.55);
            dst[i + 1] = Math.round(src[i + 1] * 0.55);
            dst[i + 2] = Math.round(src[i + 2] * 0.55);
          }
          dst[i + 3] = 255;
        }
      }

      return {
        imageData: out,
        overlay: (ctx) => {
          // Draw SAM positive prompt star/pin
          ctx.save();
          ctx.fillStyle = "#22c55e";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("+", px - 3.5, py + 4);
          ctx.restore();
          drawBadgeOverlay(ctx, [
            `SAM / SAM 3 Promptable Mask · Point (${px}, ${py})`,
            `Zero-shot object mask from positive prompt`
          ]);
        }
      };
    }

    case "oneformer_seg": {
      if (p.task === "semantic") {
        return processPixels(srcImageData, "semantic_seg", { classes: 4 });
      }
      if (p.task === "instance") {
        return processPixels(srcImageData, "instance_seg", { minArea: 80 });
      }
      return processPixels(srcImageData, "panoptic_seg", { minArea: 80 });
    }

    default:
      return { imageData: srcImageData };
  }
}

function runPipeline() {
  if (!originalImageData) return;
  const result = processPixels(originalImageData, currentOp, currentParams);
  procCtx.putImageData(result.imageData, 0, 0);
  if (typeof result.overlay === "function") {
    result.overlay(procCtx);
  }
  pythonCodeBlock.textContent = OPERATIONS[currentOp].code(currentParams);
}


// Operations Panel Collapse / Expand Toggle
const opsToggleBtn = document.getElementById("opsToggleBtn");
const opsCategoryGrid = document.getElementById("opsCategoryGrid");
const opsChevron = document.getElementById("opsChevron");
const opsToggleHint = document.getElementById("opsToggleHint");

if (opsToggleBtn && opsCategoryGrid) {
  opsToggleBtn.addEventListener("click", () => {
    const isCollapsed = opsCategoryGrid.classList.toggle("collapsed");
    opsToggleBtn.classList.toggle("collapsed", isCollapsed);
    opsChevron.classList.toggle("open", !isCollapsed);
    paramsContainer.classList.toggle("compact", isCollapsed);
    opsToggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    if (opsToggleHint) {
      opsToggleHint.textContent = isCollapsed ? "Click to expand all 29 operations" : "Click to collapse";
    }
  });

  opsToggleBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      opsToggleBtn.click();
    }
  });
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
