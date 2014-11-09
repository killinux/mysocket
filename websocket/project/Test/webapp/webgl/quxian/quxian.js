
'use strict';

// WebGL背景
function initContext(id, params) {
	var canvas = document.getElementById(id),
		gl = canvas.getContext('experimental-webgl', params);

	gl.viewportWidth = gl.canvas.width;
	gl.viewportHeight = gl.canvas.height;
	gl.clearColor(0.8, 0.9, 1.0, 1.0);
	gl.clearDepth(1.0);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	return gl;
}

// Attribute
function getAttribute(str) {
	var attributes = [];
	str = str.replace(/\s*\/\/.*?\n/g, '');
	str.replace(
		/attribute\s+(float|vec2|vec3|vec4)\s+(\w+);/g,
		function(str, type, name) {
			attributes.push({type: type, name: name});
		}
	);
	return attributes;
}

//Unifrom
function getUniform(str) {
	var uniforms = {};
	str = str.replace(/\s*\/\/[^=]*?\n/g, '');
	str.replace(
		/uniform\s+(float|vec2|vec3|vec4|mat3|mat4|bool|sampler2D)\s+(\w+);(\s*\/\/=-?[0-9]+(\.[0-9]+)?)?/g,
		function(str, type, name, def) {
			uniforms[name] = {type: type, def: def && def.trim().slice(3)};
		}
	);
	return uniforms;
}

