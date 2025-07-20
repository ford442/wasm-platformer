#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
uniform vec2 u_model_position;
uniform vec2 u_model_size;
uniform vec2 u_camera_position;
out vec2 v_texCoord;

void main() {
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  vec2 view_position = world_position - u_camera_position;
  gl_Position = vec4(view_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
