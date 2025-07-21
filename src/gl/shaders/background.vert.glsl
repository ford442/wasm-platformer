#version 300 es
in vec2 a_position; // A simple quad from -1 to 1
uniform vec2 u_camera_position;
uniform vec2 u_texture_size;
uniform vec2 u_resolution;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);

  // Calculate the aspect ratio of the screen and the background image
  float screenAspect = u_resolution.x / u_resolution.y;
  float textureAspect = u_texture_size.x / u_texture_size.y;

  // Calculate UV coordinates for the background
  vec2 uv = a_position * 0.5 + 0.5; // Convert from clip space to UV space
  
  // Parallax scrolling effect
  float parallaxFactor = 0.5;
  uv.x += (u_camera_position.x * parallaxFactor) / u_texture_size.x;
  
  // Adjust for aspect ratio differences to prevent stretching
  if (screenAspect > textureAspect) {
    float newHeight = u_texture_size.y * (textureAspect / screenAspect);
    float offset = (u_texture_size.y - newHeight) / 2.0;
    uv.y = (uv.y * newHeight + offset) / u_texture_size.y;
  } else {
    float newWidth = u_texture_size.x * (screenAspect / textureAspect);
    float offset = (u_texture_size.x - newWidth) / 2.0;
    uv.x = (uv.x * newWidth + offset) / u_texture_size.x;
  }
  
  v_texCoord = uv;
}