//
function getShader(gl, id) {
	var shaderScript = document.getElementById(id),
		str = shaderScript.textContent,
		shader = null;
	
	if(shaderScript.type == 'x-shader/x-fragment') {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if(shaderScript.type == 'x-shader/x-vertex') {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}
	
	shader.source = str;
	gl.shaderSource(shader, str);
	
	gl.compileShader(shader);
	
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log(id, gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
}

// 初始化着色器
function initShader(gl, frag, vert) {
	var fs = getShader(gl, frag),
		vs = getShader(gl, vert),
		attribute = [],
		uniform = {},
		typeSize = {'float': 1, 'vec2': 2, 'vec3': 3, 'vec4': 4},
		program = null;
	
	uniform.union = function (a) {
		for (var e in a) {
			this[e] = a[e];
		}
	};
	
	if (!fs || !vs) {
		return null;
	}
	
	attribute = getAttribute(vs.source);
	uniform.union(getUniform(vs.source));
	uniform.union(getUniform(fs.source));
	
	// Create the shader program
	program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.log(gl.getProgramInfoLog(program));
		return null;
	}
	
	gl.useProgram(program);
    
	var n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	
	for (var i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i++) {
		var a = gl.getActiveAttrib(program, i);
		attribute[a.name] = a;
	}
    
	program.attribute = attribute;
	for (var e in attribute) {
        attribute[e].location = gl.getAttribLocation(program, attribute[e].name);
		//attribute[e].size = typeSize[attribute[e].type];
		gl.enableVertexAttribArray(attribute[e].location);
	}
	program.uniform = uniform;
	for (e in uniform) {
		uniform[e].location = gl.getUniformLocation(program, e);
	}
    
    program.context = gl;
    
	return program;
}

// 纹理生成
function initTexture(gl, img) {
	var tex = gl.createTexture();
	
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if(Array.isArray(img)) {
		// ミップマップの登録
		for(var i = 0, n = img.length; i < n; i++) {
			gl.texImage2D(gl.TEXTURE_2D, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[i]);
		}
	} else {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        //gl.generateMipmap(gl.TEXTURE_2D);
	}
    
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	getError(gl);
	
	return tex;
}

// 頂点生成
function initBuffer(gl, model) {
	for(var i = 0; i < model.meshes.length; i++) {
		var mesh = model.meshes[i];
		
		mesh.vbo = {};
		
		for(var e in mesh.vertexStream) {
			mesh.vbo[e] = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo[e]);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexStream[e]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
		
		if(mesh.indexStream) {
			mesh.ibo = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(mesh.indexStream), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}
	}
    return gl;
}

//error
function getError(gl) {
	var error = gl.getError();
	if(error != gl.NO_ERROR) {
		var token = {
			1280: 'INVALID_ENUM',
			1281: 'INVALID_VALUE',
			1282: 'INVALID_OPERATION',
			1285: 'OUT_OF_MEMORY'
		};
	console.log(error + ':' + token[error]);
	}
}

//
function setupUniform(program) {
	var gl = program.context,
		n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	
	for(var i = 0; i < n; i++) {
		var u = gl.getActiveUniform(program, i);
		uniform(gl, program, u.name, program.uniform[u.name].value);
	}
}

function uniform(gl, program, name, value) {
	var u = program.uniform[name];
	if(u) {
		switch(u.type) {
            case 'float': gl.uniform1f(u.location, value); break;
			case 'vec2': gl.uniform2fv(u.location, value); break;
			case 'vec3': gl.uniform3fv(u.location, value); break;
			case 'vec4': gl.uniform4fv(u.location, value); break;
			case 'bool': gl.uniform1i(u.location, value); break;
			case 'mat3': gl.uniformMatrix3fv(u.location, false, value); break;
			case 'mat4': gl.uniformMatrix4fv(u.location, false, value); break;
			case 'sampler2D': gl.uniform1i(u.location, value); break;
			default: console.warn(u.type, 'not found uniform');
		}
	}
}

// 頂点属性設定
function setupAttribute(program, vbo) {
	var gl = program.context,
		n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	
	for(var i = 0; i < gl.getParameter(gl.MAX_VERTEX_ATTRIBS); i++) {
		gl.disableVertexAttribArray(i);
	}
    
	for(var i = 0; i < n; i++) {
		var a = gl.getActiveAttrib(program, i);
		attribute(gl, i, a.type, vbo[a.name]);
	}
}

function attribute(gl, index, type, vbo) {
	if(vbo) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.enableVertexAttribArray(index);
		switch(type) {
			case gl.FLOAT: gl.vertexAttribPointer(index, 1, gl.FLOAT, false, 0, 0); break;
			case gl.FLOAT_VEC2: gl.vertexAttribPointer(index, 2, gl.FLOAT, false, 0, 0); break;
			case gl.FLOAT_VEC3: gl.vertexAttribPointer(index, 3, gl.FLOAT, false, 0, 0); break;
			case gl.FLOAT_VEC4: gl.vertexAttribPointer(index, 4, gl.FLOAT, false, 0, 0); break;
			default: console.warn('not found vbo');
		}
	}
}

/**
 * @class 3D vector
 * @param {float} x
 * @param {float} y
 * @param {float} z
 * @return {Vector3} vector
 */
function Vector3(x, y, z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

Vector3.prototype = {
	add: function(v) {
		return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
	},
	sub: function(v) {
		return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
	},
	mul: function(s) {
		return new Vector3(this.x * s, this.y * s, this.z * s);
	},
	dot: function(v) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	},
	length: function() {
		return Math.sqrt(this.dot(this));
	},
	cross: function(v) {
		return new Vector3(
			this.y * v.z - this.z * v.y,
			this.z * v.x - this.x * v.z,
			this.x * v.y - this.y * v.x
		);
	},
	normalize: function() {
		var n = this.length();
		if(n > 0) {
			n = 1.0 / n;
		}
		return this.mul(n);
	},
	toTypedArray: function() {
		return new Float32Array([this.x, this.y, this.z]);
	}
};

function Matrix3(a) {
	if(Array.isArray(a)) {
		this.data = new Float32Array(a);
	} else if(a instanceof Matrix3) {
		this.data = new Float32Array(a.data);
	} else {
		this.data = new Float32Array(9);
	}
}

Matrix3.prototype.det = function() {
	var a = this.data;
	return a[0]*a[4]*a[8] + a[3]*a[7]*a[2] + a[6]*a[1]*a[5] - a[0]*a[5]*a[7] - a[1]*a[3]*a[8] - a[2]*a[4]*a[6];
};

