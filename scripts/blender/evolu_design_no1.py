# Robô EVOLU Design No-1, modelado por script no Blender (sem interface, sem arquivo externo).
# Referência visual: docs/intelligence/referencias/evolu-design-no-1.jpg
# Uso: python scripts/blender/evolu_design_no1.py public/intelligence/evolu-design-no-1.glb
#   (Python com o pacote gratuito "bpy", ou: blender -b -P scripts/blender/evolu_design_no1.py -- saida.glb)
# O arquivo sai em glTF binário, corpo inteiro, de frente para +Z, com Y para cima, em metros.
# Peças rígidas presas a pivôs com nome fixo. A sala (app/intelligence/avatar3d.tsx) anima esses pivôs:
#   Head, Jaw, Mouth, SocketL/R > EyeL/R e LidL/R, Chest, ShoulderL/R > ElbowL/R > WristL/R.
# Materiais com nome fixo que a sala controla: LedBar, LedRing, MouthGlow.
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

out = sys.argv[-1] if sys.argv[-1].endswith('.glb') else 'evolu-design-no-1.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
TAU = 2 * math.pi

# ---------- materiais ----------
def lin(h):
    def c(v):
        v /= 255
        return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    return tuple(c(int(h[i:i + 2], 16)) for i in (1, 3, 5))

MATS = {}
def mat(name, color, rough, metal=0.0, emit=None, strength=1.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(color), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*lin(emit), 1)
        b.inputs['Emission Strength'].default_value = strength
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = .06
    MATS[name] = m

GREEN = '#5cff3b'
mat('Shell', '#f4f6f3', .16, 0, coat=1)
mat('ShellShade', '#d9ddd8', .22, 0, coat=.6)
mat('Mech', '#5b6264', .34, .85)
mat('Dark', '#15191b', .5, .5)
mat('Cable', '#1f7a16', .4, 0, GREEN, 1.1)
mat('Eye', '#2fbf1f', .3, 0, GREEN, 1.5)
mat('EyeCore', '#eaffe0', .3, 0, '#d9ffc8', 1.4)
mat('MouthGlow', '#0e1210', .6, 0, GREEN, .02)
mat('LedBar', '#7f9c45', .4, 0, '#7f9c45', 1.5)
mat('LedRing', '#7f9c45', .4, 0, '#7f9c45', 1.5)
mat('Ink', '#2a302f', .6, 0)

# ---------- malhas básicas (eixo Z) ----------
def lathe(profile, seg=32, sy=1.0):
    verts, faces, rings = [], [], []
    for r, z in profile:
        if r < 1e-6:
            rings.append([len(verts)]); verts.append((0, 0, z))
        else:
            rings.append(list(range(len(verts), len(verts) + seg)))
            verts += [(r * math.cos(TAU * i / seg), r * sy * math.sin(TAU * i / seg), z) for i in range(seg)]
    for a, b in zip(rings, rings[1:]):
        if len(a) == 1 and len(b) == 1: continue
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1: faces.append((a[0], b[j], b[i]))
            elif len(b) == 1: faces.append((a[i], a[j], b[0]))
            else: faces.append((a[i], a[j], b[j], b[i]))
    me = bpy.data.meshes.new('m'); me.from_pydata(verts, [], faces); me.update()
    return me

def sphere(seg=32, rings=16, lo=-90, hi=90):
    """Esfera de raio 1 (ou fatia entre duas latitudes, em graus)."""
    pts = []
    for k in range(rings + 1):
        a = math.radians(lo + (hi - lo) * k / rings)
        pts.append((max(0.0, math.cos(a)) if abs(abs(math.degrees(a)) - 90) > 1e-6 else 0.0, math.sin(a)))
    return lathe(pts, seg)

def capsule(r1, r2, length, rnd=.8, seg=24):
    c1, c2, n = r1 * rnd, r2 * rnd, 6
    pts = [(r1 * math.sin(math.pi / 2 * k / n), c1 * (1 - math.cos(math.pi / 2 * k / n))) for k in range(n + 1)]
    pts += [(r2 * math.cos(math.pi / 2 * k / n), length - c2 + c2 * math.sin(math.pi / 2 * k / n)) for k in range(n + 1)]
    return lathe(pts, seg)

def torus(R, r, seg=48, rs=10, sy=1.0):
    verts, faces = [], []
    for i in range(seg):
        a = TAU * i / seg
        for j in range(rs):
            b = TAU * j / rs
            verts.append(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a) * sy, r * math.sin(b)))
    for i in range(seg):
        for j in range(rs):
            i2, j2 = (i + 1) % seg, (j + 1) % rs
            faces.append((i * rs + j, i2 * rs + j, i2 * rs + j2, i * rs + j2))
    me = bpy.data.meshes.new('t'); me.from_pydata(verts, [], faces); me.update()
    return me

