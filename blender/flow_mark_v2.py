# Headless Blender 5.1 — FLOW mark v2: "letters of light in the dark".
# v1 failed on the user's screen: hot white floor exposed the video rectangle, per-letter tilt read
# drunk, glow smeared everywhere. v2: pure-black world, DARK gloss floor (dim grounding reflections
# only), letters monumental and STILL (breath float 0.018, no rotation), the event is LIGHT — a warm
# key sweeping in front and a bright rim sweeping BEHIND (phase-offset, letters flare as it passes),
# plus emissive gold motes turned to bokeh discs by a 70mm f/2.0 DOF. Every animated value is
# f(2*pi*t) -> seamless 120-frame loop. Frame content is dark-or-gold only, so the page can
# mix-blend-mode:screen the plate and the rectangle disappears entirely.
#   & "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --python blender/flow_mark_v2.py
import bpy, math, random
from mathutils import Vector

OUT = r"C:/Users/acer/AppData/Local/Temp/claude/C--Users-acer-Desktop-m3lm/cd2cd902-5738-4185-a601-cdef6b7529d8/scratchpad/flowseq2/"
import os
os.makedirs(OUT, exist_ok=True)
FRAMES = 120  # 5.0s @ 24fps
TAU = math.pi * 2

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.0, 0.0, 0.0, 1.0)  # pure black

# ---- the letters ------------------------------------------------------------------------------------
bpy.ops.object.text_add()
txt = bpy.context.active_object
txt.data.body = "FLOW"
for fp in [r"C:/Windows/Fonts/georgiab.ttf", r"C:/Windows/Fonts/georgia.ttf"]:
    try:
        txt.data.font = bpy.data.fonts.load(fp); break
    except Exception:
        pass
txt.data.size = 1.6
txt.data.extrude = 0.14
txt.data.bevel_depth = 0.012
txt.data.bevel_resolution = 3
txt.data.align_x = "CENTER"; txt.data.align_y = "CENTER"
bpy.ops.object.convert(target="MESH")
txt.rotation_euler[0] = math.radians(90)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")

def cx(o):
    xs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return sum(v.x for v in xs) / 8
letters = sorted([o for o in bpy.data.objects if o.type == "MESH"], key=cx)
print(f"[flow2] letter parts: {len(letters)}")
zmin = min(min((o.matrix_world @ Vector(c)).z for c in o.bound_box) for o in letters)
for o in letters:
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="MEDIAN")
    o.select_set(False)

# gold with living roughness (noise-varied 0.18..0.32 — brushed character, not plastic-perfect)
gold = bpy.data.materials.new("Gold"); gold.use_nodes = True
nt = gold.node_tree
gb = nt.nodes["Principled BSDF"]
gb.inputs["Base Color"].default_value = (0.74, 0.52, 0.20, 1.0)
gb.inputs["Metallic"].default_value = 1.0
noise = nt.nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 14.0
ramp = nt.nodes.new("ShaderNodeMapRange")
ramp.inputs["From Min"].default_value = 0.0; ramp.inputs["From Max"].default_value = 1.0
ramp.inputs["To Min"].default_value = 0.18; ramp.inputs["To Max"].default_value = 0.32
nt.links.new(noise.outputs["Fac"], ramp.inputs["Value"])
nt.links.new(ramp.outputs["Result"], gb.inputs["Roughness"])
for o in letters:
    o.data.materials.clear(); o.data.materials.append(gold)

# ---- DARK gloss floor (grounding reflections only — never a white blob) ------------------------------
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, zmin - 0.02))
floor = bpy.context.active_object
fm = bpy.data.materials.new("Floor"); fm.use_nodes = True
fb = fm.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.004, 0.004, 0.005, 1.0)
fb.inputs["Metallic"].default_value = 0.9
fb.inputs["Roughness"].default_value = 0.24   # broad, dim, soft — reflections melt into black
floor.data.materials.append(fm)

# ---- gold motes -> DOF bokeh ------------------------------------------------------------------------
rng = random.Random(7)
mote_mat = bpy.data.materials.new("Mote"); mote_mat.use_nodes = True
mnt = mote_mat.node_tree
for n in list(mnt.nodes): mnt.nodes.remove(n)
em = mnt.nodes.new("ShaderNodeEmission")
em.inputs["Color"].default_value = (1.0, 0.62, 0.26, 1.0)
em.inputs["Strength"].default_value = 3.2   # amber embers, not white-hot pinpoints
out = mnt.nodes.new("ShaderNodeOutputMaterial")
mnt.links.new(em.outputs["Emission"], out.inputs["Surface"])
motes = []
for i in range(26):
    r = rng.uniform(0.010, 0.026)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=1)
    m = bpy.context.active_object
    base = Vector((rng.uniform(-3.0, 3.0), rng.uniform(-3.2, 1.6), rng.uniform(zmin + 0.15, zmin + 2.1)))
    m.location = base
    m.data.materials.append(mote_mat)
    motes.append((m, base, rng.uniform(0, 1), rng.uniform(0.05, 0.16), rng.uniform(0.1, 0.3)))

