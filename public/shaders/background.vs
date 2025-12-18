#version 300 es
layout(location=0) in vec4 a_bg_data; // x, y, type, parallax_factor

uniform vec2 u_resolution;
uniform vec2 u_camera;

out float v_type;

void main() {
    vec2 pos = a_bg_data.xy - u_camera * a_bg_data.w;
    gl_Position = vec4((pos / u_resolution * 2.0 - 1.0) * vec2(1, -1), 0, 1);
    gl_PointSize = 30.0;
    v_type = a_bg_data.z;
}
