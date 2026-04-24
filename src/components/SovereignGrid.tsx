import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;
varying float vHeight;
varying float vMouseDist;

float getWave(vec2 p, float t) {
    float wave = sin(p.x * 0.8 + t * 0.3) * cos(p.y * 0.6 + t * 0.2);
    wave += sin(p.y * 1.5 - t * 0.4) * 0.15;
    return wave * 0.5;
}

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // 1. Mouse Interaction (Strong Magnetic Pull)
    vMouseDist = length(pos.xy - uMouse);
    float mouseStrength = exp(-vMouseDist * 0.8); // Wider radius for better visibility
    
    // Magnetic Attraction: Points aggressively follow/clump toward cursor
    // Increased to 0.55 for high-visibility follow effect
    pos.xy += (uMouse - pos.xy) * mouseStrength * 0.55;
    
    // 2. Wave Motion
    float wave = getWave(pos.xy, uTime);
    
    // 3. Displacement
    pos.z += wave + (1.0 * mouseStrength);
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

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    // 1. Particle Starfield (User request: very small dots)
    float gridScale = 144.0; 
    vec2 gridUV = fract(vUv * gridScale);
    
    float dist = length(gridUV - 0.5);
    float stars = smoothstep(0.12, 0.02, dist);
    
    // 2. Twinkle & Glow Logic
    float mousePresence = exp(-vMouseDist * 1.5);
    
    vec2 cellID = floor(vUv * gridScale);
    float twinkleSeed = random(cellID);
    float twinkle = (sin(uTime * 3.5 + twinkleSeed * 12.0) * 0.5 + 0.5) * 0.5 + 0.5;
    
    // 3. Colors (Hanlan Pink #EDC2DC)
    vec3 pink = vec3(0.93, 0.76, 0.86); 
    vec3 white = vec3(1.0, 1.0, 1.0);
    
    vec3 finalColor = mix(pink, white, (mousePresence * 0.6 + (twinkle - 0.5) * 0.4));
    
    // 4. Composition (User request: shining like stars)
    float brightness = (8.0 + mousePresence * 12.0) * twinkle;
    vec3 color = finalColor * brightness;
    
    // 5. Global Visibility & Vignette
    float vignette = 1.0 - smoothstep(0.15, 1.05, length(vUv - 0.5));
    float alpha = stars * brightness * 0.18 * vignette;
    
    alpha = clamp(alpha, 0.0, 0.98);

    gl_FragColor = vec4(color, alpha);
}
`;

export default function SovereignGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    
    camera.position.set(0, -4.8, 4.2); 
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const geo = new THREE.PlaneGeometry(16, 16, 180, 180);
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
      // More viscous lerp (0.02) to make the "pulling" effect visible as it follows
      const lerpFactor = 1.0 - Math.pow(0.02, delta);
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
      className="absolute inset-0 z-[0] pointer-events-none w-full h-full bg-transparent" 
      style={{ willChange: "transform" }}
    />
  );
}
