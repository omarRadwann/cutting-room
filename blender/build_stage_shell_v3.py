# Headless Blender 5.1 — EXPERT PASS: the soundstage shell with real bevels + curved cyclorama,
# lit by a full Cycles rig that mirrors the three.js scene, and TRUE PATH-TRACED GI baked to a
# 2K lightmap on a second UV channel (Smart UV Project). Ships offline-render lighting at 60fps.
#   & "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --python blender/build_stage_shell_v3.py
# Outputs: public/models/stage-shell.glb (TEXCOORD_1 included) + public/models/stage-lightmap.png
# Axis map (glTF Z-up -> Y-up): three.x = b.x, three.y = b.z, three.z = -b.y

import bpy, math
from mathutils import Vector

GLB = r"C:/Users/acer/Desktop/higgsfield-portfolio/public/models/stage-shell.glb"
LM  = r"C:/Users/acer/Desktop/higgsfield-portfolio/public/models/stage-lightmap.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.008, 0.009, 0.013, 1.0)  # near-black ambient floor
bg.inputs[1].default_value = 1.0

FLOOR = -1.5
CEIL = 5.0
parts = []

def box(name, sx, sy, sz, x, y, z, rz=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.active_object
    o.name = name; o.scale = (sx, sy, sz); o.rotation_euler[2] = rz
    parts.append(o); return o

# ---- geometry (v2 set, rebuilt) --------------------------------------------------------------------
for i in range(-13, 14):                                  # baffle-fin arc
    a = math.radians(i * 6)
    box(f"fin{i}", 0.17, 0.5, 7.2, 10.6 * math.sin(a), 10.6 * math.cos(a), FLOOR + 3.6, rz=-a)
for j, by in enumerate([-2.5, 0.0, 2.5, 5.0, 7.5, 10.0]):  # ceiling beams X
    box(f"beamx{j}", 19.0, 0.15, 0.3, 0.0, by, CEIL)
for j, bx in enumerate([-9.0, -6.0, -3.0, 0.0, 3.0, 6.0, 9.0]):  # ceiling beams Y
    box(f"beamy{j}", 0.15, 13.5, 0.3, bx, 3.75, CEIL + 0.18)
box("flatL", 0.14, 13.0, 7.0, -10.5, 3.4, FLOOR + 3.5, rz=math.radians(-7))
box("flatR", 0.14, 13.0, 7.0, 10.5, 3.4, FLOOR + 3.5, rz=math.radians(7))
for j, by in enumerate([-2.5, 0.0, 2.5]):                  # catwalk rails + posts
    box(f"rail{j}", 19.0, 0.05, 0.05, 0.0, by, CEIL + 0.62)
    for k, bx in enumerate([-9.0, -6.0, -3.0, 0.0, 3.0, 6.0, 9.0]):
        box(f"rp{j}_{k}", 0.045, 0.045, 0.5, bx, by, CEIL + 0.36)
for j, bx in enumerate([-4.2, -1.4, 1.4, 4.2]):            # cable drops to the lamps
    box(f"cable{j}", 0.03, 0.03, CEIL - 3.55, bx, -1.35, (CEIL + 3.55) / 2)
for j, bx in enumerate([-3.4, -1.15, 1.15, 3.4]):          # sandbags at the light trees
    box(f"sA{j}", 0.5, 0.34, 0.17, bx + 0.26, 3.9, FLOOR + 0.085)
    box(f"sB{j}", 0.46, 0.3, 0.16, bx - 0.2, 4.05, FLOOR + 0.08)
    box(f"sC{j}", 0.42, 0.3, 0.15, bx + 0.05, 3.96, FLOOR + 0.24)
box("doorJambL", 0.16, 0.3, 2.7, -0.85, 10.55, FLOOR + 1.35)   # service door
box("doorJambR", 0.16, 0.3, 2.7, 0.85, 10.55, FLOOR + 1.35)
box("doorHead", 1.86, 0.3, 0.16, 0.0, 10.55, FLOOR + 2.78)

# ---- curved CYCLORAMA behind the fins (plane + Bend — the soundstage cove) -------------------------
bpy.ops.mesh.primitive_plane_add(size=1)
cyc = bpy.context.active_object
cyc.name = "cyc"
cyc.scale = (24.0, 9.2, 1.0)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.subdivide(number_cuts=40)
bpy.ops.object.mode_set(mode="OBJECT")
bend = cyc.modifiers.new("bend", "SIMPLE_DEFORM")
bend.deform_method = "BEND"; bend.angle = math.radians(150); bend.deform_axis = "Z"
bpy.ops.object.modifier_apply(modifier="bend")
cyc.rotation_euler = (math.radians(90), 0, math.radians(-90))
cyc.location = (0, 11.8, FLOOR + 4.6)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
parts.append(cyc)

# ---- join to ONE mesh + real chamfered edges (Bevel: the #1 CG-vs-real tell) -----------------------
bpy.ops.object.select_all(action="DESELECT")
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.join()
shell = bpy.context.active_object
shell.name = "StageShell"
bev = shell.modifiers.new("bevel", "BEVEL")
bev.width = 0.024; bev.segments = 2; bev.angle_limit = math.radians(42)
bpy.ops.object.modifier_apply(modifier="bevel")

mesh = shell.data
tris = sum(len(p.vertices) - 2 for p in mesh.polygons)
print(f"[v3] geometry: verts={len(mesh.vertices)} tris~={tris}")

# ---- second UV channel for the lightmap (Smart UV Project = clean islands, good texel use) ---------
mesh.uv_layers.new(name="Lightmap")
mesh.uv_layers.active = mesh.uv_layers["Lightmap"]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
bpy.ops.object.mode_set(mode="OBJECT")
print("[v3] lightmap UVs projected")

# ---- material with the bake target image ----------------------------------------------------------
img = bpy.data.images.new("stage_lightmap", 2048, 2048, alpha=False, float_buffer=False)
mat = bpy.data.materials.new("ShellBake"); mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.5, 0.52, 0.58, 1.0)  # neutral albedo for the light bake
bsdf.inputs["Roughness"].default_value = 0.8
tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img
uvn = nt.nodes.new("ShaderNodeUVMap"); uvn.uv_map = "Lightmap"
nt.links.new(uvn.outputs["UV"], tex.inputs["Vector"])
nt.nodes.active = tex  # bake target
mesh.materials.clear(); mesh.materials.append(mat)

