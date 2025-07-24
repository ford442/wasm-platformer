#version 300 es
layout(location=0) in vec4 a_rect; // x, y, w, h
layout(location=1) in vec4 a_tex;  // u, v, uw, vh

uniform vec2 u_resolution;

out vec4 v_tex;

void main() {
    vec2 pos = a_rect.xy;
    gl_Position = vec4((pos / u_resolution * 2.0 - 1.0) * vec2(1, -1), 0, 1);
    gl_PointSize = max(a_rect.z, a_rect.w); // Use the larger of width/height
    v_tex = a_tex;
}
