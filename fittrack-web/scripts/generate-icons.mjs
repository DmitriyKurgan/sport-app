// Generate PWA PNG icons from public/icon.svg.
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'icon.svg'));

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-icon-180.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

for (const { name, size } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(root, 'public', name));
  console.log(`✓ ${name} (${size}×${size})`);
}

// Placeholder screenshots for the manifest. Replace with real captures once
// you can run `next dev` against a populated DB.
const screenshotSvg = (w, h, label) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-family="Inter, sans-serif" font-size="48" font-weight="700">FitTrack</text>
  <text x="50%" y="${h / 2 + 60}" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="22">${label}</text>
</svg>`;

const screenshots = [
  { name: 'screenshot-mobile.png', w: 540, h: 720, label: 'Mobile dashboard' },
  { name: 'screenshot-desktop.png', w: 1280, h: 720, label: 'Desktop dashboard' },
];

for (const { name, w, h, label } of screenshots) {
  await sharp(Buffer.from(screenshotSvg(w, h, label)))
    .png()
    .toFile(join(root, 'public', name));
  console.log(`✓ ${name} (${w}×${h})`);
}
