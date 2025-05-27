class Cube {
    constructor() {
        this.type = "cube";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();

        this.textureNum = -2; // Default to using color
        
        // Store all vertices in a single Float32Array for better performance
        this.vertices32 = new Float32Array([
            // Front face
            0,0,0,  1,1,0,  1,0,0,    // Triangle 1
            0,0,0,  0,1,0,  1,1,0,    // Triangle 2
            
            // Back face
            0,0,1,  1,1,1,  1,0,1,    // Triangle 1
            0,0,1,  0,1,1,  1,1,1,    // Triangle 2
            
            // Top face
            0,1,0,  0,1,1,  1,1,1,    // Triangle 1
            0,1,0,  1,1,1,  1,1,0,    // Triangle 2
            
            // Bottom face
            0,0,0,  0,0,1,  1,0,1,    // Triangle 1
            0,0,0,  1,0,1,  1,0,0,    // Triangle 2
            
            // Right face
            1,0,0,  1,1,0,  1,1,1,    // Triangle 1
            1,0,0,  1,1,1,  1,0,1,    // Triangle 2
            
            // Left face
            0,0,0,  0,1,0,  0,1,1,    // Triangle 1
            0,0,0,  0,1,1,  0,0,1     // Triangle 2
        ]);

        // Store texture coordinates in a single Float32Array
        this.texCoords32 = new Float32Array([
            // Front
            0,0, 1,1, 1,0,
            0,0, 0,1, 1,1,
            // Back
            0,0, 1,1, 1,0,
            0,0, 0,1, 1,1,
            // Top
            0,0, 0,1, 1,1,
            0,0, 1,1, 1,0,
            // Bottom
            0,0, 0,1, 1,1,
            0,0, 1,1, 1,0,
            // Right
            0,0, 0,1, 1,1,
            0,0, 1,1, 1,0,
            // Left
            0,0, 0,1, 1,1,
            0,0, 1,1, 1,0
        ]);

        // Store normals in a single Float32Array
        this.normals32 = new Float32Array([
            // Front face (normal: 0,0,1)
            0,0,1, 0,0,1, 0,0,1,
            0,0,1, 0,0,1, 0,0,1,
            
            // Back face (normal: 0,0,-1)
            0,0,-1, 0,0,-1, 0,0,-1,
            0,0,-1, 0,0,-1, 0,0,-1,
            
            // Top face (normal: 0,1,0)
            0,1,0, 0,1,0, 0,1,0,
            0,1,0, 0,1,0, 0,1,0,
            
            // Bottom face (normal: 0,-1,0)
            0,-1,0, 0,-1,0, 0,-1,0,
            0,-1,0, 0,-1,0, 0,-1,0,
            
            // Right face (normal: 1,0,0)
            1,0,0, 1,0,0, 1,0,0,
            1,0,0, 1,0,0, 1,0,0,
            
            // Left face (normal: -1,0,0)
            -1,0,0, -1,0,0, -1,0,0,
            -1,0,0, -1,0,0, -1,0,0
        ]);

        // Create buffers
        this.vertexBuffer = null;
        this.texCoordBuffer = null;
        this.normalBuffer = null;
        this.initBuffers();
    }

    initBuffers() {
        // Create and bind vertex buffer
        this.vertexBuffer = gl.createBuffer();
        if (!this.vertexBuffer) {
            console.log('Failed to create vertex buffer');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices32, gl.STATIC_DRAW);

        // Create and bind texture coordinate buffer
        this.texCoordBuffer = gl.createBuffer();
        if (!this.texCoordBuffer) {
            console.log('Failed to create texture coordinate buffer');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.texCoords32, gl.STATIC_DRAW);

        // Create and bind normal buffer
        this.normalBuffer = gl.createBuffer();
        if (!this.normalBuffer) {
            console.log('Failed to create normal buffer');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals32, gl.STATIC_DRAW);
    }

    render() {
        // Set texture or color mode
        gl.uniform1i(u_whichTexture, this.textureNum);
        
        // Set base color
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        
        // Pass the model matrix to shader
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind vertex buffer and set attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind texture coordinate buffer and set attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        // Bind normal buffer and set attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // Draw all triangles in one call
        gl.drawArrays(gl.TRIANGLES, 0, 36); // 12 triangles * 3 vertices = 36
    }
}

