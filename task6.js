import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


var _VS = `
uniform vec3 LightPosition;
uniform vec3 LightIntensity;
varying vec3 ToonColor; // Toonified color
varying vec2 uv2; // For incorporating the texture color with toon shading
const int Mode = 0; // 0 is day, 1 is night

// Source for LOW and HIGH values: https://www.youtube.com/watch?v=mnxs6CR6Zrk
const float LOW = 0.47;
const float HIGH = 0.53;

// Color values based on color concepts from: https://www.youtube.com/watch?v=mnxs6CR6Zrk
// Given time of day and if vertex is in highlights, output the proper color
vec3 calc_vertex_color(bool isHighlight) {
	if (Mode == 0) { // if day time
		if (isHighlight) {
			return vec3(0.96, 0.90, 0.86);
		} else {
			return 0.8 * vec3(0.96, 0.90, 0.86);
		}
	} else { // if night time
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
	uv2 = uv; // for passing into fragment shader

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
	ToonColor = toon_shade_color(LightReflection);
}
`;

var _FS = `
varying vec3 ToonColor;
uniform sampler2D MaterialTexture;
varying vec2 uv2;

void main() {
	vec3 tx = vec3(texture2D(MaterialTexture, uv2));
	gl_FragColor = vec4(ToonColor * tx, 1.0);
}
`;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth/1.11, window.innerHeight/1.11);
renderer.setClearColor(0xffffff); // For easier viewing of shading result
const orbitCamera = new OrbitControls(camera, renderer.domElement);
orbitCamera.listenToKeyEvents( window );

document.body.appendChild(renderer.domElement);


// Add lights
var mainLight = new THREE.DirectionalLight(new THREE.Color('white') , 20.0);
mainLight.position.set(4, 1, 4);
scene.add(mainLight);

// **** //
// given a child mesh from an imported model and a set of materials mats,
// incorporates model texture in toon shading
// code from https://stackoverflow.com/questions/25198312/how-to-access-colors-in-three-shadermaterial-using-three-objmtlloader
function set_toon_material(child, mats) {
	if (child instanceof THREE.Mesh) { // if child is a Mesh
		if (child.material.id in mats) { // if material has already been processed
			child.material = mats[child.material.id];
		} else { // if new material found
			mats[child.material.id] = new THREE.ShaderMaterial({ // process texture through toon shader
				uniforms: {
					MaterialTexture: {value: child.material.map},					// for model texture
					LightPosition: {value: mainLight.position},						// for scene light positions
					LightIntensity: {value: new THREE.Vector3(mainLight.intensity)}  // for scene light intensity
				},
				vertexShader: _VS,
				fragmentShader: _FS
			});
			child.material = mats[child.material.id]; // adds new material to mats set
		}
	}

	return mats;
}
// **** //


// Add objects
// Darknut Sword model source: https://www.models-resource.com/gamecube/legendofzeldathewindwaker/model/24113/
let mtlLoader = new MTLLoader();
mtlLoader.setResourcePath('/assets/models/Darknut_Sword/');
mtlLoader.setPath('/assets/models/Darknut_Sword/');
mtlLoader.load('Tn_ken1.mtl', (materials) => {
	materials.preload();

	let objLoader = new OBJLoader();
	objLoader.setMaterials(materials);
	objLoader.setPath('/assets/models/Darknut_Sword/');
	objLoader.load('Tn_ken1.obj', (object) => {
		let mats = {};
		object.traverse(function(child) {
			mats = set_toon_material(child, mats);
		});

		object.rotation.y -= 5;
		object.rotation.x -= 5;
		scene.add(object);
	});
});


// automatic canvas resize based on user window
function resizeCanvas(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth/1.11, window.innerHeight/1.11);
}
window.addEventListener('resize', resizeCanvas, false);

function animate() {
	requestAnimationFrame(animate);

	renderer.render(scene, camera);
}

animate();