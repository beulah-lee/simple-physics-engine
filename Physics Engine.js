var gl;     // The WebGL context
var canvas; // The HTML5 Canvas
var shaderProgram; //The GLSL shader program 

var sphere1;

var modelViewMatrix = glMatrix.mat4.create();
var viewMatrix = glMatrix.mat4.create();
var projectionMatrix = glMatrix.mat4.create();
var normalMatrix = glMatrix.mat3.create();

// Material color/intensity for Phong reflection 
var kAmbient = [0.25, 0.75, 1.0];
var kDiffuse = [0.25, 0.75, 1.0];
var kSpecular = [0.25, 0.75, 1.0];
var shininess = 2;

const ambientLightColor = [0.4, 0.4, 0.4];
const diffuseLightColor = [1.0, 1.0, 1.0];
const specularLightColor = [1.0, 1.0, 1.0];

var keys = {};
var previousTime = 0;
var nSpheres = 5;
var particles = [];

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/////////////// SET UP //////////////////////////
function startup() {
  canvas = document.getElementById("glCanvas");
  gl = createGLContext(canvas);

  document.onkeydown = keyDown;
  document.onkeyup = keyUp;

  for(var i=0; i<nSpheres; i++){
    particles.push(new Particle());  
  }

  setupShaders();

  sphere1 = new Sphere(5);
  sphere1.setupBuffers(shaderProgram);
  
  // Create the projection matrix with perspective projection
  const near = 0.1;
  const far = 200.0;
  glMatrix.mat4.perspective(projectionMatrix, degToRad(45), 
                            gl.viewportWidth / gl.viewportHeight,
                            near, far);
    
  // Set the background color to black    
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  requestAnimationFrame(animate);
}

function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
    
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
  
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader; 
}

function setupShaders() {
  // Compile the shaders' source code
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.locations = {};
  shaderProgram.locations.vertexPosition =
    gl.getAttribLocation(shaderProgram, "vertexPosition");
  shaderProgram.locations.vertexNormal =
    gl.getAttribLocation(shaderProgram, "vertexNormal");

  shaderProgram.locations.modelViewMatrix =
    gl.getUniformLocation(shaderProgram, "modelViewMatrix");
  shaderProgram.locations.projectionMatrix =
    gl.getUniformLocation(shaderProgram, "projectionMatrix");
  shaderProgram.locations.normalMatrix =
    gl.getUniformLocation(shaderProgram, "normalMatrix");

  shaderProgram.locations.kAmbient =
    gl.getUniformLocation(shaderProgram, "kAmbient");
  shaderProgram.locations.kDiffuse =
    gl.getUniformLocation(shaderProgram, "kDiffuse");
  shaderProgram.locations.kSpecular =
    gl.getUniformLocation(shaderProgram, "kSpecular");
  shaderProgram.locations.shininess =
    gl.getUniformLocation(shaderProgram, "shininess");
  
  shaderProgram.locations.lightPosition =
    gl.getUniformLocation(shaderProgram, "lightPosition");
  shaderProgram.locations.ambientLightColor =
    gl.getUniformLocation(shaderProgram, "ambientLightColor");
  shaderProgram.locations.diffuseLightColor =
  gl.getUniformLocation(shaderProgram, "diffuseLightColor");
  shaderProgram.locations.specularLightColor =
  gl.getUniformLocation(shaderProgram, "specularLightColor");
}

