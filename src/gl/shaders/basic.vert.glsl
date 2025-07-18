#version 300 es

// INPUTS from our buffers
in vec2 a_position;
// NEW: Input for texture coordinates (UVs)
in vec2 a_texCoord;

// UNIFORMS (same for all vertices)
uniform vec2 u_model_position;
uniform vec2 u_model_size;
uniform vec2 u_camera_position;

// NEW: A "varying" to pass the texture coordinate to the fragment shader
out vec2 v_texCoord;

void main() {
  // Calculate the world position (same as before)
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  
  // Calculate the final screen position (same as before)
  vec2 view_position = world_position - u_camera_position;
  gl_Position = vec4(view_position, 0.0, 1.0);

  // Pass the texture coordinate to the fragment shader
  v_texCoord = a_texCoord;
}
