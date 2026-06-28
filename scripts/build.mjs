/**
 * build.mjs — bundles the app into a single self-contained dist/index.html.
 *
 * Everything (JS, CSS, the seed data, and the app icon) is inlined so the file
 * runs by simply being opened — in Koder's preview, in Safari, or from the iOS
 * home screen after "Add to Home Screen". No server, no network, fully offline.
 *
 *   npm run build            -> writes dist/index.html
 *   npm run dev              -> rebuild on change + local server at :8080
 */

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const args = process.argv.slice(2);
const WATCH = args.includes('--watch');
const SERVE = args.includes('--serve');

if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });

// ----------------------------------------------------------------------------
// App icon — a procedurally drawn life-cycle ring, encoded as a PNG with no
// external dependencies (so the build needs nothing beyond Node).
// ----------------------------------------------------------------------------

function makeIconPNG(size = 180) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.40;
  const thick = size * 0.085;
  const px = (x, y, r, g, b, a = 255) => {
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // background near-black
      px(x, y, 11, 11, 14, 255);
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > R - thick && dist < R) {
        // angle from the top, clockwise, 0..1 — colour like the life-cycle bar
        let a = Math.atan2(dx, -dy) / (Math.PI * 2);
        if (a < 0) a += 1;
        let r, g, b;
        if (a < 0.6) [r, g, b] = [124, 255, 63]; // lime
        else if (a < 0.8) [r, g, b] = [255, 176, 32]; // amber
        else [r, g, b] = [255, 77, 77]; // red
        // soft edge
        const edge = Math.min(dist - (R - thick), R - dist);
        const aa = Math.max(0, Math.min(1, edge / 1.5));
        px(x, y, r, g, b, Math.round(255 * aa));
      }
      // central lime dot (the "infinite restart")
      if (dist < size * 0.07) px(x, y, 124, 255, 63, 255);
    }
  }
  return encodePNG(buf, size, size);
}

function encodePNG(rgba, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ----------------------------------------------------------------------------
// HTML assembly
// ----------------------------------------------------------------------------

function html({ js, css, iconDataUri, manifestDataUri }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0B0B0E" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Infinite" />
<meta name="description" content="A hypertrophy training app built on the IP Method." />
<link rel="apple-touch-icon" href="${iconDataUri}" />
<link rel="icon" href="${iconDataUri}" />
<link rel="manifest" href="${manifestDataUri}" />
<title>Infinite</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;
}

async function buildOnce() {
  const result = await esbuild.build({
    entryPoints: [join(ROOT, 'src', 'main.tsx')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['safari14', 'chrome90'],
    jsx: 'automatic',
    minify: true,
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': '"production"' },
    write: false,
    loader: { '.json': 'json' },
  });
  const js = result.outputFiles[0].text;
  const css = readFileSync(join(ROOT, 'src', 'ui', 'global.css'), 'utf8');

  const iconPng = makeIconPNG(180);
  const iconDataUri = `data:image/png;base64,${iconPng.toString('base64')}`;
  const manifest = {
    name: 'Infinite',
    short_name: 'Infinite',
    start_url: '.',
    display: 'standalone',
    background_color: '#0B0B0E',
    theme_color: '#0B0B0E',
    icons: [
      { src: iconDataUri, sizes: '180x180', type: 'image/png' },
    ],
  };
  const manifestDataUri = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;

  const out = html({ js, css, iconDataUri, manifestDataUri });
  writeFileSync(join(DIST, 'index.html'), out);
  writeFileSync(join(DIST, 'icon.png'), iconPng);
  const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
  console.log(`✓ dist/index.html (${kb} KB, self-contained)`);
}

await buildOnce();

if (SERVE) {
  const port = 8080;
  createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(readFileSync(join(DIST, 'index.html')));
  }).listen(port, () => console.log(`→ http://localhost:${port}`));
}

if (WATCH) {
  const { watch } = await import('node:fs');
  let timer = null;
  watch(join(ROOT, 'src'), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => buildOnce().catch((e) => console.error(e)), 150);
  });
  console.log('… watching src/ for changes');
}
