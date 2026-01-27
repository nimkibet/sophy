/* love/main.js */
// --- CONFIGURATION ---
var radius = 240; 
var imgWidth = 140; 
var imgHeight = 200; 
var tunnelSpeed = 2;   
var tunnelDepth = 1500; 

// --- GLOBAL VARIABLES ---
var globalBeat = 0; 
var globalTime = 0; 

// --- ELEMENTS ---
var odrag = document.getElementById('drag-container');
var ospin = document.getElementById('spin-container');
var aImg = ospin.getElementsByTagName('img');
var aVid = ospin.getElementsByTagName('video');
var aEle = [...aImg, ...aVid]; 
var nimrodText = document.getElementById('nimrod-text'); // New Text Element

// --- SIZING ---
ospin.style.width = imgWidth + "px";
ospin.style.height = imgHeight + "px";

var ground = document.getElementById('ground');
ground.style.width = radius * 3 + "px";
ground.style.height = radius * 3 + "px";

// Reset CSS
ospin.style.animation = "none"; 
odrag.style.transform = "rotateX(0deg) rotateY(0deg)"; 

// --- SAFE AUDIO SYSTEM ---
var audioContext, analyser, dataArray;
var audioAllowed = false;

function setupAudioContext() {
    try {
        var audio = document.getElementById("myAudio");
        if (!audio) return;
        if (audioContext) return; 

        var AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        var src = audioContext.createMediaElementSource(audio);
        analyser = audioContext.createAnalyser();
        
        src.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyser.fftSize = 512;
        var bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        audioAllowed = true;
        audio.play();
    } catch (e) {
        console.warn("Audio fallback mode.", e);
        var audio = document.getElementById("myAudio");
        if(audio) audio.play();
    }
}

document.body.addEventListener('click', function() {
    setupAudioContext();
}, { once: true });


// --- HELPER: PINK/PURPLE PALETTE ---
function palette(t) {
    var a = {r:0.8, g:0.0, b:0.5}; 
    var b = {r:0.2, g:0.1, b:0.4}; 
    var c = {r:1.0, g:1.0, b:1.0}; 
    var d = {r:0.0, g:0.33, b:0.67}; 

    var r = a.r + b.r * Math.cos(6.28318 * (c.r * t + d.r));
    var g = a.g + b.g * Math.cos(6.28318 * (c.g * t + d.g));
    var b_val = a.b + b.b * Math.cos(6.28318 * (c.b * t + d.b));

    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b_val * 255)
    };
}


// --- HELPER: HEART COORDS ---
function getHeartCoords(angle, scale) {
    var t = angle;
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * scale, y: y * scale };
}

// --- PHASE 1: STATIC HEART ---
function arrangeInHeart() {
  for (var i = 0; i < aEle.length; i++) {
    var el = aEle[i];
    el.style.willChange = "transform, opacity, box-shadow"; 
    el.style.transition = "transform 2s ease-in-out, opacity 2s"; 
    el.zPos = 0; 
    el.angle = (i / aEle.length) * Math.PI * 2; 
    var coords = getHeartCoords(el.angle, 12); 
    el.style.opacity = 1;
    el.style.transform = `translate3d(${coords.x - imgWidth/2}px, ${coords.y - imgHeight/2}px, 0px)`;
  }
}

// --- PHASE 2: SPREAD ---
function startSpreading() {
    for (var i = 0; i < aEle.length; i++) {
        var el = aEle[i];
        el.style.transition = "transform 2s ease-in-out, opacity 2s"; 
        el.zPos = i * -(tunnelDepth / aEle.length); 
        el.angle = (i / aEle.length) * Math.PI * 10; 
        updateImagePosition(el);
    }
    setTimeout(startInfiniteLoop, 2000);
}

// --- PHASE 3: INFINITE LOOP ---
function startInfiniteLoop() {
    for (var i = 0; i < aEle.length; i++) {
        aEle[i].style.transition = "none"; 
    }
    animateTunnel();
}

function updateImagePosition(el) {
    var progress = 1 - (Math.abs(el.zPos) / tunnelDepth);
    if (progress < 0) progress = 0;

    var coords = getHeartCoords(el.angle, 12 * progress);
    
    var opacity = progress;
    if (el.zPos > 100) opacity = 0; 
    el.style.opacity = opacity;
    el.style.transform = `translate3d(${coords.x - imgWidth/2}px, ${coords.y - imgHeight/2}px, ${el.zPos}px)`;

    // --- AURA REACTION ---
    var col = palette(el.angle * 0.5 + globalTime * 0.5);
    var beatStrength = globalBeat * 1.5; 
    if (beatStrength > 1) beatStrength = 1; 

    // Optimized blur levels
    var blurRadius = 5 + (beatStrength * 30);  
    var spreadRadius = 1 + (beatStrength * 10); 
    
    var alpha = 0.6 + (beatStrength * 0.4); 
    
    el.style.boxShadow = `
        0px 0px ${blurRadius}px ${spreadRadius}px rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})
    `;
}

function animateTunnel() {
    globalTime += 0.005; 

    // --- NIMROD TEXT REACTION ---
    if(nimrodText) {
        // Pulse Scale: 1.0 (base) -> 1.2 (on beat)
        var scale = 1.0 + (globalBeat * 0.2);
        
        // Glow Intensity: 5px (base) -> 20px (on beat)
        var glow = 5 + (globalBeat * 15);
        
        nimrodText.style.transform = `translateX(-50%) scale(${scale})`;
        nimrodText.style.textShadow = `
            0 0 5px #fff,
            0 0 ${glow}px #ff00de,
            0 0 ${glow * 2}px #ff00de
        `;
    }

    for (var i = 0; i < aEle.length; i++) {
        var el = aEle[i];
        el.zPos -= tunnelSpeed; 
        el.angle += 0.01; 

        if (el.zPos < -tunnelDepth) {
            el.zPos = 200; 
        }
        updateImagePosition(el);
    }
    requestAnimationFrame(animateTunnel);
}

