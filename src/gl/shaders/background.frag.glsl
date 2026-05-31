#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_camera_position;
uniform vec2 u_resolution;
uniform vec2 u_texture_size;
uniform vec2 u_scroll_factor;
uniform float u_scale;
uniform float u_offset_y;
out vec4 outColor;
void main() {
  vec2 uv = v_texCoord;
  uv.y = 1.0 - uv.y;
  float screenAspect = u_resolution.x / u_resolution.y;
  float textureAspect = u_texture_size.x / u_texture_size.y;
  float uv_x_scale = screenAspect / textureAspect;
  uv.x = uv.x * uv_x_scale - (uv_x_scale - 1.0) / 2.0;
  float safeScale = max(u_scale, 0.001);
  uv = (uv - vec2(0.5)) / safeScale + vec2(0.5);
  vec2 scrollOffset = vec2(
    u_camera_position.x * u_scroll_factor.x * 0.05,
    u_camera_position.y * u_scroll_factor.y * 0.05 + u_offset_y * 0.05
  );
  uv += scrollOffset;
  outColor = texture(u_texture, uv);
}
