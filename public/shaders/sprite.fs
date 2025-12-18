#version 300 es
precision highp float;

uniform sampler2D u_texture;
in vec4 v_tex;
out vec4 outColor;

void main() {
    vec2 texCoord = v_tex.xy + gl_PointCoord * v_tex.zw;
    outColor = texture(u_texture, texCoord / vec2(textureSize(u_texture, 0)));
    if (outColor.a < 0.1) discard;
}
