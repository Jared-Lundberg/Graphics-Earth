import { initFileShaders, vec4, perspective, flatten, lookAt, rotateX, rotateY, scalem, vec2 } from "./helperfunctions.js";
"use strict";
let gl;
const NUM_PROGRAMS = 2;
let program;
let activeProgram = 0;
let PHONG = 0;
let earthChoice;
let choice;
let umv;
let uproj;
let mv;
let p;
let vPosition;
let vNormal;
let vAmbientDiffuseColor;
let vSpecularColor;
let vSpecularExponent;
let rotateWorld = 0;
let sunRot = 0;
let light_position;
let light_color;
let ambient_light;
let canvas;
let xAngle;
let yAngle;
let mouse_button_down = false;
let prevMouseX = 0;
let prevMouseY = 0;
let sphereverts;
let sphereBufferID;
let clouds;
let cloudRot = 0;
let vTexCoord;
let uEarthSampler;
let uSpecSampler;
let uNightSampler;
let uCloudSampler;
let earthTex;
let specTex;
let nightTex;
let cloudTex;
let specImage;
let earthImage;
let nightImage;
let cloudImage;
let anisotropic_ext;
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) {
        alert("WebGL isn't available");
    }
    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mousemove", mouse_drag);
    canvas.addEventListener("mouseup", mouse_up);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    xAngle = 0;
    yAngle = 0;
    program = [];
    program.push(initFileShaders(gl, "vshader-phong.glsl", "fshader-phong.glsl"));
    program.push(initFileShaders(gl, "vCloud.glsl", "fCloud.glsl"));
    umv = [];
    uproj = [];
    vPosition = [];
    vNormal = [];
    vAmbientDiffuseColor = [];
    vSpecularColor = [];
    vSpecularExponent = [];
    light_position = [];
    light_color = [];
    ambient_light = [];
    vTexCoord = [];
    uEarthSampler = [];
    uSpecSampler = [];
    uNightSampler = [];
    uCloudSampler = [];
    earthChoice = [];
    for (let i = 0; i < NUM_PROGRAMS; i++) {
        gl.useProgram(program[i]);
        umv.push(gl.getUniformLocation(program[i], "model_view"));
        uproj.push(gl.getUniformLocation(program[i], "projection"));
        vPosition.push(gl.getAttribLocation(program[i], "vPosition"));
        vNormal.push(gl.getAttribLocation(program[i], "vNormal"));
        vAmbientDiffuseColor.push(gl.getAttribLocation(program[i], "vAmbientDiffuseColor"));
        vSpecularColor.push(gl.getAttribLocation(program[i], "vSpecularColor"));
        vSpecularExponent.push(gl.getAttribLocation(program[i], "vSpecularExponent"));
        light_position.push(gl.getUniformLocation(program[i], "light_position"));
        light_color.push(gl.getUniformLocation(program[i], "light_color"));
        ambient_light.push(gl.getUniformLocation(program[i], "ambient_light"));
        uEarthSampler.push(gl.getUniformLocation(program[i], "earthSampler"));
        uSpecSampler.push(gl.getUniformLocation(program[i], "specSampler"));
        uNightSampler.push(gl.getUniformLocation(program[i], "nightSampler"));
        uCloudSampler.push(gl.getUniformLocation(program[i], "cloudSampler"));
        vTexCoord.push(gl.getAttribLocation(program[i], "vtexCoord"));
        earthChoice.push(gl.getUniformLocation(program[i], "choice"));
    }
    choice = 1;
    initTextures();
    generateSphere(93);
    switchShaders(PHONG);
    xAngle = 0;
    yAngle = 0;
    window.addEventListener("keydown", function (event) {
        switch (event.key) {
            case "1":
                choice = 1;
                break;
            case "2":
                choice = 2;
                break;
            case "9":
                if (clouds) {
                    clouds = false;
                }
                else {
                    clouds = true;
                }
                break;
            case "ArrowRight":
                sunRot += 10;
                break;
            case "ArrowLeft":
                sunRot -= 10;
                break;
        }
        requestAnimationFrame(render);
    });
    window.setInterval(update, 16);
    requestAnimationFrame(render);
};
function initTextures() {
    earthTex = gl.createTexture();
    earthImage = new Image();
    earthImage.onload = function () {
        handleTextureLoaded(earthImage, earthTex);
    };
    earthImage.src = 'Earth.png';
    specTex = gl.createTexture();
    specImage = new Image();
    specImage.onload = function () {
        handleTextureLoaded(specImage, specTex);
    };
    specImage.src = 'EarthSpec.png';
    nightTex = gl.createTexture();
    nightImage = new Image();
    nightImage.onload = function () {
        handleTextureLoaded(nightImage, nightTex);
    };
    nightImage.src = 'EarthNight.png';
    cloudTex = gl.createTexture();
    cloudImage = new Image();
    cloudImage.onload = function () {
        handleTextureLoaded(cloudImage, cloudTex);
    };
    cloudImage.src = 'earthcloudmap-visness.png';
}
function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    anisotropic_ext = gl.getExtension("EXT_texture_filter_anisotropic");
    gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 16);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
