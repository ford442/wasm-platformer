#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_camera_position;

void main() {
  float parallaxFactor = 0.1;
  float scrollOffset = u_camera_position.x * parallaxFactor * 0.1;
  vec2 final_uv = vec2(v_texCoord.x + scrollOffset, v_texCoord.y);
  outColor = texture(u_texture, final_uv);
}
