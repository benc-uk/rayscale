# Job & Scene Definition Reference

Properties in <span style="color:#275ce5">blue colour</span> are optional, all other properties listed are mandatory

Items in italics are specific types/classes of object, e.g. a *Light* 

---

## Job Input
This is the top level of YAML that needs to be submitted to start a job
<pre>
<b>name:</b>      Name of job to submit
<b>width:</b>     Width of image to render in pixels
<b>height:</b>    Height of image to render in pixels
<span style="color:#275ce5"><b>maxDepth:</b>  Maximum recursion depth when ray tracing (default: 4)</span>
<span style="color:#275ce5"><b>antiAlias:</b> Enable anti-aliasing, removes jagged edges but slower (default: false)</span>
<span style="color:#275ce5"><b>tasks:</b>     How many tasks to split the job into. (default: same number as active tracers)</span>
<b>scene:</b>     <i>Scene</i> to render
</pre>

## <i>Scene</i> Definition
<pre>
<span style="color:#275ce5"><b>backgroundColour:</b> <i>Colour</i> of the background, used when ray misses all objects (default: black)</span>
<span style="color:#275ce5"><b>ambientLevel:</b>     Level of ambient light, typically: 0.0 ~ 0.3 (default: 0.1)</span>
<span style="color:#275ce5"><b>cameraFov:</b>        Camera field of view, lower values "zoom in" (default: 30)</span>
<b>cameraPos:</b>        Camera position <i>Point</i> in world space
<b>cameraLookAt:</b>     Camera will be oriented and looking at this <i>Point</i> in world space
<span style="color:#275ce5"><b>seed:</b>             String used to initialize the random number generator</span>
<b>lights:</b>           Array of <i>Lights</i> in the scene
<b>objects:</b>          Array of <i>Objects</i> in the scene
<span style="color:#275ce5"><b>materials:</b>        Array of <i>Materials</i> which will be used as shared presets for <i>Objects</i> in the scene</span>
</pre>

## <i>Colour</i> Definition
<pre>
[r, b, g]   Array (tuple) of red, green & blue values. Integers in the range 0 ~ 255
</pre>

## <i>Point</i> Definition
<pre>
[x, y, z]   Array (tuple) of X, Y & Z co-ordinate values, representing a point in 3D world space.
</pre>

## <i>Rotation</i> Definition
<pre>
[x, y, z]   Array (tuple) of X, Y & Z rotation values, representing a rotation in 3D space around each axis. Values are in degrees.
</pre>

## <i>Light</i> Definition
<pre>
pos:          A <i>Point</i> position in space where the light is located
<span style="color:#275ce5">brightness:   Brightness coefficient of the light, typical values are 0.8 ~ 1.3 (default: 1.0)
radius:       Falloff and attenuation radius, in world units (default: 200)
colour:       The <i>Colour</i> of the light (default: [1, 1, 1], i.e. white light)</span>
</pre>

## <i>Object</i> Definition
All objects regardless of type have the following mandatory properties
<pre>
type:      The type of object, allowed values are: sphere, plane, cuboid, cylinder, cone & mesh
name:      The name of the object, used for logging and debug purposes
pos:       A <i>Point</i> position in world space where the center of the object is to be located
material:  A <i>Material</i> describing the appearance and surface of the object
</pre>

Each object has additional parameters that will depend on the *type* that was specified
### type: sphere
A sphere is a uniformly spherical ball 
<pre>
radius:    The radius of the sphere in world units
</pre>

### type: plane
A plane is an infinite 2D flat sheet, useful for creating walls and floors in a scene. If you need a finite 2D rectangle use a thin *cuboid* instead
<pre>
<span style="color:#275ce5">rotation:  A <i>Rotation</i> tuple, orienting the plane. The starting orientation is [0, 1, 0] aligned with the Y axis, i.e. a flat "floor"</span>
</pre>

### type: cuboid
A box shape with 6 sides, can be a regular cube or rectangular depening on parameters
<pre>
<span style="color:#275ce5">rotation:  A <i>Rotation</i> tuple, orienting the cuboid (default: [0, 0, 0])</span>
size:      A 3-tuple, specifying the dimensions of the cuboid along each axis before rotation
</pre>

### type: cylinder
A cylinder with a circular base
<pre>
<span style="color:#275ce5">rotation:  A <i>Rotation</i> tuple, orienting the cylinder. Starting orientation is aligned along Y axis pointing "upwards"</span>
radius:    The radius of the cylinder
length:    The length of the cylinder
<span style="color:#275ce5">capped:    Boolean. Cap the ends of the cylinder or have a hollow tube (default: false)</span>
</pre>

### type: cone
A tapered cone with a circular base
<pre>
<span style="color:#275ce5">rotation:  A <i>Rotation</i> tuple, orienting the cone. Starting orientation is aligned along Y axis pointing "upwards"</span>
radius:    The radius of the cone
length:    The length of the cone
<span style="color:#275ce5">capped:    Boolean. Cap the end of the cone or have it hollow (default: false)</span>
</pre>

### type: mesh
A polygon mesh in Wavefront .OBJ format. The mesh can only contain triangle polygons, and also must include vertex normals
<pre>
src:       The source URL of the mesh OBJ file, URL must be accessible by the tracers
<span style="color:#275ce5">rotation:  A <i>Rotation</i> tuple, orienting the mesh. (default: [0, 0, 0])</span>
<span style="color:#275ce5">scale:     A uniform scaling factor to resize the mesh (default: 1)</span>
</pre>

