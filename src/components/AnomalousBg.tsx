import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = `
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;

  vec3 mod289(vec3 x){return x - floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x - floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1./6.,1./3.);
    const vec4 D = vec4(0.,0.5,1.,2.);
    vec3 i  = floor(v + dot(v,C.yyy));
    vec3 x0 = v - i + dot(i,C.xxx);
    vec3 g = step(x0.yzx,x0.xyz);
    vec3 l = 1. - g;
    vec3 i1 = min(g.xyz,l.zxy);
    vec3 i2 = max(g.xyz,l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    float n_ = 0.142857142857;
    vec3 ns = n_*D.wyz - D.xzx;
    vec4 j = p - 49.*floor(p*ns.z*ns.z);
    vec4 x_ = floor(j*ns.z);
    vec4 y_ = floor(j - 7.*x_);
    vec4 x = x_*ns.x + ns.yyyy;
    vec4 y = y_*ns.x + ns.yyyy;
    vec4 h = 1. - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy,y.xy);
    vec4 b1 = vec4(x.zw,y.zw);
    vec4 s0 = floor(b0)*2.+1.;
    vec4 s1 = floor(b1)*2.+1.;
    vec4 sh = -step(h,vec4(0.));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m = max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m = m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vNormal = normal;
    vPosition = position;
    float d = snoise(position*1.8 + time*0.3)*0.18;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal*d, 1.);
  }
`;

const FRAG = `
  uniform vec3 color;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main(){
    vec3 n = normalize(vNormal);
    vec3 lDir = normalize(vec3(2.,3.,5.) - vPosition);
    float diff = max(dot(n,lDir),0.);
    float fresnel = pow(1. - dot(n,vec3(0.,0.,1.)),2.);
    vec3 col = color*(diff + fresnel*0.4);
    gl_FragColor = vec4(col, 1.);
  }
`;

export function AnomalousBg() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const geo = new THREE.IcosahedronGeometry(1.3, 48);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x333333) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      wireframe: true,
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    let frame = 0;
    const animate = (t: number) => {
      mat.uniforms.time.value = t * 0.0002;
      mesh.rotation.y += 0.0003;
      mesh.rotation.x += 0.0001;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate(0);

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };

    const onMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mesh.rotation.y += x * 0.0003;
      mesh.rotation.x += y * 0.0002;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      el.removeChild(renderer.domElement);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.35 }} />;
}
