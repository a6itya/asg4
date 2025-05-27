class Camera {
  constructor(width, height) {
    this.fov = 60;
    this.eye = new Vector3([0, 1.5, 10]);  
    this.at = new Vector3([0, 0.5, 0]);    
    this.up = new Vector3([0, 1, 0]);      

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.updateViewMatrix();
    this.updateProjectionMatrix(width, height);
    
    
    console.log("Camera initialized:");
    console.log("- Eye:", this.eye.elements);
    console.log("- At:", this.at.elements);
    console.log("- Up:", this.up.elements);
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  updateProjectionMatrix(width, height) {
    // If width and height are not provided, try to get from canvas, otherwise use default values
    const aspectWidth = width || (window.canvas ? window.canvas.width : 800);
    const aspectHeight = height || (window.canvas ? window.canvas.height : 600);
    this.projectionMatrix.setPerspective(this.fov, aspectWidth / aspectHeight, 0.1, 1000);
  }

  moveForward(speed = 1.0) {  
    
    let forward = new Vector3([
      this.at.elements[0] - this.eye.elements[0],
      0,  
      this.at.elements[2] - this.eye.elements[2]
    ]);
    
    
    forward.normalize();
    
    let scaledX = forward.elements[0] * speed;
    let scaledZ = forward.elements[2] * speed;
    
    
    this.eye.elements[0] += scaledX;
    this.eye.elements[2] += scaledZ;
    this.at.elements[0] += scaledX;
    this.at.elements[2] += scaledZ;
    
    console.log("After moveForward - Eye:", this.eye.elements, "At:", this.at.elements);
    this.updateViewMatrix();
  }

  moveBackward(speed = 1.0) {  
    this.moveForward(-speed);  
  }

  moveLeft(speed = 1.0) { 
    
    let forward = new Vector3([
      this.at.elements[0] - this.eye.elements[0],
      0,
      this.at.elements[2] - this.eye.elements[2]
    ]);
    
    
    let left = new Vector3([0, 0, 0]);
    
    let upE = this.up.elements;
    let forwardE = forward.elements;
    
    left.elements[0] = upE[1] * forwardE[2] - upE[2] * forwardE[1];
    left.elements[1] = upE[2] * forwardE[0] - upE[0] * forwardE[2];
    left.elements[2] = upE[0] * forwardE[1] - upE[1] * forwardE[0];
    
    left.normalize();
    
    let scaledX = left.elements[0] * speed;
    let scaledZ = left.elements[2] * speed;
    
    
    this.eye.elements[0] += scaledX;
    this.eye.elements[2] += scaledZ;
    this.at.elements[0] += scaledX;
    this.at.elements[2] += scaledZ;
    
    console.log("After moveLeft - Eye:", this.eye.elements, "At:", this.at.elements);
    this.updateViewMatrix();
  }

  moveRight(speed = 1.0) {  
    this.moveLeft(-speed);  
  }

  panLeft(alpha = 8) {  
    
    let forward = new Vector3([
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2]
    ]);
    
    
    let rotMatrix = new Matrix4();
    rotMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
    
    let rotated = rotMatrix.multiplyVector3(forward);
    
  
    this.at.elements[0] = this.eye.elements[0] + rotated.elements[0];
    this.at.elements[1] = this.eye.elements[1] + rotated.elements[1];
    this.at.elements[2] = this.eye.elements[2] + rotated.elements[2];
    
    console.log("After panLeft - Eye:", this.eye.elements, "At:", this.at.elements);
    this.updateViewMatrix();
  }

  panRight(alpha = 8) {  
    this.panLeft(-alpha);  
  }

  rotateWithMouse(deltaX) {
    
    const sensitivity = 0.2;
    const rotationAngle = deltaX * sensitivity;
    
    this.panLeft(-rotationAngle);  
  }
}