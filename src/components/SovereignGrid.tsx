import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;
varying float vHeight;

float getWave(vec2 p, float t) {
    float wave = sin(p.x * 1.2 + t * 0.5) * cos(p.y * 1.0 + t * 0.3);
    wave += sin(p.y * 2.0 - t * 0.8) * 0.2;
    wave += cos(length(p) * 1.5 - t * 0.4) * 0.15;
    return wave * 0.5;
}

void main() {
    vUv = uv;
    vec3 pos = position;
    
    float wave = getWave(pos.xy, uTime);
    
    float distToMouse = length(pos.xy - uMouse);
    float mouseInfluence = exp(-distToMouse * 2.5) * 0.2;
    
    pos.z += wave - mouseInfluence;
    vHeight = pos.z;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
varying vec2 vUv;
varying float vHeight;

void main() {
    float gridScale = 30.0;
    vec2 gridUV = fract(vUv * gridScale - 0.5);
    vec2 gridLines = smoothstep(0.47, 0.5, abs(gridUV - 0.5));
    float lineMask = max(gridLines.x, gridLines.y);
    
    vec2 dotUV = fract(vUv * gridScale);
    float distToCenter = length(dotUV - 0.5);
    float dots = smoothstep(0.15, 0.04, distToCenter);
    
    // Pure White for Waves and Dots as requested
    vec3 whiteCol = vec3(1.0, 1.0, 1.0);
    vec3 deepBg = vec3(0.0, 0.0, 0.0); 
    
    float pulse = (sin(uTime * 1.5 + vHeight * 4.0) * 0.5 + 0.5) * 0.4 + 0.6;
    
    // Base grid lines (very subtle)
    vec3 color = mix(deepBg, whiteCol, lineMask * 0.2);
    // Glowing intersection dots (bright white)
    color = mix(color, whiteCol * 2.0, dots * pulse);
    
    float atmosphericFade = smoothstep(-0.8, 0.8, vHeight);
    color *= (0.5 + atmosphericFade * 0.5);
    
    float alpha = (lineMask * 0.15 + dots * pulse * 0.85);
    
    float vignette = 1.0 - smoothstep(0.2, 0.9, length(vUv - 0.5));
    alpha *= vignette;

    gl_FragColor = vec4(color, alpha);
}
`;

export default function SovereignGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    
    // Adjusted camera for better visibility of the "waves"
    camera.position.set(0, -4, 4); 
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const geo = new THREE.PlaneGeometry(15, 15, 128, 128);
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(-99, -99) }
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    let targetMouseX = -99, targetMouseY = -99;
    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 15;
      targetMouseY = (0.5 - e.clientY / window.innerHeight) * 15;
    };
    window.addEventListener("mousemove", onMouseMove);

    const clock = new THREE.Clock();
    let rafId: number;
    let isPaused = false;

    const animate = () => {
      if (isPaused) return;
      rafId = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      
      const delta = clock.getDelta();
      const lerpFactor = 1.0 - Math.pow(0.01, delta);
      uniforms.uMouse.value.x += (targetMouseX - uniforms.uMouse.value.x) * lerpFactor;
      uniforms.uMouse.value.y += (targetMouseY - uniforms.uMouse.value.y) * lerpFactor;
      
      renderer.render(scene, camera);
    };
    animate();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(rafId);
      } else {
        if (isPaused) {
          isPaused = false;
          animate();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[0] pointer-events-none w-full h-full bg-[#000000]" 
      style={{ willChange: "transform" }}
    />
  );
}
