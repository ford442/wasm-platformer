#version 300 es
precision highp float;

in float v_type;
out vec4 outColor;

void main() {
    vec3 color = vec3(0.2, 0.4, 0.6);
    if (v_type > 1.5) color = vec3(0.3, 0.5, 0.7);
    if (v_type > 2.5) color = vec3(0.4, 0.6, 0.8);
    
    float dist = distance(gl_PointCoord, vec2(0.5));
    float circle = 1.0 - smoothstep(0.4, 0.5, dist);
    
    outColor = vec4(color, circle * 0.5);
    if (outColor.a < 0.01) discard;
}
