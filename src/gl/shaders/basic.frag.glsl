#version 300 es
precision highp float;

// INPUT coming from the vertex shader
in vec2 v_texCoord;

// UNIFORM: The actual texture image we want to draw
uniform sampler2D u_texture;

// OUTPUT: The final color of the pixel
out vec4 outColor;

void main() {
  // Look up the color from the texture at the given coordinate.
  // The 'texture' function is a built-in GLSL function.
  outColor = texture(u_texture, v_texCoord);
}
