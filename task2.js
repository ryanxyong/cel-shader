import * as THREE from 'three';

var _VS = `
varying vec3 Color;
const vec3 LightPosition = vec3(4, 1, 4);
const vec3 LightIntensity = vec3(20);
const vec3 ka = 0.3*vec3(1, 0.5, 0.5);
const vec3 kd = 0.7*vec3(1, 0.5, 0.5);

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

	Color = ka + kd * (max(0.0, dot(NewNormal, UnitL)) * LightIntensity/dot(l, l)); // output color after vertex shading (we consider ka to be light coming in from the environment)
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

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth/1.11, window.innerHeight/1.11);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const material = new THREE.ShaderMaterial({
	uniforms: {},
	vertexShader: _VS,
	fragmentShader: _FS,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// automatic canvas resize based on user window
function resizeCanvas(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth/1.11, window.innerHeight/1.11);
}
window.addEventListener('resize', resizeCanvas);

function animate() {
	requestAnimationFrame(animate);

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render(scene, camera);
}

animate();