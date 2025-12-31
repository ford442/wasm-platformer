#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_camera_position;
uniform vec2 u_resolution;
uniform vec2 u_texture_size;
out vec4 outColor;
void main() {
  vec2 uv = v_texCoord;
  uv.y = 1.0 - uv.y;
  float screenAspect = u_resolution.x / u_resolution.y;
  float textureAspect = u_texture_size.x / u_texture_size.y;
  float uv_x_scale = screenAspect / textureAspect;
  uv.x = uv.x * uv_x_scale - (uv_x_scale - 1.0) / 2.0;
  float parallaxFactor = 0.4;
  float scrollOffset = u_camera_position.x * parallaxFactor * 0.05;
  uv.x += scrollOffset;
  outColor = texture(u_texture, uv);
}
