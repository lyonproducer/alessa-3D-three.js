export interface MorphCloud {
  positions: Float32Array;
  colors: Float32Array;
  shades: Float32Array;
}

// A spatial ordering matches nearby regions, avoiding a random cloud explosion.
function spatialOrder(positions: Float32Array) {
  const count = positions.length / 3;
  const keys = new Uint32Array(count);
  const spread = (value: number) => {
    let n = Math.max(0, Math.min(1023, Math.round((value + 0.5) * 1023)));
    n = (n | (n << 16)) & 0x030000ff;
    n = (n | (n << 8)) & 0x0300f00f;
    n = (n | (n << 4)) & 0x030c30c3;
    n = (n | (n << 2)) & 0x09249249;
    return n;
  };
  for (let i = 0; i < count; i++) {
    keys[i] =
      spread(positions[i * 3]) |
      (spread(positions[i * 3 + 1]) << 1) |
      (spread(positions[i * 3 + 2]) << 2);
  }
  return Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => keys[a] - keys[b] || a - b,
  );
}

export function alignCloud(
  current: Float32Array,
  next: MorphCloud,
): MorphCloud {
  if (current.length !== next.positions.length)
    throw new Error('Particle counts must match');
  const fromOrder = spatialOrder(current),
    toOrder = spatialOrder(next.positions);
  const aligned: MorphCloud = {
    positions: new Float32Array(current.length),
    colors: new Float32Array(next.colors.length),
    shades: new Float32Array(next.shades.length),
  };
  for (let rank = 0; rank < fromOrder.length; rank++) {
    const from = fromOrder[rank],
      to = toOrder[rank];
    for (let axis = 0; axis < 3; axis++) {
      aligned.positions[from * 3 + axis] = next.positions[to * 3 + axis];
      aligned.colors[from * 3 + axis] = next.colors[to * 3 + axis];
    }
    aligned.shades[from] = next.shades[to];
  }
  return aligned;
}

export function gentleEase(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function interpolateCloud(
  from: MorphCloud,
  to: MorphCloud,
  output: MorphCloud,
  progress: number,
) {
  const eased = gentleEase(progress);
  for (const key of ['positions', 'colors', 'shades'] as const) {
    const a = from[key],
      b = to[key],
      out = output[key];
    for (let i = 0; i < out.length; i++) out[i] = a[i] + (b[i] - a[i]) * eased;
  }
  return eased;
}
