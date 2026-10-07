import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
    this.onloadend?.();
  }
};
const output = new URL('../public/models/', import.meta.url);
await mkdir(output, { recursive: true });

import { studies, headDistance, smoothMin } from './model-studies.mjs';

const anatomy = {};
for (const study of studies) {
  const regions = study.shapes.map((shape) => ({
    region: study.month === 'mayo' ? 'whole' : 'abdomen',
    shape,
  }));
  if (study.head) {
    const [x, y, rx, ry, rz] = study.head;
    regions.push({ region: 'head', shape: [x, y, 0, rx, ry, rz] });
  }
  for (const [index, [a, b, c, r]] of (study.limbs ?? []).entries()) {
    for (const [start, end] of [
      [a, b],
      [b, c],
    ])
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        regions.push({
          region: index < 2 ? 'arms' : 'legs',
          shape: [...start.map((v, k) => v + (end[k] - v) * t), r, r, r],
        });
      }
    regions.push({
      region: index < 2 ? 'arms' : 'legs',
      shape: [c[0] + 0.035, c[1] + 0.02, c[2], r * 1.3, r * 0.78, r * 0.62],
    });
  }
  anatomy[study.month] = regions;
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
  const mat = new THREE.MeshStandardMaterial({
    color: '#dcad91',
    roughness: 0.78,
  });
  const res = 116,
    extent = 1.65;
  const field = new MarchingCubes(res, mat, false, false, 100000);
  field.isolation = 0;
  for (let z = 0; z < res; z++)
    for (let y = 0; y < res; y++)
      for (let x = 0; x < res; x++) {
        const px = ((x / res) * 2 - 1) * extent,
          py = ((y / res) * 2 - 1) * extent,
          pz = ((z / res) * 2 - 1) * extent;
        let d = study.head ? headDistance(px, py, pz, study.head) : 10;
        for (const [cx, cy, cz, rx, ry, rz] of shapes) {
          const qx = (px - cx) / rx,
            qy = (py - cy) / ry,
            qz = (pz - cz) / rz;
          const distance =
            (Math.sqrt(qx * qx + qy * qy + qz * qz) - 1) * Math.min(rx, ry, rz);
          d = smoothMin(d, distance);
        }
        field.field[x + y * res + z * res * res] = -d;
      }
  field.update();
  const count = field.geometry.drawRange.count;
  const geometry = new THREE.BufferGeometry();
  for (const key of ['position', 'normal'])
    geometry.setAttribute(
      key,
      new THREE.BufferAttribute(
        field.geometry.getAttribute(key).array.slice(0, count * 3),
        3,
      ),
    );
  geometry.scale(extent, extent, extent);
  const sculpture = new THREE.Mesh(geometry, mat);
  sculpture.name = `Alessa_${study.month}_continuous_surface`;
  const root = new THREE.Group();
  root.add(sculpture);
  // Curved cord connected to the abdomen; keep early embryo uncluttered.
  if (study.limbs) {
    const curve = new THREE.CatmullRomCurve3(
      [
        [0.05, -0.16, -0.05],
        [0.55, -0.09, -0.3],
        [0.73, -0.6, -0.36],
        [0.3, -1.04, -0.32],
        [-0.32, -1.07, -0.2],
      ].map((p) => new THREE.Vector3(...p)),
    );
    const cord = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.034, 12, false),
      mat,
    );
    cord.name = 'cord';
    root.add(cord);
  }
  root.rotation.set(0.06, -0.18, study.rotation);
  root.userData = {
    reference: study.reference,
    month: study.month,
    artistic: true,
  };
  root.updateMatrixWorld(true);
  const gltf = await new GLTFExporter().parseAsync(root, { binary: false });
  await writeFile(new URL(`${study.month}.gltf`, output), JSON.stringify(gltf));
  console.log(
    `${study.month}: ${count / 3} triangles, independent silhouette, reference ${study.reference}`,
  );
  geometry.dispose();
  field.geometry.dispose();
  mat.dispose();
}

await writeFile(
  new URL('../components/canvasui/anatomy.json', import.meta.url),
  JSON.stringify(anatomy),
);
