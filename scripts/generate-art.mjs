/**
 * Generates the catalogue's original room illustrations as SVG files.
 * Output: public/assets/illustrations/designs/<design-id>-<n>.svg
 * Runs automatically before `npm run build`. Deterministic: same data, same art.
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { roomSVG } from '../src/js/services/roomArt.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const { designs } = read('../src/data/designs.json');
const { styles } = read('../src/data/styles.json');
const styleById = Object.fromEntries(styles.map((s) => [s.id, s]));

const outDir = new URL('../public/assets/illustrations/designs/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const wanted = new Set();
let bytes = 0;
for (const d of designs) {
  d.images.forEach((img, i) => {
    const file = `${d.id}-${i + 1}.svg`;
    wanted.add(file);
    const svg = roomSVG(d, styleById[d.style], img.view);
    bytes += svg.length;
    writeFileSync(new URL(file, outDir), svg);
  });
}
// Remove stale files from renamed designs
for (const f of readdirSync(outDir)) if (!wanted.has(f)) unlinkSync(new URL(f, outDir));

console.log(`Generated ${wanted.size} illustrations (${Math.round(bytes / 1024)} KB).`);
