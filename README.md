# DIP-Playground

An interactive, client-side web playground for experimenting with fundamental digital image processing algorithms in real time, paired with live, copyable **OpenCV (`cv2`)** Python code snippets.

## Features

- **Zero-Backend Real-Time Processing:** Runs entirely in the browser using HTML5 Canvas pixel manipulation—no server or installation required to test operations.
- **Image Input Options:** Upload custom images (auto-scaled for responsive slider updates) or test algorithms immediately using built-in procedural sample images (*Shapes & Gradients*, *Low-Contrast Scene*, *Resolution Grid*, or *Random*).
- **19 Image Processing Operations** organized into four categories:
  - **Noise & Point Operations:** Gaussian noise, Salt & pepper noise, Gamma correction, Brightness / contrast, Log transform, Inverse (negative).
  - **Filtering & Sharpening:** Gaussian blur, Box blur, Median blur, Unsharp mask.
  - **Edges & Thresholding:** Sobel edges, Canny edges, Binary threshold, Otsu's threshold.
  - **Tone & Morphology:** Grayscale, Histogram equalization, Bit-plane slicing, CLAHE, Morphology (Erosion, Dilation, Opening, Closing).
- **Interactive Parameter Controls:** Dynamic sliders and dropdowns with inline descriptions explaining what each parameter controls, plus a **Reset Values** button to restore defaults.
- **Side-by-Side Comparison & Export:** View the original and processed images side by side and download the processed output as a PNG.
- **Collapsible Notebook Code Cell:** Expandable Jupyter-style Python cell showing the exact `cv2` implementation synchronized with your active parameter values, complete with one-click copy.

## Project Structure

```text
├── index.html   # Page layout, operation selector pills, side-by-side canvases, and notebook cell
├── styles.css   # Responsive grid styling, pill controls, and dark-theme code block
└── app.js       # Pixel-processing kernels, parameter UI generator, sample drawers, and cv2 templates
```

## Getting Started
Clone the repository:
```bash
git clone https://github.com/tanvir64/DIP-Playground.git
cd DIP-Playground
```

Run locally:
Open index.html directly in any modern web browser, or serve the folder with a lightweight local server:

```bash
python -m http.server 8000
```
Then visit http://localhost:8000.

Running the Generated Python Snippets
To execute the OpenCV snippets generated in the playground's notebook cell locally, install opencv-python and numpy:

```bash
pip install opencv-python numpy
```
## License
MIT
