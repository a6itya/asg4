// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1.0)));
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform vec3 u_lightColor;
  uniform vec3 u_spotlightDir;
  uniform float u_spotlightCutoff;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;

  void main() {
    if (u_whichTexture == -3) { 
      gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);           
    } 
    else if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;                    
    } 
    else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);          
    }
    else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);   
    }
    else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);   
    }
    else {
      gl_FragColor = vec4(1,.2,.2,1);               
    }

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r = length(lightVector);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(L, N), 0.0);

    // Reflection vector
    vec3 R = reflect(-L, N);

    // eye 
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    // Specular
    float specular = pow(max(dot(E, R), 0.0), 64.0) * 0.8;

    vec3 diffuse = u_lightColor * vec3(gl_FragColor) * nDotL * 0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.2;
    
    if (u_lightOn) {
      // Spotlight calculation
      vec3 spotlightDir = normalize(u_spotlightDir);
      float cosAngle = dot(-L, spotlightDir);
      float cutoff = cos(radians(u_spotlightCutoff));
      float spotlightEffect = 0.0;
      
      if (cosAngle > cutoff) {
        spotlightEffect = pow(cosAngle, 32.0); // Soft edge
      }
      
      if (u_whichTexture == 0) {
        gl_FragColor = vec4((specular + diffuse + ambient) * spotlightEffect, 1.0);
      }
      else {
        gl_FragColor = vec4(diffuse + ambient, 1.0);
      }
    }
  }`

// Global variables
let canvas;
let gl; 
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_NormalMatrix;
let u_GlobalRotateMatrix;
let u_lightPos;
let u_cameraPos;
let u_lightOn;
let u_lightColor;
let u_spotlightDir;
// let u_Sampler0;
// let u_Sampler1;

var g_lastMouseX = -1;
var g_isMouseDown = false;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  gl.enable(gl.DEPTH_TEST);
  return true; 
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of a_Normal
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

   // Get the storage location of u_lightPos
   u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
   if (!u_lightPos) {
     console.log('Failed to get the storage location of u_lightPos');
     return;
   }
 
    // Get the storage location of u_cameraPos
    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
      console.log('Failed to get the storage location of u_cameraPos');
      return;
    }
 
   // Get the storage location of u_lightOn
   u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
   if (!u_lightOn) {
     console.log('Failed to get the storage location of u_lightOn');
     return;
   }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return; 
  }

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return; 
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return; 
  }

   // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return; 
  }

  // Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  // Get the storage location of u_whichTexture
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  // Get the storage location of u_lightColor
  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
  if (!u_lightColor) {
    console.log('Failed to get the storage location of u_lightColor');
    return;
  }

  // Get the storage location of u_spotlightDir
  u_spotlightDir = gl.getUniformLocation(gl.program, 'u_spotlightDir');
  if (!u_spotlightDir) {
    console.log('Failed to get the storage location of u_spotlightDir');
    return;
  }

  // Get the storage location of u_spotlightCutoff
  u_spotlightCutoff = gl.getUniformLocation(gl.program, 'u_spotlightCutoff');
  if (!u_spotlightCutoff) {
    console.log('Failed to get the storage location of u_spotlightCutoff');
    return;
  }

  // Set an initial value for this matrix to identity 
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_globalAngle = 0;
let g_normalOn = false;
let g_lightPos = [0,1,-2];
let g_lightColor = [1.0, 1.0, 0.9];
let g_lightOn = false;
let g_spotDir = [0, -1, 0]; 
let g_spotoff = 0.0; 
                       
var g_lastFrameTime = performance.now();
var g_frameCount = 0;                         
var g_fpsDisplay = 0;                         
var g_fpsUpdateTime = performance.now();

function mousemove(ev) {
  if (g_isMouseDown) {
    const x = ev.clientX;
    if (g_lastMouseX !== -1) {
      const deltaX = x - g_lastMouseX;
      if (deltaX !== 0) {
        g_camera.rotateWithMouse(deltaX);
        renderAllShapes();
      }
    }
    g_lastMouseX = x;
  }
}

function mousedown(ev) {
  g_isMouseDown = true;
  g_lastMouseX = ev.clientX;
}

function mouseup(ev) {
  g_isMouseDown = false;
  g_lastMouseX = -1;
}

function addActionsForHTMLUI() {
  // Register keyboard and mouse event handlers
  document.onkeydown = keydown;
  canvas.onmousedown = function(ev) {
    mousedown(ev);
    // Focus the canvas when clicked
    canvas.focus();
  };
  document.onmouseup = mouseup;
  document.onmousemove = mousemove;

  // Normalization on and off 
  document.getElementById('normalOn').onclick = function() {g_normalOn = true};
  document.getElementById('normalOff').onclick = function() {g_normalOn = false};

  // Light on and off 
  document.getElementById('lightOn').onclick = function() {g_lightOn = true};
  document.getElementById('lightOff').onclick = function() {g_lightOn = false};

  // Light position slider
  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_lightPos[0] = this.value / 100; renderAllShapes();}});
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_lightPos[1] = this.value / 100; renderAllShapes();}});
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_lightPos[2] = this.value / 100; renderAllShapes();}});
  
  // Light color slider
  document.getElementById('lightColorR').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_lightColor[0] = this.value / 100; renderAllShapes();}});
  document.getElementById('lightColorG').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_lightColor[1] = this.value / 100; renderAllShapes();}});
  document.getElementById('lightColorB').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_lightColor[2] = this.value / 100; renderAllShapes();}});

  // Spotlight direction slider
  document.getElementById('spotlightDirX').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_spotDir[0] = this.value / 100; renderAllShapes();}});
  document.getElementById('spotlightDirY').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_spotDir[1] = this.value / 100; renderAllShapes();}});
  document.getElementById('spotlightDirZ').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_spotDir[2] = this.value / 100; renderAllShapes();}});

  // Spotlight cutoff slider
  document.getElementById('spotlightCutoff').addEventListener('mousemove', function(ev) {if(ev.buttons === 1) {g_spotoff = this.value / 100; renderAllShapes();}});
}

function initTextures() {

  // Grass texture
  let grassImage = new Image();
  if (!grassImage) {
    console.log('Failed to create the grass image object');
    return false;
  }
  grassImage.onload = function () {
    sendTextureToTEXTURE0(grassImage);
  };
  grassImage.src = '../img/grass.jpg';

  // Dirt texture
  let dirtImage = new Image();
  if (!dirtImage) {
    console.log('Failed to create the dirt image object');
    return false;
  }
  dirtImage.onload = function () {
    sendTextureToTEXTURE1(dirtImage);
  };
  dirtImage.src = '../img/dirt.jpg';

  return true;
}

function sendTextureToTEXTURE0(image) {
  var texture = gl.createTexture();   
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler0, 0);

  console.log('Grass texture loaded successfully');
}

function sendTextureToTEXTURE1(image) {
  var texture = gl.createTexture();   
  if (!texture) {
    console.log('Failed to create the dirt texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler1, 1);

  console.log('Dirt texture loaded successfully');
}

function main() {
  // Set up canvas and gl variables
  setupWebGL();

  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Initialize camera with correct canvas dimensions
  g_camera = new Camera(canvas.width, canvas.height);
  console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

  // Set up actions for HTML UI elements
  addActionsForHTMLUI();
  
  // Make canvas focusable for keyboard events
  canvas.tabIndex = 0;
  // Focus canvas by default
  canvas.focus();

  // Initialize textures
  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Initial render
  renderAllShapes();
  
  // Start the animation loop
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0; 
var g_seconds = performance.now90/1000.0+g_startTime;  

function tick() {
  g_seconds = performance.now() / 1000.0 + g_startTime;
  
  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  const minX = -2;
  const maxX = 5;
  const t = (Math.sin(g_seconds) + 1) / 2; 
  g_lightPos[0] = minX + (maxX - minX) * t;
}
var g_shapesList = [];

// function convertCoordinatesEventToGL(ev){
//   var x = ev.clientX; // x coordinate of a mouse pointer
//   var y = ev.clientY; // y coordinate of a mouse pointer
//   var rect = ev.target.getBoundingClientRect();

//   // Convert to WebGL coordinates (-1 to +1)
//   x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
//   y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

//   return([x,y]);
// }


function keydown(ev) {
  console.log(`Key pressed: ${ev.key}, KeyCode: ${ev.keyCode}`);
  
  // camera movement
  if(ev.keyCode == 87) {g_camera.moveForward();}  // W key
  if(ev.keyCode == 83) {g_camera.moveBackward();} // S key
  if(ev.keyCode == 65) {g_camera.moveLeft();}     // A key
  if(ev.keyCode == 68) {g_camera.moveRight();}    // D key

  // camera rotation
  if(ev.keyCode == 81) {g_camera.panLeft();}      // Q key
  if(ev.keyCode == 69) {g_camera.panRight();}     // E key
  
  renderAllShapes();
}

var g_camera; // Just declare the variable, will be initialized in main()

var g_map = [
  // [1, 1, 1, 1, 1, 1, 1, 1],
  // [1, 0, 0, 0, 0, 0, 0, 1],
  // [1, 0, 0, 0, 0, 0, 0, 1],
  // [1, 0, 0, 1, 1, 0, 0, 1],
  // [1, 0, 0, 0, 0, 0, 0, 1],
  // [1, 0, 0, 0, 0, 0, 0, 1],
  // [1, 0, 0, 0, 1, 0, 0, 1],
  // [1, 0, 0, 0, 0, 0, 0, 1],
];

// for (let i = 0; i < 32; i++) {
//   g_map[i] = [];
//   for (let j = 0; j < 32; j++) {
//     // Generate a map pattern
//     if (i === 0 || i === 31 || j === 0 || j === 31) {
//       g_map[i][j] = 3 + Math.floor(Math.random() * 2); // Heights 3-4
//     } 
//     else if (i === 10 && j >= 10 && j <= 20) {
//       g_map[i][j] = 5; // Tall wall
//     }
//     else if (j === 15 && i >= 5 && i <= 15) {
//       g_map[i][j] = 4; // Medium wall
//     }
//     else if (i > 20 && j > 20 && (i % 3 === 0 || j % 3 === 0)) {
//       g_map[i][j] = 2 + (i + j) % 3; // Heights 2-4
//     }
//     else if ((i % 8 === 0 && j % 8 === 0)) {
//       g_map[i][j] = 6; // Tall pillars
//     }
//     else {
//       g_map[i][j] = 1; // Base terrain
//     }
//   }
// }

// function drawMap(){
//   var body = new Cube();
//   for (i=0;i<2;i++){
// for (x=0;x<32;x++){
//     for (y=0;y<32;y++){
//       bodycolor = [.8, 1.0, 1.0, 1.0];
//       body.matrix.setTranslate(0, -.75, 0);
//       body.matrix.scale(.4,.4,.4);
//       body.matrix.translate(x-16, 0, y-16);
//       body.render();
//     }
//     }
//   }
// }

function renderAllShapes() {
  var startTime = performance.now();

  //clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // gl.clear(gl.COLOR_BUFFER_BIT);

  // Update and pass camera matrices
  g_camera.updateViewMatrix();
  g_camera.updateProjectionMatrix(); 
  
  // Pass matrices to shaders
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  // Pass the global rotation matrix
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // pass light into GLSL
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  // Pass the camera position to GLSL
  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);

  // Pass the light on/off to GLSL
  gl.uniform1i(u_lightOn, g_lightOn);

  // Pass the light color to GLSL
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

  // Pass the spotlight direction to GLSL
  gl.uniform3f(u_spotlightDir, g_spotDir[0], g_spotDir[1], g_spotDir[2]);

  // Pass the spotlight cutoff to GLSL
  gl.uniform1f(u_spotlightCutoff, g_spotoff);

  // Calculate normal matrix
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(globalRotMat).transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Draw light
  var light = new Cube();
  light.color=[2,2,0,1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-.2,-.2,-.2);
  light.matrix.translate(-.5,-.5,-.5);
  light.render();

  // Draw sphere
  var sp = new Sphere();
  if (g_normalOn) {
    sp.textureNum = -3; // Use normal debug color
  } else {
    sp.textureNum = -2; // Use color
  }
  sp.color = [0.0, 0.0, 0.0, 0.0]; // Set sphere color to black
  sp.matrix.translate(1,1,1);
  sp.matrix.scale(-1, -1, -1);
  sp.render();

  // Draw the floor
  var body = new Cube();
  body.textureNum = 0; 
  body.textureRepeat = 40; 
  body.matrix.translate(0, -0.75, 0.0);
  body.matrix.scale(100, 0.1, 100);
  body.matrix.translate(-0.5, 0, -0.5);
  body.render();

  // Draw the sky
  var sky = new Cube();
  sky.color = [0.6, 0.8, .5 , 1.0];
  if (g_normalOn) sky.textureNum=-3;
  sky.matrix.scale(1000, 1000, 1000);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  // Draw the cube
  var cube = new Cube();
  if (g_normalOn) cube.textureNum = -2;
  cube.color = [1.0, 0.5, 0.0, 1.0]; // Orange color: full red, half green, no blue
  cube.matrix.translate(5, 5, 5);    
  cube.matrix.scale(-7, -7, -7);    
  cube.render();

  // Draw the world map
  // drawMap();

  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}