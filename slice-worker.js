/* eslint-disable no-restricted-globals */
// Offloads slice pixel compositing (window/level, dual-view, mask tint) from the main thread.

function applyWindowLevel(val, wWidth, wCenter, map, invert) {
    const lower = wCenter - wWidth / 2;
    const upper = wCenter + wWidth / 2;
    let norm = (val - lower) / (upper - lower);
    norm = Math.max(0, Math.min(1, norm));
    if (invert) norm = 1.0 - norm;

    const intensity = Math.floor(norm * 255);

    if (map === 'hot') return [intensity, 0, 0, 255];
    if (map === 'cool') return [0, intensity, intensity, 255];
    if (map === 'rainbow') {
        const r = Math.floor(Math.sin(norm * Math.PI) * 255);
        const g = Math.floor(Math.sin(norm * Math.PI + 2) * 255);
        const b = Math.floor(Math.sin(norm * Math.PI + 4) * 255);
        return [Math.abs(r), Math.abs(g), Math.abs(b), 255];
    }
    return [intensity, intensity, intensity, 255];
}

const DEFAULT_COLORS = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [0, 255, 255],
    [255, 0, 255]
];

function getMaskColor(val) {
    if (val <= 0) return null;
    const idx = (Math.round(val) - 1) % DEFAULT_COLORS.length;
    return DEFAULT_COLORS[idx];
}

function getLabelRgb(val, custom) {
    if (val <= 0) return null;
    const ck = String(Math.round(val));
    if (custom && custom[ck]) {
        const rgb = custom[ck];
        if (Array.isArray(rgb) && rgb.length >= 3) return [rgb[0], rgb[1], rgb[2]];
    }
    return getMaskColor(val);
}

self.onmessage = (e) => {
    const msg = e.data;
    const {
        seq,
        axis,
        settings,
        customLabelColors
    } = msg;
    const { vol1: b1, vol2: b2, mask: bMask } = msg.buffers;

    try {
        const {
            srcW,
            srcH,
            ww,
            wc,
            colorMap,
            invert,
            dualEnabled,
            dualMode,
            dualAlpha,
            showMask,
            maskOpacity,
            hasMask
        } = settings;

        const data1 = new Float32Array(b1);
        const data2 = b2 ? new Float32Array(b2) : null;
        const maskArr = hasMask && bMask ? new Float32Array(bMask) : null;

        const mode = dualMode || 'blend';
        const dualOn = dualEnabled && !!data2;
        const out = new Uint8ClampedArray(srcW * srcH * 4);
        let p = 0;

        for (let row = 0; row < srcH; row++) {
            for (let col = 0; col < srcW; col++) {
                const i = row * srcW + col;
                const val1 = data1[i];

                let r, g, b, a;

                if (dualOn && mode === 'split') {
                    if (col >= Math.floor(srcW * 0.5)) {
                        const val2 = data2[i];
                        [r, g, b, a] = applyWindowLevel(val2, ww, wc, colorMap, invert);
                    } else {
                        [r, g, b, a] = applyWindowLevel(val1, ww, wc, colorMap, invert);
                    }
                } else {
                    [r, g, b, a] = applyWindowLevel(val1, ww, wc, colorMap, invert);

                    if (dualOn) {
                        const val2 = data2[i];
                        if (mode === 'blend') {
                            const [r2, g2, b2] = applyWindowLevel(val2, ww, wc, 'hot', false);
                            const alpha = dualAlpha || 0.5;
                            r = r * (1 - alpha) + r2 * alpha;
                            g = g * (1 - alpha) + g2 * alpha;
                            b = b * (1 - alpha) + b2 * alpha;
                        } else if (mode === 'difference') {
                            const window = ww || 1;
                            let diff = (val1 - val2) / window;
                            diff = Math.max(-1, Math.min(1, diff));
                            const alpha = Math.abs(diff);
                            const diffColor = diff > 0 ? [255, 0, 0] : [0, 0, 255];
                            r = r * (1 - alpha) + diffColor[0] * alpha;
                            g = g * (1 - alpha) + diffColor[1] * alpha;
                            b = b * (1 - alpha) + diffColor[2] * alpha;
                        }
                    }
                }

                if (showMask && maskArr) {
                    const mVal = maskArr[i];
                    const mColor = getLabelRgb(mVal, customLabelColors);
                    if (mColor) {
                        const mOp = maskOpacity;
                        r = r * (1 - mOp) + mColor[0] * mOp;
                        g = g * (1 - mOp) + mColor[1] * mOp;
                        b = b * (1 - mOp) + mColor[2] * mOp;
                    }
                }

                out[p++] = r;
                out[p++] = g;
                out[p++] = b;
                out[p++] = 255;
            }
        }

        self.postMessage(
            { seq, axis, buffer: out.buffer, srcW, srcH },
            [out.buffer]
        );
    } catch (err) {
        self.postMessage({
            seq,
            axis,
            error: String(err && err.message ? err.message : err)
        });
    }
};
