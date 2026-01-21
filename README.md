# 🧠 NeuroView Web Pro

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Platform](https://img.shields.io/badge/platform-web-orange) ![License](https://img.shields.io/badge/license-MIT-green) ![Architecture](https://img.shields.io/badge/architecture-hybrid-purple)

**NeuroView Web Pro** is a high-performance medical imaging workstation that runs primarily in the browser. It parses, renders, and processes NIfTI MRI data (`.nii`, `.nii.gz`) using HTML5 Canvas, WebGL, and advanced JavaScript algorithms.

While the core viewer operates fully client-side (ensuring data privacy), the project is evolving into a hybrid system with a dedicated backend currently under development to handle heavy computational tasks like Deep Learning inference.

---

## ✨ Key Features

### 🖥️ Visualization
* **Orthogonal Views:** Simultaneous Axial, Sagittal, and Coronal slice navigation with synchronized crosshairs.
* **Volumetric 3D Rendering:**
    * **Native WebGL:** Fast, point-cloud based preview for immediate feedback.
    * **VTK.js Integration:** Lazily loaded for high-fidelity ray-casting and shading.
* **Dual-View Support:** Load two MRI volumes simultaneously (e.g., T1 and T2) with blending, difference mapping, or split-screen comparison.
* **Window/Level:** Real-time contrast and brightness adjustment with presets (Grayscale, Hot Metal, Cool Blue, Rainbow).

### 🛠️ Image Processing (Client-Side)
NeuroView includes a full suite of processing algorithms running locally in the browser:
* **Enhancement:** CLAHE (Adaptive Histogram Eq), Gamma Correction, Sigmoid Stretching.
* **Denoising:** Total Variation (TV) Denoising, Gaussian Smoothing, 3D Median Filtering.
* **Correction:** N4 Bias Field Correction approximation.
* **Morphology:** Erosion and sharpening operations.

### 🖍️ Segmentation & Analysis
* **Manual Tools:** Paintbrush and Eraser with adjustable sizes for voxel-level editing.
* **Automated Thresholding:** Otsu's Method, Li's Method, Multi-Otsu, and Local Adaptive Thresholding.
* **Volumetric Calculation:** Generate reports calculating the volume (cm³) of segmented structures based on voxel dimensions.
* **Label Management:** Load/Save JSON label configurations with custom names and colors.

---

## 🏗️ Technical Architecture

The application is designed as a hybrid client-server system to balance interactivity with computational power.

* **Frontend (Client-Side):**
    * **Core:** Vanilla JavaScript (ES6+) with no build framework dependencies.
    * **Parsing:** Custom `DataView` implementation for binary NIfTI parsing in the browser.
    * **Rendering:** WebGL (via VTK.js and custom shaders) and HTML5 Canvas for real-time 2D/3D visualization.
    * **Light Processing:** Browser-based CPU processing for immediate filters (Thresholding, Windowing, Simple Smoothing).

* **Backend (In Development):**
    * **Purpose:** Handling computationally expensive operations off-loaded from the client.
    * **Workload:** Deep Learning inference (segmentation models), complex registration, and heavy volumetric analysis.
    * **Integration:** REST/WebSocket API to stream data chunks to the GPU-accelerated backend and receive processed masks/volumes.

---

## 🚀 Getting Started

### Prerequisites
Because this project uses modern browser features (ES6 Modules, Fetch API, WebGL workers), it must be served via a local web server rather than opening the file directly.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/robbinc91/advanced-3d-mri-viewer-html](https://github.com/robbinc91/advanced-3d-mri-viewer-html)
    cd neuroview-web-pro
    ```

2.  **Dependencies:**
    The `index.html` file references external libraries. Ensure you have internet access to load the CDN links, or download the following locally:
    * `tailwindscss.js`
    * `pako.min.js`
    * `nifti-reader.min.js`

3.  **Run the application:**
    Use a simple HTTP server to serve the directory:
    
    ```bash
    # Python 3
    python -m http.server 8000
    
    # Node.js http-server
    npx http-server
    ```

4.  **Access:**
    Open `http://localhost:8000` in Chrome, Firefox, or Edge.

---

## 📖 Usage Guide

### 1. Loading Data
* **Generate Phantom:** Click "Generate Phantom" to create a synthetic 3D volume instantly for testing.
* **Load MRI:** Click "Load MRI" to select a local `.nii` or `.nii.gz` file.
* **Dual View:** Load a second image via "Load MRI 2" and toggle the "Enable Dual View" checkbox.

### 2. Navigation
* **Scroll:** Mouse wheel over any viewport to scroll slices.
* **Pan:** Right-click and drag (or Shift + Left-click).
* **Zoom:** Ctrl + Scroll.
* **Maximize:** Click the `⛶` icon in the corner of any viewport.

### 3. Segmentation
1.  Go to the **Manual Tools** section in the sidebar.
2.  Select **Brush** and adjust the size.
3.  Draw directly on the Axial, Sagittal, or Coronal views.
4.  Alternatively, use the **Thresholding & Seg** section to run automated algorithms like **Otsu** to auto-generate masks based on intensity.

---

## 🗺️ Roadmap

* [ ] **Backend Integration:** Implementing a Python/FastAPI backend to host PyTorch/TensorFlow models for automated organ segmentation.
* [ ] **Deep Learning Support:** Connect UI "Auto-Segment" buttons to backend inference endpoints.
* [ ] **DICOM Series support:** Expand file loading to support directory-based DICOM series.
* [ ] **Export Options:** Allow exporting segmentation masks as NIfTI files.
* [ ] **GPU-acceleration (Web):** Port current CPU-bound JavaScript filters to WebGL2 compute shaders.

---

## 🤝 Contributing

Contributions are welcome!
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for Medical Imaging enthusiasts.*