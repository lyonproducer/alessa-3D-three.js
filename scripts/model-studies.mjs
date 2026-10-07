// Independent visual studies of the selected scans. Hidden anatomy is artistic.
// May: 05.png, June: 12.png, July: 01.jpg, August: 18.png.
// Ellipsoids are blended into ONE continuous surface, not stacked visible spheres.
export const studies = [
  {
    month: 'mayo',
    rotation: -0.28,
    reference: '05.png',
    shapes: [
      [-0.09, 0.43, 0, 0.25, 0.29, 0.22],
      [-0.22, 0.14, 0, 0.22, 0.3, 0.19],
      [-0.18, -0.18, 0, 0.19, 0.26, 0.16],
      [-0.02, -0.37, 0, 0.17, 0.16, 0.14],
      [0.02, 0.15, 0.12, 0.11, 0.12, 0.07],
      [0.03, -0.25, 0.1, 0.1, 0.09, 0.075],
    ],
  },
  {
    month: 'junio',
    head: [-0.2, 0.54, 0.335, 0.37, 0.29],
    rotation: 1.92,
    reference: '12.png',
    shapes: [
      [-0.26, -0.02, 0, 0.24, 0.37, 0.21],
      [-0.17, -0.3, 0, 0.23, 0.23, 0.22],
    ],
    limbs: [
      [[-0.31, 0.19, 0.18], [-0.06, 0.04, 0.27], [0.1, 0.26, 0.23], 0.06],
      [[-0.31, 0.19, -0.18], [-0.08, 0.34, -0.28], [0.17, 0.57, -0.23], 0.053],
      [[-0.17, -0.29, 0.15], [0.2, -0.13, 0.22], [0.22, 0.14, 0.23], 0.072],
      [[-0.18, -0.31, -0.15], [0.19, -0.29, -0.2], [0.4, -0.16, -0.2], 0.06],
    ],
  },
  {
    month: 'julio',
    head: [-0.23, 0.63, 0.36, 0.425, 0.32],
    rotation: 1.36,
    reference: '01.jpg',
    shapes: [
      [-0.27, -0.07, 0, 0.28, 0.45, 0.25],
      [-0.11, -0.43, 0, 0.29, 0.26, 0.24],
    ],
    limbs: [
      [[-0.24, 0.21, 0.23], [-0.03, -0.02, 0.33], [0.27, 0.09, 0.28], 0.077],
      [[-0.25, 0.21, -0.23], [0.05, 0.2, -0.32], [0.26, 0.42, -0.26], 0.069],
      [[-0.07, -0.4, 0.18], [0.4, -0.15, 0.23], [0.2, -0.56, 0.24], 0.098],
      [
        [-0.11, -0.41, -0.18],
        [0.25, -0.24, -0.25],
        [0.42, -0.54, -0.22],
        0.085,
      ],
    ],
  },
  {
    month: 'agosto',
    head: [-0.24, 0.75, 0.365, 0.425, 0.325],
    rotation: -0.48,
    reference: '18.png',
    shapes: [
      [-0.13, 0.3, 0, 0.18, 0.21, 0.2],
      [-0.25, -0.12, 0, 0.33, 0.51, 0.29],
      [-0.08, -0.52, 0, 0.32, 0.29, 0.28],
    ],
    limbs: [
      [[-0.22, 0.21, 0.25], [0.17, 0.02, 0.39], [0.3, 0.25, 0.36], 0.078],
      [[-0.22, 0.21, -0.25], [0.15, 0.04, -0.35], [0.34, 0.22, -0.29], 0.082],
      [[-0.04, -0.49, 0.21], [0.49, -0.24, 0.29], [0.22, -0.76, 0.31], 0.118],
      [[-0.09, -0.48, -0.21], [0.32, -0.27, -0.3], [0.5, -0.69, -0.27], 0.106],
    ],
  },
];

// One continuous craniofacial field. Features are shallow deformations of the
// same oval, never attached balls. This remains an artistic, non-diagnostic face.
export function headDistance(x, y, z, head) {
  const [cx, cy, rx, ry, rz] = head;
  const hy = (y - cy) / ry;
  const gaussian = (v, w) => Math.exp(-(v * v) / (w * w));
  const jaw = gaussian(hy + 0.64, 0.29);
  let shift = 0.055 * jaw;
  if (x > cx) {
    shift += 0.035 * gaussian(y - (cy - 0.07), 0.04) * gaussian(z, 0.065); // small integrated nose
    shift += 0.011 * gaussian(y - (cy - 0.155), 0.025) * gaussian(z, 0.085); // soft lip profile
    shift -= 0.006 * gaussian(y - (cy - 0.183), 0.013) * gaussian(z, 0.09); // mouth crease
    shift -=
      0.009 *
      gaussian(y - (cy + 0.005), 0.023) *
      (gaussian(z - 0.13, 0.07) + gaussian(z + 0.13, 0.07));
  }
  const xRadius = rx * (1 - 0.15 * jaw),
    zRadius = rz * (1 - 0.16 * jaw);
  const qx = (x - cx - shift) / xRadius,
    qz = z / zRadius;
  return (
    (Math.sqrt(qx * qx + hy * hy + qz * qz) - 1) *
    Math.min(xRadius, ry, zRadius)
  );
}

export function smoothMin(a, b, k = 0.065) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
