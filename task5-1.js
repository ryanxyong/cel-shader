import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var _VS = `
varying vec3 Color;
const vec3 LightPosition = vec3(4, 1, 4);
const vec3 LightIntensity = vec3(20);
const int Mode = 1; // 0 is day, 1 is night

// Source for LOW and HIGH values: https://www.youtube.com/watch?v=mnxs6CR6Zrk
const float LOW = 0.47;
const float HIGH = 0.53;

// Color values based on color concepts from: https://www.youtube.com/watch?v=mnxs6CR6Zrk
// Given time of day and if vertex is in highlights, output the proper color
vec3 calc_vertex_color(bool isHighlight) {
	if (Mode == 0) {
		if (isHighlight) {
			return vec3(0.96, 0.90, 0.86);
		} else {
			return 0.8 * vec3(0.96, 0.90, 0.86);
		}
	} else {
		if (isHighlight) {
			return vec3(0.46, 0.58, 0.69);;
		} else {
			return 0.8 * vec3(0.46, 0.58, 0.69);
		}
	}
}

// Takes in the light reflection color and converts it into a toon shade value
vec3 toon_shade_color(vec3 c) {
	bool isHighlight;

	if (c.x < LOW) { // if luminosity is considered shadow
		isHighlight = false;
		return calc_vertex_color(isHighlight);
	} else if (c.x > HIGH) { // if luminosity is considered bright highlight
		isHighlight = true;
		return calc_vertex_color(isHighlight);
	} else { // if luminosity part of lit portion
		isHighlight = true;
		// factors in the luminosity gradient for color
		// - add scaled luminosity gradient to basic shadow color
		return 0.2 * ((c.x - LOW) / (HIGH - LOW)) * calc_vertex_color(isHighlight) + calc_vertex_color(false);
	}
}

void main() { // Adapted PA3b Lambertian shader code to function with three.js
	mat4 mvp = projectionMatrix * viewMatrix * modelMatrix; // Model-View-Projection matrix

	vec4 NewPosition = vec4(position, 1.0); // holds Position with homogeneous coordinate
	vec4 WorldPosition = modelMatrix * NewPosition; // Position in world space
	gl_Position = mvp * NewPosition; // Position in clip space

	vec4 tempNormal = vec4(normal, 0.0); // normal vector with homogeneous coordinate for transformation
	tempNormal = modelMatrix * tempNormal; // normal vector in world space
	vec3 NewNormal = normalize(vec3(tempNormal)); // normal vector normalized

	vec3 l = LightPosition - WorldPosition.xyz; // light direction
	vec3 UnitL = normalize(l); // normalized light direction

	// Calculating the grayscaling with mini gradient in the center
	vec3 LightReflection = max(0.0, dot(NewNormal, UnitL)) * LightIntensity/dot(l, l);
	vec3 ToonColor = toon_shade_color(LightReflection);

	// ka = calc_vertex_color(1, isHighlight);
	
	Color = ToonColor; // output color after vertex shading
}
`;

var _FS = `
varying vec3 Color;

void main() {
	gl_FragColor = vec4(Color, 1.0);
}
`;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth/1.11, window.innerHeight/1.11);
renderer.setClearColor(0xccccc); // For easier viewing of shading result
const controls = new OrbitControls(camera, renderer.domElement);

document.body.appendChild(renderer.domElement);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1, 1000, 1000, 1000);
const tkGeometry = new THREE.TorusKnotGeometry(1.3, 0.3, 1000, 1000);

const material = new THREE.ShaderMaterial({
	uniforms: {},
	vertexShader: _VS,
	fragmentShader: _FS,
});

// Add objects
const cube = new THREE.Mesh(cubeGeometry, material);
cube.position.x = 1;
cube.position.y = 1;
cube.position.z = 2;
scene.add( cube );

const torus = new THREE.Mesh(tkGeometry, material);
torus.position.x = -1;
torus.position.x = -1;
torus.position.x = -1;
scene.add(torus);


// automatic canvas resize based on user window
function resizeCanvas(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth/1.11, window.innerHeight/1.11);
}
window.addEventListener('resize', resizeCanvas);

function animate() {
	requestAnimationFrame(animate);

	cube.rotation.x -= 0.005;
	cube.rotation.y -= 0.005;

	torus.rotation.x += 0.005;
	torus.rotation.y += 0.005;

	renderer.render(scene, camera);
}

animate();