# ---- lights ------------------------------------------------------------------------------------------
def area(name, loc, rot, size, color, energy, size_y=None):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.active_object; L.name = name
    L.data.size = size
    if size_y is not None:
        L.data.shape = "RECTANGLE"; L.data.size_y = size_y
    L.data.color = color; L.data.energy = energy
    L.rotation_euler = rot
    return L

# dim static ambience — letters stay readable between sweeps, never fully gone
area("fill", (0.0, -5.0, 4.5), (math.radians(28), 0, 0), 10.0, (0.62, 0.66, 0.78), 40)
# the sweeping warm KEY (in front, above)
key = area("key", (0.0, -3.0, 2.8), (math.radians(38), 0, 0), 1.4, (1.0, 0.80, 0.48), 1250)
# the sweeping RIM BEHIND the word — a tall narrow strip; letters flare as it passes behind them
rim = area("rim", (0.0, 2.4, 0.9), (math.radians(-78), 0, 0), 0.55, (1.0, 0.93, 0.82), 950, size_y=3.4)

# ---- camera: 70mm f/2.0, gentle push, real side margins (~12%) so the page-side edge fade can
# never touch the letters ------------------------------------------------------------------------------
bpy.ops.object.camera_add(location=(0, -11.4, 0.62))
cam = bpy.context.active_object
cam.data.lens = 70
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = 11.4
cam.data.dof.aperture_fstop = 2.0
cam.rotation_euler = (math.radians(88.0), 0, 0)
scene.camera = cam

AIM = Vector((0.0, 0.3, zmin + 0.55))  # the word

def aim_at(L, target):
    d = (target - L.location).normalized()
    L.rotation_mode = "QUATERNION"
    L.rotation_quaternion = d.to_track_quat("-Z", "Y")
    L.keyframe_insert("rotation_quaternion")

# ---- seamless loop -----------------------------------------------------------------------------------
for f in range(FRAMES + 1):
    t = f / FRAMES
    scene.frame_set(f + 1)
    for i, o in enumerate(letters):
        ph = i / max(1, len(letters))
        o.location.z = 0.018 * math.sin(TAU * (t + ph))   # breath only — the baseline stays monumental
        o.keyframe_insert("location", index=2, frame=f + 1)
    key.location.x = -3.6 * math.sin(TAU * t)
    key.keyframe_insert("location", index=0, frame=f + 1)
    aim_at(key, AIM)   # aimed sweep — the floor pool stays pinned under the WORD, never at frame edge
    rim.location.x = 3.6 * math.sin(TAU * t + math.pi / 2)  # opposite phase — front & back interleave
    rim.keyframe_insert("location", index=0, frame=f + 1)
    aim_at(rim, AIM)
    for m, base, ph, az, ax in motes:
        m.location.z = base.z + az * math.sin(TAU * (t + ph))
        m.location.x = base.x + ax * math.sin(TAU * (t + ph) + 1.7)
        m.keyframe_insert("location", frame=f + 1)
    cam.location.x = 0.14 * math.sin(TAU * t + 0.6)
    cam.location.y = -9.8 + 0.22 * math.sin(TAU * t)       # the push breathes
    cam.location.z = 0.62 + 0.05 * math.sin(TAU * t * 2 + 1.0)
    cam.keyframe_insert("location", frame=f + 1)

# ---- render ------------------------------------------------------------------------------------------
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "CYCLES"):
    try:
        scene.render.engine = eng; break
    except Exception:
        continue
print(f"[flow2] engine: {scene.render.engine}")
if scene.render.engine == "CYCLES":
    scene.cycles.samples = 24; scene.cycles.use_denoising = True; scene.cycles.device = "CPU"
else:
    try: scene.eevee.taa_render_samples = 64
    except Exception: pass
    try: scene.eevee.use_raytracing = True
    except Exception: pass

scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = FRAMES
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
print("[flow2] rendering 120 frames…")
bpy.ops.render.render(animation=True)
print(f"[flow2] frames -> {OUT}")