/* love/main.js - Update the Sequence Controller Section */

// --- SEQUENCE CONTROLLER ---
// We wrap this in a global function so index.html can call it exactly when needed
window.startSequence = function() {
    console.log("Starting animation sequence...");
    
    // 1. Form the Heart Shape immediately
    arrangeInHeart(); 
    
    // 2. Wait 3 seconds, then start spreading into the tunnel
    setTimeout(startSpreading, 3000); 
};

// REMOVED: window.onload = ... 
// We no longer auto-start on load. We wait for the click in index.html.

// --- INTERACTION ---
document.onpointerdown = function (e) {
  e = e || window.event;
  var sX = e.clientX, sY = e.clientY;
  this.onpointermove = function (e) {
    e = e || window.event;
    var nX = e.clientX, nY = e.clientY;
    var desX = nX - sX;
    var desY = nY - sY;
    odrag.style.transform = `rotateX(${-desY * 0.2}deg) rotateY(${desX * 0.2}deg)`;
  };
  this.onpointerup = function () {
    this.onpointermove = this.onpointerup = null;
  };
  return false;
};

document.onmousewheel = function(e) {
  e = e || window.event;
  var d = e.wheelDelta / 20 || -e.detail;
  tunnelSpeed += d * 0.1; 
};


// --- WEBGL SHADER ---
var canvas = document.getElementById("webgl-canvas"); 
var gl = canvas.getContext('webgl');

if (gl) {
    var time = 0.0;
    var vertexSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
    
    var fragmentSource = `
    precision highp float;
    uniform float width; uniform float height; uniform float time; uniform float beat;
    vec2 resolution = vec2(width, height);
    
    #define POINT_COUNT 50
    
    vec2 getHeartPosition(float t){ 
        return vec2(16.0 * sin(t) * sin(t) * sin(t), 
                    -(13.0 * cos(t) - 5.0 * cos(2.0*t) - 2.0 * cos(3.0*t) - cos(4.0*t))); 
    }
    
    float sdSegment( in vec2 p, in vec2 a, in vec2 b ) {
        vec2 pa = p-a, ba = b-a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h );
    }

    vec3 palette( in float t ) {
        vec3 a = vec3(0.8, 0.0, 0.5); 
        vec3 b = vec3(0.2, 0.1, 0.4); 
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.0, 0.33, 0.67);
        return a + b * cos( 6.28318 * (c * t + d) );
    }

    void main(){
        vec2 uv = gl_FragCoord.xy/resolution.xy; 
        float widthHeightRatio = resolution.x/resolution.y;
        vec2 centre = vec2(0.5, 0.5); 
        vec2 pos = centre - uv; 
        pos.y /= widthHeightRatio; 
        
        float baseScale = 0.000025 * height;
        float dynamicScale = baseScale + (beat * 0.000005 * height);
        
        float dist = 10000.0;
        float angleStep = 6.283185 / float(POINT_COUNT);
        
        vec2 p_prev = getHeartPosition(0.0) * dynamicScale;
        
        for(int i=1; i<=POINT_COUNT; i++) {
            float t = float(i) * angleStep;
            vec2 p_curr = getHeartPosition(t) * dynamicScale;
            float d = sdSegment(pos, p_prev, p_curr);
            dist = min(dist, d);
            p_prev = p_curr;
        }
        
        float glowIntensity = 0.002 / dist;
        glowIntensity = pow(glowIntensity, 1.2);
        
        float angle = atan(pos.y, pos.x);
        vec3 color = palette(angle * 0.5 + time * 0.5);
        
        color += beat * 0.5;
        
        vec3 finalColor = color * glowIntensity;
        gl_FragColor = vec4(finalColor, 1.0);
    }
    `;

    function compileShader(src, type) { 
        var shader = gl.createShader(type); 
        gl.shaderSource(shader, src); 
        gl.compileShader(shader); 
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader error: " + gl.getShaderInfoLog(shader));
        }
        return shader; 
    }

    var vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
    var fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    var program = gl.createProgram(); 
    gl.attachShader(program, vertexShader); 
    gl.attachShader(program, fragmentShader); 
    gl.linkProgram(program); 
    gl.useProgram(program);

    var vertexData = new Float32Array([-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0]);
    var vertexDataBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer); gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    var positionHandle = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(positionHandle); gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 0, 0);
    var timeHandle = gl.getUniformLocation(program, 'time');
    var widthHandle = gl.getUniformLocation(program, 'width');
    var heightHandle = gl.getUniformLocation(program, 'height');
    var beatHandle = gl.getUniformLocation(program, 'beat');

    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform1f(widthHandle, canvas.width); gl.uniform1f(heightHandle, canvas.height); }
    window.addEventListener('resize', resizeCanvas); resizeCanvas();
    
    var lastFrame = Date.now();
    function draw() { 
        var thisFrame = Date.now(); 
        time += (thisFrame - lastFrame) / 1000; 
        lastFrame = thisFrame;
        
        var currentBeat = 0;
        if (audioAllowed && analyser) {
            try {
                analyser.getByteFrequencyData(dataArray);
                var bassSum = 0;
                for (var i = 0; i < 30; i++) bassSum += dataArray[i];
                currentBeat = (bassSum / 30) / 255 * 1.2; 
                if(currentBeat > 1) currentBeat = 1;
            } catch(e) {}
        }

        globalBeat = currentBeat; 

        gl.uniform1f(timeHandle, time); 
        gl.uniform1f(beatHandle, currentBeat);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
        requestAnimationFrame(draw); 
    }
    draw();
}