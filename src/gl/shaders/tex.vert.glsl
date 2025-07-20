#version 300 es
in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_model_position;
uniform vec2 u_model_size;
uniform vec2 u_camera_position;
uniform vec2 u_sprite_frame_size;
uniform vec2 u_sprite_sheet_size;
uniform vec2 u_sprite_frame_coord;

// NEW: A float to control horizontal flipping (1.0 = normal, -1.0 = flipped)
uniform float u_flip_horizontal;

out vec2 v_texCoord;

void main() {
  // Apply the flip to the local vertex position before scaling and positioning.
  vec2 flipped_position = a_position * vec2(u_flip_horizontal, 1.0);

  vec2 world_position = (flipped_position * u_model_size) + u_model_position;
  vec2 view_position = world_position - u_camera_position;
  gl_Position = vec4(view_position, 0.0, 1.0);

  // The texture coordinate calculation is now simple and doesn't need to worry about flipping.
  vec2 texelSize = u_sprite_frame_size / u_sprite_sheet_size;
  v_texCoord = (u_sprite_frame_coord / u_sprite_sheet_size) + (a_texCoord * texelSize);
}
