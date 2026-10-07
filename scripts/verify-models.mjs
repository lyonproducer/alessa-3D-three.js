import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
globalThis.ProgressEvent = class {
  constructor(type, props) {
    this.type = type;
    Object.assign(this, props);
  }
};
const silhouettes = [];
for (const month of ['mayo', 'junio', 'julio', 'agosto']) {
  const gltf = await new GLTFLoader().parseAsync(
    await readFile(`public/models/${month}.gltf`, 'utf8'),
    '',
  );
  gltf.scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(gltf.scene),
    size = box.getSize(new THREE.Vector3()),
    center = box.getCenter(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  assert(extent > 0);
  let triangles = 0;
  const bins = new Set();
  const vertex = new THREE.Vector3();
  gltf.scene.traverse((node) => {
    if (!node.isMesh) return;
    const a = node.geometry.getAttribute('position');
    assert(Array.from(a.array).every(Number.isFinite));
    triangles += (node.geometry.index?.count ?? a.count) / 3;
    for (let i = 0; i < a.count; i++) {
      vertex
        .fromBufferAttribute(a, i)
        .applyMatrix4(node.matrixWorld)
        .sub(center)
        .divideScalar(extent);
      bins.add(
        [vertex.x, vertex.y, vertex.z]
          .map((v) => Math.floor((v + 0.5) * 20))
          .join(','),
      );
    }
  });
  assert(triangles > 2500, `${month}: complete continuous surface required`);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  camera.position.copy(center).add(new THREE.Vector3(0, 0, extent * 2));
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const ray = new THREE.Raycaster();
  let hits = 0;
  for (let x = -0.6; x <= 0.6; x += 0.1)
    for (let y = -0.6; y <= 0.6; y += 0.1) {
      ray.setFromCamera(new THREE.Vector2(x, y), camera);
      if (ray.intersectObject(gltf.scene, true).length) hits++;
    }
  assert(hits > 0, `${month}: touch rays must hit the surface`);
  ray.setFromCamera(new THREE.Vector2(4, 4), camera);
  assert.equal(
    ray.intersectObject(gltf.scene, true).length,
    0,
    'Background touch must miss',
  );
  silhouettes.push({ month, bins });
  console.log(
    `${month}: ${triangles} triangles; ${hits} ray hits; geometry valid`,
  );
}
for (let i = 0; i < silhouettes.length; i++)
  for (let j = i + 1; j < silhouettes.length; j++) {
    const a = silhouettes[i],
      b = silhouettes[j],
      intersection = [...a.bins].filter((v) => b.bins.has(v)).length;
    const similarity =
      intersection / (a.bins.size + b.bins.size - intersection);
    assert(
      similarity < 0.85,
      `${a.month} and ${b.month} must differ after normalizing size`,
    );
    console.log(
      `${a.month}/${b.month}: ${(similarity * 100).toFixed(1)}% normalized surface overlap`,
    );
  }
