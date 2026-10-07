import { mkdir, writeFile } from 'node:fs/promises';
import { studies, headDistance, smoothMin } from './model-studies.mjs';

// Same coordinates, facial field and smooth unions as the original sculptures.
// A fixed lattice allows a single closed surface to grow between stages.
const resolution = 80,
  extent = 1.65;
const output = new URL('../public/models/clay/', import.meta.url);
await mkdir(output, { recursive: true });
for (const study of studies) {
  const shapes = [...study.shapes];
  for (const [a, b, c, r] of study.limbs ?? []) {
    for (const [start, end] of [
      [a, b],
      [b, c],
    ])
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        shapes.push([...start.map((v, k) => v + (end[k] - v) * t), r, r, r]);
      }
    shapes.push([c[0] + 0.035, c[1] + 0.02, c[2], r * 1.3, r * 0.78, r * 0.62]);
  }
  const field = new Float32Array(resolution ** 3);
  for (let z = 0; z < resolution; z++)
    for (let y = 0; y < resolution; y++)
      for (let x = 0; x < resolution; x++) {
        const px = ((x / resolution) * 2 - 1) * extent,
          py = ((y / resolution) * 2 - 1) * extent,
          pz = ((z / resolution) * 2 - 1) * extent;
        let d = study.head ? headDistance(px, py, pz, study.head) : 10;
        for (const [cx, cy, cz, rx, ry, rz] of shapes) {
          const qx = (px - cx) / rx,
            qy = (py - cy) / ry,
            qz = (pz - cz) / rz;
          d = smoothMin(
            d,
            (Math.sqrt(qx * qx + qy * qy + qz * qz) - 1) * Math.min(rx, ry, rz),
          );
        }
        field[x + y * resolution + z * resolution * resolution] = -d;
      }
  await writeFile(
    new URL(`${study.month}.bin`, output),
    new Uint8Array(field.buffer),
  );
  console.log(
    `${study.month}: ${resolution}³ clay field, ${field.byteLength} bytes`,
  );
}
