import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
globalThis.ProgressEvent ??= class ProgressEvent extends Event {
  constructor(type, init = {}) {
    super(type);
    Object.assign(this, init);
  }
};

const root = new URL('../', import.meta.url);
const morphCode = ts.transpileModule(
  await readFile(
    new URL('components/canvasui/particle-morph.ts', root),
    'utf8',
  ),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const morphUrl =
  'data:text/javascript;base64,' + Buffer.from(morphCode).toString('base64');
let code = ts.transpileModule(
  await readFile(new URL('components/canvasui/SolidLayers.ts', root), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
code = code
  .replaceAll("'three'", JSON.stringify(import.meta.resolve('three')))
  .replaceAll(
    "'three/addons/objects/MarchingCubes.js'",
    JSON.stringify(
      import.meta.resolve('three/addons/objects/MarchingCubes.js'),
    ),
  )
  .replaceAll("'./particle-morph'", JSON.stringify(morphUrl));
const { createSolidLayers } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);
const originalFetch = globalThis.fetch;
globalThis.fetch = async (path) => {
  const url =
    typeof path === 'string'
      ? path
      : path instanceof URL
        ? path.href
        : path.url;
  return url.startsWith('/models/clay/')
    ? new Response(
        await readFile(
          new URL('public/' + url.split('?')[0].replace(/^\//, ''), root),
        ),
      )
    : originalFetch(path);
};
const parent = new THREE.Group();
const solid = createSolidLayers(parent);
const models = [];
const loader = new GLTFLoader();
for (const month of ['mayo', 'junio', 'julio', 'agosto']) {
  const { scene } = await loader.parseAsync(
    await readFile(new URL(`public/models/${month}.gltf`, root), 'utf8'),
    '',
  );
  await solid.prepare(scene);
  const box = new THREE.Box3().setFromObject(scene);
  const bounds = {
    center: box.getCenter(new THREE.Vector3()),
    inv: 1 / Math.max(...box.getSize(new THREE.Vector3()).toArray()),
  };
  models.push({ scene, bounds });
}
let clay;
function snapshot() {
  parent.updateMatrixWorld(true);
  return {
    vertices: clay.geometry
      .getAttribute('position')
      .array.slice(0, clay.count * 3),
    matrix: clay.matrixWorld.elements.slice(),
  };
}
function validate() {
  assert.equal(parent.children.length, 1, 'Only one solid group');
  assert.ok(
    clay.count > 1000 &&
      clay.count < clay.geometry.getAttribute('position').count,
    'Nonempty surface within capacity',
  );
  assert.ok(snapshot().vertices.every(Number.isFinite), 'Finite clay vertices');
  assert.equal(clay.material.opacity, 1, 'Opaque throughout transition');
  assert.equal(
    clay.material.transparent,
    false,
    'No transparent model overlap',
  );
}
const timings = [];
for (const start of models)
  for (const end of models) {
    solid.setSource(start.scene, start.bounds, false);
    solid.update(1, 1);
    parent.traverse((node) => {
      if (node.isMarchingCubes) clay = node;
    });
    const before = snapshot();
    solid.setSource(end.scene, end.bounds, true);
    solid.update(0, 1);
    assert.deepEqual(
      snapshot(),
      before,
      'No geometry or pose jump at transition start',
    );
    for (const progress of [0.1, 0.3, 0.5, 0.75, 1]) {
      const t = performance.now();
      solid.update(progress, 1);
      timings.push(performance.now() - t);
      validate();
    }
  }
solid.setSource(models[0].scene, models[0].bounds, true);
solid.update(0.41, 1);
const interrupted = snapshot();
solid.setSource(models[2].scene, models[2].bounds, true);
solid.update(0, 1);
assert.deepEqual(
  snapshot(),
  interrupted,
  'Interrupted transition starts at currently visible volume',
);
solid.update(1, 0);
assert.equal(parent.children[0].visible, false, 'Particle mode hides solid');
solid.update(1, 1);
validate();
let disposed = 0;
clay.geometry.addEventListener('dispose', () => disposed++);
solid.dispose();
assert.equal(parent.children.length, 0);
assert.equal(disposed, 1);
globalThis.fetch = originalFetch;
timings.sort((a, b) => a - b);
console.log(
  `Clay verified: all 16 month pairs, finite opaque surface, exact start, interruption continuity, mode switching and cleanup. Median update: ${timings[Math.floor(timings.length / 2)].toFixed(1)} ms.`,
);
