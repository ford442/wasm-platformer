#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform mat4 u_projection;
uniform vec2 u_camera_position;
uniform vec2 u_model_position;
uniform vec2 u_model_size;

out vec2 v_texCoord;

void main() {
  // Calculate the world position of the vertex
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  
  // Calculate the position relative to the camera
  vec2 view_position = world_position - u_camera_position;

  // Apply the projection matrix
  gl_Position = u_projection * vec4(view_position, 0.0, 1.0);
  
  v_texCoord = a_texCoord;
}