Matrix3.prototype.inverse = function() {
	var m = new Matrix3(),
		a = this.data,
		b = m.data,
		d = this.det();
	if(d === 0) {
		return null;
	}
	d = 1 / d;
	b[0] = d * (a[4] * a[8] - a[5] * a[7]);
	b[1] = -d * (a[1] * a[8] - a[2] * a[7]);
	b[2] = d * (a[1] * a[5] - a[2] * a[4]);
	
	b[3] = -d * (a[3] * a[8] - a[5] * a[6]);
	b[4] = d * (a[0] * a[8] - a[2] * a[6]);
	b[5] = -d * (a[0] * a[5] - a[2] * a[3]);
	
	b[6] = d * (a[3] * a[7] - a[4] * a[6]);
	b[7] = -d * (a[0] * a[7] - a[1] * a[6]);
	b[8] = d * (a[0] * a[4] - a[1] * a[3]);
	
	return m;
};

Matrix3.prototype.transpose = function() {
	var m = new Matrix3(),
		a = this.data,
		b = m.data;
	for(var i = 9; i--;) {
		var k = i / 3 ^ 0,
			l = i % 3;
		b[k * 3 + l] = a[l * 3 + k];
	}
	return m;
};

/**
 * @class 4x4 matrix
 * @param a initialize parameter
 * @return {Matrix4} matrix
 */
function Matrix4(a) {
	if(Array.isArray(a)) {
		this.data = new Float32Array(a);
	} else if(a instanceof Matrix4) {
		this.data = new Float32Array(a.data);
	} else {
		this.data = new Float32Array(16);
	}
}

Matrix4.prototype.mul = function(m, mtx) {
	var r = mtx || new Matrix4(),
		a = this.data,
		b = m.data,
		c = r.data;
	for(var i = 16; i >= 0; --i) {
		var k = i & ~3,
			l = i & 3;
		c[i] = a[k]*b[l] + a[k+1]*b[l+4] + a[k+2]*b[l+8] + a[k+3]*b[l+12];
	}
	return r;
};

Matrix4.prototype.transpose = function() {
	var m = new Matrix4(),
		a = this.data,
		b = m.data;
	for(var i = 16; i--;) {
		var k = i / 4 ^ 0,
			l = i % 4;
		b[k * 4 + l] = a[l * 4 + k];
	}
	return m;
};

Matrix4.prototype.toNormalMatrix = function() {
	var m = new Matrix3(),
		a = this.data,
		b = m.data;
};

Matrix4.prototype.toMatrix3 = function(mtx) {
	var m = mtx || new Matrix3(),
		a = this.data,
		b = m.data;
	b[0] = a[0];
	b[1] = a[1];
	b[2] = a[2];
	b[3] = a[4];
	b[4] = a[5];
	b[5] = a[6];
	b[6] = a[8];
	b[7] = a[9];
	b[8] = a[10];
	return m;
};

Matrix4.identity = function(mtx) {
	var r = mtx || new Matrix4(),
		a = r.data;
	a[1] = a[2] = a[3] = a[4] = a[6] = a[7] = a[8] = a[9] = a[11] = a[12] = a[13] = a[14] = 0.0;
	a[0] = a[5] = a[10] = a[15] = 1.0;
	return r;
};

/**
 * @brief create y axis rotation matrix
 * @param {float} radian
 * @param {Matrix4} matrix
 * @return {Matrix4} matrix
 */
Matrix4.rotateY = function(y, mtx) {
	var m = mtx || new Matrix4(),
		a = m.data,
		cy = Math.cos(y),
		sy = Math.sin(y);
	a[0] = cy;
	a[2] = sy;
	
	a[8] = -sy;
	a[10] = cy;
	
	a[1] = a[3] = a[4] = a[5] = a[6] = a[7] = a[9] = a[11] = a[12] = a[13] = 0;
	a[5] = a[15] = 1;
	return m;
};