## <i>Material</i> Definition
All material properties are parameters that are used in the Blinn-Phong illumination model. Many of the parameters are coefficients or scaling factors, that typically lay in the range 0.0 ~ 1.0, but can go over 1.0 in some cases.
The only required properties are **preset** and **texture**
<pre>
preset:    Base which defines starting values for ka, kd, etc. You can then override these values. Preset is one of: basic, matte, rubber, shiny or any of the custom presets you have defined in the scene materials list
texture:   A <i>Texture</i> object
<span style="color:#275ce5">ka:        Ambient coefficient: how much ambient light the material reflects, typically 0.1 ~ 0.5
kd:        Diffuse coefficient: how much diffuse light the material reflects, typically 0.8 ~ 1.0
ks:        Specular coefficient: how much specular light the material reflects, 0.0 for for matte objects through to 1.0 for very shiny
hardness:  Specular hardness: Used by Phong shading model, changes the size of specular highlights. Small values (2 ~ 10) will give large highlights, values over 50 will give small glassy highlights
kr:        Reflective coefficient: How much the object reflects surroundings, 1.0 is a perfect mirror, 0.0 turns off reflections. Note, setting above 0.0 will affect rendering time
kt:        Transmission coefficient: How much the object allows light through it, 1.0 is perfectly clear, 0.0 turns off transparency. Note, setting above 0.0 will affect rendering time
ior:       Index of refraction. Typically 1.0 ~ 2.5, see Refractive Index on Wikipedia for some values. Ignored when kt is 0.0
noShade:   Boolean. When enabled, no shading is done and the object simply returns the colour or texture directly (default: false)
name:      Only supply a name when the material is in the scene level <i>materials</i> list. This then makes it a preset for use on objects</span>
</pre>


## Texture Definition 
Textures are typed, and the properties are strongly linked to the given type, so all textures require a **type**
<pre>
type:      The type of texture, one of: basic, check, image, noise, turbulence, wood or marble
<span style="color:#275ce5">scaleU:    Scaling factor for texture U coords (applies to check and image texture types)
scaleV:    Scaling factor for texture V coords (applies to check and image texture types)
flipU:     Boolean. Flip the direction of the texture U coords (applies to image texture types)
flipV:     Boolean. Flip the direction of the texture V coords (applies to image texture types)
swapUV:    Boolean. Swap U & V texture coords, equates to a 90deg rotation (applies to image texture types)
</pre>

### type: basic
A basic texture is a uniform single colour
<pre>
colour:    The <i>Colour</i> of the texture
</pre>

### type: check
A check texture is a 2D checkerboard, use **scaleU** and **scaleV** to resize
<pre>
colour1:    The first <i>Colour</i> of the checks
colour2:    The second <i>Colour</i> of the checks
</pre>

### type: image
A bitmap image texture mapped onto the surface of the object. Only PNG images are supported. In many cases it is advisable to select images that seamlessly tile together
<pre>
src:       The source URL of the PNG image texture, URL must be accessible by the tracers
</pre>

### type: noise
Procedurally generated solid 3d texture, based on smoothed Perlin noise
<pre>
colour1:    The first <i>Colour</i> of the checks
colour2:    The second <i>Colour</i> of the checks
<span style="color:#275ce5">scale:      3-tuple size/scaling factor for noise along each [X, Y, Z] axis
mult:       Scaling factor applied to colour1 (default: 1)
pow:        Power factor makes the ramp between colours steeper and colour1 more dense  (default: 1)</span>
</pre>

### type: turbulence
Procedurally generated solid 3d texture, based on fractally scaled Perlin noise
<pre>
colour1:    The first <i>Colour</i> of the checks
colour2:    The second <i>Colour</i> of the checks
<span style="color:#275ce5">scale:      3-tuple size/scaling factor for noise along each [X, Y, Z] axis
size:       Starting size of the turbulence (default: 32)
abs:        Clamp values to positive, results in finer looking textures (default: false)
mult:       Scaling factor applied to colour1 (default: 1)
pow:        Power factor makes the ramp between colours steeper and colour1 more dense (default: 1)</span>
</pre>

### type: marble
Procedurally generated solid 3d texture, that approximates the look of veined marble based on applying sine function to **turbulence**
<pre>
colour1:    The first <i>Colour</i> of the checks
colour2:    The second <i>Colour</i> of the checks
<span style="color:#275ce5">periods:    3-tuple scales the repeating marble pattern along each [X, Y, Z] axis
turbPower:  Power factor determines how sharp the marble veins are (default: 5)
turbSize:   Size of the turbulence used (default: 32)
mult:       Scaling factor applied to colour1 (default: 1)
pow:        Power factor makes the ramp between colours steeper and colour1 more dense (default: 1)</span>
</pre>

### type: wood
Procedurally generated solid 3d texture, that approximates the look of grained wood grain, based on applying sine function to **turbulence** along one axis
<pre>
colour1:    The first <i>Colour</i> of the checks
colour2:    The second <i>Colour</i> of the checks
<span style="color:#275ce5">period:     Scales the repeating wood grain pattern 
axis:       Integer axis to align the wood along, 0 = x, 1 = y, 2 = z (default: 1)
offset:     A <i>Point</i> which moves the center of the wood grain pattern in world coords
turbPower:  Power factor determines how sharp the wood grain pattern is (default: 5)
turbSize:   Size of the turbulence used (default: 32)
mult:       Scaling factor applied to colour1 (default: 1)
pow:        Power factor makes the ramp between colours steeper and colour1 more dense (default: 1)</span>
</pre>
