"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { AssistantStatus } from "@/types"

/** GLSL 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT). */
const SNOISE = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uSpeed;
uniform float uFreq;
uniform float uPulse;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
varying float vDisp;
${SNOISE}
void main(){
  float t = uTime * uSpeed;
  // Multiple overlapping octaves at slightly different frequencies so the
  // surface never repeats in an obvious way — viscous fluid in zero gravity.
  float n1 = snoise(position * uFreq + vec3(0.0, t * 0.30, t * 0.10));
  float n2 = snoise(position * (uFreq * 2.15) + vec3(t * 0.21, 0.0, t * 0.17));
  float n3 = snoise(position * (uFreq * 0.55) - vec3(t * 0.09, t * 0.13, 0.0));
  float disp = (n1 * 0.55 + n2 * 0.28 + n3 * 0.5) * uAmp;
  disp += uPulse * 0.08 * n2;
  vec3 p = position + normal * disp;
  vDisp = disp;
  vPos = p;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;
uniform float uColorShift;
uniform float uLight;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
varying float vDisp;
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);

  // Slow internal currents mixing the palette through the volume.
  float flow = sin(uTime * 0.18 + vPos.x * 1.8 + vPos.y * 1.2)
             + cos(uTime * 0.13 - vPos.z * 1.5);
  float g = smoothstep(-1.4, 1.4, vPos.y * 0.9 + flow * 0.35 + uColorShift);
  vec3 base = mix(uColorA, uColorB, g);
  float g2 = smoothstep(-1.0, 1.2, vPos.x + flow * 0.4);
  base = mix(base, uColorC, g2 * 0.5);
  // burgundy pooling toward the rim
  base = mix(base, uColorD, smoothstep(0.45, 1.0, fres) * 0.55);

  // Internal light — soft glow from the core outward.
  float core = smoothstep(1.1, 0.0, length(vPos));
  base += core * uColorA * 0.35 * uLight;

  // Specular highlight from a soft key light.
  vec3 L = normalize(vec3(0.35, 0.85, 0.55));
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 30.0);
  base += spec * uLight * 0.7;

  // Rim brightening + ripple sparkle from displacement.
  base += fres * 0.45;
  base += abs(vDisp) * 0.6 * uLight;

  float alpha = clamp(uOpacity + fres * 0.5 + core * 0.2, 0.0, 1.0);
  gl_FragColor = vec4(base, alpha);
}
`

interface StateUniforms {
  amp: number
  speed: number
  freq: number
  light: number
  opacity: number
  spin: number
}

const STATE_TARGETS: Record<AssistantStatus, StateUniforms> = {
  standby: { amp: 0.14, speed: 0.28, freq: 0.95, light: 0.5, opacity: 0.42, spin: 0.04 },
  listening: { amp: 0.22, speed: 0.55, freq: 1.1, light: 0.72, opacity: 0.46, spin: 0.08 },
  thinking: { amp: 0.3, speed: 0.95, freq: 1.45, light: 0.95, opacity: 0.5, spin: 0.16 },
  speaking: { amp: 0.24, speed: 0.62, freq: 1.15, light: 0.88, opacity: 0.48, spin: 0.07 },
}

// Palette matching the Mycroft design tokens (violet → plum/pink → burgundy).
const PALETTE = {
  light: {
    a: new THREE.Color("#8a74d8"),
    b: new THREE.Color("#c98fb8"),
    c: new THREE.Color("#d16f8e"),
    d: new THREE.Color("#a63552"),
  },
  dark: {
    a: new THREE.Color("#9683e0"),
    b: new THREE.Color("#c58fc0"),
    c: new THREE.Color("#cf6f8f"),
    d: new THREE.Color("#c15068"),
  },
}

export function LiquidOrb({
  status,
  reduced,
  dark,
  pausedRef,
}: {
  status: AssistantStatus
  reduced: boolean
  dark: boolean
  pausedRef: React.RefObject<boolean>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const shellRef = useRef<THREE.ShaderMaterial>(null)
  const coreRef = useRef<THREE.ShaderMaterial>(null)
  const cur = useRef<StateUniforms>({ ...STATE_TARGETS.standby })

  const palette = dark ? PALETTE.dark : PALETTE.light

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: cur.current.amp },
      uSpeed: { value: cur.current.speed },
      uFreq: { value: cur.current.freq },
      uPulse: { value: 0 },
      uColorShift: { value: 0 },
      uLight: { value: cur.current.light },
      uOpacity: { value: cur.current.opacity },
      uColorA: { value: palette.a.clone() },
      uColorB: { value: palette.b.clone() },
      uColorC: { value: palette.c.clone() },
      uColorD: { value: palette.d.clone() },
    }),
    // rebuild uniforms only when palette (theme) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dark],
  )

  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: cur.current.amp * 0.7 },
      uSpeed: { value: cur.current.speed * 1.3 },
      uFreq: { value: cur.current.freq * 1.4 },
      uPulse: { value: 0 },
      uColorShift: { value: 1.2 },
      uLight: { value: 1.0 },
      uOpacity: { value: 0.28 },
      uColorA: { value: palette.b.clone() },
      uColorB: { value: palette.a.clone() },
      uColorC: { value: palette.c.clone() },
      uColorD: { value: palette.d.clone() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dark],
  )

  useFrame((state, delta) => {
    if (pausedRef.current) return
    const d = Math.min(delta, 0.05)
    const target = STATE_TARGETS[status]
    const c = cur.current
    // Critically-damped approach for smooth, organic state transitions.
    const k = reduced ? 1 : 1 - Math.pow(0.001, d)
    c.amp += (target.amp - c.amp) * k
    c.speed += ((reduced ? 0 : target.speed) - c.speed) * k
    c.freq += (target.freq - c.freq) * k
    c.light += (target.light - c.light) * k
    c.opacity += (target.opacity - c.opacity) * k
    c.spin += ((reduced ? 0 : target.spin) - c.spin) * k

    const t = state.clock.elapsedTime
    // Speaking: a gentle rhythmic amplitude, not a flashing pulse.
    const pulse =
      status === "speaking" && !reduced
        ? (Math.sin(t * 5.5) * 0.5 + 0.5) * (Math.sin(t * 1.3) * 0.5 + 0.5)
        : 0
    const shift = Math.sin(t * 0.15) * 0.6

    for (const [mat, mul] of [
      [shellRef.current, 1],
      [coreRef.current, 1.35],
    ] as const) {
      if (!mat) continue
      mat.uniforms.uTime.value = t
      mat.uniforms.uAmp.value = c.amp * (mat === coreRef.current ? 0.7 : 1)
      mat.uniforms.uSpeed.value = c.speed * (mat === coreRef.current ? 1.3 : 1)
      mat.uniforms.uFreq.value = c.freq * (mat === coreRef.current ? 1.4 : 1)
      mat.uniforms.uLight.value = c.light
      mat.uniforms.uPulse.value = pulse * mul
      mat.uniforms.uColorShift.value =
        shift + (mat === coreRef.current ? 1.2 : 0)
    }
    if (shellRef.current) shellRef.current.uniforms.uOpacity.value = c.opacity

    if (groupRef.current) {
      groupRef.current.rotation.y += c.spin * d
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.12
      // extremely slow, organic wobble
      groupRef.current.rotation.z = Math.cos(t * 0.08) * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      {/* Outer translucent shell */}
      <mesh>
        <icosahedronGeometry args={[1.35, 24]} />
        <shaderMaterial
          ref={shellRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
      {/* Inner luminous core (additive) — internal light + layered structure */}
      <mesh scale={0.82}>
        <icosahedronGeometry args={[1.35, 16]} />
        <shaderMaterial
          ref={coreRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
