/**
 * Generates PNG app icons from public/favicon.svg. Needs `sharp`
 * (npm i -D sharp) — run only when the icon artwork changes; the PNGs are committed.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url));
const out = (n) => new URL(`../public/${n}`, import.meta.url).pathname;
const padded = async (size, pad) =>
  sharp({ create: { width: size, height: size, channels: 4, background: '#2a2724' } })
    .composite([{ input: await sharp(svg).resize(size - pad * 2).png().toBuffer(), top: pad, left: pad }])
    .png();
await sharp(svg).resize(180).png().toFile(out('apple-touch-icon.png'));
await sharp(svg).resize(192).png().toFile(out('assets/icons/icon-192.png'));
await sharp(svg).resize(512).png().toFile(out('assets/icons/icon-512.png'));
await (await padded(512, 64)).toFile(out('assets/icons/icon-maskable-512.png'));
console.log('Icons generated.');
