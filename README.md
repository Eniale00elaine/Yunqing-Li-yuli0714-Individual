# Yunqing-Li-yuli0714-Individual
Function prototype of individual artwork-Bands, Cells & Cat

1.Interaction Instructions

I retained the spacebar interaction from the group project—pressing the spacebar still toggles between two different animation modes in my individual submission. Additionally, I introduced a new pause feature: the animation pauses when the mouse hovers over the webpage and resumes once the mouse moves away.

2.Individual Approach

Driving Method

I have chosen Perlin noise and randomness as the animation approach for my individual project, primarily utilizing Perlin noise and stochastic values to control color transitions of the shapes and the oscillation frequency of their movements. This method better captures the rhythmic arrangement of lines and blocks in Mondrian’s Broadway Boogie Woogie, making the entire composition more vibrant and engaging.

Load page — animation begins automatically (A mode or B mode depending on state).

Press SPACE — toggle between Mode A and Mode B:

Mode A: bands dominate (Perlin noise controls band color/shake).

Mode B: grid/cells dominate (Perlin noise controls cell color/shake) and cat logic is active.

Mouse hover over the canvas — pause all animations and show a “PAUSED” overlay. Move the mouse out of the canvas to resume.

Observe — bands and cells appear sequentially; when either bands or cells reach 19 elements the sketch resets.

Cat behavior (Mode B) — cat sprite appears in an empty cell, grows from 0 to the cell size, holds briefly, then shrinks and disappears. The cat flips horizontally sometimes.

Distinctiveness from Others

My prototype focuses on leveraging variations in Perlin noise values not only to drive the dynamic vibration of geometric shapes but also to govern color transformations. Furthermore, in Mode B, I incorporated dynamically changing cat avatars, adding a layer of whimsy and playfulness to the visual experience.

Inspiration Sources

*Broadway Boogie Woogie*

Our primary inspiration is this abstract painting by Piet Mondrian. The varied lengths of bands and diverse rectangles that compose the artwork inspired our use of array management to construct the foundational animation effect.

*Cat Distribution System*

My individual assignment references this work created by Manasvi. The randomness in the placement of cat avatars across different positions in the artwork provided guidance for the effects presented in Mode B of my assignment.
https://editor.p5js.org/manasvihow/sketches/TnI2BDD1Z

*Untitled_time6*

Another reference for my individual assignment is this piece by Samuel YAN. The smooth color transitions controlled by Perlin noise served as the main reference for my implementation.
https://openprocessing.org/sketch/2693579

Technical Explanation

1. Perlin Noise–Driven Animation
Perlin noise is used to control:
* Band color variation and subtle vibration in Mode A
* Subtle shaking of the cat image in Mode B
* Smooth transitions for parameters that should not jump randomly
Example:

let n = noise(frameCount * 0.01);
let offset = map(n, 0, 1, -5, 5);

Perlin noise generates smooth continuous randomness, ideal for organic motion.

Sources:
p5.js Reference – noise(): https://p5js.org/reference/#/p5/noise (Perlin, K. (1985) original paper)

2. Manual Layer Management (z-order through drawing order)
Layer order is achieved by controlling the draw sequence:
* Blocks (bottom layer)
* Cat image (middle layer)
* Bands (top layer)
p5.js does not have native layering APIs; the order in which elements are drawn determines their z-order.

Source:
2D rendering order in p5.js: https://p5js.org/learn/coordinate-system-and-shapes.html

3. Counters + Auto-Reset Mechanism (Reset after 19 items)
Both bands and blocks use counters. When the count reaches 19, the canvas resets:

if (bands.length >= 19) resetBands();
if (blocks.length >= 19) resetBlocks();

This creates a dynamic yet bounded generative system.

Source:
p5.js program flow: https://p5js.org/learn/program-flow.html

4. Random Cat Position Every Time It Appears
The cat appears once per cycle and is positioned randomly in Mode B:

catX = floor(random(cols)) * cellSize;
catY = floor(random(rows)) * cellSize;

The cat position remains fixed until the next reset or mode switch.

Source:
random(): https://p5js.org/reference/#/p5/random

5. Mouse Hover Pause System (mouseenter / mouseleave)
Techniques used for mouse hover pause function:
* Native JavaScript event listeners: mouseenter / mouseleave
* A global paused boolean
* Conditional early return inside draw()
* Optional “PAUSED” overlay text

Example:
When the mouse enters the canvas:
paused = true;
When the mouse leaves:
paused = false;
Inside draw():

if (paused) {
  text("PAUSED", width/2, height/2);
  return;
}

Animation stops because no updates occur while paused.

Source:
https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
https://p5js.org/reference/#/p5/noLoop

Modifications from Group Code
I implemented the Perlin-noise-driven color and shake for bands, the cat spawn & lifecycle state machine (appear → hold → fade) and the mouse-hover pause overlay. I also consolidated the mode toggle logic and added robust reset behavior when total bands/cells reach 19.

External Tools & Techniques

* Utility Helper Functions
Several recurring logic components are abstracted into helper functions to improve readability and reusability:

* keyVH(v, h)
Generates a unique key for grid coordinates (v, h).
Used for tracking block states or intersections.

* randomColor()
Returns a randomly selected color from the predefined palette.

* innerEdges()
Computes the cell boundaries or internal edges for layout precision.

* indexOfLine()
Finds an existing line (band) within arrays to prevent duplicates.

Source:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions

References
* Perlin, K. (1985). An image synthesizer. ACM SIGGRAPH Computer Graphics, 19(3), 287–296. https://doi.org/10.1145/325165.325247

* p5.js. (n.d.). noise(). Retrieved from https://p5js.org/reference/#/p5/noise

* p5.js. (n.d.). random(). Retrieved from https://p5js.org/reference/#/p5/random

* p5.js. (n.d.). image(). Retrieved from https://p5js.org/reference/#/p5/image

* p5.js. (n.d.). loadImage(). Retrieved from https://p5js.org/reference/#/p5/loadImage

* p5.js. (n.d.). keyPressed(). Retrieved from https://p5js.org/reference/#/p5/keyPressed

* p5.js. (n.d.). Program flow. Retrieved from https://p5js.org/learn/program-flow.html

* p5.js. (n.d.). Coordinate system and shapes. Retrieved from https://p5js.org/learn/coordinate-system-and-shapes.html

* Mozilla Developer Network. (n.d.). EventTarget.addEventListener(). Retrieved from https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

* Mozilla Developer Network. (n.d.). JavaScript functions. Retrieved from
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions
