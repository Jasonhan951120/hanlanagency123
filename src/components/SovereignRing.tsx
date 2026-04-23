import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export default function SovereignRing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    
    // Performance Optimization: Limit pixel ratio
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.25, 0.8, 0.9);
    composer.addPass(bloomPass);
    
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(1 / width, 1 / height);
    composer.addPass(fxaaPass);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);
    const torusGroup = new THREE.Group();
    const updateTorusScale = () => {
      const isMobileSize = window.innerWidth < 768;
      const s = isMobileSize ? 0.58 : 0.6;
      torusGroup.scale.set(s, s, s);
    };
    updateTorusScale();
    scene.add(torusGroup);
    function addBarycentricCoords(geo: THREE.BufferGeometry) {
      const g = geo.toNonIndexed();
      const count = g.attributes.position.count;
      const bary = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 3) {
        bary[i * 3] = 1; bary[i * 3 + 1] = 0; bary[i * 3 + 2] = 0;
        bary[(i + 1) * 3] = 0; bary[(i + 1) * 3 + 1] = 1; bary[(i + 2) * 3 + 2] = 0;
        bary[(i + 2) * 3] = 0; bary[(i + 2) * 3 + 1] = 0; bary[(i + 2) * 3 + 2] = 1;
      }
      g.setAttribute("barycentric", new THREE.BufferAttribute(bary, 3));
      return g;
    }
    const wireMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 barycentric; 
        varying vec3 vBary; 
        varying vec3 vNormal; 
        varying vec3 vViewPosition; 
        void main() { 
          vBary = barycentric; 
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition; 
        }
      `,
      fragmentShader: `
        varying vec3 vBary; 
        varying vec3 vNormal; 
        varying vec3 vViewPosition;
        float wireMask(vec3 b, float t) { 
          vec3 d = fwidth(b); 
          vec3 a = smoothstep(vec3(0.0), d * t, b); 
          return 1.0 - min(a.x, min(a.y, a.z)); 
        } 
        void main() { 
          float wf = wireMask(vBary, 1.6); 
          vec3 pinkCol = vec3(0.93, 0.76, 0.86);
          vec3 bgCol = vec3(0.01, 0.01, 0.01);
          
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          vec3 lightDir = normalize(vec3(3.0, 4.0, 5.0)); // Matches scene directional light
          
          // 1. Surface Quality: Sharp Glossiness (PBR Specular)
          vec3 halfVector = normalize(lightDir + viewDir);
          float NdotH = max(0.0, dot(normal, halfVector));
          float specular = pow(NdotH, 150.0) * 1.5; 
          
          // 2. Premium Glow: Thin, sharp edge highlights (Fresnel)
          float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 4.0);
          float edgeGlow = smoothstep(0.5, 1.0, fresnel) * 1.2;
          
          // 3. Lighting Depth: Emissive core
          vec3 emissive = pinkCol * 0.4;
          
          vec3 col = mix(bgCol, pinkCol, wf);
          if (wf > 0.0) {
            col += emissive; // Self-illuminating depth
            col += vec3(1.0, 0.95, 0.98) * specular; // Premium glossy reflection
            col += vec3(1.0, 0.7, 0.85) * edgeGlow; // Sharp edge glow
          }
          
          // Preserve original identity brightness
          col = mix(col, vec3(1.0) * 1.2, wf * 0.3);
          
          gl_FragColor = vec4(col, 1.0); 
        }
      `,
      side: THREE.DoubleSide, extensions: { derivatives: true } as any,
    });
    const coreTorus = new THREE.Mesh(addBarycentricCoords(new THREE.TorusGeometry(2, 0.4, 40, 40)), wireMaterial);
    torusGroup.add(coreTorus);
    const FRAG_SCALE = 24; const TORUS_R = 2, TORUS_r = 0.4;
    function hash2(px: number, py: number) {
      const a = Math.sin(px * 127.1 + py * 311.7) * 43758.5453;
      const b = Math.sin(px * 269.5 + py * 183.3) * 43758.5453;
      return [a - Math.floor(a), b - Math.floor(b)];
    }
    function cellSeed(u: number, v: number) {
      const n = [Math.floor(u * FRAG_SCALE), Math.floor(v * FRAG_SCALE)];
      const f = [u * FRAG_SCALE - n[0], v * FRAG_SCALE - n[1]];
      let md = Infinity, best = [...n];
      for (let j = -2; j <= 2; j++) {
        for (let i = -2; i <= 2; i++) {
          const o = hash2(n[0] + i, n[1] + j);
          const r = [i + o[0] - f[0], j + o[1] - f[1]];
          const d = r[0] * r[0] + r[1] * r[1];
          if (d < md) { md = d; best = [n[0] + i + o[0], n[1] + j + o[1]]; }
        }
      }
      return [best[0] / FRAG_SCALE, best[1] / FRAG_SCALE];
    }
    const baseGeo = new THREE.TorusGeometry(TORUS_R, TORUS_r, 60, 60);
    const nonIndexed = baseGeo.toNonIndexed(); baseGeo.dispose();
    const pos = nonIndexed.attributes.position.array;
    const nrm = nonIndexed.attributes.normal.array;
    const uvData = nonIndexed.attributes.uv.array;
    const tris = pos.length / 9;
    const cellMap = new Map<string, { s: number[], t: number[] }>();
    for (let t = 0; t < tris; t++) {
      const uc = (uvData[t * 6] + uvData[t * 6 + 2] + uvData[t * 6 + 4]) / 3;
      const vc = (uvData[t * 6 + 1] + uvData[t * 6 + 3] + uvData[t * 6 + 5]) / 3;
      const s = cellSeed(uc, vc);
      const k = `${s[0].toFixed(8)}_${s[1].toFixed(8)}`;
      if (!cellMap.has(k)) cellMap.set(k, { s, t: [] });
      cellMap.get(k)!.t.push(t);
    }
    const glassMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xedc2dc, 
      metalness: 0.4, 
      roughness: 0.15, 
      transmission: 0.8, 
      ior: 1.5, 
      thickness: 1.5, 
      clearcoat: 1.0, 
      clearcoatRoughness: 0.05, 
      side: THREE.DoubleSide 
    });
    const fragments: THREE.Mesh[] = [];
    const TWO_PI = Math.PI * 2;
    cellMap.forEach(({ s: seed, t: triList }) => {
      if (!triList.length) return;
      const vc = triList.length * 3;
      const pArr = new Float32Array(vc * 3), nArr = new Float32Array(vc * 3), uvArr = new Float32Array(vc * 2);
      let vi = 0;
      for (const tri of triList) {
        for (let v = 0; v < 3; v++) {
          const sv = tri * 3 + v;
          pArr[vi * 3] = pos[sv * 3]; pArr[vi * 3 + 1] = pos[sv * 3 + 1]; pArr[vi * 3 + 2] = pos[sv * 3 + 2];
          nArr[vi * 3] = nrm[sv * 3]; nArr[vi * 3 + 1] = nrm[sv * 3 + 1]; nArr[vi * 3 + 2] = nrm[sv * 3 + 2];
          uvArr[vi * 2] = uvData[sv * 2]; uvArr[vi * 2 + 1] = uvData[sv * 2 + 1];
          vi++;
        }
      }
      const phi = seed[0] * TWO_PI, theta = seed[1] * TWO_PI;
      const cx = (TORUS_R + TORUS_r * Math.cos(theta)) * Math.cos(phi);
      const cy = (TORUS_R + TORUS_r * Math.cos(theta)) * Math.sin(phi);
      const cz = TORUS_r * Math.sin(theta);
      const cellCenter = new THREE.Vector3(cx, cy, cz);
      const majorPt = new THREE.Vector3(TORUS_R * Math.cos(phi), TORUS_R * Math.sin(phi), 0);
      const cellNormal = cellCenter.clone().sub(majorPt).normalize();
      const SHRINK = 0.96;
      for (let i = 0; i < pArr.length; i += 3) { pArr[i] = (pArr[i] - cx) * SHRINK; pArr[i+1] = (pArr[i+1] - cy) * SHRINK; pArr[i+2] = (pArr[i+2] - cz) * SHRINK; }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pArr, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(nArr, 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));
      const rnd = hash2(seed[0] * 137.5, seed[1] * 137.5);
      const rotAxis = new THREE.Vector3(rnd[0] - 0.5, rnd[1] - 0.5, Math.random() - 0.5).normalize();
      const mesh = new THREE.Mesh(geo, glassMat);
      mesh.position.copy(cellCenter).addScaledVector(cellNormal, 0.01);
      mesh.userData = { cellCenter, cellNormal, rotAxis, maxAngle: 0.6 + rnd[1] * 0.6, lift: 0 };
      torusGroup.add(mesh);
      fragments.push(mesh);
    });
    nonIndexed.dispose();
    const rcMesh = new THREE.Mesh(new THREE.TorusGeometry(TORUS_R, TORUS_r, 60, 60), new THREE.MeshBasicMaterial({ visible: false }));
    torusGroup.add(rcMesh);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const hoverPoint = new THREE.Vector3();
    let hoverActive = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
    };
    container.addEventListener("mousemove", onMouseMove);
    let reqId: number;
    const clock = new THREE.Clock();
    let lastTime = 0;
    const tick = () => {
      const elapsed = clock.getElapsedTime();
      const delta = elapsed - lastTime;
      lastTime = elapsed;
      torusGroup.rotation.y += 0.002;
      torusGroup.rotation.x += 0.0008;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(rcMesh);
      if (hits.length > 0) {
        torusGroup.worldToLocal(hoverPoint.copy(hits[0].point));
        hoverActive = Math.min(hoverActive + delta * 4, 1);
      } else {
        hoverActive = Math.max(hoverActive - delta * 2, 0);
      }

      for (const frag of fragments) {
        const { cellCenter, cellNormal, rotAxis, maxAngle } = frag.userData;
        let target = 0;
        if (hoverActive > 0.01) {
          const dist = cellCenter.distanceTo(hoverPoint);
          target = (1 - Math.min(1, Math.max(0, (dist - 0.2) / 0.8))) * hoverActive;
        }
        frag.userData.lift = THREE.MathUtils.lerp(frag.userData.lift, target, target > frag.userData.lift ? 0.1 : 0.05);
        const lift = frag.userData.lift;
        frag.position.copy(cellCenter).addScaledVector(cellNormal, 0.01 + lift * 0.25);
        frag.quaternion.setFromAxisAngle(rotAxis, lift * maxAngle);
      }

      composer.render();
      reqId = requestAnimationFrame(tick);
    };
    tick();

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      fxaaPass.uniforms["resolution"].value.set(1 / width, 1 / height);
      updateTorusScale();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      scene.clear();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent pointer-events-auto">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
