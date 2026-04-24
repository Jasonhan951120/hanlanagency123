import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;
varying float vHeight;
varying float vMouseDist;

float getWave(vec2 p, float t) {
    float wave = sin(p.x * 1.5 + t * 0.5) * cos(p.y * 1.2 + t * 0.3);
    wave += sin(p.y * 2.5 - t * 0.8) * 0.25;
    wave += cos(length(p) * 1.8 - t * 0.4) * 0.15;
    return wave * 0.5;
}

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // 1. Base Topographical Wave
    float wave = getWave(pos.xy, uTime);
    
    // 2. Stronger Mouse Interaction (Gravitational Pull)
    float distToMouse = length(pos.xy - uMouse);
    vMouseDist = distToMouse;
    
    float mousePull = 0.4 * exp(-distToMouse * 1.8);
    pos.z += wave + mousePull; // Bends "towards" viewer near mouse
    vHeight = pos.z;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
varying vec2 vUv;
varying float vHeight;
varying float vMouseDist;

void main() {
    // 1. High Density Grid
    float gridScale = 48.0;
    vec2 gridUV = fract(vUv * gridScale - 0.5);
    vec2 gridLines = smoothstep(0.485, 0.5, abs(gridUV - 0.5));
    float lineMask = max(gridLines.x, gridLines.y);
    
    // 2. Smaller Intersection Dots
    vec2 dotUV = fract(vUv * gridScale);
    float distToCenter = length(dotUV - 0.5);
    float dots = smoothstep(0.1, 0.03, distToCenter);
    
    // 3. Colors (Pure White)
    vec3 whiteCol = vec3(1.0, 1.0, 1.0);
    vec3 deepBg = vec3(0.0, 0.0, 0.0); 
    
    // Pulse effect
    float pulse = (sin(uTime * 2.0 + vHeight * 6.0) * 0.5 + 0.5) * 0.3 + 0.7;
    
    // 4. Mouse Reactive Brightness
    float sensing = exp(-vMouseDist * 3.5) * 1.5;
    
    // Composite
    // Subtle lines
    vec3 color = mix(deepBg, whiteCol, lineMask * 0.18); 
    
    // Stronger, reactive glowing dots
    float dotBrightness = (3.5 + sensing * 2.5);
    color = mix(color, whiteCol * dotBrightness, dots * pulse);
    
    // Atmospheric effects
    float atmosphericFade = smoothstep(-0.8, 1.0, vHeight);
    color *= (0.4 + atmosphericFade * 0.6);
    
    // Dynamic Alpha
    float alpha = (lineMask * 0.12 + dots * pulse * 0.9);
    
    // Edge Vignette
    float vignette = 1.0 - smoothstep(0.15, 0.95, length(vUv - 0.5));
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
    
    // Refined angle for depth
    camera.position.set(0, -4.5, 4.5); 
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const geo = new THREE.PlaneGeometry(16, 16, 144, 144);
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
      // Mapping mouse to -8 to 8 space
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 16;
      targetMouseY = (0.5 - e.clientY / window.innerHeight) * 16;
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
      // Faster, smoother lerp for high-density interaction
      const lerpFactor = 1.0 - Math.pow(0.005, delta);
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
      className="absolute inset-0 z-[0] pointer-events-none w-full h-full bg-[#000000]" 
      style={{ willChange: "transform" }}
    />
  );
}