/**
 * @brief rotate by XYZ order
 * @param x {float} X asix rotation
 * @param y {float} Y asix rotation
 * @param z {float} Z asix rotation
 * @return {Matrix4} rotation matrix
 */
Matrix4.rotateXYZ = function(x, y, z, mtx) {
	var m = mtx || new Matrix4(),
		a = m.data,
		cx = Math.cos(x),
		sx = Math.sin(x),
		cy = Math.cos(y),
		sy = Math.sin(y),
		cz = Math.cos(z),
		sz = Math.sin(z);
	
	a[0] = cy * cz;
	a[1] = sx * sy * cz - cx * sz;
	a[2] = sx * sz + cx * sy * cz;
	
	a[4] = cy * sz;
	a[5] = sx * sy * sz + cx * cz;
	a[6] = cx * sy * sz - sx * cz;
	
	a[8] = -sy;
	a[9] = sx * cy;
	a[10] = cx * cy;
	
	a[3] = a[7] = a[11] = a[12] = a[13] = a[14] = 0;
	a[15] = 1;
	
	return m;
};

/**
 * @brief create view matrix
 * @param {Vector3} p position
 * @param {Vector3} t target
 * @param {Vector3} u up
 * @return {Matrix4} view matrix
 */
Matrix4.lookAt = function(p, t, u, mtx) {
	var z = p.sub(t).normalize(),
		x = u.cross(z).normalize(),
		y = z.cross(x),
		m = mtx || new Matrix4(),
		a = m.data;
	a[0] = x.x;
	a[4] = x.y;
	a[8] = x.z;
	a[12] = -p.x * x.x - p.y * x.y - p.z * x.z;
	a[1] = y.x;
	a[5] = y.y;
	a[9] = y.z;
	a[13] = -p.x * y.x - p.y * y.y - p.z * y.z;
	a[2] = z.x;
	a[6] = z.y;
	a[10] = z.z;
	a[14] = -p.x * z.x - p.y * z.y - p.z * z.z;
	a[3] = a[7] = a[11] = 0.0;
	a[15] = 1.0;
	return m;
};

/**
 * @brief create projection matrix 投影矩阵
 * @param {float} fovy
 * @param {float} aspect
 * @param {float} near
 * @param {float} far
 * @return {Matrix4} matrix
 */
Matrix4.perspective = function(fovy, aspect, near, far, mtx) {
	var f = Math.cos(fovy * 0.5) / Math.sin(fovy * 0.5),
		m = mtx || new Matrix4(),
		a = m.data;
	a[0] = f / aspect;
	a[1] = a[2] = a[3] = a[4] = a[6] = a[7] = a[8] = a[9] = a[12] = a[13] = a[15] = 0.0;
	a[5] = f;
	a[10] = (near + far) / (near - far);
	a[14] = 2.0 * near * far / (near - far);
	a[11] = -1.0;
	return m;
};

function createSphere(n) {
	var vertices = [],
		indices = [],
		normals = [],
		texcoords = [],
		curvatures = [];
	
	for(var i = 0; i <= n; i++) {
		var ph = Math.PI * i / n,
			y = Math.cos(ph),
			r = Math.sin(ph);
		
		for(var j = 0; j <= n; j++) {
			var th = 2.0 * Math.PI * j / n,
				x = r * Math.cos(th),
				z = r * Math.sin(th);
			vertices.push(x, y, z);
			normals.push(x, y, z);
			texcoords.push(x, y, z);
			curvatures.push(1.0 / 2.0);
		}
	}
	
	for(i = 0; i < n; i++) {
		for(j = 0; j < n; j++) {
			var count = (n + 1) * j + i;
			indices.push(count, count + 1, count + n + 2);
			indices.push(count, count + n + 2, count + n + 1);
		}
	}
	return {
		meshes: [
			{
				indexStream: indices,
				vertexStream: {
					position: vertices,
					normal: normals,
					uv: texcoords,
					curvature: curvatures
				}
			}
		],
		materials: []
	};
}

