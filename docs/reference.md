# Job & Scene Definition Reference

Properties in <span style="color:#275ce5">blue colour</span> are optional, otherwise they are mandatory

Items in italics are specific types/classes of object

## Job Input

<pre>
<b>name:</b>      Name of job to submit
<b>width:</b>     Width of image to render in pixels
<b>height:</b>    Height of image to render in pixels
<span style="color:#275ce5"><b>maxDepth:</b>  Maximum recursion depth when ray tracing (default: 4)</span>
<b>scene:</b>     <i>Scene</i> to render
</pre>

## <i>Scene</i> Definition
<pre>
<b>name:</b> Name of scene, not currently used
<span style="color:#275ce5"><b>backgroundColour:</b> <i>Colour</i> of background, used when ray misses all objects</span>
<span style="color:#275ce5"><b>ambientLevel:</b> Level of ambient light, <i>float</i> typically: 0.0 ~ 1.5 (default: 0.1)</span>
<span style="color:#275ce5"><b>cameraFov:</b> Camera field of view, lower values "zoom in" (default: 30)</span>
<b>cameraPos:</b> Camera position <i>Point</i> in world space
<b>cameraLookAt:</b> Camera will be oriented and looking at this <i>Point</i> in world space
<b>lights:</b> Array of <i>Light</i> in the scene
<b>objects:</b> Array of <i>Object</i> in the scene
</pre>

## <i>Colour</i> Definition
<pre>
[r, b, g]   Array (tuple) of red, green & blue values. Integers in the range 0 ~ 255
</pre>

## <i>Point</i> Definition
<pre>
[x, y, z]   Array (tuple) of X, Y & Z co-ordinate values, representing a point in world space.
</pre>

## <i>Rotation</i> Definition
<pre>
[x, y, z]   Array (tuple) of X, Y & Z rotation values, representing a rotation in 3D space around each axis. Values are in degrees.
</pre>

## Material Definition

## Texture Definition 