/////////////// ANIMATION FOR EACH FRAME //////////////////////////
function animate(currentTime) {
  currentTime *= 0.001;   // Convert the time to seconds
  var deltaTime = currentTime - previousTime;
  previousTime = currentTime;
   
  if (keys["ArrowRight"]) { 
    nSpheres = nSpheres+1;
    particles.push(new Particle());
  }
  if (keys["ArrowLeft"]) { 
    nSpheres = 0;
    for(var i=0; i<particles.length; i++){
      particles.pop();        //clear particles
    }
  }
  // Set up the canvas for this frame
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var modelMatrix = glMatrix.mat4.create();
  var viewMatrix = glMatrix.mat4.create();

  // Create the view matrix using lookat
  const lookAtPt = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
  const eyePt = glMatrix.vec3.fromValues(0.0, 0.0, 15.0);
  const up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0); 
  glMatrix.mat4.lookAt(viewMatrix, eyePt, lookAtPt, up);

  // Concatenate the model and view matrices
  glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

  setMatrixUniforms();

  // Transform the light position to view coordinates
  var lightPosition = glMatrix.vec3.fromValues(5, 5, -5);
  glMatrix.vec3.transformMat4(lightPosition, lightPosition, viewMatrix);

  setLightUniforms(ambientLightColor, diffuseLightColor, specularLightColor, lightPosition);
  setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess);

  sphere1.bindVAO();

  for(var i=0; i<particles.length; i++){
    // Update the positions and velocities of each sphere
    particles[i].updatePosition(particles[i].velocity, particles[i].position, deltaTime);
    particles[i].updateVelocity(particles[i].velocity, deltaTime);

    // For each sphere, check if it is colliding with one of the 6 walls of the bounding box 
    var sMat = glMatrix.mat4.create();
    var tMat = glMatrix.mat4.create();    
    glMatrix.mat4.fromTranslation(tMat, particles[i].position);

    var rVec = glMatrix.vec3.fromValues(particles[i].radius, particles[i].radius, particles[i].radius);
    glMatrix.mat4.fromScaling(sMat, rVec);
    glMatrix.mat4.multiply(modelMatrix, tMat, sMat);   
    glMatrix.mat4.multiply(this.modelViewMatrix, viewMatrix, modelMatrix);  

    kAmbient = particles[i].color;
    kDiffuse = particles[i].color;

    setMatrixUniforms();
    setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess);
    
    gl.drawArrays(gl.TRIANGLES, 0, sphere1.numTriangles*3);
  }

  sphere1.unbindVAO();

  requestAnimationFrame(animate);
}

// Sends the three matrix uniforms to the shader program
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.locations.modelViewMatrix, false,
                      modelViewMatrix);
  gl.uniformMatrix4fv(shaderProgram.locations.projectionMatrix, false,
                      projectionMatrix);

  // Transform the normals by the inverse-transpose of the Model/View matrix
  glMatrix.mat3.fromMat4(normalMatrix,modelViewMatrix);
  glMatrix.mat3.transpose(normalMatrix,normalMatrix);
  glMatrix.mat3.invert(normalMatrix,normalMatrix);

  gl.uniformMatrix3fv(shaderProgram.locations.normalMatrix, false,
                      normalMatrix);
}

function setMaterialUniforms(a, d, s, alpha) {
  gl.uniform3fv(shaderProgram.locations.kAmbient, a);
  gl.uniform3fv(shaderProgram.locations.kDiffuse, d);
  gl.uniform3fv(shaderProgram.locations.kSpecular, s);
  gl.uniform1f(shaderProgram.locations.shininess, alpha);
}

function setLightUniforms(a, d, s, loc) {
  gl.uniform3fv(shaderProgram.locations.ambientLightColor, a);
  gl.uniform3fv(shaderProgram.locations.diffuseLightColor, d);
  gl.uniform3fv(shaderProgram.locations.specularLightColor, s);
  gl.uniform3fv(shaderProgram.locations.lightPosition, loc);
}

/////////////// USER KEY CODE STUFF //////////////////////////
function keyDown(event){
  console.log("Key down ", event.key, " code ", event.code);
  if (event.key == "ArrowLeft" ||   event.key == "ArrowRight") {
    event.preventDefault();
  }
  keys[event.key] = true;
}

function keyUp(event){
  console.log("Key up ", event.key, " code ", event.code);
  keys[event.key] = false;
}