# ---- the LIGHT RIG mirroring the three.js scene (positions via the axis map) -----------------------
def area(name, loc, target, size, color, energy):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.active_object; L.name = name
    L.data.size = size; L.data.color = color; L.data.energy = energy
    d = (Vector(target) - Vector(loc)).normalized()
    L.rotation_mode = "QUATERNION"
    L.rotation_quaternion = d.to_track_quat("-Z", "Y")
    return L

for j, bx in enumerate([-4.2, -1.4, 1.4, 4.2]):     # warm overhead lamps (three z≈+1.35 → b.y=-1.35)
    area(f"lampW{j}", (bx, -1.35, 3.3), (bx, -0.6, FLOOR), 1.3, (1.0, 0.855, 0.68), 320)
for j, bx in enumerate([-3.4, -1.15, 1.15, 3.4]):    # cool LED wall (three z≈-3.79 → b.y=+3.79)
    area(f"ledC{j}", (bx, 3.72, 1.3), (bx, -2.0, 0.2), 1.35, (0.82, 0.89, 1.0), 150)
area("key",  (2.5, -13.0, 8.5), (0.0, 3.0, 0.0), 3.4, (1.0, 0.925, 0.8), 1500)   # warm key, front-high
area("rim",  (-5.0, 6.0, 7.0), (0.0, 0.0, 1.0), 2.6, (0.68, 0.8, 1.0), 600)      # cool rim, back-high
area("door", (0.0, 10.3, FLOOR + 1.2), (0.0, 6.0, FLOOR + 1.4), 0.9, (1.0, 0.8, 0.6), 120)  # door spill

# ---- bake TRUE GI (diffuse direct+indirect, no albedo) ---------------------------------------------
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 128
scene.render.bake.margin = 8
bpy.ops.object.select_all(action="DESELECT")
shell.select_set(True); bpy.context.view_layer.objects.active = shell
print("[v3] baking GI lightmap (Cycles CPU 128spp, 2048px)…")
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=8)
img.filepath_raw = LM; img.file_format = "PNG"; img.save()
print(f"[v3] lightmap saved -> {LM}")

# ---- export GLB (lights removed; both UV sets ride along; runtime overrides the material) ----------
for L in [o for o in bpy.data.objects if o.type == "LIGHT"]:
    bpy.data.objects.remove(L, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=GLB, export_format="GLB")
print(f"[v3] wrote {GLB}")
