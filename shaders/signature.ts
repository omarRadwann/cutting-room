// Starter "signature" material: fresnel rim + noise displacement that reacts to scroll velocity.
// This is a placeholder signature effect — replace/extend per the concept (blob-mask, dissolve,
// particles, etc. — see references/recipes.md). ShaderMaterial auto-provides position, normal,
// modelMatrix, viewMatrix, projectionMatrix, cameraPosition.

export const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uVelocity;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;

// Compact hash-based 3D value noise (cheap, dependency-free).
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

void main(){
  float n = noise(position * 1.5 + uTime * 0.2);
  vNoise = n;
  float amp = 0.06 + uVelocity * 0.0008;            // scroll velocity warps the surface
  vec3 displaced = position + normal * (n - 0.5) * amp * 2.0;
  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;

void main(){
  float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 3.0); // rim
  vec3 col = mix(uColorB, uColorA, clamp(fres + vNoise * 0.25, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
`;