function createPlane() {
	var x = 2.0,
		z = 2.0;
	return {
		meshes: [
			{
				indexStream: [0, 1, 2, 0, 2, 3],
				vertexStream: {
					position: [
						-x, 0.0, -z,
						-x, 0.0, z,
						x, 0.0, z,
						x, 0.0, -z
					],
					normal: [
						0.0, 1.0, 0.0,
						0.0, 1.0, 0.0,
						0.0, 1.0, 0.0,
						0.0, 1.0, 0.0
					]
				}
			}
		],
		materials: []
	};
}

//
function createCheckbox(id, callback) {
	var wrapper = document.createElement('div'),
		label = document.createElement('label'),
		input = document.createElement('input');
	
	wrapper.classList.add('checkbox');
	label.setAttribute('for', id);
	label.textContent = id;
	input.setAttribute('type', 'checkbox');
	input.setAttribute('id', id);
	
	input.addEventListener('click', function(e) {
		if(callback) {
			callback(e.target.checked, id);
		}
	}, false);
	
	wrapper.appendChild(input);
	wrapper.appendChild(label);
	
	return wrapper;
}

//
function createSlider(id, initial, callback) {
	var wrapper = document.createElement('div'),
		slider = document.createElement('div'),
		thumb = document.createElement('span'),
		label = document.createElement('label');
	
	var w = 120;
	
	wrapper.appendChild(slider);
	wrapper.appendChild(label);
	label.textContent = id;
	slider.setAttribute('id', id);
	slider.appendChild(thumb);
	slider.classList.add('slider');
	slider.style.width = w + 'px';
	thumb.style.left = initial * (w - 12) + 'px';
	
	slider.addEventListener('mousedown', function(e) {
		var cur = this.firstChild,
			t = document,
			r = slider.getBoundingClientRect(),
			x = e.pageX - r.left,
			y = e.pageY - r.top,
			l = r.left;
		
		if(x > w - 12) x = w - 12;
		cur.style.left = x + 'px';
		slider.value = x / (w - 12);
		
		if(slider.value > 1.0) slider.value = 1.0;
		if(slider.value < 0.0) slider.value = 0.0;
		
		t.onselectstart = function() { return false; };
		t.onmousemove = function(e) {
			var x = e.clientX - l;
			if(x < 0) x = 0;
			if(x > w - 12) x = w - 12;
			cur.style.left = x + 'px';
			slider.value = x / (w - 12);
			if(callback) {
				callback(slider.value, id);
			}
		};
		t.onmouseup = function(e) {
			t.onmousemove = null;
			t.onmouseup = null;
			t.onselectstart = null;
		};
		
		if(callback) {
			callback(slider.value, id);
		}
	}, false);
	slider.value = 1.0;
	
	return wrapper;
}

function createColor(id, initial, callback) {
	var wrapper = document.createElement('div'),
		box = document.createElement('box'),
		picker = document.createElement('span'),
		input = document.createElement('input'),
		label = document.createElement('label');
	
	box.appendChild(picker);
	box.appendChild(input);
	box.classList.add('color');
	wrapper.appendChild(box);
	wrapper.appendChild(label);
	
	input.setAttribute('type', 'text');
	input.setAttribute('id', id);
	input.value = initial;
	label.textContent = id;
	label.setAttribute('for', id);
	
	picker.style.backgroundColor = initial;
	
	input.addEventListener('keyup', function(e) {
		if(input.value.length > 0) {
			picker.style.backgroundColor = input.value;
			
			if(callback) {
				var c = parseColor(input.value);
				callback(c, id);
			}
		}
	}, false);
	
	return wrapper;
}

