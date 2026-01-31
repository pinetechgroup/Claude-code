/**
 * Icon Generator for Math Adventure PWA
 * Run with: node generate-icons.js
 *
 * This creates simple colored PNG icons for the PWA.
 * For best results, replace with custom designed icons.
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple PNG icon using raw pixel data
function createPngIcon(size) {
    // PNG Header
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // Create IHDR chunk
    const ihdr = createIHDRChunk(size, size);

    // Create IDAT chunk with image data
    const idat = createIDATChunk(size, size);

    // Create IEND chunk
    const iend = createIENDChunk();

    return Buffer.concat([signature, ihdr, idat, iend]);
}

function createIHDRChunk(width, height) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(width, 0);
    data.writeUInt32BE(height, 4);
    data.writeUInt8(8, 8);   // Bit depth
    data.writeUInt8(2, 9);   // Color type (RGB)
    data.writeUInt8(0, 10);  // Compression
    data.writeUInt8(0, 11);  // Filter
    data.writeUInt8(0, 12);  // Interlace

    return createChunk('IHDR', data);
}

function createIDATChunk(width, height) {
    const zlib = require('zlib');

    // Create raw pixel data with filter byte per row
    const rawData = Buffer.alloc((width * 3 + 1) * height);

    // Colors
    const bgColor = { r: 74, g: 144, b: 217 };      // #4A90D9
    const starColor = { r: 255, g: 215, b: 0 };     // Gold
    const symbolColor = { r: 255, g: 255, b: 255 }; // White

    const centerX = width / 2;
    const centerY = height / 2;
    const cornerRadius = width * 0.15;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * (width * 3 + 1);
        rawData[rowOffset] = 0; // Filter byte (none)

        for (let x = 0; x < width; x++) {
            const pixelOffset = rowOffset + 1 + x * 3;

            // Check if inside rounded rect
            const inRect = isInRoundedRect(x, y, width, height, cornerRadius);

            if (!inRect) {
                // Transparent (white for simplicity)
                rawData[pixelOffset] = 255;
                rawData[pixelOffset + 1] = 255;
                rawData[pixelOffset + 2] = 255;
            } else {
                // Gradient background
                const gradientFactor = (x + y) / (width + height);
                const r = Math.round(bgColor.r * (1 - gradientFactor * 0.3) + 155 * gradientFactor * 0.3);
                const g = Math.round(bgColor.g * (1 - gradientFactor * 0.2) + 89 * gradientFactor * 0.2);
                const b = Math.round(bgColor.b * (1 - gradientFactor * 0.1) + 182 * gradientFactor * 0.1);

                // Draw × symbol (top)
                const topSymbolY = height * 0.35;
                const symbolSize = width * 0.2;
                if (isInCross(x, y, centerX, topSymbolY, symbolSize)) {
                    rawData[pixelOffset] = symbolColor.r;
                    rawData[pixelOffset + 1] = symbolColor.g;
                    rawData[pixelOffset + 2] = symbolColor.b;
                }
                // Draw ÷ symbol (bottom)
                else if (isInDivide(x, y, centerX, height * 0.65, symbolSize, width)) {
                    rawData[pixelOffset] = symbolColor.r;
                    rawData[pixelOffset + 1] = symbolColor.g;
                    rawData[pixelOffset + 2] = symbolColor.b;
                }
                // Draw corner stars
                else if (isInStar(x, y, width * 0.18, height * 0.18, width * 0.08) ||
                         isInStar(x, y, width * 0.82, height * 0.18, width * 0.08) ||
                         isInStar(x, y, width * 0.18, height * 0.82, width * 0.08) ||
                         isInStar(x, y, width * 0.82, height * 0.82, width * 0.08)) {
                    rawData[pixelOffset] = starColor.r;
                    rawData[pixelOffset + 1] = starColor.g;
                    rawData[pixelOffset + 2] = starColor.b;
                }
                // Background
                else {
                    rawData[pixelOffset] = r;
                    rawData[pixelOffset + 1] = g;
                    rawData[pixelOffset + 2] = b;
                }
            }
        }
    }

    const compressed = zlib.deflateSync(rawData);
    return createChunk('IDAT', compressed);
}

function isInRoundedRect(x, y, width, height, radius) {
    // Check corners
    if (x < radius && y < radius) {
        return Math.pow(x - radius, 2) + Math.pow(y - radius, 2) <= Math.pow(radius, 2);
    }
    if (x > width - radius && y < radius) {
        return Math.pow(x - (width - radius), 2) + Math.pow(y - radius, 2) <= Math.pow(radius, 2);
    }
    if (x < radius && y > height - radius) {
        return Math.pow(x - radius, 2) + Math.pow(y - (height - radius), 2) <= Math.pow(radius, 2);
    }
    if (x > width - radius && y > height - radius) {
        return Math.pow(x - (width - radius), 2) + Math.pow(y - (height - radius), 2) <= Math.pow(radius, 2);
    }
    return true;
}

function isInCross(x, y, cx, cy, size) {
    const thickness = size * 0.25;
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    // Rotated 45 degrees
    const rx = (dx + dy) / Math.sqrt(2);
    const ry = Math.abs(dx - dy) / Math.sqrt(2);
    return (rx < size && ry < thickness) || (ry < size && rx < thickness);
}

function isInDivide(x, y, cx, cy, size, width) {
    const thickness = size * 0.2;
    const dotRadius = size * 0.15;
    const dotOffset = size * 0.5;

    // Horizontal line
    if (Math.abs(y - cy) < thickness && Math.abs(x - cx) < size) {
        return true;
    }
    // Top dot
    if (Math.pow(x - cx, 2) + Math.pow(y - (cy - dotOffset), 2) < Math.pow(dotRadius, 2)) {
        return true;
    }
    // Bottom dot
    if (Math.pow(x - cx, 2) + Math.pow(y - (cy + dotOffset), 2) < Math.pow(dotRadius, 2)) {
        return true;
    }
    return false;
}

function isInStar(x, y, cx, cy, size) {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > size) return false;

    const angle = Math.atan2(dy, dx);
    const points = 5;
    const innerRadius = size * 0.4;

    const sectorAngle = Math.PI / points;
    const normalizedAngle = ((angle % (2 * sectorAngle)) + 2 * sectorAngle) % (2 * sectorAngle);

    const expectedRadius = normalizedAngle < sectorAngle
        ? size - (size - innerRadius) * (normalizedAngle / sectorAngle)
        : innerRadius + (size - innerRadius) * ((normalizedAngle - sectorAngle) / sectorAngle);

    return dist < expectedRadius * 0.8;
}

function createIENDChunk() {
    return createChunk('IEND', Buffer.alloc(0));
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = getCrc32Table();

    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }

    return crc ^ 0xFFFFFFFF;
}

let crc32Table = null;
function getCrc32Table() {
    if (crc32Table) return crc32Table;

    crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crc32Table[i] = c;
    }
    return crc32Table;
}

// Generate icons
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');
for (const size of sizes) {
    const iconPath = path.join(iconsDir, `icon-${size}.png`);
    const pngData = createPngIcon(size);
    fs.writeFileSync(iconPath, pngData);
    console.log(`Created: icon-${size}.png`);
}
console.log('Done! Icons saved to ./icons/');
