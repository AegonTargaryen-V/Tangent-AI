=== T-NOB AI // PROCEDURAL BPY REFERENCE REGISTRY ===
Target Engine: Blender 4.x / 5.x Principled BSDF v2
Format: <TEXTURE_NAME> followed by self-contained executable bpy block.

================================================================================
TEXTURE: wood
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Oak / Walnut Wood (Porous, Fibrous & Varnished)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Wood_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1400, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1050, 0)
bsdf.inputs["Coat Weight"].default_value = 0.25
bsdf.inputs["Coat Roughness"].default_value = 0.12
bsdf.inputs["Subsurface Weight"].default_value = 0.04
bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.4, 0.1)
bsdf.inputs["Subsurface Scale"].default_value = 0.01

links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & ORGANIC VECTOR WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1700, 0)

# Low-frequency domain warp for trunk growth irregular rings
macro_warp = nodes.new("ShaderNodeTexNoise")
macro_warp.location = (-1450, 200)
macro_warp.inputs["Scale"].default_value = 1.2
macro_warp.inputs["Detail"].default_value = 4.0
macro_warp.inputs["Roughness"].default_value = 0.5

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1200, 100)
vec_warp.operation = 'ADD'

links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(macro_warp.outputs["Color"], vec_warp.inputs[1])

# Non-uniform scaling to stretch grain lengthwise along Z-axis
mapping = nodes.new("ShaderNodeMapping")
mapping.location = (-950, 100)
mapping.inputs["Scale"].default_value = (3.5, 3.5, 0.18)
links.new(vec_warp.outputs["Vector"], mapping.inputs["Vector"])

# --- 3. DUAL-TIER WOOD RINGS & RAY PATTERN ---
# Macro annual growth rings (Wave bands with high distortion)
wave_rings = nodes.new("ShaderNodeTexWave")
wave_rings.location = (-650, 300)
wave_rings.wave_type = 'RINGS'
wave_rings.wave_profile = 'SIN'
wave_rings.inputs["Scale"].default_value = 2.8
wave_rings.inputs["Distortion"].default_value = 9.5
wave_rings.inputs["Detail"].default_value = 4.0
wave_rings.inputs["Detail Scale"].default_value = 1.8
links.new(mapping.outputs["Vector"], wave_rings.inputs["Vector"])

# Fine cellular longitudinal fibers (stretched noise)
fine_fibers = nodes.new("ShaderNodeTexNoise")
fine_fibers.location = (-650, 0)
fine_fibers.inputs["Scale"].default_value = 65.0
fine_fibers.inputs["Detail"].default_value = 12.0
fine_fibers.inputs["Roughness"].default_value = 0.75
links.new(mapping.outputs["Vector"], fine_fibers.inputs["Vector"])

# Elongated vascular pores (Voronoi distance)
pore_noise = nodes.new("ShaderNodeTexVoronoi")
pore_noise.location = (-650, -300)
pore_noise.feature = 'DISTANCE_TO_EDGE'
pore_noise.inputs["Scale"].default_value = 45.0
links.new(mapping.outputs["Vector"], pore_noise.inputs["Vector"])

# Blend rings and fine fibers
grain_mix = nodes.new("ShaderNodeMix")
grain_mix.location = (-350, 150)
grain_mix.data_type = 'FLOAT'
grain_mix.blend_type = 'OVERLAY'
grain_mix.inputs["Factor"].default_value = 0.45
links.new(wave_rings.outputs["Fac"], grain_mix.inputs["A"])
links.new(fine_fibers.outputs["Fac"], grain_mix.inputs["B"])

# --- 4. COLOR VARIATION (HEARTWOOD, SAPWOOD & FIBER SHADOWS) ---
# Primary multi-stop color ramp for organic depth
ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (-50, 200)
ramp_color.color_ramp.interpolation = 'EASE'

# Position stops: Earlywood, Latewood, Pore crevices
ramp_color.color_ramp.elements[0].position = 0.05
ramp_color.color_ramp.elements[0].color = (0.075, 0.035, 0.015, 1.0) # Dark ring fissure

ramp_color.color_ramp.elements[1].position = 0.45
ramp_color.color_ramp.elements[1].color = (0.24, 0.12, 0.055, 1.0)  # Core dense grain

elem3 = ramp_color.color_ramp.elements.new(0.85)
elem3.color = (0.42, 0.23, 0.11, 1.0)                               # Lighter springwood

links.new(grain_mix.outputs["Result"], ramp_color.inputs["Fac"])

# Secondary micro-grime & vascular tone shifting
mix_pores = nodes.new("ShaderNodeMix")
mix_pores.location = (250, 150)
mix_pores.data_type = 'RGBA'
mix_pores.blend_type = 'MULTIPLY'
mix_pores.inputs["Factor"].default_value = 0.35
mix_pores.inputs["B"].default_value = (0.12, 0.06, 0.03, 1.0)

