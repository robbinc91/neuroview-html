/* global importScripts, postMessage, pako */
importScripts('pako.min.js');

const NiftiParser = {
    parseHeader(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        if (arrayBuffer.byteLength < 348) throw new Error('File too small');

        const headerSizeLittle = dataView.getInt32(0, true);
        const headerSizeBig = dataView.getInt32(0, false);
        let isLittleEndian = true;

        if (headerSizeLittle === 348 || headerSizeLittle === 540) {
            isLittleEndian = true;
        } else if (headerSizeBig === 348 || headerSizeBig === 540) {
            isLittleEndian = false;
        } else {
            throw new Error('Invalid NIfTI header');
        }

        const dims = [];
        for (let i = 0; i < 8; i++) {
            dims.push(dataView.getInt16(40 + i * 2, isLittleEndian));
        }

        const datatype = dataView.getInt16(70, isLittleEndian);
        const vox_offset = dataView.getFloat32(108, isLittleEndian);
        const scl_slope = dataView.getFloat32(112, isLittleEndian);
        const scl_inter = dataView.getFloat32(116, isLittleEndian);

        const pixdim = [];
        for (let i = 0; i < 8; i++) {
            pixdim.push(dataView.getFloat32(76 + i * 4, isLittleEndian));
        }

        return {
            dims: { x: dims[1], y: dims[2], z: dims[3] || 1 },
            datatype,
            vox_offset,
            scl_slope: scl_slope === 0 ? 1 : scl_slope,
            scl_inter,
            isLittleEndian,
            voxelDims: { x: pixdim[1] || 1.0, y: pixdim[2] || 1.0, z: pixdim[3] || 1.0 }
        };
    },

    readData(header, arrayBuffer) {
        const offset = Math.floor(header.vox_offset);
        const size = header.dims.x * header.dims.y * header.dims.z;
        let typedArray;

        switch (header.datatype) {
            case 2: typedArray = new Uint8Array(arrayBuffer, offset, size); break;
            case 4: typedArray = new Int16Array(arrayBuffer, offset, size); break;
            case 8: typedArray = new Int32Array(arrayBuffer, offset, size); break;
            case 16: typedArray = new Float32Array(arrayBuffer, offset, size); break;
            case 64: typedArray = new Float64Array(arrayBuffer, offset, size); break;
            case 512: typedArray = new Uint16Array(arrayBuffer, offset, size); break;
            default: throw new Error(`Unsupported datatype: ${header.datatype}`);
        }

        const data = new Float32Array(size);
        let min = Infinity;
        let max = -Infinity;
        const slope = header.scl_slope;
        const inter = header.scl_inter;

        for (let i = 0; i < size; i++) {
            const val = typedArray[i] * slope + inter;
            data[i] = val;
            if (val < min) min = val;
            if (val > max) max = val;
        }

        return { data, min, max };
    }
};

self.onmessage = (e) => {
    const { id, buffer, fileName } = e.data;
    try {
        let ab = buffer;
        const name = (fileName || '').toLowerCase();
        if (name.endsWith('.gz')) {
            ab = pako.inflate(new Uint8Array(ab)).buffer;
        }

        const header = NiftiParser.parseHeader(ab);
        const result = NiftiParser.readData(header, ab);

        self.postMessage({
            id,
            ok: true,
            dims: header.dims,
            voxelDims: header.voxelDims,
            min: result.min,
            max: result.max,
            header,
            data: result.data.buffer
        }, [result.data.buffer]);
    } catch (err) {
        self.postMessage({
            id,
            ok: false,
            error: err && err.message ? err.message : String(err)
        });
    }
};
