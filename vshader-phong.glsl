#version 300 es

in vec4 vPosition;
in vec4 vNormal;
in vec4 vAmbientDiffuseColor; //material color
in vec4 vSpecularColor;
in float vSpecularExponent;

out vec3 Lin;
out vec3 Hin;
out vec3 Nin;

out vec4 fAmbientDiffuseColor;
out vec4 fSpecularColor;
out float fSpecularExponent;

in vec2 vtexCoord;

out vec2 ftexCoord;



uniform mat4 model_view;
uniform mat4 projection;
uniform vec4 light_position;


void main() {

    vec4 veyepos = model_view*vPosition;
    vec3 L = normalize(light_position.xyz - veyepos.xyz);
    vec3 V = normalize(-veyepos.xyz);
    vec3 H = normalize(L+V);

    vec3 N = normalize((model_view * vNormal).xyz);

    ftexCoord = vtexCoord;

    Lin = L;
    Hin = H;
    Nin = N;
    fAmbientDiffuseColor = vAmbientDiffuseColor;
    fSpecularColor = vSpecularColor;
    fSpecularExponent = vSpecularExponent;

    gl_Position = projection * veyepos;
}
