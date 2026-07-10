import * as THREE from "three";

/**
 * IDEMPOTENT texture prep — runs once per texture object. Re-running sets `needsUpdate=true`, which
 * RE-UPLOADS the (multi-MB) texture to the GPU; doing that on every per-scene swap is a 20–80ms
 * scroll-stutter spike. Mark + skip. (references/production-hardening.md §A)
 *
 * For a cylindrical/curved wrap label the (repeatX sign, offsetX) pair controls mirroring + which panel
 * faces the camera; the correct values are model-specific and two render paths for the SAME model can need
 * OPPOSITE signs — probe at runtime, don't theorize (§D). anisotropy 16 is mandatory or curved sides smear.
 */
export function prepColorTexture(
  t: THREE.Texture,
  opts?: { repeatX?: number; offsetX?: number; flipY?: boolean }
): THREE.Texture {
  const marked = t as THREE.Texture & { __prepped?: boolean };
  if (marked.__prepped) return t;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  if (opts?.flipY !== undefined) t.flipY = opts.flipY;
  if (opts?.repeatX !== undefined) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = opts.repeatX; }
  if (opts?.offsetX !== undefined) t.offset.x = opts.offsetX;
  t.needsUpdate = true;
  marked.__prepped = true;
  return t;
}

/**
 * Swap a material's color map WITHOUT forcing a shader recompile. Only the first null→texture assignment
 * changes the USE_MAP define and needs `needsUpdate`; swapping between two already-uploaded textures just
 * rebinds the sampler. Forcing `needsUpdate` on every swap recompiles the program (~50–100ms) — the main
 * per-transition scroll spike on a material that uses onBeforeCompile. (§A)
 */
export function swapMap(mat: THREE.MeshStandardMaterial, tex: THREE.Texture) {
  const first = !mat.map;
  mat.map = tex;
  if (first) mat.needsUpdate = true;
}
