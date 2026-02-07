const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convert() {
    const input = path.join(process.cwd(), 'public', 'favicon.png');
    const output = path.join(process.cwd(), 'public', 'favicon.ico');

    if (!fs.existsSync(input)) {
        console.error('favicon.png not found');
        return;
    }

    // Resize to 256x256 and convert to buffer
    const buffer = await sharp(input)
        .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    // ICO Header
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type (1 for icon)
    header.writeUInt16LE(1, 4); // Count (1 image)

    // Directory Entry
    const entry = Buffer.alloc(16);
    entry.writeUInt8(0, 0); // Width (0 means 256)
    entry.writeUInt8(0, 1); // Height (0 means 256)
    entry.writeUInt8(0, 2); // Color count (0)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Image size
    entry.writeUInt32LE(22, 12); // Offset to image data (6 header + 16 entry = 22)

    const icoBuffer = Buffer.concat([header, entry, buffer]);
    fs.writeFileSync(output, icoBuffer);
    console.log('favicon.ico created successfully');
}

convert();
