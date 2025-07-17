#version 300 es

// We must specify the precision for floating point numbers in a fragment shader.
precision highp float;

// This is the output variable for our shader. It determines the final color of a pixel.
// It's a 4D vector representing (red, green, blue, alpha).
out vec4 outColor;

// This is the main function that runs for every pixel.
void main() {
  // We're setting the color to a solid blue with full opacity.
  // RGBA values are from 0.0 to 1.0.
  outColor = vec4(0.0, 0.67, 1.0, 1.0); // Our theme's primary color
}
