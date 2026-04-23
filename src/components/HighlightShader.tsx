import React, { useEffect, useRef } from 'react';

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define N normalize
#define MN min(R.x,R.y)
#define S smoothstep
#define rot(a) mat2(cos((a)-vec4(0,11,33,0)))
#define hue(a) (.5+.5*sin(3.14*(a)+vec3(1,2,3)))
#define EFFECT(rd,n) pow(clamp(noise(T-reflect(rd,n).xz*4.),.0,1.),5.)

float rnd(vec2 p) {
	p=fract(p*vec2(12.9898,78.233));
	p+=dot(p,p+34.56);
	return fract(p.x*p.y);
}

float noise(vec2 p) {
	vec2 i=floor(p), u=S(i,i+1.,p), k=vec2(1,0);
	float
	a=rnd(i),
	b=rnd(i+k),
	c=rnd(i+k.yx),
	d=rnd(i+k.xx);
	return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float box(vec3 p, vec3 s, float r) {
	p.y-=s.y;
	p=abs(p)-s+r;
	return length(max(p,.0))+min(.0,max(max(p.x,p.y),p.z))-r;
}

float map(vec3 p) {
	const float n=5.;
	vec2 id=round(p.xz/n);
	p.xz-=clamp(round(p.xz/n),-7.,7.)*n;
	p=abs(p)-1.;
	float d=max(max(p.x,p.y),p.z)-.9*cos(2.5*T-length(id));
	return d*.8;
}

vec3 norm(vec3 p) {
	float h=1e-3; vec2 k=vec2(-1,1);
	return N(
		k.xyy*map(p+k.xyy*h)+
		k.yxy*map(p+k.yxy*h)+
		k.yyx*map(p+k.yyx*h)+
		k.xxx*map(p+k.xxx*h)
	);
}

bool march(inout vec3 p, vec3 rd) {
	for (int i; i++<500;) {
		float d=map(p);
		if (abs(d)<1e-3) return true;
		if (d>100.) return false;
		p+=rd*d;
	}
    return false;
}

void cam(inout vec3 p) {
	p.yz*=rot(1.);
	p.xz*=rot(.2);
	p.xy*=rot(-.6);
}

vec3 render(vec2 uv) {
	vec3 col=vec3(0),
	p=vec3(10,-5,-75),
	rd=N(vec3(uv,.7));
	cam(p); cam(rd);
	if (march(p,rd)) {
		vec3 n=norm(p);
		col+=pow(clamp(dot(N(vec3(0,10,0)-rd),n),.0,1.),5.)*.4+pow(clamp(dot(reflect(rd,n),N(vec3(10,10,40)-p)),.0,1.),8.);
		float k=.5*length(round(p.xz/5.));
		col*=hue(k-T*1.5);
		col+=EFFECT(rd,n);
	} else {
		col+=EFFECT(rd,vec3(0,1,0));
	}
	return col;
}

void main() {
	vec2 uv=(FC-.5*R)/MN;
	vec3 col=render(uv);
	for (float x=.0; x<=1.; x++) {
		for (float y=.0; y<=1.; y++)
			col+=render(uv+(vec2(x,y)-.5)/R);
	}
	col/=5.;
    O=vec4(col,1);
}
`;

const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}
`;

class HighlightRenderer {
  canvas: HTMLCanvasElement;
  scale: number;
  gl: WebGL2RenderingContext;
  shaderSource: string;
  
  program: WebGLProgram | null = null;
  vs: WebGLShader | null = null;
  fs: WebGLShader | null = null;
  buffer: WebGLBuffer | null = null;
  cubeMap: WebGLTexture | null = null;

  constructor(canvas: HTMLCanvasElement, scale: number, shaderSource: string) {
    this.canvas = canvas;
    this.scale = scale;
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
    this.shaderSource = shaderSource;
  }

  updateScale(scale: number) {
    this.scale = scale;
    this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
  }

  compile(shader: WebGLShader, source: string) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
  }

  reset() {
    const { gl, program, vs, fs, cubeMap } = this;
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
    if (vs) { gl.detachShader(program, vs); gl.deleteShader(vs); }
    if (fs) { gl.detachShader(program, fs); gl.deleteShader(fs); }
    if (cubeMap) gl.deleteTexture(cubeMap);
    gl.deleteProgram(program);
  }

  createCubeMap() {
    const { gl } = this;
    this.cubeMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap);

    const imgpath = 'https://assets.codepen.io/4386748';
    const faces: [number, string][] = [
        [gl.TEXTURE_CUBE_MAP_POSITIVE_X, '01posx.jpg'],
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, '01negx.jpg'],
        [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, '01posy.jpg'],
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, '01negy.jpg'],
        [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, '01posz.jpg'],
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, '01negz.jpg'],
    ];

    for (let [target, url] of faces) {
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 512;
        const height = 512;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap!);
            gl.texImage2D(target, level, internalFormat, format, type, image);
        };
        image.src = `${imgpath}/${url}?width=512&height=512&format=auto`;
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  }

  setup() {
    const gl = this.gl;
    this.createCubeMap();
    this.vs = gl.createShader(gl.VERTEX_SHADER)!;
    this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    this.compile(this.vs, vertexShaderSource);
    this.compile(this.fs, this.shaderSource);
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);
  }

  init() {
    const { gl, program } = this;
    if (!program) return;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    (program as any).resolution = gl.getUniformLocation(program, "resolution");
    (program as any).time = gl.getUniformLocation(program, "time");
    (program as any).cubeMap = gl.getUniformLocation(program, "cubeMap");
  }

  render(now = 0) {
    const { gl, program, buffer, canvas } = this;
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f((program as any).resolution, canvas.width, canvas.height);
    gl.uniform1f((program as any).time, now * 1e-3);
    gl.uniform1i((program as any).cubeMap, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

export default function HighlightShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    let frm: number;
    
    const renderer = new HighlightRenderer(canvas, dpr, fragmentShaderSource);

    renderer.setup();
    renderer.init();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      renderer.updateScale(dpr);
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 100);

    const loop = (now: number) => {
      renderer.render(now);
      frm = requestAnimationFrame(loop);
    };
    loop(0);

    return () => {
      cancelAnimationFrame(frm);
      window.removeEventListener('resize', resize);
      renderer.reset();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="w-full h-full block rounded-3xl" />
  );
}