links.new(ramp_color.outputs["Color"], mix_pores.inputs["A"])
links.new(pore_noise.outputs["Distance"], mix_pores.inputs["Factor"])
links.new(mix_pores.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. SURFACE ROUGHNESS (PORE DRYNESS VS POLISHED CELLULOSE) ---
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (250, -100)
ramp_rough.color_ramp.elements[0].position = 0.2
ramp_rough.color_ramp.elements[0].color = (0.25, 0.25, 0.25, 1.0) # Burnished smooth grain
ramp_rough.color_ramp.elements[1].position = 0.8
ramp_rough.color_ramp.elements[1].color = (0.68, 0.68, 0.68, 1.0) # Open rough pore grooves

links.new(grain_mix.outputs["Result"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. DUAL-TIER BUMP & VASCULAR GROOVES ---
# Primary broad wood ring ridges
bump_rings = nodes.new("ShaderNodeBump")
bump_rings.location = (450, 400)
bump_rings.inputs["Strength"].default_value = 0.18
bump_rings.inputs["Distance"].default_value = 0.02
links.new(grain_mix.outputs["Result"], bump_rings.inputs["Height"])

# Sharp vascular pore micro-grooves chained into primary
bump_pores = nodes.new("ShaderNodeBump")
bump_pores.location = (750, 300)
bump_pores.inputs["Strength"].default_value = 0.25
bump_pores.inputs["Distance"].default_value = 0.004
links.new(pore_noise.outputs["Distance"], bump_pores.inputs["Height"])
links.new(bump_rings.outputs["Normal"], bump_pores.inputs["Normal"])

links.new(bump_pores.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: marble
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Carrara Marble (Deep Mineral Veining & SSS)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Marble_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1400, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1050, 0)
bsdf.inputs["IOR"].default_value = 1.486  # Refractive index of calcite marble
bsdf.inputs["Roughness"].default_value = 0.06
bsdf.inputs["Coat Weight"].default_value = 0.85
bsdf.inputs["Coat Roughness"].default_value = 0.03
bsdf.inputs["Coat IOR"].default_value = 1.52
# Translucent stone scattering (internal light transport)
bsdf.inputs["Subsurface Weight"].default_value = 0.35
bsdf.inputs["Subsurface Radius"].default_value = (0.9, 0.75, 0.65)
bsdf.inputs["Subsurface Scale"].default_value = 0.03


links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. VECTOR COORDINATES & DUAL DOMAIN DISTORTION ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency flow distortion (geological tectonic shifts)
macro_noise = nodes.new("ShaderNodeTexNoise")
macro_noise.location = (-1550, 200)
macro_noise.inputs["Scale"].default_value = 0.8
macro_noise.inputs["Detail"].default_value = 4.0
macro_noise.inputs["Roughness"].default_value = 0.5

vec_warp_macro = nodes.new("ShaderNodeVectorMath")
vec_warp_macro.location = (-1300, 100)
vec_warp_macro.operation = 'ADD'

links.new(coord.outputs["Object"], vec_warp_macro.inputs[0])
links.new(macro_noise.outputs["Color"], vec_warp_macro.inputs[1])

# High-frequency turbulent distortion for hairline fractures
turb_noise = nodes.new("ShaderNodeTexNoise")
turb_noise.location = (-1300, -200)
turb_noise.inputs["Scale"].default_value = 4.5
turb_noise.inputs["Detail"].default_value = 10.0
turb_noise.inputs["Roughness"].default_value = 0.75

vec_warp_fine = nodes.new("ShaderNodeVectorMath")
vec_warp_fine.location = (-1050, 0)
vec_warp_fine.operation = 'ADD'

links.new(vec_warp_macro.outputs["Vector"], vec_warp_fine.inputs[0])
links.new(turb_noise.outputs["Color"], vec_warp_fine.inputs[1])

# --- 3. LAYERED VEINING GENERATORS ---
# Primary Major Vein Structure (Angular Voronoi F2 - F1 math)
voronoi_f1 = nodes.new("ShaderNodeTexVoronoi")
voronoi_f1.location = (-800, 300)
voronoi_f1.feature = 'F1'
voronoi_f1.inputs["Scale"].default_value = 1.4

voronoi_f2 = nodes.new("ShaderNodeTexVoronoi")
voronoi_f2.location = (-800, 50)
voronoi_f2.feature = 'F2'
voronoi_f2.inputs["Scale"].default_value = 1.4

links.new(vec_warp_fine.outputs["Vector"], voronoi_f1.inputs["Vector"])
links.new(vec_warp_fine.outputs["Vector"], voronoi_f2.inputs["Vector"])

# Subtract to isolate cell boundaries into sharp fault lines
crack_math = nodes.new("ShaderNodeMath")
crack_math.location = (-550, 200)
crack_math.operation = 'SUBTRACT'
links.new(voronoi_f2.outputs["Distance"], crack_math.inputs[0])
links.new(voronoi_f1.outputs["Distance"], crack_math.inputs[1])

# Secondary Diffused Smoky Flow (Wave bands through warped domain)
wave_smoke = nodes.new("ShaderNodeTexWave")
wave_smoke.location = (-800, -250)
wave_smoke.wave_type = 'BANDS'
wave_smoke.bands_direction = 'DIAGONAL'
wave_smoke.inputs["Scale"].default_value = 0.6
wave_smoke.inputs["Distortion"].default_value = 6.0
wave_smoke.inputs["Detail"].default_value = 5.0
links.new(vec_warp_fine.outputs["Vector"], wave_smoke.inputs["Vector"])

# Blend major fault lines with softer mineral drift
vein_composite = nodes.new("ShaderNodeMix")
vein_composite.location = (-300, 100)
vein_composite.data_type = 'FLOAT'
vein_composite.blend_type = 'MULTIPLY'
vein_composite.inputs["Factor"].default_value = 0.75
links.new(crack_math.outputs["Value"], vein_composite.inputs["A"])
links.new(wave_smoke.outputs["Fac"], vein_composite.inputs["B"])

# --- 4. COLOR AND MINERAL SPECKLE MAPPING ---
# Base crystalline calcite background speckle
calcite_granules = nodes.new("ShaderNodeTexNoise")
calcite_granules.location = (-300, -200)
calcite_granules.inputs["Scale"].default_value = 120.0
calcite_granules.inputs["Detail"].default_value = 15.0
calcite_granules.inputs["Roughness"].default_value = 0.85
links.new(coord.outputs["Object"], calcite_granules.inputs["Vector"])

# Mineral vein color gradient (Pyrite/slate gray to milky white)
ramp_vein = nodes.new("ShaderNodeValToRGB")
ramp_vein.location = (-50, 150)
ramp_vein.color_ramp.interpolation = 'EASE'

# Core dark mineral line
ramp_vein.color_ramp.elements[0].position = 0.02
ramp_vein.color_ramp.elements[0].color = (0.04, 0.05, 0.055, 1.0)

# Golden/pyrite oxidation border
elem_pyrite = ramp_vein.color_ramp.elements.new(0.08)
elem_pyrite.color = (0.28, 0.24, 0.17, 1.0)

# Translucent soft haze transition
elem_haze = ramp_vein.color_ramp.elements.new(0.25)
elem_haze.color = (0.76, 0.78, 0.79, 1.0)

# Bright crystalline body
ramp_vein.color_ramp.elements[1].position = 0.75
ramp_vein.color_ramp.elements[1].color = (0.94, 0.95, 0.95, 1.0)

links.new(vein_composite.outputs["Result"], ramp_vein.inputs["Fac"])

# Combine vein colors with subtle calcite grain shifts
mix_grain = nodes.new("ShaderNodeMix")
mix_grain.location = (250, 50)
mix_grain.data_type = 'RGBA'
mix_grain.blend_type = 'OVERLAY'
mix_grain.inputs["Factor"].default_value = 0.08
links.new(ramp_vein.outputs["Color"], mix_grain.inputs["A"])
links.new(calcite_granules.outputs["Color"], mix_grain.inputs["B"])

links.new(mix_grain.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS & COAT POLISH CONTRAST ---
# Exposed mineral veins exhibit slightly higher micro-porosity than polished matrix
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (250, -200)
ramp_rough.color_ramp.elements[0].position = 0.05
ramp_rough.color_ramp.elements[0].color = (0.28, 0.28, 0.28, 1.0)  # Dull mineral seam
ramp_rough.color_ramp.elements[1].position = 0.4
ramp_rough.color_ramp.elements[1].color = (0.04, 0.04, 0.04, 1.0)  # Polished marble plane

links.new(vein_composite.outputs["Result"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. DUAL-TIER BUMP STACKING ---
# Micro-surface crystalline undulation
bump_calcite = nodes.new("ShaderNodeBump")
bump_calcite.location = (450, 300)
bump_calcite.inputs["Strength"].default_value = 0.02
bump_calcite.inputs["Distance"].default_value = 0.005
links.new(calcite_granules.outputs["Fac"], bump_calcite.inputs["Height"])

# Subtle vein indentation/recession across geological seam
bump_vein = nodes.new("ShaderNodeBump")
bump_vein.location = (750, 200)
bump_vein.inputs["Strength"].default_value = 0.07
bump_vein.inputs["Distance"].default_value = 0.01
links.new(vein_composite.outputs["Result"], bump_vein.inputs["Height"])
links.new(bump_calcite.outputs["Normal"], bump_vein.inputs["Normal"])

links.new(bump_vein.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: concrete
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Poured Concrete (Pitted, Stained & Aged)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Concrete_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & MACRO WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency distortion for organic aging and moisture spread
macro_warp = nodes.new("ShaderNodeTexNoise")
macro_warp.location = (-1550, 200)
macro_warp.inputs["Scale"].default_value = 1.5
macro_warp.inputs["Detail"].default_value = 5.0
macro_warp.inputs["Roughness"].default_value = 0.6

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'

links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(macro_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. LAYERED CONCRETE GENERATORS (STAINS, GRAIN, PITS) ---
# Layer A: Macro Moisture & Grime Stains
stain_noise = nodes.new("ShaderNodeTexNoise")
stain_noise.location = (-950, 250)
stain_noise.inputs["Scale"].default_value = 3.5
stain_noise.inputs["Detail"].default_value = 12.0
stain_noise.inputs["Roughness"].default_value = 0.7
links.new(vec_warp.outputs["Vector"], stain_noise.inputs["Vector"])

# Layer B: Fine Sand/Cement Aggregate Grain
grain_noise = nodes.new("ShaderNodeTexNoise")
grain_noise.location = (-950, -50)
grain_noise.inputs["Scale"].default_value = 150.0
grain_noise.inputs["Detail"].default_value = 10.0
grain_noise.inputs["Roughness"].default_value = 0.8
links.new(coord.outputs["Object"], grain_noise.inputs["Vector"])

# Layer C: Poured Concrete Air Bubble Pitting
pit_voronoi = nodes.new("ShaderNodeTexVoronoi")
pit_voronoi.location = (-950, -350)
pit_voronoi.inputs["Scale"].default_value = 45.0
pit_voronoi.inputs["Randomness"].default_value = 1.0
links.new(coord.outputs["Object"], pit_voronoi.inputs["Vector"])

# Isolate the pits with a tight color ramp
ramp_pits = nodes.new("ShaderNodeValToRGB")
ramp_pits.location = (-650, -350)
ramp_pits.color_ramp.interpolation = 'B_SPLINE'
ramp_pits.color_ramp.elements[0].position = 0.0
ramp_pits.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
ramp_pits.color_ramp.elements[1].position = 0.15
ramp_pits.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
links.new(pit_voronoi.outputs["Distance"], ramp_pits.inputs["Fac"])

# Combine Stains and Grain
mix_base = nodes.new("ShaderNodeMix")
mix_base.location = (-550, 100)
mix_base.data_type = 'FLOAT'
mix_base.blend_type = 'OVERLAY'
mix_base.inputs["Factor"].default_value = 0.4
links.new(stain_noise.outputs["Fac"], mix_base.inputs["A"])
links.new(grain_noise.outputs["Fac"], mix_base.inputs["B"])

# Subtract Pits to create dark recesses in the color map
mix_pits = nodes.new("ShaderNodeMix")
mix_pits.location = (-250, -50)
mix_pits.data_type = 'FLOAT'
mix_pits.blend_type = 'MULTIPLY'
mix_pits.inputs["Factor"].default_value = 0.85
links.new(mix_base.outputs["Result"], mix_pits.inputs["A"])
links.new(ramp_pits.outputs["Color"], mix_pits.inputs["B"])

# --- 4. COLOR AND TONE MAPPING ---
ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (50, 100)
ramp_color.color_ramp.interpolation = 'EASE'

# Dark moisture stains
ramp_color.color_ramp.elements[0].position = 0.15
ramp_color.color_ramp.elements[0].color = (0.12, 0.12, 0.11, 1.0)
# Mid-tone cement
elem_mid = ramp_color.color_ramp.elements.new(0.45)
elem_mid.color = (0.35, 0.36, 0.34, 1.0)
# Bright dust highlights
ramp_color.color_ramp.elements[1].position = 0.85
ramp_color.color_ramp.elements[1].color = (0.55, 0.54, 0.52, 1.0)

links.new(mix_pits.outputs["Result"], ramp_color.inputs["Fac"])
links.new(ramp_color.outputs["Color"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS MAPPING ---
# Moisture stains should be slightly less rough (darker) than dry cement dust
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (450, -100)
ramp_rough.color_ramp.elements[0].position = 0.2
ramp_rough.color_ramp.elements[0].color = (0.55, 0.55, 0.55, 1.0) # Damp/Stained
ramp_rough.color_ramp.elements[1].position = 0.8
ramp_rough.color_ramp.elements[1].color = (0.85, 0.85, 0.85, 1.0) # Dry/Dusty

links.new(mix_base.outputs["Result"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. TRIPLE-TIER BUMP STACKING ---
# Bump 1: Macro Unevenness (Stains)
bump_macro = nodes.new("ShaderNodeBump")
bump_macro.location = (400, -350)
bump_macro.inputs["Strength"].default_value = 0.2
bump_macro.inputs["Distance"].default_value = 0.1
links.new(stain_noise.outputs["Fac"], bump_macro.inputs["Height"])

# Bump 2: Deep Pits (Inverted Voronoi)
bump_pits = nodes.new("ShaderNodeBump")
bump_pits.location = (700, -250)
bump_pits.inputs["Strength"].default_value = 0.6
bump_pits.inputs["Distance"].default_value = 0.05
bump_pits.invert = True
links.new(ramp_pits.outputs["Color"], bump_pits.inputs["Height"])
links.new(bump_macro.outputs["Normal"], bump_pits.inputs["Normal"])

# Bump 3: Fine Aggregate Grain
bump_grain = nodes.new("ShaderNodeBump")
bump_grain.location = (1000, -150)
bump_grain.inputs["Strength"].default_value = 0.15
bump_grain.inputs["Distance"].default_value = 0.002
links.new(grain_noise.outputs["Fac"], bump_grain.inputs["Height"])
links.new(bump_pits.outputs["Normal"], bump_grain.inputs["Normal"])

# Final Normal Link
links.new(bump_grain.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: brick
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Single Brick (Fired Clay, Porous, Gritty)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_SingleBrick_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
bsdf.inputs["Roughness"].default_value = 0.95  # Raw clay is very matte
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & ORGANIC WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency distortion to break up mathematical perfection
macro_warp = nodes.new("ShaderNodeTexNoise")
macro_warp.location = (-1550, 200)
macro_warp.inputs["Scale"].default_value = 1.2
macro_warp.inputs["Detail"].default_value = 4.0

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'

links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(macro_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. LAYERED CLAY GENERATORS (GRIT, PORES, BURNT SPOTS) ---
# Layer A: Macro Color Variation (Burnt/Fired spots in the kiln)
macro_burn = nodes.new("ShaderNodeTexNoise")
macro_burn.location = (-1000, 350)
macro_burn.inputs["Scale"].default_value = 1.5
macro_burn.inputs["Detail"].default_value = 10.0
macro_burn.inputs["Roughness"].default_value = 0.6
links.new(vec_warp.outputs["Vector"], macro_burn.inputs["Vector"])

# Layer B: Fine Gritty Sand/Clay Aggregate
micro_grit = nodes.new("ShaderNodeTexNoise")
micro_grit.location = (-1000, 100)
micro_grit.inputs["Scale"].default_value = 180.0
micro_grit.inputs["Detail"].default_value = 12.0
micro_grit.inputs["Roughness"].default_value = 0.8
links.new(coord.outputs["Object"], micro_grit.inputs["Vector"])

# Layer C: Deep Porous Craters (Air bubbles during firing)
pores = nodes.new("ShaderNodeTexVoronoi")
pores.location = (-1000, -200)
pores.inputs["Scale"].default_value = 65.0
pores.inputs["Randomness"].default_value = 0.9
links.new(vec_warp.outputs["Vector"], pores.inputs["Vector"])

# Invert and isolate pores to create sharp little cavities
ramp_pores = nodes.new("ShaderNodeValToRGB")
ramp_pores.location = (-700, -200)
ramp_pores.color_ramp.interpolation = 'EASE'
ramp_pores.color_ramp.elements[0].position = 0.0
ramp_pores.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
ramp_pores.color_ramp.elements[1].position = 0.25
ramp_pores.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
links.new(pores.outputs["Distance"], ramp_pores.inputs["Fac"])

# Layer D: White Calcium/Efflorescence Deposits
calcium = nodes.new("ShaderNodeTexNoise")
calcium.location = (-1000, -450)
calcium.inputs["Scale"].default_value = 8.0
calcium.inputs["Detail"].default_value = 15.0
calcium.inputs["Roughness"].default_value = 0.7
links.new(coord.outputs["Object"], calcium.inputs["Vector"])

ramp_calcium = nodes.new("ShaderNodeValToRGB")
ramp_calcium.location = (-700, -450)
ramp_calcium.color_ramp.elements[0].position = 0.55
ramp_calcium.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
ramp_calcium.color_ramp.elements[1].position = 0.85
ramp_calcium.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
links.new(calcium.outputs["Fac"], ramp_calcium.inputs["Fac"])

# --- 4. COLOR COMPOSITING ---
# Base Terracotta Ramp
ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (-650, 350)
ramp_color.color_ramp.interpolation = 'EASE'
ramp_color.color_ramp.elements[0].position = 0.2
ramp_color.color_ramp.elements[0].color = (0.15, 0.04, 0.02, 1.0)  # Dark Burnt Clay
ramp_color.color_ramp.elements[1].position = 0.7
ramp_color.color_ramp.elements[1].color = (0.45, 0.14, 0.05, 1.0)  # Rich Red Orange

links.new(macro_burn.outputs["Fac"], ramp_color.inputs["Fac"])

# Mix in Micro Grit (Lightens the sand flecks)
mix_grit = nodes.new("ShaderNodeMix")
mix_grit.location = (-350, 200)
mix_grit.data_type = 'RGBA'
mix_grit.blend_type = 'OVERLAY'
mix_grit.inputs["Factor"].default_value = 0.35
links.new(ramp_color.outputs["Color"], mix_grit.inputs["A"])
links.new(micro_grit.outputs["Color"], mix_grit.inputs["B"])

# Darken the deep pores
mix_pores = nodes.new("ShaderNodeMix")
mix_pores.location = (-50, 100)
mix_pores.data_type = 'RGBA'
mix_pores.blend_type = 'MULTIPLY'
mix_pores.inputs["Factor"].default_value = 0.9
links.new(mix_grit.outputs["Result"], mix_pores.inputs["A"])
links.new(ramp_pores.outputs["Color"], mix_pores.inputs["B"])

# Add white calcium deposits on top
mix_calcium = nodes.new("ShaderNodeMix")
mix_calcium.location = (250, 0)
mix_calcium.data_type = 'RGBA'
mix_calcium.blend_type = 'SCREEN'
mix_calcium.inputs["Factor"].default_value = 0.45
mix_calcium.inputs["B"].default_value = (0.85, 0.8, 0.75, 1.0)
links.new(mix_pores.outputs["Result"], mix_calcium.inputs["A"])
links.new(ramp_calcium.outputs["Color"], mix_calcium.inputs["Factor"])

links.new(mix_calcium.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS MAPPING ---
# Pores are slightly darker (shadowed/damp), calcium is bone dry
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (450, -100)
ramp_rough.color_ramp.elements[0].position = 0.0
ramp_rough.color_ramp.elements[0].color = (0.7, 0.7, 0.7, 1.0) # Deep pores
ramp_rough.color_ramp.elements[1].position = 1.0
ramp_rough.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0) # Bone dry surface

links.new(ramp_pores.outputs["Color"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. TRIPLE-TIER BUMP STACKING ---
# Bump 1: Macro Unevenness (Clumping during firing/molding)
bump_macro = nodes.new("ShaderNodeBump")
bump_macro.location = (400, -350)
bump_macro.inputs["Strength"].default_value = 0.15
bump_macro.inputs["Distance"].default_value = 0.05
links.new(macro_burn.outputs["Fac"], bump_macro.inputs["Height"])

# Bump 2: Deep Craters and Pores (Inverted Voronoi)
bump_pores = nodes.new("ShaderNodeBump")
bump_pores.location = (700, -250)
bump_pores.inputs["Strength"].default_value = 0.5
bump_pores.inputs["Distance"].default_value = 0.02
bump_pores.invert = True
links.new(ramp_pores.outputs["Color"], bump_pores.inputs["Height"])
links.new(bump_macro.outputs["Normal"], bump_pores.inputs["Normal"])

# Bump 3: Sharp Micro-Grit (Sand/Aggregate)
bump_grit = nodes.new("ShaderNodeBump")
bump_grit.location = (1000, -150)
bump_grit.inputs["Strength"].default_value = 0.25
bump_grit.inputs["Distance"].default_value = 0.003
links.new(micro_grit.outputs["Fac"], bump_grit.inputs["Height"])
links.new(bump_pores.outputs["Normal"], bump_grit.inputs["Normal"])

# Final Normal Link
links.new(bump_grit.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: tiles
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Single Tile (Glazed Ceramic / Porcelain)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_SingleTile_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)

# A ceramic tile gets its deep shine from a clear glaze over a matte clay body.
bsdf.inputs["Coat Weight"].default_value = 1.0
bsdf.inputs["IOR"].default_value = 1.45  # Standard for glass/ceramic glaze
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & MACRO WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Very subtle low-frequency warp to simulate natural kiln distortion
macro_warp = nodes.new("ShaderNodeTexNoise")
macro_warp.location = (-1550, 200)
macro_warp.inputs["Scale"].default_value = 2.0
macro_warp.inputs["Detail"].default_value = 2.0

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'

links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(macro_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. CERAMIC SUBSTRATE GENERATORS (Cloudy Minerals & Micro-speckles) ---
# Layer A: Cloudy mineral variations in the porcelain body
cloud_noise = nodes.new("ShaderNodeTexNoise")
cloud_noise.location = (-1000, 300)
cloud_noise.inputs["Scale"].default_value = 4.5
cloud_noise.inputs["Detail"].default_value = 12.0
cloud_noise.inputs["Roughness"].default_value = 0.6
links.new(vec_warp.outputs["Vector"], cloud_noise.inputs["Vector"])

# Layer B: Tiny baked mineral impurities/speckles
speckle_noise = nodes.new("ShaderNodeTexNoise")
speckle_noise.location = (-1000, 50)
speckle_noise.inputs["Scale"].default_value = 250.0
speckle_noise.inputs["Detail"].default_value = 8.0
links.new(coord.outputs["Object"], speckle_noise.inputs["Vector"])

# Isolate speckles
ramp_speckle = nodes.new("ShaderNodeValToRGB")
ramp_speckle.location = (-700, 50)
ramp_speckle.color_ramp.interpolation = 'EASE'
ramp_speckle.color_ramp.elements[0].position = 0.45
ramp_speckle.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
ramp_speckle.color_ramp.elements[1].position = 0.65
ramp_speckle.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
links.new(speckle_noise.outputs["Fac"], ramp_speckle.inputs["Fac"])

# --- 4. COLOR COMPOSITING ---
# Base Glaze Color (Warm off-white / subtle cream)
ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (-700, 300)
ramp_color.color_ramp.interpolation = 'B_SPLINE'
ramp_color.color_ramp.elements[0].position = 0.2
ramp_color.color_ramp.elements[0].color = (0.75, 0.74, 0.72, 1.0)  # Slightly darker cloudy area
ramp_color.color_ramp.elements[1].position = 0.8
ramp_color.color_ramp.elements[1].color = (0.92, 0.91, 0.89, 1.0)  # Bright porcelain white

links.new(cloud_noise.outputs["Fac"], ramp_color.inputs["Fac"])

# Mix clouds with mineral speckles
mix_color = nodes.new("ShaderNodeMix")
mix_color.location = (-350, 200)
mix_color.data_type = 'RGBA'
mix_color.blend_type = 'MULTIPLY'
mix_color.inputs["Factor"].default_value = 0.15
mix_color.inputs["B"].default_value = (0.4, 0.38, 0.35, 1.0) # Speckle color (faint grey/brown)

links.new(ramp_color.outputs["Color"], mix_color.inputs["A"])
links.new(ramp_speckle.outputs["Color"], mix_color.inputs["Factor"])
links.new(mix_color.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS & GLAZE IMPERFECTIONS (Smudges & Wipes) ---
# Base clay under the glaze is moderately rough
bsdf.inputs["Roughness"].default_value = 0.6 

# The Coat layer handles the glossy glaze. We add dried water spots and smudges here.
smudge_noise = nodes.new("ShaderNodeTexNoise")
smudge_noise.location = (-350, -100)
smudge_noise.inputs["Scale"].default_value = 8.0
smudge_noise.inputs["Detail"].default_value = 8.0
smudge_noise.inputs["Roughness"].default_value = 0.8
links.new(coord.outputs["Object"], smudge_noise.inputs["Vector"])

ramp_coat_rough = nodes.new("ShaderNodeValToRGB")
ramp_coat_rough.location = (-50, -100)
ramp_coat_rough.color_ramp.elements[0].position = 0.3
ramp_coat_rough.color_ramp.elements[0].color = (0.01, 0.01, 0.01, 1.0) # Highly polished/clean areas
ramp_coat_rough.color_ramp.elements[1].position = 0.8
ramp_coat_rough.color_ramp.elements[1].color = (0.08, 0.08, 0.08, 1.0) # Smudged/oily areas

links.new(smudge_noise.outputs["Fac"], ramp_coat_rough.inputs["Fac"])
links.new(ramp_coat_rough.outputs["Color"], bsdf.inputs["Coat Roughness"])

# --- 6. TRIPLE-TIER BUMP STACKING ---
# Bump 1: Macro Waviness (Tiles are rarely perfectly flat due to kiln firing)
bump_waviness = nodes.new("ShaderNodeBump")
bump_waviness.location = (400, -350)
bump_waviness.inputs["Strength"].default_value = 0.08
bump_waviness.inputs["Distance"].default_value = 0.2
links.new(cloud_noise.outputs["Fac"], bump_waviness.inputs["Height"])

# Generator for Micro-scratches (Cleaning abrasions over time)
scratch_mapping = nodes.new("ShaderNodeMapping")
scratch_mapping.location = (-350, -450)
scratch_mapping.inputs["Scale"].default_value = (1.0, 50.0, 1.0) # Stretch the noise into thin lines
links.new(coord.outputs["Object"], scratch_mapping.inputs["Vector"])

scratch_noise = nodes.new("ShaderNodeTexNoise")
scratch_noise.location = (-100, -450)
scratch_noise.inputs["Scale"].default_value = 80.0
scratch_noise.inputs["Detail"].default_value = 15.0
links.new(scratch_mapping.outputs["Vector"], scratch_noise.inputs["Vector"])

# Bump 2: Micro-scratches embedded in the glaze
bump_scratches = nodes.new("ShaderNodeBump")
bump_scratches.location = (700, -250)
bump_scratches.inputs["Strength"].default_value = 0.06
bump_scratches.inputs["Distance"].default_value = 0.002
links.new(scratch_noise.outputs["Fac"], bump_scratches.inputs["Height"])
links.new(bump_waviness.outputs["Normal"], bump_scratches.inputs["Normal"])

# Apply the combined normals to BOTH the Base Normal and the Coat Normal
links.new(bump_scratches.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bump_scratches.outputs["Normal"], bsdf.inputs["Coat Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: plaster
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Plaster (Hand-Troweled Stucco with Grit)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Plaster_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
# Plaster has very slight light scattering
bsdf.inputs["Subsurface Weight"].default_value = 0.1
bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.6)
bsdf.inputs["Subsurface Scale"].default_value = 0.02

links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & SWEEPING VECTOR WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency directional warp to simulate human arm sweeps
sweep_warp = nodes.new("ShaderNodeTexNoise")
sweep_warp.location = (-1550, 200)
sweep_warp.inputs["Scale"].default_value = 1.8
sweep_warp.inputs["Detail"].default_value = 3.0
sweep_warp.inputs["Distortion"].default_value = 1.2

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'

links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(sweep_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. LAYERED PLASTER GENERATORS (TROWEL MARKS & SAND GRIT) ---
# Layer A: Macro Trowel Arcs (Smooth F1 Voronoi gives overlapping organic shapes)
trowel_voronoi = nodes.new("ShaderNodeTexVoronoi")
trowel_voronoi.location = (-1000, 250)
trowel_voronoi.feature = 'SMOOTH_F1'
trowel_voronoi.inputs["Scale"].default_value = 3.5
trowel_voronoi.inputs["Smoothness"].default_value = 0.8
links.new(vec_warp.outputs["Vector"], trowel_voronoi.inputs["Vector"])

# Layer B: Uneven Wall Base Noise
wall_noise = nodes.new("ShaderNodeTexNoise")
wall_noise.location = (-1000, 0)
wall_noise.inputs["Scale"].default_value = 6.0
wall_noise.inputs["Detail"].default_value = 12.0
wall_noise.inputs["Roughness"].default_value = 0.6
links.new(coord.outputs["Object"], wall_noise.inputs["Vector"])

# Mix Trowel Arcs and Wall Unevenness
mix_macro = nodes.new("ShaderNodeMix")
mix_macro.location = (-700, 150)
mix_macro.data_type = 'FLOAT'
mix_macro.blend_type = 'OVERLAY'
mix_macro.inputs["Factor"].default_value = 0.65
links.new(trowel_voronoi.outputs["Distance"], mix_macro.inputs["A"])
links.new(wall_noise.outputs["Fac"], mix_macro.inputs["B"])

# Layer C: Fine Sand / Plaster Aggregate
grit_noise = nodes.new("ShaderNodeTexNoise")
grit_noise.location = (-1000, -300)
grit_noise.inputs["Scale"].default_value = 220.0
grit_noise.inputs["Detail"].default_value = 15.0
grit_noise.inputs["Roughness"].default_value = 0.8
links.new(coord.outputs["Object"], grit_noise.inputs["Vector"])

# --- 4. COLOR COMPOSITING ---
ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (-350, 250)
ramp_color.color_ramp.interpolation = 'EASE'
# Deeper trowel valleys collect more shadow/grime (warm darker beige)
ramp_color.color_ramp.elements[0].position = 0.2
ramp_color.color_ramp.elements[0].color = (0.75, 0.72, 0.68, 1.0)
# Raised polished peaks (brighter off-white)
ramp_color.color_ramp.elements[1].position = 0.75
ramp_color.color_ramp.elements[1].color = (0.91, 0.89, 0.86, 1.0)

links.new(mix_macro.outputs["Result"], ramp_color.inputs["Fac"])

# Darken slightly based on grit to simulate micro-occlusion
mix_color_grit = nodes.new("ShaderNodeMix")
mix_color_grit.location = (-50, 150)
mix_color_grit.data_type = 'RGBA'
mix_color_grit.blend_type = 'MULTIPLY'
mix_color_grit.inputs["Factor"].default_value = 0.25
mix_color_grit.inputs["B"].default_value = (0.6, 0.58, 0.55, 1.0)

links.new(ramp_color.outputs["Color"], mix_color_grit.inputs["A"])
links.new(grit_noise.outputs["Fac"], mix_color_grit.inputs["Factor"])

links.new(mix_color_grit.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS MAPPING (TROWEL BURNISHING) ---
# Trowel peaks are slightly smoother from metal tool pressure; valleys remain rough and porous
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (450, -50)
ramp_rough.color_ramp.elements[0].position = 0.3
ramp_rough.color_ramp.elements[0].color = (0.92, 0.92, 0.92, 1.0) # Valleys (Rough)
ramp_rough.color_ramp.elements[1].position = 0.8
ramp_rough.color_ramp.elements[1].color = (0.65, 0.65, 0.65, 1.0) # Peaks (Smoother)

links.new(mix_macro.outputs["Result"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. DUAL-TIER BUMP STACKING ---
# Bump 1: Macro Trowel Depth
bump_macro = nodes.new("ShaderNodeBump")
bump_macro.location = (650, -250)
bump_macro.inputs["Strength"].default_value = 0.25
bump_macro.inputs["Distance"].default_value = 0.08
links.new(mix_macro.outputs["Result"], bump_macro.inputs["Height"])

# Bump 2: Micro Sand/Grit
bump_grit = nodes.new("ShaderNodeBump")
bump_grit.location = (950, -150)
bump_grit.inputs["Strength"].default_value = 0.12
bump_grit.inputs["Distance"].default_value = 0.003
links.new(grit_noise.outputs["Fac"], bump_grit.inputs["Height"])
links.new(bump_macro.outputs["Normal"], bump_grit.inputs["Normal"])

# Final Normal Link
links.new(bump_grit.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: asphalt
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Asphalt")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.07, 0.07, 0.07, 1.0)
bsdf.inputs["Roughness"].default_value = 0.75

coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-600, 0)

voronoi = nodes.new("ShaderNodeTexVoronoi")
voronoi.location = (-350, 0)
voronoi.inputs["Scale"].default_value = 80.0

bump = nodes.new("ShaderNodeBump")
bump.location = (-100, 0)
bump.inputs["Strength"].default_value = 0.35

links.new(coord.outputs["Object"], voronoi.inputs["Vector"])
links.new(voronoi.outputs["Distance"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: cobblestone
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Single Cobblestone (Eroded Granite/Basalt)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_SingleCobble_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & MACRO WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency distortion to simulate heavy erosion and imperfect breaking
macro_warp = nodes.new("ShaderNodeTexNoise")
macro_warp.location = (-1550, 200)
macro_warp.inputs["Scale"].default_value = 1.1
macro_warp.inputs["Detail"].default_value = 5.0
macro_warp.inputs["Roughness"].default_value = 0.55

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'

links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(macro_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. ROCK SURFACE GENERATORS (FACETS, MINERALS, LICHEN) ---
# Layer A: Chiseled Macro Facets (Simulating tumbled rock impacts)
facets_voronoi = nodes.new("ShaderNodeTexVoronoi")
facets_voronoi.location = (-1000, 350)
facets_voronoi.feature = 'F1'
facets_voronoi.distance = 'EUCLIDEAN'
facets_voronoi.inputs["Scale"].default_value = 2.5
links.new(vec_warp.outputs["Vector"], facets_voronoi.inputs["Vector"])

# Layer B: Fine Mineral Grain (Granite/Basalt speckles)
grain_noise = nodes.new("ShaderNodeTexNoise")
grain_noise.location = (-1000, 50)
grain_noise.inputs["Scale"].default_value = 85.0
grain_noise.inputs["Detail"].default_value = 15.0
grain_noise.inputs["Roughness"].default_value = 0.75
links.new(coord.outputs["Object"], grain_noise.inputs["Vector"])

# Layer C: Deep Fissures and Cracks
cracks_voronoi = nodes.new("ShaderNodeTexVoronoi")
cracks_voronoi.location = (-1000, -250)
cracks_voronoi.feature = 'DISTANCE_TO_EDGE'
cracks_voronoi.inputs["Scale"].default_value = 8.0
links.new(vec_warp.outputs["Vector"], cracks_voronoi.inputs["Vector"])

ramp_cracks = nodes.new("ShaderNodeValToRGB")
ramp_cracks.location = (-700, -250)
ramp_cracks.color_ramp.interpolation = 'EASE'
ramp_cracks.color_ramp.elements[0].position = 0.0
ramp_cracks.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
ramp_cracks.color_ramp.elements[1].position = 0.15
ramp_cracks.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
links.new(cracks_voronoi.outputs["Distance"], ramp_cracks.inputs["Fac"])

# Layer D: Surface Lichen / Organic Grime
lichen_noise = nodes.new("ShaderNodeTexNoise")
lichen_noise.location = (-1000, -500)
lichen_noise.inputs["Scale"].default_value = 4.0
lichen_noise.inputs["Detail"].default_value = 8.0
links.new(coord.outputs["Object"], lichen_noise.inputs["Vector"])

# --- 4. COLOR COMPOSITING ---
# Base stone color (Varying across facets)
ramp_base = nodes.new("ShaderNodeValToRGB")
ramp_base.location = (-650, 350)
ramp_base.color_ramp.interpolation = 'EASE'
ramp_base.color_ramp.elements[0].position = 0.1
ramp_base.color_ramp.elements[0].color = (0.08, 0.08, 0.08, 1.0)  # Dark stone
ramp_base.color_ramp.elements[1].position = 0.85
ramp_base.color_ramp.elements[1].color = (0.22, 0.21, 0.19, 1.0)  # Lighter worn areas
links.new(facets_voronoi.outputs["Color"], ramp_base.inputs["Fac"])

# Mix in the fine mineral grain
mix_grain = nodes.new("ShaderNodeMix")
mix_grain.location = (-350, 200)
mix_grain.data_type = 'RGBA'
mix_blend = mix_grain.blend_type = 'OVERLAY'
mix_grain.inputs["Factor"].default_value = 0.4
links.new(ramp_base.outputs["Color"], mix_grain.inputs["A"])
links.new(grain_noise.outputs["Color"], mix_grain.inputs["B"])

# Darken the deep cracks
mix_cracks = nodes.new("ShaderNodeMix")
mix_cracks.location = (-50, 100)
mix_cracks.data_type = 'RGBA'
mix_cracks.blend_type = 'MULTIPLY'
mix_cracks.inputs["Factor"].default_value = 0.8
links.new(mix_grain.outputs["Result"], mix_cracks.inputs["A"])
links.new(ramp_cracks.outputs["Color"], mix_cracks.inputs["B"])

# Add Lichen/Grime tinting
ramp_lichen = nodes.new("ShaderNodeValToRGB")
ramp_lichen.location = (-50, -150)
ramp_lichen.color_ramp.elements[0].position = 0.45
ramp_lichen.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0) # Transparent mask area
ramp_lichen.color_ramp.elements[1].position = 0.75
ramp_lichen.color_ramp.elements[1].color = (0.15, 0.22, 0.12, 1.0) # Dull organic green/brown
links.new(lichen_noise.outputs["Fac"], ramp_lichen.inputs["Fac"])

mix_lichen = nodes.new("ShaderNodeMix")
mix_lichen.location = (250, 0)
mix_lichen.data_type = 'RGBA'
mix_lichen.blend_type = 'MULTIPLY'
mix_lichen.inputs["Factor"].default_value = 0.95
links.new(mix_cracks.outputs["Result"], mix_lichen.inputs["A"])
links.new(ramp_lichen.outputs["Color"], mix_lichen.inputs["B"])

links.new(mix_lichen.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS & SPECULAR MAPPING ---
# Exposed quartz/minerals are slightly glossy, rest of the stone and lichen is rough
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (450, -100)
ramp_rough.color_ramp.elements[0].position = 0.35
ramp_rough.color_ramp.elements[0].color = (0.85, 0.85, 0.85, 1.0) # Standard rough stone
ramp_rough.color_ramp.elements[1].position = 0.85
ramp_rough.color_ramp.elements[1].color = (0.25, 0.25, 0.25, 1.0) # Shiny mineral flecks

links.new(grain_noise.outputs["Fac"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. TRIPLE-TIER BUMP STACKING ---
# Bump 1: Macro Facets (Major structural erosion)
bump_facets = nodes.new("ShaderNodeBump")
bump_facets.location = (400, -350)
bump_facets.inputs["Strength"].default_value = 0.35
bump_facets.inputs["Distance"].default_value = 0.15
links.new(facets_voronoi.outputs["Distance"], bump_facets.inputs["Height"])

# Bump 2: Deep Cracks
bump_cracks = nodes.new("ShaderNodeBump")
bump_cracks.location = (700, -250)
bump_cracks.inputs["Strength"].default_value = 0.6
bump_cracks.inputs["Distance"].default_value = 0.04
bump_cracks.invert = True
links.new(ramp_cracks.outputs["Color"], bump_cracks.inputs["Height"])
links.new(bump_facets.outputs["Normal"], bump_cracks.inputs["Normal"])

# Bump 3: Micro Mineral Grit
bump_grit = nodes.new("ShaderNodeBump")
bump_grit.location = (1000, -150)
bump_grit.inputs["Strength"].default_value = 0.2
bump_grit.inputs["Distance"].default_value = 0.005
links.new(grain_noise.outputs["Fac"], bump_grit.inputs["Height"])
links.new(bump_cracks.outputs["Normal"], bump_grit.inputs["Normal"])

# Final Normal Link
links.new(bump_grit.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: steel
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Brushed Steel (Milled, Scratched, Smudged)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Steel_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
bsdf.inputs["Metallic"].default_value = 1.0
bsdf.inputs["Anisotropic"].default_value = 0.85
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & MAPPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Stretched mapping for directional milling/brushing
mapping_brush = nodes.new("ShaderNodeMapping")
mapping_brush.location = (-1500, 200)
mapping_brush.inputs["Scale"].default_value = (1.0, 80.0, 1.0)
links.new(coord.outputs["Object"], mapping_brush.inputs["Vector"])

# Rotated mapping for random micro-scratches
mapping_scratch = nodes.new("ShaderNodeMapping")
mapping_scratch.location = (-1500, -200)
mapping_scratch.inputs["Rotation"].default_value = (0.5, 1.2, 0.8)
mapping_scratch.inputs["Scale"].default_value = (1.0, 60.0, 1.0)
links.new(coord.outputs["Object"], mapping_scratch.inputs["Vector"])

# --- 3. LAYERED METAL GENERATORS ---
# Layer A: Brushed Metal Grain
brush_noise = nodes.new("ShaderNodeTexNoise")
brush_noise.location = (-1200, 250)
brush_noise.inputs["Scale"].default_value = 45.0
brush_noise.inputs["Detail"].default_value = 12.0
brush_noise.inputs["Roughness"].default_value = 0.8
links.new(mapping_brush.outputs["Vector"], brush_noise.inputs["Vector"])

# Layer B: Micro-Scratches (Thin Voronoi Edges)
scratch_voronoi = nodes.new("ShaderNodeTexVoronoi")
scratch_voronoi.location = (-1200, -250)
scratch_voronoi.feature = 'DISTANCE_TO_EDGE'
scratch_voronoi.inputs["Scale"].default_value = 12.0
links.new(mapping_scratch.outputs["Vector"], scratch_voronoi.inputs["Vector"])

ramp_scratch = nodes.new("ShaderNodeValToRGB")
ramp_scratch.location = (-900, -250)
ramp_scratch.color_ramp.interpolation = 'EASE'
ramp_scratch.color_ramp.elements[0].position = 0.0
ramp_scratch.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
ramp_scratch.color_ramp.elements[1].position = 0.03
ramp_scratch.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
links.new(scratch_voronoi.outputs["Distance"], ramp_scratch.inputs["Fac"])

# Layer C: Fingerprints & Oil Smudges
smudge_noise = nodes.new("ShaderNodeTexNoise")
smudge_noise.location = (-1200, 0)
smudge_noise.inputs["Scale"].default_value = 4.0
smudge_noise.inputs["Detail"].default_value = 4.0
smudge_noise.inputs["Roughness"].default_value = 0.4
links.new(coord.outputs["Object"], smudge_noise.inputs["Vector"])

# --- 4. COLOR COMPOSITING ---
ramp_base = nodes.new("ShaderNodeValToRGB")
ramp_base.location = (-650, 350)
ramp_base.color_ramp.elements[0].position = 0.2
ramp_base.color_ramp.elements[0].color = (0.45, 0.46, 0.48, 1.0)
ramp_base.color_ramp.elements[1].position = 0.8
ramp_base.color_ramp.elements[1].color = (0.75, 0.76, 0.78, 1.0)
links.new(brush_noise.outputs["Fac"], ramp_base.inputs["Fac"])

# Darken surface slightly where smudges exist
mix_color_smudge = nodes.new("ShaderNodeMix")
mix_color_smudge.location = (-350, 200)
mix_color_smudge.data_type = 'RGBA'
mix_color_smudge.blend_type = 'MULTIPLY'
mix_color_smudge.inputs["Factor"].default_value = 0.15
mix_color_smudge.inputs["B"].default_value = (0.2, 0.2, 0.2, 1.0)
links.new(ramp_base.outputs["Color"], mix_color_smudge.inputs["A"])
links.new(smudge_noise.outputs["Fac"], mix_color_smudge.inputs["Factor"])

links.new(mix_color_smudge.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS MAPPING ---
# Base brushed roughness
ramp_rough_brush = nodes.new("ShaderNodeValToRGB")
ramp_rough_brush.location = (-650, -50)
ramp_rough_brush.color_ramp.elements[0].position = 0.2
ramp_rough_brush.color_ramp.elements[0].color = (0.25, 0.25, 0.25, 1.0)
ramp_rough_brush.color_ramp.elements[1].position = 0.8
ramp_rough_brush.color_ramp.elements[1].color = (0.45, 0.45, 0.45, 1.0)
links.new(brush_noise.outputs["Fac"], ramp_rough_brush.inputs["Fac"])

# Add smudge variations to roughness (oil makes it slicker/glossier or dirtier)
mix_rough_smudge = nodes.new("ShaderNodeMix")
mix_rough_smudge.location = (-350, -100)
mix_rough_smudge.data_type = 'FLOAT'
mix_rough_smudge.blend_type = 'OVERLAY'
mix_rough_smudge.inputs["Factor"].default_value = 0.6
links.new(ramp_rough_brush.outputs["Color"], mix_rough_smudge.inputs["A"])
links.new(smudge_noise.outputs["Fac"], mix_rough_smudge.inputs["B"])

# Add scratches (scratches scatter light, increasing roughness)
mix_rough_scratch = nodes.new("ShaderNodeMix")
mix_rough_scratch.location = (-50, -150)
mix_rough_scratch.data_type = 'FLOAT'
mix_rough_scratch.blend_type = 'ADD'
mix_rough_scratch.inputs["Factor"].default_value = 0.4
links.new(mix_rough_smudge.outputs["Result"], mix_rough_scratch.inputs["A"])
links.new(ramp_scratch.outputs["Color"], mix_rough_scratch.inputs["B"])

links.new(mix_rough_scratch.outputs["Result"], bsdf.inputs["Roughness"])

# --- 6. DUAL-TIER BUMP STACKING ---
# Bump 1: Milled Brushing Grooves
bump_brush = nodes.new("ShaderNodeBump")
bump_brush.location = (650, -300)
bump_brush.inputs["Strength"].default_value = 0.12
bump_brush.inputs["Distance"].default_value = 0.002
links.new(brush_noise.outputs["Fac"], bump_brush.inputs["Height"])

# Bump 2: Micro-Scratches
bump_scratch = nodes.new("ShaderNodeBump")
bump_scratch.location = (950, -200)
bump_scratch.inputs["Strength"].default_value = 0.4
bump_scratch.inputs["Distance"].default_value = 0.005
links.new(ramp_scratch.outputs["Color"], bump_scratch.inputs["Height"])
links.new(bump_brush.outputs["Normal"], bump_scratch.inputs["Normal"])

# Final Normal Link
links.new(bump_scratch.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: rusted iron
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Rusted Iron (Flaking, Pitted, Oxidized)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_RustedIron_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & MACRO WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency distortion to simulate organic moisture spread
macro_warp = nodes.new("ShaderNodeTexNoise")
macro_warp.location = (-1550, 200)
macro_warp.inputs["Scale"].default_value = 1.2
macro_warp.inputs["Detail"].default_value = 5.0

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'
links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(macro_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. THE SPREAD MASK (Defining Rust vs. Exposed Iron) ---
mask_noise = nodes.new("ShaderNodeTexNoise")
mask_noise.location = (-1000, 350)
mask_noise.inputs["Scale"].default_value = 3.5
mask_noise.inputs["Detail"].default_value = 15.0
mask_noise.inputs["Roughness"].default_value = 0.65
links.new(vec_warp.outputs["Vector"], mask_noise.inputs["Vector"])

# High contrast ramp to create sharp flaking edges
ramp_mask = nodes.new("ShaderNodeValToRGB")
ramp_mask.location = (-700, 350)
ramp_mask.color_ramp.interpolation = 'B_SPLINE'
ramp_mask.color_ramp.elements[0].position = 0.45
ramp_mask.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0) # Iron
ramp_mask.color_ramp.elements[1].position = 0.55
ramp_mask.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0) # Rust
links.new(mask_noise.outputs["Fac"], ramp_mask.inputs["Fac"])

# --- 4. SURFACE GENERATORS (Iron Pits & Rust Flakes) ---
# Layer A: Exposed Iron Pitting & Milling Marks
iron_noise = nodes.new("ShaderNodeTexNoise")
iron_noise.location = (-1000, 0)
iron_noise.inputs["Scale"].default_value = 45.0
iron_noise.inputs["Detail"].default_value = 8.0
links.new(coord.outputs["Object"], iron_noise.inputs["Vector"])

# Layer B: Coarse, powdery rust flakes
rust_noise = nodes.new("ShaderNodeTexNoise")
rust_noise.location = (-1000, -250)
rust_noise.inputs["Scale"].default_value = 120.0
rust_noise.inputs["Detail"].default_value = 15.0
rust_noise.inputs["Roughness"].default_value = 0.85
links.new(vec_warp.outputs["Vector"], rust_noise.inputs["Vector"])

# --- 5. COLOR COMPOSITING ---
# Iron Base Color (Dark, greasy metal)
ramp_iron = nodes.new("ShaderNodeValToRGB")
ramp_iron.location = (-650, 50)
ramp_iron.color_ramp.elements[0].position = 0.2
ramp_iron.color_ramp.elements[0].color = (0.05, 0.05, 0.06, 1.0)
ramp_iron.color_ramp.elements[1].position = 0.8
ramp_iron.color_ramp.elements[1].color = (0.15, 0.15, 0.16, 1.0)
links.new(iron_noise.outputs["Fac"], ramp_iron.inputs["Fac"])

# Rust Base Color (Deep reds to bright orange oxidation)
ramp_rust = nodes.new("ShaderNodeValToRGB")
ramp_rust.location = (-650, -250)
ramp_rust.color_ramp.interpolation = 'EASE'
ramp_rust.color_ramp.elements[0].position = 0.15
ramp_rust.color_ramp.elements[0].color = (0.08, 0.02, 0.01, 1.0) # Dark aged rust
elem_mid = ramp_rust.color_ramp.elements.new(0.5)
elem_mid.color = (0.28, 0.08, 0.02, 1.0) # Heavy red oxidation
ramp_rust.color_ramp.elements[1].position = 0.85
ramp_rust.color_ramp.elements[1].color = (0.65, 0.32, 0.08, 1.0) # Fresh bright orange rust
links.new(rust_noise.outputs["Fac"], ramp_rust.inputs["Fac"])

# Mix Iron and Rust using the Spread Mask
mix_color = nodes.new("ShaderNodeMix")
mix_color.location = (-300, 150)
mix_color.data_type = 'RGBA'
mix_color.blend_type = 'MIX'
links.new(ramp_mask.outputs["Color"], mix_color.inputs["Factor"])
links.new(ramp_iron.outputs["Color"], mix_color.inputs["A"])
links.new(ramp_rust.outputs["Color"], mix_color.inputs["B"])
links.new(mix_color.outputs["Result"], bsdf.inputs["Base Color"])

# --- 6. METALLIC & ROUGHNESS MAPPING ---
# Metallic: Iron is 1.0, Rust is 0.0 (Dielectric)
mix_metal = nodes.new("ShaderNodeMix")
mix_metal.location = (250, 50)
mix_metal.data_type = 'FLOAT'
mix_metal.blend_type = 'MIX'
mix_metal.inputs["A"].default_value = 1.0 # Iron
mix_metal.inputs["B"].default_value = 0.0 # Rust
links.new(ramp_mask.outputs["Color"], mix_metal.inputs["Factor"])
links.new(mix_metal.outputs["Result"], bsdf.inputs["Metallic"])

# Roughness: Iron is slightly greasy/polished, Rust is highly porous
mix_rough = nodes.new("ShaderNodeMix")
mix_rough.location = (250, -100)
mix_rough.data_type = 'FLOAT'
mix_rough.blend_type = 'MIX'
mix_rough.inputs["A"].default_value = 0.45 # Iron Roughness
mix_rough.inputs["B"].default_value = 0.95 # Rust Roughness
links.new(ramp_mask.outputs["Color"], mix_rough.inputs["Factor"])

# Add fine roughness variation based on rust noise
mix_rough_detail = nodes.new("ShaderNodeMix")
mix_rough_detail.location = (550, -100)
mix_rough_detail.data_type = 'FLOAT'
mix_rough_detail.blend_type = 'OVERLAY'
mix_rough_detail.inputs["Factor"].default_value = 0.5
links.new(mix_rough.outputs["Result"], mix_rough_detail.inputs["A"])
links.new(rust_noise.outputs["Fac"], mix_rough_detail.inputs["B"])
links.new(mix_rough_detail.outputs["Result"], bsdf.inputs["Roughness"])

# --- 7. TRIPLE-TIER BUMP STACKING ---
# Bump 1: Transition Edge (Rust expands and eats into the iron, creating a raised ridge)
bump_edge = nodes.new("ShaderNodeBump")
bump_edge.location = (400, -350)
bump_edge.inputs["Strength"].default_value = 0.6
bump_edge.inputs["Distance"].default_value = 0.05
links.new(ramp_mask.outputs["Color"], bump_edge.inputs["Height"])

# Bump 2: Powdery Rust Flaking
bump_rust = nodes.new("ShaderNodeBump")
bump_rust.location = (700, -250)
bump_rust.inputs["Strength"].default_value = 0.35
bump_rust.inputs["Distance"].default_value = 0.015
links.new(rust_noise.outputs["Fac"], bump_rust.inputs["Height"])
links.new(bump_edge.outputs["Normal"], bump_rust.inputs["Normal"])

# Bump 3: Pitted Iron Micro-Surface
bump_iron = nodes.new("ShaderNodeBump")
bump_iron.location = (1000, -150)
bump_iron.inputs["Strength"].default_value = 0.15
bump_iron.inputs["Distance"].default_value = 0.005
links.new(iron_noise.outputs["Fac"], bump_iron.inputs["Height"])
links.new(bump_rust.outputs["Normal"], bump_iron.inputs["Normal"])

# Final Normal Link
links.new(bump_iron.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: gold
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Gold (Hammered, Scratched, Antique)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Gold_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
bsdf.inputs["Metallic"].default_value = 1.0
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & MAPPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Rotated mapping for random micro-scratches
mapping_scratch = nodes.new("ShaderNodeMapping")
mapping_scratch.location = (-1500, -200)
mapping_scratch.inputs["Rotation"].default_value = (0.7, 0.4, 1.1)
mapping_scratch.inputs["Scale"].default_value = (1.0, 45.0, 1.0)
links.new(coord.outputs["Object"], mapping_scratch.inputs["Vector"])

# --- 3. LAYERED GOLD GENERATORS ---
# Layer A: Hammered Dents (Smooth F1 Voronoi)
hammered_voronoi = nodes.new("ShaderNodeTexVoronoi")
hammered_voronoi.location = (-1200, 250)
hammered_voronoi.feature = 'SMOOTH_F1'
hammered_voronoi.inputs["Scale"].default_value = 6.0
hammered_voronoi.inputs["Smoothness"].default_value = 1.0
links.new(coord.outputs["Object"], hammered_voronoi.inputs["Vector"])

# Layer B: Micro-Scratches (Thin Voronoi Edges)
scratch_voronoi = nodes.new("ShaderNodeTexVoronoi")
scratch_voronoi.location = (-1200, -250)
scratch_voronoi.feature = 'DISTANCE_TO_EDGE'
scratch_voronoi.inputs["Scale"].default_value = 15.0
links.new(mapping_scratch.outputs["Vector"], scratch_voronoi.inputs["Vector"])

ramp_scratch = nodes.new("ShaderNodeValToRGB")
ramp_scratch.location = (-900, -250)
ramp_scratch.color_ramp.interpolation = 'EASE'
ramp_scratch.color_ramp.elements[0].position = 0.0
ramp_scratch.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
ramp_scratch.color_ramp.elements[1].position = 0.05
ramp_scratch.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
links.new(scratch_voronoi.outputs["Distance"], ramp_scratch.inputs["Fac"])

# Layer C: Surface Smudges & Fingerprints
smudge_noise = nodes.new("ShaderNodeTexNoise")
smudge_noise.location = (-1200, 0)
smudge_noise.inputs["Scale"].default_value = 8.0
smudge_noise.inputs["Detail"].default_value = 5.0
smudge_noise.inputs["Roughness"].default_value = 0.6
links.new(coord.outputs["Object"], smudge_noise.inputs["Vector"])

# --- 4. COLOR COMPOSITING ---
# Base Gold Color Ramp (Bright peaks to darker, warmer crevices)
ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (-650, 350)
ramp_color.color_ramp.elements[0].position = 0.1
ramp_color.color_ramp.elements[0].color = (0.7, 0.45, 0.08, 1.0) # Deep, warm tarnish
ramp_color.color_ramp.elements[1].position = 0.6
ramp_color.color_ramp.elements[1].color = (1.0, 0.76, 0.33, 1.0) # Bright pure gold
links.new(hammered_voronoi.outputs["Distance"], ramp_color.inputs["Fac"])

# Add slight darkening from smudges
mix_color_smudge = nodes.new("ShaderNodeMix")
mix_color_smudge.location = (-350, 200)
mix_color_smudge.data_type = 'RGBA'
mix_color_smudge.blend_type = 'MULTIPLY'
mix_color_smudge.inputs["Factor"].default_value = 0.25
mix_color_smudge.inputs["B"].default_value = (0.5, 0.4, 0.2, 1.0)
links.new(ramp_color.outputs["Color"], mix_color_smudge.inputs["A"])
links.new(smudge_noise.outputs["Fac"], mix_color_smudge.inputs["Factor"])

links.new(mix_color_smudge.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS MAPPING ---
# Hammered crevices are slightly rougher
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (-650, -50)
ramp_rough.color_ramp.elements[0].position = 0.2
ramp_rough.color_ramp.elements[0].color = (0.35, 0.35, 0.35, 1.0) # Crevices
ramp_rough.color_ramp.elements[1].position = 0.7
ramp_rough.color_ramp.elements[1].color = (0.12, 0.12, 0.12, 1.0) # Polished peaks
links.new(hammered_voronoi.outputs["Distance"], ramp_rough.inputs["Fac"])

# Smudges increase roughness (finger oils/dirt)
mix_rough_smudge = nodes.new("ShaderNodeMix")
mix_rough_smudge.location = (-350, -100)
mix_rough_smudge.data_type = 'FLOAT'
mix_rough_smudge.blend_type = 'OVERLAY'
mix_rough_smudge.inputs["Factor"].default_value = 0.5
links.new(ramp_rough.outputs["Color"], mix_rough_smudge.inputs["A"])
links.new(smudge_noise.outputs["Fac"], mix_rough_smudge.inputs["B"])

# Scratches scatter light (highly rough)
mix_rough_scratch = nodes.new("ShaderNodeMix")
mix_rough_scratch.location = (-50, -150)
mix_rough_scratch.data_type = 'FLOAT'
mix_rough_scratch.blend_type = 'ADD'
mix_rough_scratch.inputs["Factor"].default_value = 0.4
links.new(mix_rough_smudge.outputs["Result"], mix_rough_scratch.inputs["A"])
links.new(ramp_scratch.outputs["Color"], mix_rough_scratch.inputs["B"])

links.new(mix_rough_scratch.outputs["Result"], bsdf.inputs["Roughness"])

# --- 6. DUAL-TIER BUMP STACKING ---
# Bump 1: Hammered Dents
bump_hammer = nodes.new("ShaderNodeBump")
bump_hammer.location = (650, -300)
bump_hammer.inputs["Strength"].default_value = 0.3
bump_hammer.inputs["Distance"].default_value = 0.08
bump_hammer.invert = True
links.new(hammered_voronoi.outputs["Distance"], bump_hammer.inputs["Height"])

# Bump 2: Micro-Scratches
bump_scratch = nodes.new("ShaderNodeBump")
bump_scratch.location = (950, -200)
bump_scratch.inputs["Strength"].default_value = 0.3
bump_scratch.inputs["Distance"].default_value = 0.003
links.new(ramp_scratch.outputs["Color"], bump_scratch.inputs["Height"])
links.new(bump_hammer.outputs["Normal"], bump_scratch.inputs["Normal"])

# Final Normal Link
links.new(bump_scratch.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: galvanized_metal
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_GalvanizedMetal")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.75, 0.77, 0.8, 1.0)
bsdf.inputs["Metallic"].default_value = 1.0

coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-600, 0)

voronoi = nodes.new("ShaderNodeTexVoronoi")
voronoi.location = (-350, 0)
voronoi.feature = "F2"
voronoi.inputs["Scale"].default_value = 15.0

links.new(coord.outputs["Object"], voronoi.inputs["Vector"])
links.new(voronoi.outputs["Distance"], bsdf.inputs["Roughness"])
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: glass
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Glass")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
bsdf.inputs["Roughness"].default_value = 0.02
bsdf.inputs["Transmission Weight"].default_value = 1.0
bsdf.inputs["IOR"].default_value = 1.52

links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: plastic
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Plastic")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.8, 0.05, 0.08, 1.0)
bsdf.inputs["Roughness"].default_value = 0.25
bsdf.inputs["Coat Weight"].default_value = 1.0
bsdf.inputs["Coat Roughness"].default_value = 0.05

coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-600, 0)

noise = nodes.new("ShaderNodeTexNoise")
noise.location = (-350, 0)
noise.inputs["Scale"].default_value = 100.0

bump = nodes.new("ShaderNodeBump")
bump.location = (-100, 0)
bump.inputs["Strength"].default_value = 0.02

links.new(coord.outputs["Object"], noise.inputs["Vector"])
links.new(noise.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: rubber
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Rubber")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.04, 0.04, 0.04, 1.0)
bsdf.inputs["Roughness"].default_value = 0.7

coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-600, 0)

noise = nodes.new("ShaderNodeTexNoise")
noise.location = (-350, 0)
noise.inputs["Scale"].default_value = 120.0

bump = nodes.new("ShaderNodeBump")
bump.location = (-100, 0)
bump.inputs["Strength"].default_value = 0.05

links.new(coord.outputs["Object"], noise.inputs["Vector"])
links.new(noise.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: wax
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Wax")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.95, 0.82, 0.6, 1.0)
bsdf.inputs["Roughness"].default_value = 0.25
bsdf.inputs["Subsurface Weight"].default_value = 1.0
bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.5, 0.2)
bsdf.inputs["Subsurface Scale"].default_value = 0.05

links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: rock
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural River Rock (Smooth, Speckled, Water-Worn)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_RiverRock_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & MACRO SHIFTS ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency noise for subtle color shifts (uneven stone base)
macro_noise = nodes.new("ShaderNodeTexNoise")
macro_noise.location = (-1500, 200)
macro_noise.inputs["Scale"].default_value = 1.5
macro_noise.inputs["Detail"].default_value = 4.0
links.new(coord.outputs["Object"], macro_noise.inputs["Vector"])

# --- 3. MICRO-GRAIN GENERATORS (Salt & Pepper Speckles) ---
# Dark mineral flecks (Pepper)
dark_speckles = nodes.new("ShaderNodeTexNoise")
dark_speckles.location = (-1100, 300)
dark_speckles.inputs["Scale"].default_value = 350.0
dark_speckles.inputs["Detail"].default_value = 12.0
links.new(coord.outputs["Object"], dark_speckles.inputs["Vector"])

ramp_dark = nodes.new("ShaderNodeValToRGB")
ramp_dark.location = (-800, 300)
ramp_dark.color_ramp.interpolation = 'EASE'
ramp_dark.color_ramp.elements[0].position = 0.35
ramp_dark.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
ramp_dark.color_ramp.elements[1].position = 0.5
ramp_dark.color_ramp.elements[1].color = (0.05, 0.05, 0.06, 1.0)
links.new(dark_speckles.outputs["Fac"], ramp_dark.inputs["Fac"])

# Light quartz/silica flecks (Salt)
light_speckles = nodes.new("ShaderNodeTexNoise")
light_speckles.location = (-1100, 50)
light_speckles.inputs["Scale"].default_value = 450.0
light_speckles.inputs["Detail"].default_value = 15.0
links.new(coord.outputs["Object"], light_speckles.inputs["Vector"])

ramp_light = nodes.new("ShaderNodeValToRGB")
ramp_light.location = (-800, 50)
ramp_light.color_ramp.interpolation = 'EASE'
ramp_light.color_ramp.elements[0].position = 0.45
ramp_light.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
ramp_light.color_ramp.elements[1].position = 0.6
ramp_light.color_ramp.elements[1].color = (0.85, 0.85, 0.85, 1.0)
links.new(light_speckles.outputs["Fac"], ramp_light.inputs["Fac"])

# --- 4. COLOR COMPOSITING ---
# Base Stone Color (Bluish-grey to warm mid-grey)
ramp_base = nodes.new("ShaderNodeValToRGB")
ramp_base.location = (-800, -200)
ramp_base.color_ramp.interpolation = 'B_SPLINE'
ramp_base.color_ramp.elements[0].position = 0.2
ramp_base.color_ramp.elements[0].color = (0.28, 0.29, 0.32, 1.0) # Cooler grey
ramp_base.color_ramp.elements[1].position = 0.8
ramp_base.color_ramp.elements[1].color = (0.35, 0.34, 0.33, 1.0) # Warmer grey
links.new(macro_noise.outputs["Fac"], ramp_base.inputs["Fac"])

# Mix base with dark speckles
mix_dark = nodes.new("ShaderNodeMix")
mix_dark.location = (-400, 150)
mix_dark.data_type = 'RGBA'
mix_dark.blend_type = 'MULTIPLY'
mix_dark.inputs["Factor"].default_value = 0.8
links.new(ramp_base.outputs["Color"], mix_dark.inputs["A"])
links.new(ramp_dark.outputs["Color"], mix_dark.inputs["B"])

# Mix result with light speckles
mix_light = nodes.new("ShaderNodeMix")
mix_light.location = (-100, 100)
mix_light.data_type = 'RGBA'
mix_light.blend_type = 'ADD'
mix_light.inputs["Factor"].default_value = 0.6
links.new(mix_dark.outputs["Result"], mix_light.inputs["A"])
links.new(ramp_light.outputs["Color"], mix_light.inputs["B"])

links.new(mix_light.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS MAPPING ---
# River stones are relatively smooth from erosion, but not perfectly glossy
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (400, -100)
ramp_rough.color_ramp.elements[0].position = 0.0
ramp_rough.color_ramp.elements[0].color = (0.45, 0.45, 0.45, 1.0) # Slightly polished
ramp_rough.color_ramp.elements[1].position = 1.0
ramp_rough.color_ramp.elements[1].color = (0.65, 0.65, 0.65, 1.0) # Matte grain

# Use macro noise combined with some grain to drive roughness
mix_rough = nodes.new("ShaderNodeMix")
mix_rough.location = (150, -100)
mix_rough.data_type = 'FLOAT'
mix_rough.blend_type = 'MIX'
mix_rough.inputs["Factor"].default_value = 0.2
links.new(macro_noise.outputs["Fac"], mix_rough.inputs["A"])
links.new(dark_speckles.outputs["Fac"], mix_rough.inputs["B"])

links.new(mix_rough.outputs["Result"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. MICRO-BUMP MAPPING ---
# Smooth river rocks lack macro-crags; they only have a very subtle surface grit
bump_grain = nodes.new("ShaderNodeBump")
bump_grain.location = (900, -250)
bump_grain.inputs["Strength"].default_value = 0.12  # Very low strength for smoothness
bump_grain.inputs["Distance"].default_value = 0.002

# Combine dark and light speckles for bump mapping
math_bump = nodes.new("ShaderNodeMath")
math_bump.location = (600, -250)
math_bump.operation = 'ADD'
links.new(dark_speckles.outputs["Fac"], math_bump.inputs[0])
links.new(light_speckles.outputs["Fac"], math_bump.inputs[1])

links.new(math_bump.outputs["Value"], bump_grain.inputs["Height"])
links.new(bump_grain.outputs["Normal"], bsdf.inputs["Normal"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)
================================================================================
TEXTURE: mud
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Mud (Wet Puddles, Clumps & Soil Grit)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Mud_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1800, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1450, 0)
# We will drive Coat Weight dynamically for the water puddles
bsdf.inputs["Coat Roughness"].default_value = 0.01 
bsdf.inputs["Coat IOR"].default_value = 1.33 # IOR of water (if socket exists)
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & ORGANIC WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency distortion for organic, uneven terrain flow
warp_noise = nodes.new("ShaderNodeTexNoise")
warp_noise.location = (-1500, 200)
warp_noise.inputs["Scale"].default_value = 1.5
warp_noise.inputs["Detail"].default_value = 4.0

warp_mix = nodes.new("ShaderNodeMix")
warp_mix.location = (-1200, 100)
warp_mix.data_type = 'VECTOR'
warp_mix.inputs["Factor"].default_value = 0.25 # Substantial distortion
links.new(coord.outputs["Object"], warp_mix.inputs["A"])
links.new(warp_noise.outputs["Color"], warp_mix.inputs["B"])

# --- 3. TERRAIN GENERATORS (Macro Hills vs. Puddles) ---
# Macro Structure (The rolling clumps of mud)
macro_mud = nodes.new("ShaderNodeTexNoise")
macro_mud.location = (-900, 300)
macro_mud.inputs["Scale"].default_value = 3.0
macro_mud.inputs["Detail"].default_value = 12.0
macro_mud.inputs["Roughness"].default_value = 0.6
links.new(warp_mix.outputs["Result"], macro_mud.inputs["Vector"])

# Height map modifier to flatten the bottoms of the noise into water puddles
ramp_height = nodes.new("ShaderNodeValToRGB")
ramp_height.location = (-600, 300)
ramp_height.color_ramp.interpolation = 'B_SPLINE'
ramp_height.color_ramp.elements[0].position = 0.35
ramp_height.color_ramp.elements[0].color = (0.1, 0.1, 0.1, 1.0) # Flat water level
ramp_height.color_ramp.elements[1].position = 1.0
ramp_height.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0) # Mud peaks
links.new(macro_mud.outputs["Fac"], ramp_height.inputs["Fac"])

# Wetness Mask (White = Water/Wet, Black = Dry Mud)
ramp_wet = nodes.new("ShaderNodeValToRGB")
ramp_wet.location = (-600, 50)
ramp_wet.color_ramp.interpolation = 'EASE'
ramp_wet.color_ramp.elements[0].position = 0.36
ramp_wet.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0) # Puddle areas
ramp_wet.color_ramp.elements[1].position = 0.48
ramp_wet.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0) # Dry earth
links.new(macro_mud.outputs["Fac"], ramp_wet.inputs["Fac"])

# --- 4. MICRO DETAILS (Dirt Grit & Pebbles) ---
micro_grit = nodes.new("ShaderNodeTexNoise")
micro_grit.location = (-900, -250)
micro_grit.inputs["Scale"].default_value = 85.0
micro_grit.inputs["Detail"].default_value = 15.0
links.new(warp_mix.outputs["Result"], micro_grit.inputs["Vector"])

# Invert wet mask to cancel out grit inside the puddles
invert_wet = nodes.new("ShaderNodeInvert")
invert_wet.location = (-300, -150)
links.new(ramp_wet.outputs["Color"], invert_wet.inputs["Color"])

masked_grit = nodes.new("ShaderNodeMix")
masked_grit.location = (-50, -200)
masked_grit.data_type = 'FLOAT'
masked_grit.blend_type = 'MULTIPLY'
masked_grit.inputs["Factor"].default_value = 1.0
links.new(micro_grit.outputs["Fac"], masked_grit.inputs["A"])
links.new(invert_wet.outputs["Color"], masked_grit.inputs["B"])

# --- 5. COLOR COMPOSITING ---
ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (-300, 250)
ramp_color.color_ramp.interpolation = 'EASE'
ramp_color.color_ramp.elements[0].position = 0.35
ramp_color.color_ramp.elements[0].color = (0.02, 0.015, 0.01, 1.0)  # Murky water
elem_mid = ramp_color.color_ramp.elements.new(0.45)
elem_mid.color = (0.08, 0.04, 0.02, 1.0)                            # Dark wet mud
ramp_color.color_ramp.elements[1].position = 0.85
ramp_color.color_ramp.elements[1].color = (0.18, 0.12, 0.07, 1.0)   # Drier peak mud
links.new(macro_mud.outputs["Fac"], ramp_color.inputs["Fac"])

# Blend micro grit color variation into the mud peaks
color_mix = nodes.new("ShaderNodeMix")
color_mix.location = (50, 200)
color_mix.data_type = 'RGBA'
color_mix.blend_type = 'OVERLAY'
color_mix.inputs["Factor"].default_value = 0.35
links.new(ramp_color.outputs["Color"], color_mix.inputs["A"])
links.new(micro_grit.outputs["Color"], color_mix.inputs["B"])

links.new(color_mix.outputs["Result"], bsdf.inputs["Base Color"])

# --- 6. ROUGHNESS & COAT MAPPING ---
# Roughness varies from mirror-smooth water to matte dirt
mix_rough = nodes.new("ShaderNodeMix")
mix_rough.location = (300, -50)
mix_rough.data_type = 'FLOAT'
mix_rough.blend_type = 'MIX'
mix_rough.inputs["A"].default_value = 0.85 # Mud Roughness
mix_rough.inputs["B"].default_value = 0.02 # Water Roughness
links.new(ramp_wet.outputs["Color"], mix_rough.inputs["Factor"])
links.new(mix_rough.outputs["Result"], bsdf.inputs["Roughness"])

# Add Coat layer exclusively to the puddles for water surface tension
mix_coat = nodes.new("ShaderNodeMix")
mix_coat.location = (1100, 150)
mix_coat.data_type = 'FLOAT'
mix_coat.blend_type = 'MIX'
mix_coat.inputs["A"].default_value = 0.0 # No coat on dry mud
mix_coat.inputs["B"].default_value = 1.0 # Full clearcoat on water
links.new(ramp_wet.outputs["Color"], mix_coat.inputs["Factor"])

# Forward compatibility check for Blender 4.x/5.x Coat
if "Coat Weight" in bsdf.inputs:
    links.new(mix_coat.outputs["Result"], bsdf.inputs["Coat Weight"])
elif "Coat" in bsdf.inputs:
    links.new(mix_coat.outputs["Result"], bsdf.inputs["Coat"])

# --- 7. DUAL-TIER BUMP STACKING ---
# Bump 1: Macro Mud Clumps (Flat in the valleys)
bump_macro = nodes.new("ShaderNodeBump")
bump_macro.location = (800, -250)
bump_macro.inputs["Strength"].default_value = 0.65
bump_macro.inputs["Distance"].default_value = 0.15
links.new(ramp_height.outputs["Color"], bump_macro.inputs["Height"])

# Bump 2: Masked Micro Grit (Zero bump inside the water puddles)
bump_grit = nodes.new("ShaderNodeBump")
bump_grit.location = (1100, -250)
bump_grit.inputs["Strength"].default_value = 0.35
bump_grit.inputs["Distance"].default_value = 0.01
links.new(masked_grit.outputs["Result"], bump_grit.inputs["Height"])
links.new(bump_macro.outputs["Normal"], bump_grit.inputs["Normal"])

# Final Normal Link
links.new(bump_grit.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: sand
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Sand (Wind Ripples, Grain, Quartz Glint)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Sand_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & WIND WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Macro wind distortion to make the dunes organic and uneven
wind_warp = nodes.new("ShaderNodeTexNoise")
wind_warp.location = (-1550, 200)
wind_warp.inputs["Scale"].default_value = 2.5
wind_warp.inputs["Detail"].default_value = 5.0
wind_warp.inputs["Distortion"].default_value = 1.0

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'
links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(wind_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. SAND SURFACE GENERATORS (Ripples, Grain, Quartz) ---
# Layer A: Wind-blown Dunes / Ripples
wave_dunes = nodes.new("ShaderNodeTexWave")
wave_dunes.location = (-1000, 300)
wave_dunes.wave_type = 'BANDS'
wave_dunes.bands_direction = 'X'
wave_dunes.wave_profile = 'SIN'
wave_dunes.inputs["Scale"].default_value = 2.0
wave_dunes.inputs["Distortion"].default_value = 4.5
wave_dunes.inputs["Detail"].default_value = 3.0
links.new(vec_warp.outputs["Vector"], wave_dunes.inputs["Vector"])

# Layer B: High-Frequency Sand Grain
sand_grain = nodes.new("ShaderNodeTexNoise")
sand_grain.location = (-1000, 0)
sand_grain.inputs["Scale"].default_value = 350.0
sand_grain.inputs["Detail"].default_value = 15.0
sand_grain.inputs["Roughness"].default_value = 0.85
links.new(coord.outputs["Object"], sand_grain.inputs["Vector"])

# Layer C: Quartz / Mica Glitter Flecks
quartz_glint = nodes.new("ShaderNodeTexVoronoi")
quartz_glint.location = (-1000, -250)
quartz_glint.feature = 'F1'
quartz_glint.distance = 'EUCLIDEAN'
quartz_glint.inputs["Scale"].default_value = 450.0
links.new(coord.outputs["Object"], quartz_glint.inputs["Vector"])

# Isolate the quartz flecks into tiny sharp points
ramp_quartz = nodes.new("ShaderNodeValToRGB")
ramp_quartz.location = (-700, -250)
ramp_quartz.color_ramp.interpolation = 'EASE'
ramp_quartz.color_ramp.elements[0].position = 0.0
ramp_quartz.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
ramp_quartz.color_ramp.elements[1].position = 0.1
ramp_quartz.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
links.new(quartz_glint.outputs["Distance"], ramp_quartz.inputs["Fac"])

# --- 4. COLOR COMPOSITING ---
# Base Sand Dune Colors (Shadows in the troughs, sun-bleached on the peaks)
ramp_base = nodes.new("ShaderNodeValToRGB")
ramp_base.location = (-650, 300)
ramp_base.color_ramp.interpolation = 'EASE'
ramp_base.color_ramp.elements[0].position = 0.15
ramp_base.color_ramp.elements[0].color = (0.55, 0.42, 0.28, 1.0)  # Trough shadows
ramp_base.color_ramp.elements[1].position = 0.85
ramp_base.color_ramp.elements[1].color = (0.82, 0.73, 0.58, 1.0)  # Peak highlights
links.new(wave_dunes.outputs["Fac"], ramp_base.inputs["Fac"])

# Add fine granular color variation
mix_grain = nodes.new("ShaderNodeMix")
mix_grain.location = (-350, 150)
mix_grain.data_type = 'RGBA'
mix_grain.blend_type = 'OVERLAY'
mix_grain.inputs["Factor"].default_value = 0.45
links.new(ramp_base.outputs["Color"], mix_grain.inputs["A"])
links.new(sand_grain.outputs["Color"], mix_grain.inputs["B"])

# Add white quartz highlights
mix_quartz = nodes.new("ShaderNodeMix")
mix_quartz.location = (-50, 100)
mix_quartz.data_type = 'RGBA'
mix_quartz.blend_type = 'ADD'
mix_quartz.inputs["Factor"].default_value = 0.5
links.new(mix_grain.outputs["Result"], mix_quartz.inputs["A"])
links.new(ramp_quartz.outputs["Color"], mix_quartz.inputs["B"])

links.new(mix_quartz.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS & SPECULAR (THE QUARTZ GLINT) ---
# General sand is very rough and matte
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (400, -50)
ramp_rough.color_ramp.elements[0].position = 0.0
ramp_rough.color_ramp.elements[0].color = (0.75, 0.75, 0.75, 1.0)
ramp_rough.color_ramp.elements[1].position = 1.0
ramp_rough.color_ramp.elements[1].color = (0.95, 0.95, 0.95, 1.0)
links.new(sand_grain.outputs["Fac"], ramp_rough.inputs["Fac"])

# Quartz flecks cut through the roughness (making them shiny)
mix_rough = nodes.new("ShaderNodeMix")
mix_rough.location = (700, -100)
mix_rough.data_type = 'FLOAT'
mix_rough.blend_type = 'MIX'
mix_rough.inputs["B"].default_value = 0.1  # Highly polished quartz
links.new(ramp_quartz.outputs["Color"], mix_rough.inputs["Factor"])
links.new(ramp_rough.outputs["Color"], mix_rough.inputs["A"])

links.new(mix_rough.outputs["Result"], bsdf.inputs["Roughness"])

# Boost specular IOR on the quartz flecks for extra sun-catch
if "Specular IOR Level" in bsdf.inputs:
    mix_spec = nodes.new("ShaderNodeMix")
    mix_spec.location = (950, -150)
    mix_spec.data_type = 'FLOAT'
    mix_spec.blend_type = 'MIX'
    mix_spec.inputs["A"].default_value = 0.5  # Default sand specular
    mix_spec.inputs["B"].default_value = 1.0  # Max specular for quartz
    links.new(ramp_quartz.outputs["Color"], mix_spec.inputs["Factor"])
    links.new(mix_spec.outputs["Result"], bsdf.inputs["Specular IOR Level"])

# --- 6. DUAL-TIER BUMP STACKING ---
# Bump 1: Macro Wind Ripples
bump_ripples = nodes.new("ShaderNodeBump")
bump_ripples.location = (650, -350)
bump_ripples.inputs["Strength"].default_value = 0.4
bump_ripples.inputs["Distance"].default_value = 0.15
links.new(wave_dunes.outputs["Fac"], bump_ripples.inputs["Height"])

# Bump 2: Micro Sand Grain
bump_grain = nodes.new("ShaderNodeBump")
bump_grain.location = (950, -300)
bump_grain.inputs["Strength"].default_value = 0.25
bump_grain.inputs["Distance"].default_value = 0.005
links.new(sand_grain.outputs["Fac"], bump_grain.inputs["Height"])
links.new(bump_ripples.outputs["Normal"], bump_grain.inputs["Normal"])

# Final Normal Link
links.new(bump_grain.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: ice
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Ice")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.88, 0.94, 0.98, 1.0)
bsdf.inputs["Transmission Weight"].default_value = 0.85
bsdf.inputs["Roughness"].default_value = 0.12
bsdf.inputs["IOR"].default_value = 1.31

coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-600, 0)

voronoi = nodes.new("ShaderNodeTexVoronoi")
voronoi.location = (-350, 0)
voronoi.inputs["Scale"].default_value = 5.0

bump = nodes.new("ShaderNodeBump")
bump.location = (-100, 0)
bump.inputs["Strength"].default_value = 0.15

links.new(coord.outputs["Object"], voronoi.inputs["Vector"])
links.new(voronoi.outputs["Distance"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: water
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Water (Ocean Swells, Wind Ripples, Volume)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Water_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT, BSDF & VOLUME ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
bsdf.inputs["Base Color"].default_value = (0.85, 0.95, 1.0, 1.0) # Very faint surface tint
bsdf.inputs["Roughness"].default_value = 0.0  # Water surface is perfectly smooth
bsdf.inputs["IOR"].default_value = 1.333      # Physical IOR of water
bsdf.inputs["Transmission Weight"].default_value = 1.0
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# Volume Absorption gives realistic deep water color based on thickness
volume = nodes.new("ShaderNodeVolumeAbsorption")
volume.location = (1250, -300)
volume.inputs["Color"].default_value = (0.02, 0.45, 0.65, 1.0) # Deep ocean cyan/blue
volume.inputs["Density"].default_value = 0.25
links.new(volume.outputs["Volume"], node_out.inputs["Volume"])

# --- 2. COORDINATES & WAVE WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency current distortion
current_warp = nodes.new("ShaderNodeTexNoise")
current_warp.location = (-1550, 200)
current_warp.inputs["Scale"].default_value = 0.5
current_warp.inputs["Detail"].default_value = 2.0

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'
links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(current_warp.outputs["Color"], vec_warp.inputs[1])

# --- 3. WAVE GENERATORS (Swells, Chops, Ripples) ---
# Layer A: Broad Ocean Swells (Smooth Voronoi for rolling wave peaks)
swells = nodes.new("ShaderNodeTexVoronoi")
swells.location = (-1000, 300)
swells.feature = 'SMOOTH_F1'
swells.distance = 'EUCLIDEAN'
swells.inputs["Scale"].default_value = 1.5
swells.inputs["Smoothness"].default_value = 1.0
links.new(vec_warp.outputs["Vector"], swells.inputs["Vector"])

# Layer B: Medium Choppy Waves
chop = nodes.new("ShaderNodeTexNoise")
chop.location = (-1000, 50)
chop.inputs["Scale"].default_value = 8.0
chop.inputs["Detail"].default_value = 5.0
chop.inputs["Roughness"].default_value = 0.6
links.new(vec_warp.outputs["Vector"], chop.inputs["Vector"])

# Layer C: High-Frequency Wind Ripples
ripples = nodes.new("ShaderNodeTexNoise")
ripples.location = (-1000, -200)
ripples.inputs["Scale"].default_value = 45.0
ripples.inputs["Detail"].default_value = 8.0
ripples.inputs["Roughness"].default_value = 0.7
links.new(coord.outputs["Object"], ripples.inputs["Vector"])

# --- 4. WAVE COMPOSITING ---
# Combine Swells and Chop
mix_waves = nodes.new("ShaderNodeMix")
mix_waves.location = (-600, 150)
mix_waves.data_type = 'FLOAT'
mix_waves.blend_type = 'OVERLAY'
mix_waves.inputs["Factor"].default_value = 0.5
links.new(swells.outputs["Distance"], mix_waves.inputs["A"])
links.new(chop.outputs["Fac"], mix_waves.inputs["B"])

# --- 5. DUAL-TIER BUMP STACKING ---
# Bump 1: Macro Swells and Choppy Waves
bump_macro = nodes.new("ShaderNodeBump")
bump_macro.location = (600, -200)
bump_macro.inputs["Strength"].default_value = 0.35
bump_macro.inputs["Distance"].default_value = 0.2
links.new(mix_waves.outputs["Result"], bump_macro.inputs["Height"])

# Bump 2: Micro Wind Ripples
bump_ripples = nodes.new("ShaderNodeBump")
bump_ripples.location = (900, -200)
bump_ripples.inputs["Strength"].default_value = 0.12
bump_ripples.inputs["Distance"].default_value = 0.02
links.new(ripples.outputs["Fac"], bump_ripples.inputs["Height"])
links.new(bump_macro.outputs["Normal"], bump_ripples.inputs["Normal"])

# Final Normal Link
links.new(bump_ripples.outputs["Normal"], bsdf.inputs["Normal"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: moss
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Moss (Organic Clumps, Subsurface, Micro-Fuzz)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Moss_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
bsdf.inputs["Roughness"].default_value = 0.85
# Sheen mimics the light-catching micro-fuzz of biological surfaces
bsdf.inputs["Sheen Weight"].default_value = 1.0
bsdf.inputs["Sheen Roughness"].default_value = 0.6
bsdf.inputs["Sheen Tint"].default_value = (0.5, 0.8, 0.3, 1.0)
# Subsurface scattering is critical for spongy, translucent plant matter
bsdf.inputs["Subsurface Weight"].default_value = 0.65
bsdf.inputs["Subsurface Scale"].default_value = 0.05

links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & ORGANIC WARPING ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Low-frequency vector distortion to make the growth look organic
warp_noise = nodes.new("ShaderNodeTexNoise")
warp_noise.location = (-1550, 200)
warp_noise.inputs["Scale"].default_value = 1.2
warp_noise.inputs["Detail"].default_value = 4.0

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1300, 50)
vec_warp.operation = 'ADD'
links.new(coord.outputs["Object"], vec_warp.inputs[0])
links.new(warp_noise.outputs["Color"], vec_warp.inputs[1])

# --- 3. MOSS STRUCTURE GENERATORS ---
# Layer A: Macro Growth Clumps (Smooth Voronoi for bulbous shapes)
clumps = nodes.new("ShaderNodeTexVoronoi")
clumps.location = (-1000, 300)
clumps.feature = 'SMOOTH_F1'
clumps.inputs["Scale"].default_value = 12.0
clumps.inputs["Smoothness"].default_value = 0.75
links.new(vec_warp.outputs["Vector"], clumps.inputs["Vector"])

# Layer B: Decay Mask (Isolates dead/dry patches)
decay_noise = nodes.new("ShaderNodeTexNoise")
decay_noise.location = (-1000, 50)
decay_noise.inputs["Scale"].default_value = 2.5
decay_noise.inputs["Detail"].default_value = 10.0
links.new(vec_warp.outputs["Vector"], decay_noise.inputs["Vector"])

ramp_decay = nodes.new("ShaderNodeValToRGB")
ramp_decay.location = (-700, 50)
ramp_decay.color_ramp.interpolation = 'B_SPLINE'
ramp_decay.color_ramp.elements[0].position = 0.45
ramp_decay.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0) # Live moss
ramp_decay.color_ramp.elements[1].position = 0.65
ramp_decay.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0) # Dead patches
links.new(decay_noise.outputs["Fac"], ramp_decay.inputs["Fac"])

# Layer C: High-Frequency Micro-Fuzz (Strands)
fuzz = nodes.new("ShaderNodeTexNoise")
fuzz.location = (-1000, -200)
fuzz.inputs["Scale"].default_value = 250.0
fuzz.inputs["Detail"].default_value = 15.0
fuzz.inputs["Roughness"].default_value = 0.8
links.new(coord.outputs["Object"], fuzz.inputs["Vector"])

# --- 4. COLOR COMPOSITING ---
# Live Moss Color (Deep shadows in roots to vibrant green tips)
ramp_live = nodes.new("ShaderNodeValToRGB")
ramp_live.location = (-650, 300)
ramp_live.color_ramp.interpolation = 'EASE'
ramp_live.color_ramp.elements[0].position = 0.1
ramp_live.color_ramp.elements[0].color = (0.02, 0.04, 0.01, 1.0) # Shadowed root
ramp_live.color_ramp.elements[1].position = 0.75
ramp_live.color_ramp.elements[1].color = (0.12, 0.28, 0.04, 1.0) # Bright tip
links.new(clumps.outputs["Distance"], ramp_live.inputs["Fac"])

# Mix live clumps with fine fuzz texture
mix_fuzz = nodes.new("ShaderNodeMix")
mix_fuzz.location = (-350, 150)
mix_fuzz.data_type = 'RGBA'
mix_fuzz.blend_type = 'OVERLAY'
mix_fuzz.inputs["Factor"].default_value = 0.4
links.new(ramp_live.outputs["Color"], mix_fuzz.inputs["A"])
links.new(fuzz.outputs["Color"], mix_fuzz.inputs["B"])

# Dead/Dry Moss Color
ramp_dead = nodes.new("ShaderNodeValToRGB")
ramp_dead.location = (-350, -50)
ramp_dead.color_ramp.elements[0].position = 0.2
ramp_dead.color_ramp.elements[0].color = (0.15, 0.12, 0.06, 1.0) # Muddy brown
ramp_dead.color_ramp.elements[1].position = 0.8
ramp_dead.color_ramp.elements[1].color = (0.28, 0.25, 0.12, 1.0) # Dry yellow/brown
links.new(fuzz.outputs["Fac"], ramp_dead.inputs["Fac"])

# Final Color Mix (Live vs Dead)
color_final = nodes.new("ShaderNodeMix")
color_final.location = (-50, 100)
color_final.data_type = 'RGBA'
color_final.blend_type = 'MIX'
links.new(ramp_decay.outputs["Color"], color_final.inputs["Factor"])
links.new(mix_fuzz.outputs["Result"], color_final.inputs["A"])
links.new(ramp_dead.outputs["Color"], color_final.inputs["B"])

links.new(color_final.outputs["Result"], bsdf.inputs["Base Color"])
links.new(color_final.outputs["Result"], bsdf.inputs["Subsurface Radius"])

# --- 5. DUAL-TIER BUMP STACKING ---
# Bump 1: Macro Bulbous Clumps
bump_clumps = nodes.new("ShaderNodeBump")
bump_clumps.location = (600, -200)
bump_clumps.inputs["Strength"].default_value = 0.5
bump_clumps.inputs["Distance"].default_value = 0.15
links.new(clumps.outputs["Distance"], bump_clumps.inputs["Height"])

# Bump 2: Micro Fuzz / Plant Strands
bump_fuzz = nodes.new("ShaderNodeBump")
bump_fuzz.location = (900, -200)
bump_fuzz.inputs["Strength"].default_value = 0.35
bump_fuzz.inputs["Distance"].default_value = 0.005
links.new(fuzz.outputs["Fac"], bump_fuzz.inputs["Height"])
links.new(bump_clumps.outputs["Normal"], bump_fuzz.inputs["Normal"])

links.new(bump_fuzz.outputs["Normal"], bsdf.inputs["Normal"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: fabric
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Fabric (Woven Denim/Twill with Micro-Fuzz)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Fabric_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1200, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (850, 0)
bsdf.inputs["Roughness"].default_value = 0.88
bsdf.inputs["Sheen Weight"].default_value = 0.95
bsdf.inputs["Sheen Roughness"].default_value = 0.65
bsdf.inputs["Sheen Tint"].default_value = (0.78, 0.84, 0.95, 1.0)
bsdf.inputs["Subsurface Weight"].default_value = 0.08
bsdf.inputs["Subsurface Radius"].default_value = (0.8, 0.4, 0.3)
bsdf.inputs["Subsurface Scale"].default_value = 0.02

links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & WEAVE WARPING (ELIMINATES MECHANICAL GRID ARTIFACTS) ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1600, 0)

warp_noise = nodes.new("ShaderNodeTexNoise")
warp_noise.location = (-1350, 200)
warp_noise.inputs["Scale"].default_value = 14.0
warp_noise.inputs["Detail"].default_value = 4.0
warp_noise.inputs["Roughness"].default_value = 0.5

vec_warp = nodes.new("ShaderNodeVectorMath")
vec_warp.location = (-1100, 100)
vec_warp.operation = 'ADD'

links.new(coord.outputs["UV"], vec_warp.inputs[0])
links.new(warp_noise.outputs["Color"], vec_warp.inputs[1])

# Scale mapped UVs for the thread density
mapping = nodes.new("ShaderNodeMapping")
mapping.location = (-850, 100)
mapping.inputs["Scale"].default_value = (140.0, 140.0, 140.0)
links.new(vec_warp.outputs["Vector"], mapping.inputs["Vector"])

# --- 3. DUAL-AXIS WEAVE GENERATION (WARP & WEFT PATTERN) ---
wave_warp = nodes.new("ShaderNodeTexWave")
wave_warp.location = (-600, 250)
wave_warp.wave_type = 'BANDS'
wave_warp.bands_direction = 'X'
wave_warp.wave_profile = 'SIN'
wave_warp.inputs["Scale"].default_value = 1.0
wave_warp.inputs["Distortion"].default_value = 2.4
wave_warp.inputs["Detail"].default_value = 3.0
wave_warp.inputs["Detail Scale"].default_value = 2.0
links.new(mapping.outputs["Vector"], wave_warp.inputs["Vector"])

wave_weft = nodes.new("ShaderNodeTexWave")
wave_weft.location = (-600, -50)
wave_weft.wave_type = 'BANDS'
wave_weft.bands_direction = 'Y'
wave_weft.wave_profile = 'SIN'
wave_weft.inputs["Scale"].default_value = 1.0
wave_weft.inputs["Distortion"].default_value = 2.4
wave_weft.inputs["Detail"].default_value = 3.0
wave_weft.inputs["Detail Scale"].default_value = 2.0
links.new(mapping.outputs["Vector"], wave_weft.inputs["Vector"])

# Weave interlace blend
weave_mix = nodes.new("ShaderNodeMix")
weave_mix.location = (-350, 100)
weave_mix.data_type = 'FLOAT'
weave_mix.blend_type = 'MULTIPLY'
weave_mix.inputs["Factor"].default_value = 1.0
links.new(wave_warp.outputs["Fac"], weave_mix.inputs["A"])
links.new(wave_weft.outputs["Fac"], weave_mix.inputs["B"])

# Micro-fiber Noise for thread strands
micro_thread = nodes.new("ShaderNodeTexNoise")
micro_thread.location = (-350, 350)
micro_thread.inputs["Scale"].default_value = 220.0
micro_thread.inputs["Detail"].default_value = 12.0
micro_thread.inputs["Roughness"].default_value = 0.8
links.new(mapping.outputs["Vector"], micro_thread.inputs["Vector"])

# Combined High-Frequency Weave Pattern
thread_combine = nodes.new("ShaderNodeMix")
thread_combine.location = (-100, 200)
thread_combine.data_type = 'FLOAT'
thread_combine.blend_type = 'OVERLAY'
thread_combine.inputs["Factor"].default_value = 0.4
links.new(weave_mix.outputs["Result"], thread_combine.inputs["A"])
links.new(micro_thread.outputs["Fac"], thread_combine.inputs["B"])

# --- 4. COLOR VARIATION (MACRO FADE, THREAD SHADOWING, MICRO SPECKS) ---
macro_wear = nodes.new("ShaderNodeTexNoise")
macro_wear.location = (-600, -350)
macro_wear.inputs["Scale"].default_value = 2.8
macro_wear.inputs["Detail"].default_value = 4.0
macro_wear.inputs["Roughness"].default_value = 0.55
links.new(coord.outputs["Object"], macro_wear.inputs["Vector"])

# Base dye color ramp (Worn Indigo / Dark Wash Denim)
ramp_base = nodes.new("ShaderNodeValToRGB")
ramp_base.location = (-100, -100)
ramp_base.color_ramp.interpolation = 'EASE'
ramp_base.color_ramp.elements[0].position = 0.2
ramp_base.color_ramp.elements[0].color = (0.015, 0.035, 0.09, 1.0) # Deep shadow weave
ramp_base.color_ramp.elements[1].position = 0.85
ramp_base.color_ramp.elements[1].color = (0.07, 0.14, 0.32, 1.0)  # Core dyed thread
links.new(thread_combine.outputs["Result"], ramp_base.inputs["Fac"])

# Surface wear ramp (Highlights, faded knees/folds)
color_mix_wear = nodes.new("ShaderNodeMix")
color_mix_wear.location = (200, -50)
color_mix_wear.data_type = 'RGBA'
color_mix_wear.blend_type = 'SCREEN'
color_mix_wear.inputs["B"].default_value = (0.24, 0.35, 0.55, 1.0) # Faded wear highlight
links.new(macro_wear.outputs["Fac"], color_mix_wear.inputs["Factor"])
links.new(ramp_base.outputs["Color"], color_mix_wear.inputs["A"])

links.new(color_mix_wear.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. SURFACE FUZZ & NORMAL STACKING (DUAL-TIER BUMP) ---
# Primary Weave Height
bump_weave = nodes.new("ShaderNodeBump")
bump_weave.location = (250, 350)
bump_weave.inputs["Strength"].default_value = 0.35
bump_weave.inputs["Distance"].default_value = 0.03
links.new(thread_combine.outputs["Result"], bump_weave.inputs["Height"])

# Micro-Fuzz / Stray Lint Noise
lint_noise = nodes.new("ShaderNodeTexNoise")
lint_noise.location = (250, 600)
lint_noise.inputs["Scale"].default_value = 350.0
lint_noise.inputs["Detail"].default_value = 15.0
lint_noise.inputs["Roughness"].default_value = 0.9
links.new(coord.outputs["Object"], lint_noise.inputs["Vector"])

# Secondary Micro-Bump Chained into Primary Bump
bump_micro = nodes.new("ShaderNodeBump")
bump_micro.location = (550, 450)
bump_micro.inputs["Strength"].default_value = 0.12
bump_micro.inputs["Distance"].default_value = 0.005
links.new(lint_noise.outputs["Fac"], bump_micro.inputs["Height"])
links.new(bump_weave.outputs["Normal"], bump_micro.inputs["Normal"])

links.new(bump_micro.outputs["Normal"], bsdf.inputs["Normal"])

# --- 6. ROUGHNESS & COAT SHEEN MAP ---
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (450, 100)
ramp_rough.color_ramp.elements[0].position = 0.1
ramp_rough.color_ramp.elements[0].color = (0.75, 0.75, 0.75, 1.0)
ramp_rough.color_ramp.elements[1].position = 0.9
ramp_rough.color_ramp.elements[1].color = (0.95, 0.95, 0.95, 1.0)
links.new(macro_wear.outputs["Fac"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# Assign material to active object
if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: leather
================================================================================
import bpy

# -------------------------------------------------------------------------
# Production-Grade Procedural Leather (Corrected Fine Cellular Grain)
# Compatible with Blender 4.x & 5.x Principled BSDF v2
# -------------------------------------------------------------------------

obj = bpy.context.active_object
if not obj:
    raise RuntimeError("Select an active mesh object before running.")

mat_name = "Procedural_Leather_Production"
mat = bpy.data.materials.get(mat_name)
if not mat:
    mat = bpy.data.materials.new(name=mat_name)

mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# --- 1. CORE OUTPUT & BSDF ---
node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (1600, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (1250, 0)
bsdf.inputs["Sheen Weight"].default_value = 1.0
bsdf.inputs["Sheen Roughness"].default_value = 0.6
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

# --- 2. COORDINATES & SUBTLE STRETCH ---
coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-1800, 0)

# Much tighter, less destructive noise for a slight, organic pull
stretch_warp = nodes.new("ShaderNodeTexNoise")
stretch_warp.location = (-1550, 200)
stretch_warp.inputs["Scale"].default_value = 2.0
stretch_warp.inputs["Detail"].default_value = 4.0

vec_warp = nodes.new("ShaderNodeMix")
vec_warp.location = (-1300, 50)
vec_warp.data_type = 'VECTOR'
vec_warp.inputs["Factor"].default_value = 0.04 # Extremely subtle warp
links.new(coord.outputs["Object"], vec_warp.inputs["A"])
links.new(stretch_warp.outputs["Color"], vec_warp.inputs["B"])

# --- 3. DUAL-SCALE LEATHER GRAIN GENERATORS ---
# Layer A: Micro-Grain (The fine skin cells)
micro_grain = nodes.new("ShaderNodeTexVoronoi")
micro_grain.location = (-1000, 350)
micro_grain.feature = 'DISTANCE_TO_EDGE'
micro_grain.inputs["Scale"].default_value = 120.0
links.new(vec_warp.outputs["Result"], micro_grain.inputs["Vector"])

ramp_micro = nodes.new("ShaderNodeValToRGB")
ramp_micro.location = (-700, 350)
ramp_micro.color_ramp.interpolation = 'EASE'
ramp_micro.color_ramp.elements[0].position = 0.0
ramp_micro.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
ramp_micro.color_ramp.elements[1].position = 0.08 # Tightened to make lines thin
ramp_micro.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
links.new(micro_grain.outputs["Distance"], ramp_micro.inputs["Fac"])

# Layer B: Macro-Folds (Major intersecting creases)
macro_grain = nodes.new("ShaderNodeTexVoronoi")
macro_grain.location = (-1000, 50)
macro_grain.feature = 'DISTANCE_TO_EDGE'
macro_grain.inputs["Scale"].default_value = 25.0
links.new(vec_warp.outputs["Result"], macro_grain.inputs["Vector"])

ramp_macro = nodes.new("ShaderNodeValToRGB")
ramp_macro.location = (-700, 50)
ramp_macro.color_ramp.interpolation = 'EASE'
ramp_macro.color_ramp.elements[0].position = 0.0
ramp_macro.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
ramp_macro.color_ramp.elements[1].position = 0.03 # Extremely sharp major lines
ramp_macro.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
links.new(macro_grain.outputs["Distance"], ramp_macro.inputs["Fac"])

# Combine the two grain scales
mix_grain = nodes.new("ShaderNodeMix")
mix_grain.location = (-350, 150)
mix_grain.data_type = 'FLOAT'
mix_grain.blend_type = 'MULTIPLY'
mix_grain.inputs["Factor"].default_value = 0.7
links.new(ramp_micro.outputs["Color"], mix_grain.inputs["A"])
links.new(ramp_macro.outputs["Color"], mix_grain.inputs["B"])

# --- 4. COLOR COMPOSITING ---
# Organic mottling for the dye job
dye_noise = nodes.new("ShaderNodeTexNoise")
dye_noise.location = (-700, -250)
dye_noise.inputs["Scale"].default_value = 4.0
dye_noise.inputs["Detail"].default_value = 12.0
links.new(coord.outputs["Object"], dye_noise.inputs["Vector"])

ramp_color = nodes.new("ShaderNodeValToRGB")
ramp_color.location = (-350, -200)
ramp_color.color_ramp.elements[0].position = 0.2
ramp_color.color_ramp.elements[0].color = (0.10, 0.04, 0.015, 1.0) # Dark rich brown
ramp_color.color_ramp.elements[1].position = 0.8
ramp_color.color_ramp.elements[1].color = (0.22, 0.09, 0.03, 1.0)  # Lighter cognac
links.new(dye_noise.outputs["Fac"], ramp_color.inputs["Fac"])

# Darken the creases so the grain pops
color_final = nodes.new("ShaderNodeMix")
color_final.location = (-50, 0)
color_final.data_type = 'RGBA'
color_final.blend_type = 'MULTIPLY'
color_final.inputs["Factor"].default_value = 0.9
links.new(ramp_color.outputs["Color"], color_final.inputs["A"])
links.new(mix_grain.outputs["Result"], color_final.inputs["B"])

links.new(color_final.outputs["Result"], bsdf.inputs["Base Color"])

# --- 5. ROUGHNESS MAPPING ---
# Raised pads are smooth from wear, deep creases are rough and matte
ramp_rough = nodes.new("ShaderNodeValToRGB")
ramp_rough.location = (400, -100)
ramp_rough.color_ramp.elements[0].position = 0.0
ramp_rough.color_ramp.elements[0].color = (0.75, 0.75, 0.75, 1.0) # Deep Creases
ramp_rough.color_ramp.elements[1].position = 1.0
ramp_rough.color_ramp.elements[1].color = (0.35, 0.35, 0.35, 1.0) # Flat Pads
links.new(mix_grain.outputs["Result"], ramp_rough.inputs["Fac"])
links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])

# --- 6. BUMP MAPPING ---
bump_leather = nodes.new("ShaderNodeBump")
bump_leather.location = (650, -250)
bump_leather.inputs["Strength"].default_value = 0.45
bump_leather.inputs["Distance"].default_value = 0.01
bump_leather.invert = True # Pushes the black lines inward
links.new(mix_grain.outputs["Result"], bump_leather.inputs["Height"])
links.new(bump_leather.outputs["Normal"], bsdf.inputs["Normal"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)

================================================================================
TEXTURE: scales
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Scales")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.08, 0.35, 0.12, 1.0)
bsdf.inputs["Roughness"].default_value = 0.3
bsdf.inputs["Coat Weight"].default_value = 0.7

coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-600, 0)

wave = nodes.new("ShaderNodeTexWave")
wave.location = (-350, 0)
wave.wave_type = "RINGS"
wave.inputs["Scale"].default_value = 8.0

bump = nodes.new("ShaderNodeBump")
bump.location = (-100, 0)
bump.inputs["Strength"].default_value = 0.5

links.new(coord.outputs["UV"], wave.inputs["Vector"])
links.new(wave.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


================================================================================
TEXTURE: cardboard
================================================================================
import bpy

obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Procedural_Cardboard")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

node_out = nodes.new("ShaderNodeOutputMaterial")
node_out.location = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (150, 0)
bsdf.inputs["Base Color"].default_value = (0.45, 0.35, 0.22, 1.0)
bsdf.inputs["Roughness"].default_value = 0.95

coord = nodes.new("ShaderNodeTexCoord")
coord.location = (-600, 0)

noise = nodes.new("ShaderNodeTexNoise")
noise.location = (-350, 0)
noise.inputs["Scale"].default_value = 50.0

bump = nodes.new("ShaderNodeBump")
bump.location = (-100, 0)
bump.inputs["Strength"].default_value = 0.12

links.new(coord.outputs["Object"], noise.inputs["Vector"])
links.new(noise.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bsdf.outputs["BSDF"], node_out.inputs["Surface"])

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)