function createControl(program, parent, initial, render) {
	var gl = program.context,
		n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS),
        f = function(v, id) { program.uniform[id].value = v; render(); };
	
	render = typeof initial === 'function' ? initial : render;
	
	for(var i = 0; i < n; i++) {
		var u = gl.getActiveUniform(program, i);
		if(u.type === gl.BOOL) {
			program.uniform[u.name].value = initial[u.name];
			parent.appendChild(createCheckbox(u.name, f));
		} else if(u.type === gl.FLOAT) {
			program.uniform[u.name].value = initial[u.name];
			parent.appendChild(createSlider(u.name, initial[u.name], f));
		} else if(u.type === gl.FLOAT_VEC3 && u.name.indexOf('Color') >= 0) {
			program.uniform[u.name].value = initial[u.name];
			parent.appendChild(createColor(u.name, toColorCode(initial[u.name]), function(v, id) {
				program.uniform[id].value[0] = v[0] / 255;
				program.uniform[id].value[1] = v[1] / 255;
				program.uniform[id].value[2] = v[2] / 255;
				render();
			}));
		}
	}
}

function toColorCode(color) {
	if(color.length === 3) {
		var r = color[0] * 255 ^ 0,
			g = color[1] * 255 ^ 0,
			b = color[2] * 255 ^ 0;
		return '#' + (r > 127 ? '' : '0') + r.toString(16) + (g > 127 ? '' : '0') + g.toString(16) + (b > 127 ? '' : '0') + b.toString(16);
	} else if(color.length === 4) {
//		return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
	}
	return '#FFFFFF';
}

function parseColor(str) {
	var n = str.length;
	
	if(str[0] === '#') {
		if(str.length === 7) {
			return [parseInt(str.slice(1, 3), 16), parseInt(str.slice(3, 5), 16), parseInt(str.slice(5), 16)];
		} else if (str.length === 4) {
			return [parseInt(str[1] + str[1], 16), parseInt(str[2] + str[2], 16), parseInt(str[3] + str[3], 16)];
		}
	} else {
		var c = str.match(/(\d+)/g);
		return [parseInt(c[0], 10), parseInt(c[1], 10), parseInt(c[2], 10)];
	}
	return [255, 255, 255];
}

function createTorus(n, m) {
	var vertices = [],
		indices = [],
		normals = [],
		s = 3.0,
		t = 1.0;
	
	for(var i = 0; i <= n; i++) {
		var ph = Math.PI * 2.0 * i / n,
			r = Math.cos(ph) * t,
			y = Math.sin(ph) * t;

		for(var j = 0; j <= m; j++) {
		    var th = 2.0 * Math.PI * j / m,
			x = Math.cos(th) * (s + r),
			z = Math.sin(th) * (s + r);
		    vertices.push(x, y, z);
		    normals.push(r * Math.cos(th), y, r * Math.sin(th));
		}
    }
	for(i = 0; i < n; i++) {
		for(j = 0; j < m; j++) {
			var count = (n + 1) * j + i;
			indices.push(count, count + n + 2, count + 1);
			indices.push(count, count + n + 1, count + n + 2);
		}
	}
	
	return {
		meshes: [
			{
				indexStream: indices,
				vertexStream: {
					position: vertices,
					normal: normals
				}
			}
		],
		materials: []
	};
}

function setAnimationFrame(callback, interval) {
	var elapsed = 0,
		time = Date.now(),
		stop = false;

	var update = function() {
		var delta = Date.now() - time;
		time = Date.now();
		elapsed += delta;
		if(elapsed >= interval) {
			var n = elapsed / interval ^ 0;
			elapsed -= n * interval;
			callback(delta);
		}

		if(!stop) {
			requestAnimationFrame(update);
		}
	};

	update();

	return {
		play: function() {
			stop = false;
			update();
		},
		pause: function() {
			stop = true;
		},
		step: function() {
			stop = true;
			elapsed = interval;
			update();
		},
		toggle: function() {
			if(stop) {
				this.play();
			} else {
				this.pause();
			}
		}
	};
};
