#version 300 es
in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_model_position;
uniform vec2 u_model_size;
uniform vec2 u_camera_position;
uniform vec2 u_sprite_frame_size;
uniform vec2 u_sprite_sheet_size;
uniform vec2 u_sprite_frame_coord;

// NEW: A boolean to control horizontal flipping
uniform bool u_flip_horizontal;

out vec2 v_texCoord;

void main() {
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  vec2 view_position = world_position - u_camera_position;
  gl_Position = vec4(view_position, 0.0, 1.0);

  // Create a temporary variable for texture coordinates
  vec2 final_texCoord = a_texCoord;

  // If the flip uniform is true, flip the x-coordinate
  if (u_flip_horizontal) {
    final_texCoord.x = 1.0 - final_texCoord.x;
  }

  // Calculate the actual texture coordinate within the spritesheet
  vec2 texelSize = u_sprite_frame_size / u_sprite_sheet_size;
  v_texCoord = (u_sprite_frame_coord / u_sprite_sheet_size) + (final_texCoord * texelSize);
}
