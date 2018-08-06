# Job & Scene Definition Reference

Properties in <span style="color:#275ce5">blue colour</span> are optional, all other properties listed are mandatory

Items in italics are specific types/classes of object, e.g. a *Light* 

## !! Note !!
This document is massively incomplete, until it is finished, please use the sample jobs in the examples folder as a reference and guide. Sorry!

### Preset Materials
There are five built-in preset materials
- basic
- matte
- rubber
- shiny

---

## Job Input

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
<span style="color:#275ce5"><b>backgroundColour:</b> <i>Colour</i> of background, used when ray misses all objects (default: black)</span>
<span style="color:#275ce5"><b>ambientLevel:</b>     Level of ambient light, <i>float</i> typically: 0.0 ~ 0.3 (default: 0.1)</span>
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

## Object Definition

## Material Definition

## Texture Definition 

