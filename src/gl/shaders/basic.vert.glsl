#version 300 es

// INPUT: The position of a vertex in the object's local space (a 1x1 square).
in vec2 a_position;

// UNIFORMS: Data passed from our code.
uniform vec2 u_model_position; // The center position of the object
uniform vec2 u_model_size;     // The width and height of the object

void main() {
  // Scale the vertex position by the size, then add the world position.
  vec2 final_position = (a_position * u_model_size) + u_model_position;

  gl_Position = vec4(final_position, 0.0, 1.0);
}
