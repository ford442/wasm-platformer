#version 300 es
precision highp float;

// Input from the vertex shader
in vec2 v_texCoord;

// Uniforms for texture and animation data
uniform sampler2D u_texture;
uniform vec2 u_sprite_sheet_size;
uniform vec2 u_sprite_frame_size;
uniform vec2 u_sprite_frame_coord; // The top-left corner of the current frame in pixels
uniform float u_flip_horizontal; // A flag (0.0 or 1.0) to flip the sprite

// Output color for the pixel
out vec4 outColor;

void main() {
  vec2 texCoord = v_texCoord;

  // If the flip uniform is set, reverse the x-coordinate of the texture lookup
  if (u_flip_horizontal > 0.5) {
    texCoord.x = 1.0 - texCoord.x;
  }

  // Calculate the final UV coordinate within the specific sprite frame
  // 1. Scale the incoming texCoord by the frame size
  // 2. Add the starting coordinate of the frame
  // 3. Normalize the result by the total sheet size to get a [0, 1] UV value
  vec2 frame_uv = (u_sprite_frame_coord + texCoord * u_sprite_frame_size) / u_sprite_sheet_size;
  
  // Sample the texture at the calculated coordinate
  outColor = texture(u_texture, frame_uv);
}
