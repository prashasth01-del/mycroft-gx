"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { AssistantStatus } from "@/types"

/* Per-state motion targets: [displacement amplitude, flow speed, brightness]. */
const STATE_TARGETS: Record<AssistantStatus, [number, number, number]> = {
  standby: [0.028, 0.1, 0.85],
  listening: [0.06, 0.3, 1.05],
  thinking: [0.09, 0.7, 1.1],
  speaking: [0.078, 0.5, 1.16],
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uSpeed;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPos;
  varying float vDisp;

  // Ashima simplex noise 3D
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

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

  void main() {
    float t = uTime * uSpeed;
    // Layered noise for an organic, liquid surface.
    float n1 = snoise(normal * 1.4 + vec3(t * 0.6));
    float n2 = snoise(normal * 3.1 - vec3(t * 0.4));
    float disp = (n1 * 0.7 + n2 * 0.3) * uAmp;
    vDisp = disp;

    vec3 displaced = position + normal * disp;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -mvPosition.xyz;
    vPos = displaced;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform vec3 uHighlight;
  uniform float uBright;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPos;
  varying float vDisp;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    // Seamless four-hue swirl using cosine lobes around the sphere — no wrap
    // seam. Each color peaks at a quarter turn and blends smoothly with its
    // neighbors, offset by position + displacement for organic movement.
    float theta = atan(vPos.y, vPos.x) + 1.2 * vPos.z + 0.5 * vPos.y + vDisp * 2.6;
    // Broad lobes so several hues coexist; violet (brand) weighted a touch higher.
    float w0 = 1.35 * pow(max(cos(theta), 0.0), 1.05);
    float w1 = pow(max(cos(theta - 1.5708), 0.0), 1.05);
    float w2 = pow(max(cos(theta - 3.1416), 0.0), 1.05);
    float w3 = pow(max(cos(theta - 4.7124), 0.0), 1.05);
    float ws = w0 + w1 + w2 + w3 + 1e-4;
    vec3 col = (uColorA * w0 + uColorB * w1 + uColorC * w2 + uColorD * w3) / ws;

    // Gentle vertical lift — keep it luminous rather than dark at the base.
    float lift = clamp(0.5 + vPos.y * 0.35 - vPos.x * 0.1, 0.0, 1.0);
    col *= mix(0.9, 1.16, lift);

    // Fresnel rim — the glassy edge glow.
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
    col = mix(col, col + uHighlight * 0.9, fres * 0.6);

    // Bright specular core toward the top-left (the signature highlight).
    vec3 L = normalize(vec3(-0.55, 0.7, 0.95));
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 22.0);
    col += uHighlight * spec * 1.1;

    // Broad soft sheen around the highlight for a milky-glass core.
    float sheen = pow(max(dot(N, L), 0.0), 3.0);
    col += uHighlight * sheen * 0.28;

    // Soft diffuse from the same key light.
    float diff = clamp(dot(N, L), 0.0, 1.0);
    col *= mix(0.92, 1.12, diff);

    col *= uBright;

    // Translucent rim reads as glass.
    float alpha = 0.9 + fres * 0.1;
    gl_FragColor = vec4(col, alpha);
  }
`

function toVec3(hex: string) {
  const c = new THREE.Color(hex)
  return new THREE.Vector3(c.r, c.g, c.b)
}

interface LiquidOrbProps {
  status: AssistantStatus
  palette: { violet: string; plum: string; burgundy: string; gold: string; highlight: string }
  detail?: number
  animate?: boolean
}

export function LiquidOrb({ status, palette, detail = 24, animate = true }: LiquidOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  // Smoothed motion values so state changes ease rather than snap.
  const current = useRef<[number, number, number]>([...STATE_TARGETS.standby])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: STATE_TARGETS.standby[0] },
      uSpeed: { value: STATE_TARGETS.standby[1] },
      uBright: { value: STATE_TARGETS.standby[2] },
      uColorA: { value: toVec3(palette.violet) },
      uColorB: { value: toVec3(palette.plum) },
      uColorC: { value: toVec3(palette.burgundy) },
      uColorD: { value: toVec3(palette.gold) },
      uHighlight: { value: toVec3(palette.highlight) },
    }),
    // Palette is stable per theme; recreate uniforms only when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [palette.violet, palette.plum, palette.burgundy, palette.gold, palette.highlight],
  )

  useFrame((state, delta) => {
    const mat = matRef.current
    const mesh = meshRef.current
    if (!mat || !mesh) return

    const dt = Math.min(delta, 0.05)
    const target = STATE_TARGETS[status]
    const cur = current.current
    // Critically-damped-ish easing toward the target.
    const k = 1 - Math.pow(0.001, dt)
    cur[0] += (target[0] - cur[0]) * k
    cur[1] += (target[1] - cur[1]) * k
    cur[2] += (target[2] - cur[2]) * k

    if (animate) {
      mat.uniforms.uTime.value += dt
      mesh.rotation.y += dt * (0.12 + cur[1] * 0.2)
      mesh.rotation.x = Math.sin(mat.uniforms.uTime.value * 0.15) * 0.12
      mesh.position.y = Math.sin(mat.uniforms.uTime.value * 0.5) * 0.04
    }
    mat.uniforms.uAmp.value = cur[0]
    mat.uniforms.uSpeed.value = cur[1]
    mat.uniforms.uBright.value = cur[2]
  })

  return (
    <mesh ref={meshRef} scale={1.35}>
      <icosahedronGeometry args={[1, detail]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}
