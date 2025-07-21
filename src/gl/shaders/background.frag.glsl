#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_camera_position;
uniform vec2 u_resolution;
uniform vec2 u_texture_size;

out vec4 outColor;

void main() {
  // Calculate aspect ratios
  float screenAspect = u_resolution.x / u_resolution.y;
  float textureAspect = u_texture_size.x / u_texture_size.y;

  // Start with the screen UVs
  vec2 uv = v_texCoord;

  // Adjust UVs to prevent stretching and show the full height of the background
  uv.x *= screenAspect / textureAspect;
  // Center the scaled texture horizontally
  uv.x += (1.0 - (screenAspect / textureAspect)) / 2.0;

  // Apply parallax scrolling with an increased factor
  float parallaxFactor = 0.4;
  // Scale the scroll offset to be more noticeable
  float scrollOffset = u_camera_position.x * parallaxFactor * 0.1;
  uv.x += scrollOffset;
  
  outColor = texture(u_texture, uv);
}
