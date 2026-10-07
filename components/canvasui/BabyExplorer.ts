import * as THREE from 'three';
import anatomy from './anatomy.json';
import type { BodyRegion } from '../../lib/measurements';

// Region fields share the author's coordinates with generate-models.mjs.
// Picking uses the continuous surface, so it follows orbit, float and zoom and
// does not accidentally select a limb hidden behind the head.
export function createBabyExplorer(
  source: THREE.Group,
  parent: THREE.Group,
  bounds: { center: THREE.Vector3; inv: number },
) {
  const group = new THREE.Group();
  const clone = source.clone(true);
  clone.position.sub(bounds.center);
  group.scale.setScalar(bounds.inv);
  group.add(clone);
  group.visible = false;
  parent.add(group);
  let month = '';
  clone.traverse((node) => {
    if (node.userData.month) month = node.userData.month;
  });
  const fields = anatomy[month as keyof typeof anatomy];
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const local = new THREE.Vector3();
  return {
    pick(x: number, y: number, camera: THREE.Camera): BodyRegion | null {
      if (!fields) return null;
      parent.updateWorldMatrix(true, true);
      camera.updateMatrixWorld(true);
      ray.setFromCamera(ndc.set(x, y), camera);
      const hit = ray.intersectObject(group, true)[0];
      if (!hit) return null;
      if (hit.object.name === 'cord') return 'cord';
      if (month === 'mayo') return 'whole';
      local.copy(hit.point);
      hit.object.worldToLocal(local);
      let region: BodyRegion = 'abdomen';
      let closest = Infinity;
      for (const field of fields) {
        const [cx, cy, cz, rx, ry, rz] = field.shape;
        const distance =
          (Math.hypot(
            (local.x - cx) / rx,
            (local.y - cy) / ry,
            (local.z - cz) / rz,
          ) -
            1) *
          Math.min(rx, ry, rz);
        if (distance < closest) {
          closest = distance;
          region = field.region as BodyRegion;
        }
      }
      return region;
    },
    dispose() {
      parent.remove(group);
      // Clones share resources with source, which the asset owner disposes.
      group.clear();
    },
  };
}
