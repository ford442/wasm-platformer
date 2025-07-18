#version 300 es
precision highp float;

// UNIFORM: The color passed from our code.
uniform vec4 u_color;

// OUTPUT: The final color of the pixel.
out vec4 outColor;

void main() {
  // Set the output color to the value of the uniform.
  outColor = u_color;
}
