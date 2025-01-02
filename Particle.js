var gravity = -10;
var drag = 0.7;
var m = 5;            // axis-aligned box
var wallNormal = [];

class Particle{
  constructor(){
    this.velocity = glMatrix.vec3.fromValues(Math.random(), Math.random(), Math.random()); 
    this.radius = Math.random(); 
    this.color = glMatrix.vec3.fromValues(Math.random(), Math.random(), Math.random());
    this.mass = 1;  //set to uniform mass of 1 based on Physics slides (we never actually use this apparently according to campuswire)
    this.position = glMatrix.vec3.fromValues(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5); 
    glMatrix.vec3.scale(this.position, this.position, 4*this.radius);
  }

  //Update the position using the current velocity and Euler integration
  updatePosition(velocity, position, t){
    var vt = glMatrix.vec3.create();
    var startPos = glMatrix.vec3.clone(this.position);
    glMatrix.vec3.scale(vt, velocity, t);          
    glMatrix.vec3.add(this.position, position, vt);   // Pnew = Pold + V*t
    
    //collision detection
    var wallNum = collisionDetection(this.position, this.radius);
    if(wallNum > 0){
        var vt = glMatrix.vec3.create();

        var tHit = timeHit(wallNum, this.radius, startPos, this.velocity);

        glMatrix.vec3.scale(vt, velocity, tHit);         
        glMatrix.vec3.add(this.position, startPos, vt);  // resolution position (Pnew = Pold + v*t)
        
        //resolutionVelocity(velocity, wallNum);        
        var oldVelocity = glMatrix.vec3.clone(this.velocity);    
        var newVelocity = glMatrix.vec3.create();
        var vDot = glMatrix.vec3.create();
        var vMult = glMatrix.vec3.create();
        var tvnn = glMatrix.vec3.create();

        vDot = glMatrix.vec3.dot(oldVelocity, wallNormal[wallNum]); // (Vold∙n)
        glMatrix.vec3.scale(vMult, wallNormal[wallNum], vDot);      // (Vold∙n)n
        glMatrix.vec3.scale(tvnn, vMult, 2);                        // 2(Vold∙n)n

        glMatrix.vec3.subtract(newVelocity, oldVelocity, tvnn);     // Vnew = Vold - 2(Vold∙n)n
        
        glMatrix.vec3.scale(this.velocity, newVelocity, 0.7);       // Vnew = Vnew*d
    }
  }

  //Update the velocity using the acceleration and Euler integration and drag.
  updateVelocity(velocity, t){
    var acceleration = glMatrix.vec3.fromValues(0, gravity, 0); 
    var newVelocity = glMatrix.vec3.create();
    var at = glMatrix.vec3.create();

    var dt = Math.pow(drag, t);                       //velocity update with drag (Vnew = V*d^t)
    glMatrix.vec3.scale(newVelocity, velocity, dt);
    
    //velocity update using Euler integration (Vnew = V*d^t + A*t)
    glMatrix.vec3.scale(at, acceleration, t);
    glMatrix.vec3.add(this.velocity, newVelocity, at); // final velocity
  }
  
}

// Computing the time at which the collision actually occurred to get the right velocity vector and position for the updated sphere. 
function collisionDetection(position, radius){
  var normal1 = glMatrix.vec3.fromValues(1, 0, 0);  //left wall
  wallNormal.push(normal1);
  var normal2 = glMatrix.vec3.fromValues(-1, 0, 0);  //right wall
  wallNormal.push(normal2);
  var normal3 = glMatrix.vec3.fromValues(0, 1, 0);  //bottom wall
  wallNormal.push(normal3);
  var normal4 = glMatrix.vec3.fromValues(0, -1, 0); //top wall
  wallNormal.push(normal4);
  var normal5 = glMatrix.vec3.fromValues(0, 0, 1);  //front wall
  wallNormal.push(normal5);
  var normal6 = glMatrix.vec3.fromValues(0, 0, -1); //back wall
  wallNormal.push(normal6);

  //Sphere-Plane Collision
  if(position[0] - radius <= -m)      return 1;   //left wall
  else if(position[0] + radius >= m)  return 2;   //right wall
  else if(position[1] - radius <= -m) return 3;   //bottom wall
  else if(position[1] + radius >= m)  return 4;   //top wall
  else if(position[2] - radius <= -m) return 5;   //front wall
  else if(position[2] + radius >= m)  return 6;   //back wall
  else                                return 0;   //no collision
    
}

function timeHit(wallNum, radius, startPos, velocity){
  if(wallNum == 1)      return ((-m + radius) - startPos[0])/velocity[0];   //left wall
  else if(wallNum == 2) return ((m - radius) - startPos[0])/velocity[0];    //right wall
  else if(wallNum == 3) return ((-m + radius) - startPos[1])/velocity[1];   //bottom wall
  else if(wallNum == 4) return ((m - radius) - startPos[1])/velocity[1];    //top wall
  else if(wallNum == 5) return ((-m + radius) - startPos[2])/velocity[2];   //front wall
  else if(wallNum ==6)  return ((m - radius) - startPos[2])/velocity[2];    //back wall
  else                  return 0;                                           //no collision
    
}
