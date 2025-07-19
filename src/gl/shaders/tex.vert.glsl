#version 300 es
in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_model_position;
uniform vec2 u_model_size;
uniform vec2 u_camera_position;

uniform vec2 u_sprite_frame_size; // The size of one frame in the sheet (e.g., 64x64)
uniform vec2 u_sprite_sheet_size; // The total size of the spritesheet image
uniform vec2 u_sprite_frame_coord; // The top-left corner of the current frame (e.g., frame 2, row 1)
uniform bool u_flip_horizontal;

out vec2 v_texCoord;

void main() {
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  vec2 view_position = world_position - u_camera_position;
  gl_Position = vec4(view_position, 0.0, 1.0);
  
  vec2 texCoord = a_texCoord;
  if (u_flip_horizontal) {
    texCoord.x = 1.0 - texCoord.x;
  }
  
  vec2 texelSize = u_sprite_frame_size / u_sprite_sheet_size;
  v_texCoord = (u_sprite_frame_coord / u_sprite_sheet_size) + (texCoord * texelSize);
}