class Floor extends Cube {
    constructor() {
        super();
        this.textureNum = 0; // Default to grass texture
        this.textureRepeat = 20; // How many times to repeat the texture
        
        // Override vertices to only include the top face (floor)
        this.vertices32 = new Float32Array([
            // Top face only (which will be the floor)
            0,1,0,  0,1,1,  1,1,1,    // Triangle 1
            0,1,0,  1,1,1,  1,1,0     // Triangle 2
        ]);
        
        // Override texture coordinates for floor with repeat
        const repeat = this.textureRepeat;
        this.texCoords32 = new Float32Array([
            // Texture coordinates for the floor
            0,0,  0,repeat,  repeat,repeat,
            0,0,  repeat,repeat,  repeat,0
        ]);

        // Update vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices32, gl.STATIC_DRAW);

        // Update texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.texCoords32, gl.STATIC_DRAW);
    }

    render() {
        // Set texture and color
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind vertex buffer and set attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind texture coordinate buffer and set attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        // Draw the floor (2 triangles)
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

function drawCube() {
    let vertices = new Float32Array([
      // Front face
      -0.5, -0.5,  0.5,
       0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5,  0.5,  0.5,
      // Back face
      -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
       0.5,  0.5, -0.5,
      -0.5,  0.5, -0.5,
    ]);
  
    let indices = new Uint8Array([
      0,1,2,   0,2,3,    // front
      1,5,6,   1,6,2,    // right
      5,4,7,   5,7,6,    // back
      4,0,3,   4,3,7,    // left
      3,2,6,   3,6,7,    // top
      4,5,1,   4,1,0     // bottom
    ]);
  
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    if (!vertexBuffer || !indexBuffer) {
      console.log('Failed to create buffers');
      return -1;
    }
  
    // Write vertex coordinates to buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
    // Assign buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  
    // Enable assignment
    gl.enableVertexAttribArray(a_Position);
  
    // Write indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
    // Draw cube
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
}

class Sky extends Cube {
    constructor() {
        super();
        this.textureNum = 2; // Use sky texture
        
        // Override vertices to create an inside-out cube (sky box)
        this.vertices32 = new Float32Array([
            // Front face (viewed from inside)
            1,1,0,  0,0,0,  0,1,0,    // Triangle 1
            1,1,0,  1,0,0,  0,0,0,    // Triangle 2
            
            // Back face (viewed from inside)
            0,1,1,  1,0,1,  1,1,1,    // Triangle 1
            0,1,1,  0,0,1,  1,0,1,    // Triangle 2
            
            // Top face (viewed from inside)
            0,1,1,  1,1,0,  0,1,0,    // Triangle 1
            0,1,1,  1,1,1,  1,1,0,    // Triangle 2
            
            // Bottom face (viewed from inside)
            0,0,0,  1,0,1,  0,0,1,    // Triangle 1
            0,0,0,  1,0,0,  1,0,1,    // Triangle 2
            
            // Right face (viewed from inside)
            1,1,1,  1,0,0,  1,1,0,    // Triangle 1
            1,1,1,  1,0,1,  1,0,0,    // Triangle 2
            
            // Left face (viewed from inside)
            0,1,0,  0,0,1,  0,1,1,    // Triangle 1
            0,1,0,  0,0,0,  0,0,1     // Triangle 2
        ]);
        
        // Override texture coordinates for sky
        this.texCoords32 = new Float32Array([
            // Front
            0,1, 1,0, 1,1,
            0,1, 0,0, 1,0,
            // Back
            1,1, 0,0, 0,1,
            1,1, 1,0, 0,0,
            // Top
            0,1, 1,1, 0,0,
            0,1, 1,0, 1,1,
            // Bottom
            0,0, 1,1, 0,1,
            0,0, 1,0, 1,1,
            // Right
            0,1, 1,0, 1,1,
            0,1, 0,0, 1,0,
            // Left
            1,1, 0,0, 0,1,
            1,1, 1,0, 0,0
        ]);

        // Update vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices32, gl.STATIC_DRAW);

        // Update texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.texCoords32, gl.STATIC_DRAW);
    }

    render() {
        // Disable depth testing temporarily for sky rendering
        gl.disable(gl.DEPTH_TEST);
        
        // Set texture and color
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind vertex buffer and set attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind texture coordinate buffer and set attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        // Draw all triangles
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        
        // Re-enable depth testing for other objects
        gl.enable(gl.DEPTH_TEST);
    }
}