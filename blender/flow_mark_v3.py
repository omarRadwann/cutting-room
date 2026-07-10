# Headless Blender 5.1 — FLOW mark v3: v2's black-void letters + THE STUDIO AROUND THEM.
# User: "give some studio feeling — lightings, shadows, equipment". Added, all dim (screen-blend-safe):
# a curved CYCLORAMA far behind that catches the sweeping key — the letters throw TRAVELING SHADOWS
# across it; two softbox panels on stands flanking the word (dim emissive faces + real area light);
# C-stand tripod silhouettes rim-caught at the frame edges; cables coiled on the floor. Floor lifted
# a hair (0.012 / rough 0.30) so pools and shadows actually read against the void.
#   & "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --python blender/flow_mark_v3.py
import bpy, math, random
from mathutils import Vector

OUT = r"C:/Users/acer/AppData/Local/Temp/claude/C--Users-acer-Desktop-m3lm/cd2cd902-5738-4185-a601-cdef6b7529d8/scratchpad/flowseq3/"
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

# ---- DARK gloss floor — lifted a hair so shadows and light pools read against the void ---------------
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, zmin - 0.02))
floor = bpy.context.active_object
fm = bpy.data.materials.new("Floor"); fm.use_nodes = True
fb = fm.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.007, 0.007, 0.009, 1.0)
fb.inputs["Metallic"].default_value = 0.88
fb.inputs["Roughness"].default_value = 0.26
floor.data.materials.append(fm)

# ---- THE STUDIO: cyclorama + softboxes on stands + C-stands + cables (all dim, all in the dark) -------
grey = bpy.data.materials.new("Rig"); grey.use_nodes = True
gp = grey.node_tree.nodes["Principled BSDF"]
gp.inputs["Base Color"].default_value = (0.03, 0.032, 0.038, 1.0)
gp.inputs["Metallic"].default_value = 0.75
gp.inputs["Roughness"].default_value = 0.45

# curved cyclorama far behind — the sweeping key rakes it and the LETTERS THROW TRAVELING SHADOWS on it
bpy.ops.mesh.primitive_plane_add(size=1)
cyc = bpy.context.active_object
cyc.scale = (18.0, 4.8, 1.0)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.subdivide(number_cuts=32); bpy.ops.object.mode_set(mode="OBJECT")
bend = cyc.modifiers.new("bend", "SIMPLE_DEFORM"); bend.deform_method = "BEND"; bend.angle = math.radians(70); bend.deform_axis = "Z"
bpy.ops.object.modifier_apply(modifier="bend")
cyc.rotation_euler = (math.radians(90), 0, 0)
cyc.location = (0, 7.5, zmin + 1.7)
cm = bpy.data.materials.new("Cyc"); cm.use_nodes = True
cb = cm.node_tree.nodes["Principled BSDF"]
cb.inputs["Base Color"].default_value = (0.022, 0.023, 0.027, 1.0)  # near-black: ONLY the sweep's pool reads on it
cb.inputs["Roughness"].default_value = 0.9
cyc.data.materials.append(cm)

def rig_box(sx, sy, sz, x, y, z, rz=0.0, mat=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.active_object
    o.scale = (sx, sy, sz); o.rotation_euler[2] = rz
    o.data.materials.append(mat or grey)
    return o

soft_face = bpy.data.materials.new("SoftFace"); soft_face.use_nodes = True
sfn = soft_face.node_tree
for n in list(sfn.nodes): sfn.nodes.remove(n)
sem = sfn.nodes.new("ShaderNodeEmission")
sem.inputs["Color"].default_value = (0.9, 0.82, 0.68, 1.0)
sem.inputs["Strength"].default_value = 0.2    # a lit panel in the dark — present, never hot
sout = sfn.nodes.new("ShaderNodeOutputMaterial")
sfn.links.new(sem.outputs["Emission"], sout.inputs["Surface"])

def softbox(x, y, rz):
    # stand
    rig_box(0.035, 0.035, 2.35, x, y, zmin + 1.175, rz)
    rig_box(0.5, 0.06, 0.04, x, y, zmin + 0.03, rz + 0.5)
    rig_box(0.5, 0.06, 0.04, x, y, zmin + 0.03, rz - 0.5)
    # head: frame + dim emissive face angled at the word
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, zmin + 2.45))
    head = bpy.context.active_object
    head.scale = (0.95, 0.1, 0.72)
    head.rotation_euler = (math.radians(-18), 0, rz)
    head.data.materials.append(grey)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, zmin + 2.45))
    face = bpy.context.active_object
    face.scale = (0.84, 0.62, 1.0)
    face.rotation_euler = (math.radians(90 - 18), 0, rz)
    d = (Vector((0, 0.3, zmin + 0.8)) - face.location).normalized()
    face.location += d * 0.09
    face.data.materials.append(soft_face)
    # a matching real light so the panel actually contributes
    bpy.ops.object.light_add(type="AREA", location=face.location + d * 0.05)
    L = bpy.context.active_object
    L.data.size = 0.9; L.data.color = (1.0, 0.9, 0.75); L.data.energy = 26
    L.rotation_mode = "QUATERNION"; L.rotation_quaternion = d.to_track_quat("-Z", "Y")

softbox(-2.9, 2.3, math.radians(24))
softbox(2.9, 2.3, math.radians(-24))

def cstand(x, y):
    rig_box(0.028, 0.028, 1.9, x, y, zmin + 0.95)
    for a in (0.0, 2.1, 4.2):
        rig_box(0.4, 0.045, 0.035, x + 0.14 * math.cos(a), y + 0.14 * math.sin(a), zmin + 0.05, a)
    rig_box(0.75, 0.03, 0.03, x, y, zmin + 1.86, math.radians(30))   # boom arm

cstand(-2.75, 0.2)
cstand(2.85, -0.5)

# coiled cables on the floor (torus arcs, barely catching the sweep)
for (cx_, cy_, cr, crot) in [(-1.9, -1.6, 0.34, 0.4), (2.2, -1.2, 0.28, 1.2), (0.6, 1.9, 0.4, 2.3)]:
    bpy.ops.mesh.primitive_torus_add(major_radius=cr, minor_radius=0.018, location=(cx_, cy_, zmin + 0.012))
    tor = bpy.context.active_object
    tor.rotation_euler[2] = crot
    tor.scale[1] = 0.72
    tor.data.materials.append(grey)

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

# dim static ambience — letters stay readable between sweeps, never fully gone (small + low so its
# spill dies before the cyclorama: the cyc must light ONLY when the sweep rakes it)
area("fill", (0.0, -4.6, 3.6), (math.radians(30), 0, 0), 5.0, (0.62, 0.66, 0.78), 20)
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