# ---------- pivôs e peças ----------
M = {None: Matrix.Identity(4)}      # matriz de mundo de cada pivô
PARENT, LOCAL = {}, {}
PIECES = {}                          # (pivô, material) -> [(malha, matriz de mundo)]

def pivot(name, parent, pos, scale=(1, 1, 1)):
    local = Matrix.Translation(M[parent].inverted() @ Vector(pos)) @ Matrix.Diagonal((*scale, 1))
    M[name] = M[parent] @ local; PARENT[name] = parent; LOCAL[name] = local

def put(piv, material, mesh, loc=(0, 0, 0), scale=(1, 1, 1), rot=None):
    m = Matrix.Translation(Vector(loc)) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*scale, 1))
    PIECES.setdefault((piv, material), []).append((mesh, m))

def aim(p1, p2):
    d = Vector(p2) - Vector(p1)
    return Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4(), d.length

def limb(piv, material, p1, p2, r1, r2, rnd=.8, seg=24):
    rot, length = aim(p1, p2)
    put(piv, material, capsule(r1, r2, length, rnd, seg), p1, rot=rot)

def ball(piv, material, pos, r, seg=24):
    s = r if isinstance(r, tuple) else (r, r, r)
    put(piv, material, sphere(seg, max(8, seg // 2)), pos, s)

def ring(piv, material, pos, R, r, sy=1.0, rot=None, seg=48):
    put(piv, material, torus(R, r, seg, 8, sy), pos, rot=rot)

RX90 = Matrix.Rotation(math.pi / 2, 4, 'X')
RY90 = Matrix.Rotation(math.pi / 2, 4, 'Y')

# ---------- tronco ----------
pivot('Root', None, (0, 0, 0))
pivot('Chest', 'Root', (0, 0, 1.2))
SY = .62
CHEST = [(.09, 1.2), (.122, 1.204), (.14, 1.24), (.158, 1.31), (.17, 1.38), (.172, 1.43), (.16, 1.475), (.125, 1.51), (.08, 1.532), (.062, 1.54)]
def chest_r(z):
    for (r1, z1), (r2, z2) in zip(CHEST, CHEST[1:]):
        if z1 <= z <= z2: return r1 + (r2 - r1) * (z - z1) / (z2 - z1)
    return CHEST[-1][0]
def chest_y(x, z):
    r = chest_r(z); return -SY * math.sqrt(max(0, r * r - x * x))
put('Chest', 'Shell', lathe(CHEST, 48, SY))
ring('Chest', 'Cable', (0, 0, 1.212), chest_r(1.212) + .002, .003, SY)
# Barra de estado e marca no peito.
limb('Chest', 'LedBar', (0, chest_y(0, 1.31) - .001, 1.31), (0, chest_y(0, 1.41) - .001, 1.41), .004, .004, 1, 10)
def text_mesh(body, size):
    cu = bpy.data.curves.new('txt', 'FONT'); cu.body = body; cu.size = size; cu.extrude = .0012
    ob = bpy.data.objects.new('txt', cu); scene.collection.objects.link(ob)
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(ob); return me
for body, size, z in (('EVOLU', .026, 1.385), ('DESIGN NO-1', .0095, 1.368)):
    me = text_mesh(body, size); width = max(v.co.x for v in me.vertices)
    # Plano do texto tangente ao peito no meio da palavra, um pouco à frente da superfície.
    x0 = .016; xm = x0 + width / 2; phi = math.atan2(chest_y(xm + .005, z) - chest_y(xm - .005, z), .01)
    mid = Vector((xm, chest_y(xm, z), z)) + Vector((math.sin(phi), -math.cos(phi), 0)) * .0025
    put('Chest', 'Ink', me, tuple(mid - Vector((math.cos(phi), math.sin(phi), 0)) * width / 2), rot=Matrix.Rotation(phi, 4, 'Z') @ RX90)
# Abdômen mecânico com cabos e bacia.
put('Root', 'Dark', lathe([(.07, 1.03), (.092, 1.05), (.085, 1.09), (.095, 1.11), (.086, 1.15), (.097, 1.17), (.09, 1.22), (.07, 1.24)], 32, .72))
for i in range(-3, 4):
    limb('Root', 'Cable', (i * .021, -.066 + abs(i) * .004, 1.04), (i * .024, -.07 + abs(i) * .005, 1.215), .0045, .0045, 1, 8)
for z in (1.075, 1.135, 1.195):
    ring('Root', 'Mech', (0, 0, z), .1, .006, .72)
put('Root', 'Shell', lathe([(0, .845), (.07, .85), (.13, .9), (.165, .975), (.158, 1.02), (.125, 1.05), (.08, 1.055)], 40, .66))
ring('Root', 'Cable', (0, 0, 1.045), .132, .003, .66)

# ---------- pescoço ----------
limb('Root', 'Dark', (0, 0, 1.5), (0, 0, 1.64), .043, .04, .2)
for i in range(12):
    a = TAU * i / 12
    limb('Root', 'Cable', (.047 * math.cos(a), .047 * math.sin(a), 1.52), (.043 * math.cos(a), .043 * math.sin(a), 1.635), .0032, .0032, 1, 6)
for z, R in ((1.555, .05), (1.585, .048), (1.615, .046)):
    ring('Root', 'Mech', (0, 0, z), R, .0045)
ring('Chest', 'Shell', (0, 0, 1.538), .068, .015)

# ---------- cabeça ----------
pivot('Head', 'Root', (0, 0, 1.62))
HEADP = [(0, -1.02), (.2, -1), (.42, -.88), (.6, -.65), (.74, -.35), (.8, 0), (.82, .3), (.72, .65), (.45, .92), (.2, .985), (0, 1)]
def smooth_profile(p, n=6):
    outp = []
    for (r1, z1), (r2, z2) in zip(p, p[1:]):
        for k in range(n): outp.append((r1 + (r2 - r1) * k / n, z1 + (z2 - z1) * k / n))
    outp.append(p[-1]); return outp
HC = (0, 0, 1.737)
put('Head', 'Shell', lathe(smooth_profile(HEADP, 3), 48), HC, (.097, .104, .125))
put('Head', 'Shell', lathe(smooth_profile(HEADP, 3), 48), (0, -.016, 1.722), (.076, .088, .1))
limb('Head', 'ShellShade', (0, -.03, 1.862), (0, .06, 1.845), .002, .002, 1, 8)
for s, side in ((-1, 'L'), (1, 'R')):
    pivot('Socket' + side, 'Head', (s * .03, -.079, 1.746), (1.55, 1, .82))
    pivot('Eye' + side, 'Socket' + side, tuple(M['Socket' + side].translation))
    pivot('Lid' + side, 'Socket' + side, tuple(M['Socket' + side].translation))
    c = M['Socket' + side].translation
    PIECES.setdefault(('Eye' + side, 'Eye'), []).append((sphere(24, 12), M['Eye' + side] @ Matrix.Diagonal((.0105, .0105, .0105, 1))))
    PIECES.setdefault(('Eye' + side, 'EyeCore'), []).append((sphere(16, 8), M['Eye' + side] @ Matrix.Translation((0, -.0098, 0)) @ Matrix.Diagonal((.0042, .0016, .0042, 1))))
    PIECES.setdefault(('Lid' + side, 'Shell'), []).append((sphere(24, 8, 0, 90), M['Lid' + side] @ Matrix.Diagonal((.012, .012, .012, 1))))
    PIECES.setdefault(('Socket' + side, 'Shell'), []).append((sphere(24, 8, -90, 0), M['Socket' + side] @ Matrix.Rotation(.72, 4, 'X') @ Matrix.Diagonal((.0118, .0118, .0118, 1))))
limb('Head', 'Shell', (0, -.088, 1.742), (0, -.095, 1.712), .0055, .008, .9, 16)
limb('Head', 'ShellShade', (-.017, -.0835, 1.69), (.017, -.0835, 1.69), .003, .003, 1, 10)
pivot('Mouth', 'Head', (0, -.081, 1.685))
ball('Mouth', 'MouthGlow', (0, -.081, 1.685), (.019, .005, .0016), 20)
pivot('Jaw', 'Head', (0, -.02, 1.71))
limb('Jaw', 'ShellShade', (-.014, -.082, 1.679), (.014, -.082, 1.679), .003, .003, 1, 10)
ball('Jaw', 'Shell', (0, -.064, 1.655), (.022, .013, .009), 24)

# ---------- braços ----------
for s, side in ((-1, 'L'), (1, 'R')):
    pivot('Shoulder' + side, 'Root', (s * .1830, 0, 1.455))
    ball('Shoulder' + side, 'Mech', (s * .1800, 0, 1.455), .05)
    ring('Shoulder' + side, 'LedRing', (s * .1800, -.049, 1.455), .026, .0035, rot=RX90, seg=32)
    put('Shoulder' + side, 'Dark', lathe([(0, 0), (.02, 0), (.02, .004), (0, .004)], 20), (s * .1800, -.048, 1.455), rot=RX90)
    ball('Shoulder' + side, 'Shell', (s * .2180, .002, 1.468), (.06, .066, .06), 32)
    limb('Shoulder' + side, 'Shell', (s * .2200, 0, 1.415), (s * .2340, 0, 1.165), .05, .04)
    rot, _ = aim((s * .2200, 0, 1.415), (s * .2340, 0, 1.165))
    ring('Shoulder' + side, 'Cable', (s * .2225, 0, 1.375), .0495, .0025, rot=rot, seg=32)
    pivot('Elbow' + side, 'Shoulder' + side, (s * .2360, 0, 1.128))
    ball('Elbow' + side, 'Mech', (s * .2360, 0, 1.128), .036)
    for k in range(6):
        a = TAU * k / 6
        limb('Elbow' + side, 'Cable', (s * .2350 + .03 * math.cos(a), .03 * math.sin(a), 1.165), (s * .2380 + .03 * math.cos(a), .03 * math.sin(a), 1.09), .003, .003, 1, 6)
    limb('Elbow' + side, 'Shell', (s * .2380, 0, 1.1), (s * .2540, -.01, .868), .044, .032)
    pivot('Wrist' + side, 'Elbow' + side, (s * .2560, -.012, .848))
    ball('Wrist' + side, 'Mech', (s * .2560, -.012, .848), .025)
    ball('Wrist' + side, 'Dark', (s * .2580, -.014, .798), (.014, .03, .04))
    ball('Wrist' + side, 'Shell', (s * .2670, -.014, .8), (.008, .026, .034))
    for k, y in enumerate((-.04, -.023, -.006, .011)):
        zt = .695 + abs(k - 1.2) * .008
        limb('Wrist' + side, 'Mech', (s * .2580, y, .768), (s * .2550, y - .004, zt + .03), .0065, .006, 1, 8)
        limb('Wrist' + side, 'Shell', (s * .2555, y - .004, zt + .034), (s * .2530, y - .007, zt), .0072, .0062, 1, 10)
    limb('Wrist' + side, 'Mech', (s * .2550, -.04, .815), (s * .2440, -.058, .775), .007, .0065, 1, 8)
    limb('Wrist' + side, 'Shell', (s * .2435, -.059, .772), (s * .2360, -.066, .745), .0075, .0065, 1, 10)

# ---------- pernas ----------
for s in (-1, 1):
    ball('Root', 'Mech', (s * .09, 0, .93), .058)
    limb('Root', 'Shell', (s * .094, 0, .9), (s * .1, 0, .565), .082, .058)
    ball('Root', 'Mech', (s * .1, 0, .52), .048)
    for k in range(8):
        a = TAU * k / 8
        limb('Root', 'Cable', (s * .1 + .042 * math.cos(a), .042 * math.sin(a), .57), (s * .1 + .04 * math.cos(a), .04 * math.sin(a), .465), .0035, .0035, 1, 6)
    limb('Root', 'Shell', (s * .1, 0, .485), (s * .1, .005, .145), .06, .04)
    ball('Root', 'Mech', (s * .1, .005, .105), .034)
    for k in range(6):
        a = TAU * k / 6
        limb('Root', 'Cable', (s * .1 + .028 * math.cos(a), .005 + .028 * math.sin(a), .15), (s * .1 + .026 * math.cos(a), .005 + .026 * math.sin(a), .07), .0028, .0028, 1, 6)
    ball('Root', 'Shell', (s * .1, -.04, .04), (.047, .11, .04), 32)

# ---------- montagem: um objeto por pivô e material ----------
objs = {}
for name in M:
    if name is None: continue
    o = bpy.data.objects.new(name, None); scene.collection.objects.link(o); objs[name] = o
for name, o in objs.items():
    if PARENT[name]: o.parent = objs[PARENT[name]]
    o.matrix_local = LOCAL[name]
tris = 0
for (piv, material), parts in PIECES.items():
    bm = bmesh.new(); inv = M[piv].inverted()
    for mesh, mw in parts:
        n = len(bm.verts); bm.from_mesh(mesh); bm.verts.ensure_lookup_table()
        bmesh.ops.transform(bm, matrix=inv @ mw, verts=bm.verts[n:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(piv + '_' + material); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.append(MATS[material]); me.update(); tris += sum(len(p.vertices) - 2 for p in me.polygons)
    o = bpy.data.objects.new(piv + '_' + material, me); scene.collection.objects.link(o); o.parent = objs[piv]

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, export_texcoords=False, export_normals=True,
                          export_yup=True, export_animations=False, export_cameras=False, export_lights=False)
print('triangulos', tris, 'arquivo', out)
