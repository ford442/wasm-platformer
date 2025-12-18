#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_sprite_sheet_size;
uniform vec2 u_sprite_frame_size;
uniform vec2 u_sprite_frame_coord; // The top-left corner of the current frame in pixels
uniform float u_flip_horizontal; // A flag (0.0 or 1.0) to flip the sprite
out vec4 outColor;

void main() {
  vec2 texCoord = v_texCoord;
  if (u_flip_horizontal > 0.5) {
    texCoord.x = 1.0 - texCoord.x;
  }
  vec2 frame_uv = (u_sprite_frame_coord + texCoord * u_sprite_frame_size) / u_sprite_sheet_size;
  outColor = texture(u_texture, frame_uv);
}
