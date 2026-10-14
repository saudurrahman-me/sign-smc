const fs = require('fs');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgbaBuffer) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = width * 4;
  const filtered = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (rowSize + 1)] = 0; // None filter
    rgbaBuffer.copy(filtered, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  const idatChunk = makeChunk('IDAT', zlib.deflateSync(filtered, { level: 9 }));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Read input PNG
const srcBuf = fs.readFileSync('public/sign-smc-logo.png');
let pos = 8;
const idats = [];
const width = srcBuf.readUInt32BE(16);
const height = srcBuf.readUInt32BE(20);

while (pos < srcBuf.length) {
  const len = srcBuf.readUInt32BE(pos);
  const type = srcBuf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') idats.push(srcBuf.slice(pos + 8, pos + 8 + len));
  pos += 12 + len;
}

const decomp = zlib.inflateSync(Buffer.concat(idats));
const bpp = 4;
const rowSize = width * bpp;
const raw = Buffer.alloc(width * height * bpp);
let offset = 0;

for (let y = 0; y < height; y++) {
  const filter = decomp[offset++];
  for (let x = 0; x < rowSize; x++) {
    const byte = decomp[offset++];
    const a = x >= bpp ? raw[y * rowSize + x - bpp] : 0;
    const b = y > 0 ? raw[(y - 1) * rowSize + x] : 0;
    const c = x >= bpp && y > 0 ? raw[(y - 1) * rowSize + x - bpp] : 0;
    let val = byte;
    if (filter === 1) val = (byte + a) & 0xff;
    else if (filter === 2) val = (byte + b) & 0xff;
    else if (filter === 3) val = (byte + Math.floor((a + b) / 2)) & 0xff;
    else if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      val = (byte + pr) & 0xff;
    }
    raw[y * rowSize + x] = val;
  }
}

// 1. Transparent background version (preserving dark green #016533)
const transRaw = Buffer.from(raw);
for (let i = 0; i < transRaw.length; i += 4) {
  const r = transRaw[i];
  const g = transRaw[i + 1];
  const b = transRaw[i + 2];
  // Calculate brightness / distance from white
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  if (r > 235 && g > 235 && b > 235) {
    transRaw[i + 3] = 0; // pure transparent
  } else if (minChannel > 160) {
    // smooth alpha blend for edges
    const alphaFactor = (255 - minChannel) / (255 - 160);
    transRaw[i + 3] = Math.round(255 * Math.min(Math.max(alphaFactor, 0), 1));
  }
}

const transPng = encodePng(width, height, transRaw);
fs.writeFileSync('public/sign-smc-logo-transparent.png', transPng);
fs.writeFileSync('src/assets/sign-smc-logo-transparent.png', transPng);
console.log('Created public/sign-smc-logo-transparent.png');

// 2. White/Light version for dark backgrounds
const whiteRaw = Buffer.from(transRaw);
for (let i = 0; i < whiteRaw.length; i += 4) {
  const a = whiteRaw[i + 3];
  if (a > 0) {
    whiteRaw[i] = 255;     // White R
    whiteRaw[i + 1] = 255; // White G
    whiteRaw[i + 2] = 255; // White B
  }
}
const whitePng = encodePng(width, height, whiteRaw);
fs.writeFileSync('public/sign-smc-logo-white.png', whitePng);
fs.writeFileSync('src/assets/sign-smc-logo-white.png', whitePng);
console.log('Created public/sign-smc-logo-white.png');
