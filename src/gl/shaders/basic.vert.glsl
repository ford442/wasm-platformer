#version 300 es

in vec2 a_position;

uniform vec2 u_model_position;
uniform vec2 u_model_size;
// NEW: A uniform for the camera's world position
uniform vec2 u_camera_position;

void main() {
  // Calculate the object's world position
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  
  // To create the scrolling effect, subtract the camera's position from the world position.
  // This moves the entire world in the opposite direction of the camera.
  vec2 view_position = world_position - u_camera_position;

  gl_Position = vec4(view_position, 0.0, 1.0);
}
