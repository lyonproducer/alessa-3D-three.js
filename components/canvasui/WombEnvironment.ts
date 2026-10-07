import * as THREE from 'three';

/** Procedural interior in the same 3D space as the sculpture. No clinical data. */
export function createWombEnvironment(scene: THREE.Scene) {
  const uniforms = { time: { value: 0 }, pulse: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;
      varying vec3 vP;uniform float time;uniform float pulse;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 p=normalize(vP);float n=noise(p*5.+time*.018)*.6+noise(p*14.-time*.009)*.3+noise(p*35.)*.1;
      float folds=pow(.5+.5*sin(p.y*24.+n*13.+p.x*9.),5.);
      float veins=pow(1.-abs(sin(p.x*27.+p.y*15.+n*22.)),22.);
      float back=pow(max(dot(p,normalize(vec3(-.4,.2,-1.))),0.),3.);
      vec3 color=mix(vec3(.007),vec3(.085),n);
      color+=vec3(.040)*folds+vec3(.060)*back;
      color*=1.-veins*.24;color+=pulse*vec3(.012);
      gl_FragColor=vec4(color,1.);}`,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(14, 56, 40), material);
  shell.scale.set(1, 0.86, 1);
  scene.add(shell);
  const dustGeometry = new THREE.BufferGeometry(),
    positions = new Float32Array(1500);
  for (let i = 0; i < positions.length; i++)
    positions[i] = (Math.random() - 0.5) * 15;
  dustGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  );
  const dustMaterial = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.017,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);
  const ambient = new THREE.HemisphereLight('#ffffff', '#222222', 2.1);
  const key = new THREE.PointLight('#ffffff', 35, 18, 2);
  key.position.set(-3, 3, 4);
  const rim = new THREE.PointLight('#ffffff', 22, 15, 2);
  rim.position.set(3, 0, -3);
  scene.add(ambient, key, rim);
  return {
    update(time: number, pulse: number) {
      uniforms.time.value = time;
      uniforms.pulse.value = pulse;
      dust.rotation.y = time * 0.012;
      dust.position.y = Math.sin(time * 0.08) * 0.15;
      key.intensity = 35 + pulse * 7;
    },
    dispose() {
      scene.remove(shell, dust, ambient, key, rim);
      shell.geometry.dispose();
      material.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
    },
  };
}
