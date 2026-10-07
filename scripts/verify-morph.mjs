import assert from 'node:assert/strict';
import {
  alignCloud,
  gentleEase,
  interpolateCloud,
} from '../components/canvasui/particle-morph.ts';

const cloud = (positions) => ({
  positions: new Float32Array(positions),
  colors: new Float32Array(positions.map((_, i) => (i % 7) / 7)),
  shades: new Float32Array(positions.length / 3).fill(0.8),
});
const copy = (c) => ({
  positions: c.positions.slice(),
  colors: c.colors.slice(),
  shades: c.shades.slice(),
});
const a = cloud([
  -0.45, -0.3, 0, -0.1, 0.2, 0.3, 0.2, 0.3, -0.2, 0.45, 0.4, 0.1,
]);
const b = cloud([
  0.43, 0.41, 0.12, 0.18, 0.31, -0.21, -0.11, 0.22, 0.32, -0.44, -0.29, 0.01,
]);
const target = alignCloud(a.positions, b),
  output = copy(a);
interpolateCloud(a, target, output, 0);
assert.deepEqual(
  output,
  a,
  'Transition must begin at exactly the displayed cloud',
);
interpolateCloud(a, target, output, 1);
for (const key of ['positions', 'colors', 'shades'])
  for (let i = 0; i < output[key].length; i++)
    assert(Math.abs(output[key][i] - target[key][i]) < 1e-6);
const triples = (p) =>
  Array.from({ length: p.length / 3 }, (_, i) =>
    Array.from(p.slice(i * 3, i * 3 + 3)).join(','),
  ).sort();
assert.deepEqual(
  triples(target.positions),
  triples(b.positions),
  'Matching must retain every target particle',
);
const distance = (p, q) =>
  Array.from(p).reduce((sum, v, i) => sum + (v - q[i]) ** 2, 0);
assert(
  distance(a.positions, target.positions) < distance(a.positions, b.positions),
  'Spatial matching should avoid random crossing',
);
interpolateCloud(a, target, output, 0.42);
const interrupted = copy(output),
  next = alignCloud(interrupted.positions, a);
interpolateCloud(interrupted, next, output, 0);
assert.deepEqual(output, interrupted, 'A rapid month change must not jump');
for (let i = 1; i <= 100; i++)
  assert(gentleEase(i / 100) >= gentleEase((i - 1) / 100));
assert(
  gentleEase(0.01) < 0.00002 && gentleEase(0.99) > 0.99998,
  'Both ends must ease gently',
);
interpolateCloud(a, target, output, 2);
assert.equal(
  gentleEase(2),
  1,
  'Reduced motion and completed transitions finish directly',
);
assert.throws(() => alignCloud(new Float32Array(3), b));
console.log(
  'Morph verified: exact start/end, complete target, nearby matching, interruption continuity, gentle easing and progress clamping.',
);
