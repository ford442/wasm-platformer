#version 300 es
in vec2 a_position;
out vec2 v_texCoord;
void main() {
  // Pass the vertex position directly to the fragment shader.
  // This covers the entire screen since we use a -1 to 1 quad.
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
