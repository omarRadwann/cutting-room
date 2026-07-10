// Shared volumetric-shaft shader: flowing value-noise inside a cone; v=1 at the lamp (apex),
// v=0 at the floor. NaN-safe (everything clamped) so Bloom can never smear a bad pixel.
// Used by the SoundStage shafts AND the featured-film tracking beam.
export const SHAFT_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const SHAFT_FRAG = /* glsl */ `precision highp float;
uniform float uTime; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
void main(){
  float v = vUv.y;
  float flow = uTime * 0.22;
  float n = vnoise(vec2(vUv.x * 4.0, v * 5.0 + flow)) * 0.6 + vnoise(vec2(vUv.x * 9.0, v * 11.0 + flow * 1.7)) * 0.4;
  n = clamp(n, 0.0, 1.0);
  float source = smoothstep(1.0, 0.62, v);   // soften the hot apex at the lamp
  float foot   = smoothstep(0.0, 0.30, v);   // dissolve into the haze at the floor
  float a = n * source * foot * uOpacity;
  vec3 col = uColor * (0.5 + n * 0.9);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}`;
