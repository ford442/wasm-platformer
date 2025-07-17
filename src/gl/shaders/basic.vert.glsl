#version 300 es

// INPUT: The position of a vertex in the object's local space.
in vec2 a_position;

// UNIFORM: A global variable passed from our JS/C++ code.
// This will represent the object's position in the world.
uniform vec2 u_model_position;

void main() {
  // Calculate the final position by adding the object's world position
  // to the vertex's local position.
  vec2 final_position = a_position + u_model_position;

  gl_Position = vec4(final_position, 0.0, 1.0);
}