function switchShaders(index) {
    gl.disableVertexAttribArray(vPosition[activeProgram]);
    gl.disableVertexAttribArray(vNormal[activeProgram]);
    gl.disableVertexAttribArray(vTexCoord[activeProgram]);
    gl.useProgram(program[index]);
    activeProgram = index;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    p = perspective(60, (canvas.clientWidth / canvas.clientHeight), 5, 500);
    gl.uniformMatrix4fv(uproj[index], false, p.flatten());
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBufferID);
    gl.vertexAttribPointer(vPosition[activeProgram], 4, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(vPosition[activeProgram]);
    gl.vertexAttribPointer(vNormal[activeProgram], 4, gl.FLOAT, false, 40, 16);
    gl.enableVertexAttribArray(vNormal[activeProgram]);
    gl.vertexAttribPointer(vTexCoord[activeProgram], 2, gl.FLOAT, false, 40, 32);
    gl.enableVertexAttribArray(vTexCoord[activeProgram]);
}
function generateSphere(subdiv) {
    let step = (360.0 / subdiv) * (Math.PI / 180.0);
    sphereverts = [];
    for (let lat = 0; lat <= Math.PI; lat += step) {
        for (let lon = 0; lon + step <= 2 * Math.PI; lon += step) {
            //triangle 1
            sphereverts.push(new vec4(Math.sin(lat) * Math.cos(lon), Math.sin(lon) * Math.sin(lat), Math.cos(lat), 1.0)); //position
            sphereverts.push(new vec4(Math.sin(lat) * Math.cos(lon), Math.sin(lon) * Math.sin(lat), Math.cos(lat), 0.0)); //normal
            sphereverts.push(new vec2(-lon / (2 * Math.PI), lat / Math.PI)); //Texture
            sphereverts.push(new vec4(Math.sin(lat) * Math.cos(lon + step), Math.sin(lat) * Math.sin(lon + step), Math.cos(lat), 1.0));
            sphereverts.push(new vec4(Math.sin(lat) * Math.cos(lon + step), Math.sin(lat) * Math.sin(lon + step), Math.cos(lat), 0.0));
            sphereverts.push(new vec2(-(lon + step) / (2 * Math.PI), lat / Math.PI)); //Texture
            sphereverts.push(new vec4(Math.sin(lat + step) * Math.cos(lon + step), Math.sin(lon + step) * Math.sin(lat + step), Math.cos(lat + step), 1.0));
            sphereverts.push(new vec4(Math.sin(lat + step) * Math.cos(lon + step), Math.sin(lon + step) * Math.sin(lat + step), Math.cos(lat + step), 0.0));
            sphereverts.push(new vec2(-(lon + step) / (2 * Math.PI), (lat + step) / Math.PI)); //Textue
            //triangle 2
            sphereverts.push(new vec4(Math.sin(lat + step) * Math.cos(lon + step), Math.sin(lon + step) * Math.sin(lat + step), Math.cos(lat + step), 1.0));
            sphereverts.push(new vec4(Math.sin(lat + step) * Math.cos(lon + step), Math.sin(lon + step) * Math.sin(lat + step), Math.cos(lat + step), 0.0));
            sphereverts.push(new vec2(-(lon + step) / (2 * Math.PI), (lat + step) / Math.PI)); //Texture
            sphereverts.push(new vec4(Math.sin(lat + step) * Math.cos(lon), Math.sin(lat + step) * Math.sin(lon), Math.cos(lat + step), 1.0));
            sphereverts.push(new vec4(Math.sin(lat + step) * Math.cos(lon), Math.sin(lat + step) * Math.sin(lon), Math.cos(lat + step), 0.0));
            sphereverts.push(new vec2(-lon / (2 * Math.PI), (lat + step) / Math.PI)); //Texture
            sphereverts.push(new vec4(Math.sin(lat) * Math.cos(lon), Math.sin(lon) * Math.sin(lat), Math.cos(lat), 1.0));
            sphereverts.push(new vec4(Math.sin(lat) * Math.cos(lon), Math.sin(lon) * Math.sin(lat), Math.cos(lat), 0.0));
            sphereverts.push(new vec2(-lon / (2 * Math.PI), lat / Math.PI)); //Texture
        }
    }
    sphereBufferID = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBufferID);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereverts), gl.STATIC_DRAW);
}
function mouse_drag(event) {
    let thetaY, thetaX;
    if (mouse_button_down) {
        thetaY = 360.0 * (event.clientX - prevMouseX) / canvas.clientWidth;
        thetaX = 360.0 * (event.clientY - prevMouseY) / canvas.clientHeight;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        xAngle += thetaX;
        yAngle += thetaY;
    }
}
function mouse_down(event) {
    mouse_button_down = true;
    prevMouseX = event.clientX;
    prevMouseY = event.clientY;
}
function mouse_up() {
    mouse_button_down = false;
}
window.addEventListener("keydown", function (event) {
    switch (event.key) {
        default:
            switchShaders(PHONG);
    }
});
function update() {
    rotateWorld += 0.1;
    sunRot += 0.2;
    cloudRot += 0.05;
    requestAnimationFrame(render);
}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    switchShaders(0);
    mv = lookAt(new vec4(0, 0, 10, 1), new vec4(0, 0, 0, 1), new vec4(0, 1, 0, 0));
    let sunMV = mv;
    let cloudMV = mv;
    sunMV = sunMV.mult(rotateY(sunRot));
    mv = mv.mult(rotateY(yAngle - rotateWorld).mult(rotateX(xAngle + 90)));
    mv = mv.mult(scalem(4, 4, 4));
    gl.uniformMatrix4fv(umv[activeProgram], false, mv.flatten());
    if (choice == 1) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, earthTex);
        gl.uniform1i(uEarthSampler[activeProgram], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, specTex);
        gl.uniform1i(uSpecSampler[activeProgram], 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, nightTex);
        gl.uniform1i(uNightSampler[activeProgram], 2);
        gl.vertexAttrib4fv(vAmbientDiffuseColor[activeProgram], [0.0, 0.0, 0.0, 1]);
        gl.vertexAttrib4fv(vSpecularColor[activeProgram], [1.0, 1.0, 1.0, 1.0]);
        gl.vertexAttrib1f(vSpecularExponent[activeProgram], 80.0);
        gl.uniform4fv(light_position[activeProgram], sunMV.mult(new vec4(50, 0, 50, 1)).flatten());
        gl.uniform4fv(light_color[activeProgram], [1.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(ambient_light[activeProgram], [0, 0, 0, 0]);
    }
    if (choice == 2) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, specTex);
        gl.uniform1i(uSpecSampler[activeProgram], 0);
        gl.vertexAttrib4fv(vAmbientDiffuseColor[activeProgram], [0.0, 0.0, 0.0, 1]);
        gl.vertexAttrib4fv(vSpecularColor[activeProgram], [1.0, 1.0, 1.0, 1.0]);
        gl.vertexAttrib1f(vSpecularExponent[activeProgram], 40.0);
        gl.uniform4fv(light_position[activeProgram], sunMV.mult(new vec4(50, 50, 50, 1)).flatten());
        gl.uniform4fv(light_color[activeProgram], [1.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(ambient_light[activeProgram], [.2, .2, .2, 2]);
    }
    gl.uniform1i(earthChoice[0], choice);
    gl.drawArrays(gl.TRIANGLES, 0, sphereverts.length / 3);
    if (clouds) {
        switchShaders(1);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cloudTex);
        gl.uniform1i(uCloudSampler[activeProgram], 0);
        cloudMV = cloudMV.mult(scalem(4.1, 4.1, 4.1));
        cloudMV = cloudMV.mult(rotateY(-cloudRot));
        gl.uniformMatrix4fv(umv[activeProgram], false, cloudMV.flatten());
        gl.drawArrays(gl.TRIANGLES, 0, sphereverts.length / 3);
        gl.disable(gl.BLEND);
        gl.blendFunc(null, null);
        gl.depthMask(true);
    }
}
//# sourceMappingURL=texturefunctions.js.map