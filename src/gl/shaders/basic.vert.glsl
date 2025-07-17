#version 300 es

// This is an "attribute" - an input to the vertex shader that comes from a buffer.
// It represents the position (x, y) of a single vertex.
in vec2 a_position;

// This is the main function that runs for every vertex.
void main() {
  // gl_Position is a special, built-in variable that determines the final
  // position of the vertex on the screen.
  // We create a 4D vector (x, y, z, w) because that's what the graphics pipeline expects.
  gl_Position = vec4(a_position, 0.0, 1.0);
}
