# Headless Blender 5.1 — builds the Cutting Room soundstage SHELL and bakes vertex AO (no UVs needed).
#   & "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --python blender/build_stage_shell.py
# Output: public/models/stage-shell.glb — ONE merged mesh, world placement baked in (1 draw call in R3F).
# Axis map (glTF exporter Z-up -> Y-up): three.x = b.x, three.y = b.z, three.z = -b.y
# Recipe per memory: subdivide for vertex density -> BYTE_COLOR point attr -> Cycles CPU 48spp AO bake
# -> Color Attribute node -> Principled Base Color (so the exporter writes COLOR_0).

import bpy, math

OUT = r"C:/Users/acer/Desktop/higgsfield-portfolio/public/models/stage-shell.glb"

# ---- clean scene ----------------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
if scene.world is None:
    scene.world = bpy.data.worlds.new("World")

FLOOR = -1.5     # blender z of the three.js floor (FLOOR_Y ~= -1.415, sink slightly below)
parts = []

def box(name, sx, sy, sz, x, y, z, rz=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.active_object
    o.name = name
    o.scale = (sx, sy, sz)
    o.rotation_euler[2] = rz
    parts.append(o)
    return o

# ---- back baffle wall: an arc of vertical acoustic fins behind the reel (three.z ~ -10.6) ---------
R_FINS = 10.6
FIN_H = 7.2
for i in range(-13, 14):                      # 27 fins, 6 deg apart -> +/-78 deg
    a = math.radians(i * 6)
    x, y = R_FINS * math.sin(a), R_FINS * math.cos(a)
    box(f"fin{i}", 0.17, 0.5, FIN_H, x, y, FLOOR + FIN_H / 2, rz=-a)

# ---- ceiling beam grid at three.y ~ +5 -------------------------------------------------------------
CEIL = 5.0
for j, by in enumerate([-2.5, 0.0, 2.5, 5.0, 7.5, 10.0]):     # beams spanning X (three.z rows)
    box(f"beamx{j}", 19.0, 0.15, 0.3, 0.0, by, CEIL)
for j, bx in enumerate([-9.0, -6.0, -3.0, 0.0, 3.0, 6.0, 9.0]):  # beams spanning Y (three depth)
    box(f"beamy{j}", 0.15, 13.5, 0.3, bx, 3.75, CEIL + 0.18)

# ---- side flats (soundstage walls), slightly angled in --------------------------------------------
FLAT_H = 7.0
box("flatL", 0.14, 13.0, FLAT_H, -10.5, 3.4, FLOOR + FLAT_H / 2, rz=math.radians(-7))
box("flatR", 0.14, 13.0, FLAT_H, 10.5, 3.4, FLOOR + FLAT_H / 2, rz=math.radians(7))

# ---- v2: catwalk handrails on the 3 nearest ceiling beams (three.z rows +2.5 / 0 / -2.5) ----------
for j, by in enumerate([-2.5, 0.0, 2.5]):
    box(f"rail{j}", 19.0, 0.05, 0.05, 0.0, by, CEIL + 0.62)
    for k, bx in enumerate([-9.0, -6.0, -3.0, 0.0, 3.0, 6.0, 9.0]):
        box(f"railpost{j}_{k}", 0.045, 0.045, 0.5, bx, by, CEIL + 0.36)

# ---- v2: cable drops from the ceiling to each overhead lamp (lamps: three z = RADIUS*0.18 -> b.y=-1.35)
for j, bx in enumerate([-4.2, -1.4, 1.4, 4.2]):
    box(f"cable{j}", 0.03, 0.03, CEIL - 3.55, bx, -1.35, (CEIL + 3.55) / 2)

# ---- v2: sandbag clusters at the light-tree bases (trees: three z = -R*0.5-0.14 -> b.y ~= +3.9) ----
for j, bx in enumerate([-3.4, -1.15, 1.15, 3.4]):
    box(f"sbagA{j}", 0.5, 0.34, 0.17, bx + 0.26, 3.9, FLOOR + 0.085)
    box(f"sbagB{j}", 0.46, 0.3, 0.16, bx - 0.2, 4.05, FLOOR + 0.08)
    box(f"sbagC{j}", 0.42, 0.3, 0.15, bx + 0.05, 3.96, FLOOR + 0.24)

# ---- v2: service-door frame on the back baffle wall (glow plane is added in Room.tsx) --------------
box("doorJambL", 0.16, 0.3, 2.7, -0.85, 10.55, FLOOR + 1.35)
box("doorJambR", 0.16, 0.3, 2.7, 0.85, 10.55, FLOOR + 1.35)
box("doorHead", 1.86, 0.3, 0.16, 0.0, 10.55, FLOOR + 2.78)

# ---- apply transforms, join to ONE mesh ------------------------------------------------------------
bpy.ops.object.select_all(action="DESELECT")
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.join()
shell = bpy.context.active_object
shell.name = "StageShell"

# ---- subdivide for smooth vertex-AO gradients ------------------------------------------------------
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.subdivide(number_cuts=6)
bpy.ops.object.mode_set(mode="OBJECT")

mesh = shell.data
tris = sum(len(p.vertices) - 2 for p in mesh.polygons)
print(f"[shell] verts={len(mesh.vertices)} polys={len(mesh.polygons)} tris~={tris}")

# ---- vertex-color attribute + Cycles AO bake -------------------------------------------------------
attr = mesh.color_attributes.new(name="AO", type="BYTE_COLOR", domain="POINT")
mesh.color_attributes.active_color = attr

scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48
bpy.ops.object.select_all(action="DESELECT")
shell.select_set(True)
bpy.context.view_layer.objects.active = shell
print("[shell] baking AO to vertex colors (Cycles CPU, 48spp)…")
bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
print("[shell] bake done")

# ---- material: Color Attribute -> Principled Base Color (so glTF writes COLOR_0) ------------------
mat = bpy.data.materials.new("ShellAO")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes.get("Principled BSDF")
ca = nt.nodes.new("ShaderNodeVertexColor")
ca.layer_name = "AO"
nt.links.new(ca.outputs["Color"], bsdf.inputs["Base Color"])
mesh.materials.clear()
mesh.materials.append(mat)

# ---- export GLB ------------------------------------------------------------------------------------
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB")
print(f"[shell] wrote {OUT}")
