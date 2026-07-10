# Headless Blender 5.1 — the FLOW mark: 3D extruded-and-beveled letters, gold brushed metal on a
# reflecting studio floor, a warm light SWEEPING through the word, per-letter wave float (the wave
# travels F->L->O->W: the word literally flows), 70mm DOF camera drift, fog-glow bloom.
# Rendered as a SEAMLESS 96-frame loop (every animated value is sin/cos of 2*pi*t) -> PNG sequence.
#   & "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --python blender/flow_mark.py
import bpy, math, os
from mathutils import Vector

OUT = r"C:/Users/acer/AppData/Local/Temp/claude/C--Users-acer-Desktop-m3lm/cd2cd902-5738-4185-a601-cdef6b7529d8/scratchpad/flowseq/"
os.makedirs(OUT, exist_ok=True)
FRAMES = 96

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.0025, 0.0028, 0.004, 1.0)

# ---- the letters -----------------------------------------------------------------------------------
bpy.ops.object.text_add()
txt = bpy.context.active_object
txt.data.body = "FLOW"
for fp in [r"C:/Windows/Fonts/georgiab.ttf", r"C:/Windows/Fonts/georgia.ttf"]:
    try:
        txt.data.font = bpy.data.fonts.load(fp); break
    except Exception:
        pass
txt.data.size = 1.6
txt.data.extrude = 0.16
txt.data.bevel_depth = 0.016
txt.data.bevel_resolution = 3
txt.data.align_x = "CENTER"; txt.data.align_y = "CENTER"
bpy.ops.object.convert(target="MESH")
txt.rotation_euler[0] = math.radians(90)  # stand upright, faces -Y (the camera side)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")
letters = sorted([o for o in bpy.data.objects if o.type == "MESH" and "Text" in o.name],
                 key=lambda o: o.location.x if o.location.x != 0 else min(v.co.x for v in o.data.vertices))
# re-sort robustly by bounding-box centre X
def cx(o):
    xs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return sum(v.x for v in xs) / 8
letters = sorted([o for o in bpy.data.objects if o.type == "MESH"], key=cx)
print(f"[flow] letters: {len(letters)}")
for o in letters:
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="MEDIAN")
    o.select_set(False)

gold = bpy.data.materials.new("Gold"); gold.use_nodes = True
gb = gold.node_tree.nodes["Principled BSDF"]
gb.inputs["Base Color"].default_value = (0.78, 0.55, 0.22, 1.0)
gb.inputs["Metallic"].default_value = 1.0
gb.inputs["Roughness"].default_value = 0.27
for o in letters:
    o.data.materials.clear(); o.data.materials.append(gold)

# ---- reflecting studio floor -----------------------------------------------------------------------
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -0.62))
floor = bpy.context.active_object
fm = bpy.data.materials.new("Floor"); fm.use_nodes = True
fb = fm.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.005, 0.0055, 0.008, 1.0)  # near-black mirror — only the letters reflect
fb.inputs["Metallic"].default_value = 0.88
fb.inputs["Roughness"].default_value = 0.09
floor.data.materials.append(fm)

# ---- lights: static cool rim + fill, and the warm KEY that SWEEPS through the word ------------------
def area(name, loc, rot, size, color, energy):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.active_object; L.name = name
    L.data.size = size; L.data.color = color; L.data.energy = energy
    L.rotation_euler = rot
    return L

rim  = area("rim",  (0.0, 3.2, 2.4), (math.radians(-125), 0, 0), 7.0, (0.62, 0.75, 1.0), 900)
fill = area("fill", (0.0, -6.0, 0.6), (math.radians(80), 0, 0), 9.0, (1.0, 0.9, 0.78), 16)
key  = area("key",  (0.0, -2.6, 3.1), (math.radians(35), 0, 0), 1.1, (1.0, 0.78, 0.45), 1400)

# ---- camera: 70mm, DOF, slow sinusoidal drift (loops) ----------------------------------------------
bpy.ops.object.camera_add(location=(0, -9.0, 0.62))
cam = bpy.context.active_object
cam.data.lens = 70
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = 9.0
cam.data.dof.aperture_fstop = 2.4
cam.rotation_euler = (math.radians(87.5), 0, 0)
scene.camera = cam

# ---- seamless-loop animation (every value = f(2*pi*t)) ---------------------------------------------
TAU = math.pi * 2
for f in range(FRAMES + 1):
    t = f / FRAMES
    scene.frame_set(f + 1)
    for i, o in enumerate(letters):
        ph = i / max(1, len(letters))                     # the wave travels through the word
        o.location.z = 0.045 * math.sin(TAU * (t + ph))
        o.rotation_euler[1] = 0.032 * math.sin(TAU * (t + ph) + 1.2)
        o.keyframe_insert("location", index=2, frame=f + 1)
        o.keyframe_insert("rotation_euler", index=1, frame=f + 1)
    key.location.x = -3.6 * math.sin(TAU * t)             # the sweep
    key.keyframe_insert("location", index=0, frame=f + 1)
    cam.location.x = 0.22 * math.sin(TAU * t + 0.6)
    cam.location.z = 0.62 + 0.06 * math.sin(TAU * t * 2 + 1.0)
    cam.keyframe_insert("location", frame=f + 1)

# ---- render: EEVEE + fog-glow glare ----------------------------------------------------------------
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "CYCLES"):
    try:
        scene.render.engine = eng; break
    except Exception:
        continue
print(f"[flow] engine: {scene.render.engine}")
if scene.render.engine == "CYCLES":
    scene.cycles.samples = 24; scene.cycles.use_denoising = True; scene.cycles.device = "CPU"
else:
    try: scene.eevee.taa_render_samples = 48
    except Exception: pass
    try: scene.eevee.use_raytracing = True
    except Exception: pass

# (Blender 5.1 moved the compositor to node-group datablocks — the glow/bloom pass is applied in
#  ffmpeg after the render instead: split -> threshold -> gaussian blur -> screen blend.)

scene.render.resolution_x = 1152
scene.render.resolution_y = 648
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = FRAMES
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
print("[flow] rendering 96 frames…")
bpy.ops.render.render(animation=True)
print(f"[flow] frames -> {OUT}")
