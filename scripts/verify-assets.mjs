import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
globalThis.ProgressEvent=class {constructor(type,props){this.type=type;Object.assign(this,props)}};
const manifest=JSON.parse(await readFile('lib/memories.json','utf8'));let images=0;
for(const month of ['mayo','junio','julio','agosto']){
 const model=await new GLTFLoader().parseAsync(await readFile(`public/models/${month}.gltf`,'utf8'),'');let meshes=0;
 model.scene.traverse(node=>{if(node.isMesh){meshes++;const a=node.geometry.getAttribute('position');if(!a||!Array.from(a.array).every(Number.isFinite))throw new Error('Invalid geometry')}});
 if(meshes<1)throw new Error('Missing model geometry');
 for(const src of manifest[month]){const r=await fetch(`http://127.0.0.1:5173${src}`);if(!r.ok||!(r.headers.get('content-type')||'').startsWith('image/'))throw new Error(`Missing image ${src}`);images++}
 console.log(`${month}: ${meshes} meshes, ${manifest[month].length} images OK`);
}console.log(`${images} original images accessible; four glTF models parsed by Three.js.`);

