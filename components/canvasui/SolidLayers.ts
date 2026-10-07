import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { gentleEase } from './particle-morph';

const RESOLUTION = 80;
const EXTENT = 1.65;
const fields = new Map<string, Promise<Float32Array>>();
const months = new Set(['mayo', 'junio', 'julio', 'agosto']);
type Bounds = { center: THREE.Vector3; inv: number };
type Pose = Bounds & { rotation: THREE.Quaternion; cord: number };

function studyNode(source: THREE.Group): THREE.Object3D | null {
  let study: THREE.Object3D | null = null;
  source.traverse((node) => {
    if (months.has(node.userData.month)) study = node;
  });
  return study;
}
function copyPose(pose: Pose): Pose {
  return {
    center: pose.center.clone(),
    inv: pose.inv,
    rotation: pose.rotation.clone(),
    cord: pose.cord,
  };
}

export function createSolidLayers(parent: THREE.Group) {
  const material = new THREE.MeshStandardMaterial({
    color: '#e4e4e4',
    roughness: 0.82,
  });
  const group = new THREE.Group();
  const poseGroup = new THREE.Group();
  const clay = new MarchingCubes(RESOLUTION, material, false, false, 80000);
  clay.isolation = 0;
  clay.scale.setScalar(EXTENT);
  clay.frustumCulled = false;
  poseGroup.add(clay);
  const curve = new THREE.CatmullRomCurve3(
    [
      [0.05, -0.16, -0.05],
      [0.55, -0.09, -0.3],
      [0.73, -0.6, -0.36],
      [0.3, -1.04, -0.32],
      [-0.32, -1.07, -0.2],
    ].map((p) => new THREE.Vector3(...p)),
  );
  const cordGeometry = new THREE.TubeGeometry(curve, 64, 0.034, 12, false);
  const cord = new THREE.Mesh(cordGeometry, material);
  const cordHome = new Float32Array(
    cordGeometry.getAttribute('position').array,
  );
  poseGroup.add(cord);
  group.add(poseGroup);
  group.visible = false;
  parent.add(group);

  let prepared: { month: string; field: Float32Array } | null = null;
  const readyFields = new Map<string, Float32Array>();
  let current: Pose | null = null;
  let from: Pose | null = null;
  let to: Pose | null = null;
  let fromField: Float32Array | null = null;
  let toField: Float32Array | null = null;
  let previousEase = -1;
  let geometryDirty = true;
  let needsAttach = false;
  const elastic = new THREE.Vector3(1, 1, 1);
  const fromElastic = new THREE.Vector3(1, 1, 1);

  return {
    async prepare(source: THREE.Group) {
      const study = studyNode(source);
      if (!study) return;
      const month = study.userData.month as string;
      let pending = fields.get(month);
      if (!pending) {
        pending = fetch(`/models/clay/${month}.bin?v=1`)
          .then(async (response) => {
            if (!response.ok)
              throw new Error(`Clay field: HTTP ${response.status}`);
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength !== RESOLUTION ** 3 * 4)
              throw new Error('Invalid clay field');
            return new Float32Array(buffer);
          })
          .catch((error) => {
            fields.delete(month);
            throw error;
          });
        fields.set(month, pending);
      }
      readyFields.set(month, await pending);
    },
    setSource(source: THREE.Group, bounds: Bounds, transitioning: boolean) {
      const study = studyNode(source);
      if (!study) return;
      const month = study.userData.month as string;
      const field = readyFields.get(month);
      if (!field) return;
      if (needsAttach) {
        parent.add(group);
        needsAttach = false;
      }
      prepared = { month, field };
      to = {
        center: bounds.center.clone(),
        inv: bounds.inv,
        rotation: study.quaternion.clone(),
        cord: month === 'mayo' ? 0 : 1,
      };
      from = copyPose(transitioning && current ? current : to);
      fromElastic.copy(transitioning ? elastic : new THREE.Vector3(1, 1, 1));
      fromField = transitioning && current ? clay.field.slice() : field;
      toField = field;
      if (!transitioning || !current) {
        clay.field.set(field);
        current = copyPose(to);
      }
      previousEase = -1;
      geometryDirty = true;
    },
    update(progress: number, solidOpacity: number) {
      if (!prepared || !from || !to || !fromField || !toField || !current)
        return;
      const eased = gentleEase(progress);
      if (eased !== previousEase) {
        // Blend distance, not alpha: a single surface changes its own volume.
        for (let i = 0; i < clay.field.length; i++)
          clay.field[i] = fromField[i] + (toField[i] - fromField[i]) * eased;
        current.center.lerpVectors(from.center, to.center, eased);
        current.inv = THREE.MathUtils.lerp(from.inv, to.inv, eased);
        current.rotation.slerpQuaternions(from.rotation, to.rotation, eased);
        current.cord = THREE.MathUtils.lerp(from.cord, to.cord, eased);
        const pulse = Math.sin(Math.PI * eased) ** 2;
        const stretch = 1 + 0.045 * pulse;
        elastic.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
        elastic.x += (fromElastic.x - 1) * (1 - eased);
        elastic.y += (fromElastic.y - 1) * (1 - eased);
        elastic.z += (fromElastic.z - 1) * (1 - eased);
        previousEase = eased;
        geometryDirty = true;
      }
      const visible = solidOpacity > 0.002;
      group.visible = visible;
      if (!visible) return;
      if (geometryDirty) {
        // MarchingCubes caches gradients; clear them for correct changing normals.
        clay.normal_cache.fill(0);
        clay.update();
        const position = cordGeometry.getAttribute(
          'position',
        ) as THREE.BufferAttribute;
        for (let i = 0; i < position.count; i++) {
          position.setXYZ(
            i,
            0.05 + (cordHome[i * 3] - 0.05) * current.cord,
            -0.16 + (cordHome[i * 3 + 1] + 0.16) * current.cord,
            -0.05 + (cordHome[i * 3 + 2] + 0.05) * current.cord,
          );
        }
        position.needsUpdate = true;
        cord.visible = current.cord > 0.01;
        geometryDirty = false;
      }
      group.position.copy(current.center).multiplyScalar(-current.inv);
      group.scale.setScalar(current.inv);
      poseGroup.quaternion.copy(current.rotation);
      poseGroup.scale.copy(elastic);
      const transparent = solidOpacity < 0.998;
      if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
      material.opacity = transparent ? solidOpacity : 1;
    },
    dispose() {
      parent.remove(group);
      clay.geometry.dispose();
      cordGeometry.dispose();
      material.dispose();
      readyFields.clear();
      prepared = null;
      current = null;
      fromField = null;
      toField = null;
      needsAttach = true;
    },
  };
}
