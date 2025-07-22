#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec2 u_camera_position;
uniform vec2 u_resolution;
uniform vec2 u_texture_size;

out vec4 outColor;

void main() {
  float screenAspect = u_resolution.x / u_resolution.y;
  float textureAspect = u_texture_size.x / u_texture_size.y;

  vec2 uv = v_texCoord;

  // Scale the background to cover the screen without stretching
  float uv_x_scale = screenAspect / textureAspect;
  uv.x = uv.x * uv_x_scale - (uv_x_scale - 1.0) / 2.0;

  // Apply parallax scrolling
  float parallaxFactor = 0.4;
  // This offset is scaled down significantly to prevent the background from scrolling too fast.
  // The world-space camera position is mapped to a much smaller texture-space offset.
  float scrollOffset = u_camera_position.x * parallaxFactor * 0.05; 
  uv.x += scrollOffset;
  
  outColor = texture(u_texture, uv);
}
