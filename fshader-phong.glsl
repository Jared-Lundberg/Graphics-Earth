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
    //ambient term
    if(choice == 1){

        vec4 amb = texture(earthSampler, ftexCoord);
        vec4 spec = pow(max(0.0, dot(N, H)), texture(specSampler, ftexCoord).a * 60.0) * vec4(texture(specSampler, ftexCoord).rgb, 1.0) * light_color;
        vec4 diff = max(0.0, dot(L, N)) * fAmbientDiffuseColor * light_color;

        if(dot(L,N) < 0.4 && dot(L,N) > -0.4){
            amb = texture(earthSampler, ftexCoord) * ((dot(L,N) + 0.4) / (0.4 + 0.4)) + texture(nightSampler, ftexCoord) * (1.0 - (dot(L,N) + 0.4) / (0.4 + 0.4));
        }
        if(dot(L,N) < -0.4){
            amb = texture(nightSampler, ftexCoord);
            spec = vec4(0, 0, 0, 0);
        }

        //diffuse term


        //specular term


        if (dot(L, N) < 0.0){
            spec = vec4(0, 0, 0, texture(specSampler, ftexCoord));
        }
        fColor = amb + spec + diff;
        fColor.a = 1.0;
    }
    if(choice == 2){
        vec4 amb = fAmbientDiffuseColor * ambient_light;

        //diffuse term
        vec4 diff = max(0.0, dot(L, N)) * fAmbientDiffuseColor * light_color;

        //specular term
        vec4 spec = pow(max(0.0, dot(N, H)), texture(specSampler, ftexCoord).a * 60.0) * vec4(texture(specSampler, ftexCoord).rgb, 1.0) * light_color;

        if (dot(L, N) < 0.0){
            spec = vec4(0, 0, 0, texture(specSampler, ftexCoord));
        }
        fColor = amb + spec + diff;
        fColor.a = 1.0;
    }
}
