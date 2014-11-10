(function() {
    'use strict';
    
    var canvas = document.getElementById('canvas'),
        gl = initContext('canvas', {preserveDrawingBuffer: true});
    
    var program = initShader(gl, 'shader-fs', 'shader-vs'),
        fill = initShader(gl, 'shader-fs', 'shader-vs-fill');
    
    var positions = new Float32Array(4);
    
    var camera = {},
		matrix = {};
	
	camera.position = new Vector3(0, 1.0, 2.0);
	camera.target = new Vector3(0, 0.1, 0);
	camera.up = new Vector3(0, 1, 0);
    
    camera.fovy = 45.0 * Math.PI / 180.0;
    camera.aspect = gl.canvas.width / gl.canvas.height;
    camera.near = 0.1;
    camera.far = 1000.0;
    
    camera.lookAt = function(matrix) {
        Matrix4.lookAt(this.position, this.target, this.up, matrix);
    };
    
    camera.perspective = function(matrix) {
        Matrix4.perspective(this.fovy, this.aspect, this.near, this.far, matrix);
    }
    
	matrix.mMatrix = new Matrix4();
	matrix.nMatrix = new Matrix4();
	matrix.vMatrix = new Matrix4();
	matrix.mvMatrix = new Matrix4();
	matrix.pMatrix = new Matrix4();
    
    camera.perspective(matrix.pMatrix);
    camera.lookAt(matrix.vMatrix);
    Matrix4.identity(matrix.mMatrix);
	matrix.mMatrix.mul(matrix.vMatrix, matrix.mvMatrix);
    
    var frame = 0,
        speed = 0.005;
    
	for(var i = 0; i < positions.length; i++) {
		positions[i] = i * 2.0 * Math.PI / positions.length;
	}
	
    var vbo = {};
	vbo.r = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo.r);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    var plane = {
        position: [
            1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, -1.0, 1.0,
			-1.0, 1.0, 1.0
        ],
        vbo: {}
    };
    
    plane.vbo.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plane.vbo.position);
    var buffer = new Float32Array(plane.position);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
    
    var clearColor = new Float32Array([0.0, 0.0, 0.0, 0.1]);
    
	gl.enable(gl.BLEND);
	
	gl.depthFunc(gl.ALWAYS);
	
    // 
	function setAlphaBlend(gl) {
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	}
	
    // 加算合成
	function setAdditionBlend(gl) {
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	}
	
    // 描画
	function render(model) {
	//	gl.clearColor(0.0, 0.0, 1.0, 0.2);
//		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
        
        fill.uniform['color'].value = clearColor;
        gl.useProgram(fill);
        setupUniform(fill);
        setupAttribute(fill, plane.vbo);
		setAlphaBlend(gl);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        //绘图
		program.uniform['mvMatrix'].value = matrix.mvMatrix.data;
		program.uniform['pMatrix'].value = matrix.pMatrix.data;
		program.uniform['time'].value = frame * speed;
		program.uniform['a'].value = 12.0;
		program.uniform['b'].value = 13.0;
		program.uniform['radius'].value = 0.5;
        
        gl.useProgram(program);
        setupUniform(program);
        setupAttribute(program, vbo);
		setAdditionBlend(gl);
        gl.drawArrays(gl.POINTS, 0, positions.length);
		gl.flush();
		
		frame++;
    }
	
	setInterval(render, 1000 / 15);
//    render();
})();
