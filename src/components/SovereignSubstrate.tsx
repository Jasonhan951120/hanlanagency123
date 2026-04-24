import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
varying vec2 vUv;

// --- Simplex Noise Helpers ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float line(float val, float width) {
  return smoothstep(width, 0.0, abs(val));
}

// --- Structured Field Helper ---
// Generates uniform, mathematically calculated lines
float structuredField(vec2 p, float scale, float t) {
  // Parallel flow with slight magnetic curvature
  float x = p.x * 2.0 + sin(p.y * 0.5 + t * 0.1) * 0.8;
  float lines = sin(x * scale + t * 0.2);
  return smoothstep(0.985, 1.0, lines);
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * vec2(uResolution.x / uResolution.y, 1.0);
  float t = uTime * 0.05;

  // --- Center/Ring Gravity Integration ---
  vec2 center = vec2(uResolution.x / uResolution.y, 1.0) * 0.5;
  float distToCenter = length(p - center);
  float ringGravity = smoothstep(0.5, 0.2, distToCenter) * 0.03;
  p += normalize(center - p) * ringGravity;

  // --- Gravitational Distortion (Cursor) ---
  vec2 mouseAspect = uMouse * vec2(uResolution.x / uResolution.y, 1.0);
  float mouseDist = length(p - mouseAspect);
  float bend = exp(-mouseDist * 5.0) * 0.1;
  vec2 dir = normalize(p - mouseAspect + 0.001);
  p -= dir * bend;

  // Colors (Strictly muted, no white)
  vec3 baseBg = vec3(0.02, 0.02, 0.027);      // #050507
  vec3 graphite = vec3(0.2, 0.18, 0.22);     // Deep graphite
  vec3 violet = vec3(0.18, 0.15, 0.2);       // Deep muted violet
  vec3 mauve = vec3(0.25, 0.2, 0.24);        // Faint deep mauve
  vec3 pulseColor = vec3(0.4, 0.3, 0.38);    // Muted accent

  vec3 finalField = vec3(0.0);

  // --- 1. Primary Structured Field (Ultra-thin vector lines) ---
  // Mid-scale mathematical lines
  float field1 = structuredField(p, 18.0, t);
  finalField += graphite * field1 * 0.06;

  // High-scale infrastructure lines
  float field2 = structuredField(p + 0.5, 32.0, -t * 0.5);
  finalField += violet * field2 * 0.04;

  // --- 2. Deep Structural Topology ---
  float nDeep = snoise(p * 0.4 + t * 0.02);
  float topology = line(nDeep - 0.1, 0.01);
  finalField += mauve * topology * 0.03;

  // --- 3. Subtle Interaction Brightness ---
  // Increase brightness near cursor (Sensing the user)
  float sensing = exp(-mouseDist * 6.0) * 0.08;
  finalField *= (1.0 + sensing);

  // --- Rare Data Packets (Along structured lines) ---
  float packets = field1 * smoothstep(0.99, 1.0, sin(p.y * 10.0 - uTime * 1.5));
  finalField += pulseColor * packets * 0.15;

  // Central power source glow (Seating the ring)
  float ringSeat = exp(-distToCenter * 4.0) * 0.06;
  finalField += violet * ringSeat;

  vec3 col = baseBg + finalField;

  // Final Restraint: Edge fade & Vignette
  float vig = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 1.6);
  col *= vig;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export default function SovereignSubstrate() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(1); // Performance priority
    container.appendChild(renderer.domElement);

    const geo = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) }
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VERTEX_SHADER, fragmentShader: FRAGMENT_SHADER, uniforms });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    let mouseX = 0.5, mouseY = 0.5;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = 1.0 - (e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMouseMove);

    const clock = new THREE.Clock();
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      // Smooth lerp for mouse for "high resistance" feel
      uniforms.uMouse.value.x += (mouseX - uniforms.uMouse.value.x) * 0.02;
      uniforms.uMouse.value.y += (mouseY - uniforms.uMouse.value.y) * 0.02;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" />;
}
