#version 300 es

precision mediump float;
uniform vec4 light_color;
uniform vec4 ambient_light;
uniform sampler2D earthSampler;
uniform sampler2D specSampler;
uniform sampler2D nightSampler;
uniform sampler2D cloudSampler;
uniform int choice;


out vec4 fColor;

in vec4 fAmbientDiffuseColor;
in vec4 fSpecularColor;
in float fSpecularExponent;

in vec2 ftexCoord;


in vec3 Lin;
in vec3 Nin;
in vec3 Hin;


void main() {
    vec3 L = normalize(Lin);
    vec3 N = normalize(Nin);
    vec3 H = normalize(Hin);


    vec4 amb = texture(cloudSampler, ftexCoord);
    vec4 diff = pow(max(0.0, dot(N, H)), texture(cloudSampler, ftexCoord).a * 60.0) * vec4(texture(cloudSampler, ftexCoord).rgb, 1.0) * light_color;

    fColor = amb + diff;
    fColor.a = texture(cloudSampler, ftexCoord).a;

}
