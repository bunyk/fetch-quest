import * as THREE from 'three';
import { Vector3, Triangle } from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { Octree } from 'three/addons/math/Octree.js';

import { Capsule } from 'three/addons/math/Capsule.js';

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );
scene.fog = new THREE.Fog( 0x88ccee, 20, 500 );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0xffffff, 1.5 );
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
scene.add( directionalLight );

const container = document.getElementById( 'container' );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

const raycaster = new THREE.Raycaster();


const GRAVITY = 30;
const STEPS_PER_FRAME = 5;

const worldOctree = new Octree();

const INITIAL_PLAYER_POSITION = new Vector3( 4, 0, 27 );

const playerCollider = new Capsule(
  new Vector3( INITIAL_PLAYER_POSITION.x, 0.35, INITIAL_PLAYER_POSITION.z ),
  new Vector3( INITIAL_PLAYER_POSITION.x, 1.7, INITIAL_PLAYER_POSITION.z ),
  0.35
);

const playerVelocity = new Vector3();
const playerDirection = new Vector3();

let playerOnFloor = false;

const keyStates = {};

document.addEventListener( 'keydown', ( event ) => {

  keyStates[ event.code ] = true;

} );

document.addEventListener( 'keyup', ( event ) => {

  keyStates[ event.code ] = false;

} );

container.addEventListener( 'mousedown', () => {
  document.body.requestPointerLock();
} );

document.addEventListener( 'mouseup', (event) => {
  if ( document.pointerLockElement !== null ) interact();
});

const pointer = new THREE.Vector2(); // zero vector
function interact() {
	raycaster.setFromCamera( pointer, camera ); // send ray from center of camera
	const intersects = raycaster.intersectObjects( scene.children );
  let obj = intersects[0].object;

  while (obj.parent.name !== 'Scene') {
    obj = obj.parent;
  }

  take(obj);
}


function say(text) {
  const container = document.getElementById( 'info' );
  container.innerHTML = '<h1>' + text + '</h1>';
  setTimeout(() => {
    container.innerText = '';
  }, 2000);
  let utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}


function getDirectChildOfScene(obj) {
  let parent = obj;
  while (parent.parent !== scene) {
    parent = parent.parent;
  }
  return parent;
}

function whatIs(obj) {
  return obj.name.split('0')[0];
}

let takenObject = null;
let deltaDist = null;
function take(o) {
  console.log(o);
  if (takenObject) { // Already taken, release
    takenObject = null;
    return
  }
  const what = whatIs(o);
  if (what == 'PhotoCamera') {
    flash(o.position)
  }
  if (what !== 'Chair' && what !== 'Cart') {
    return
  }
  takenObject = {...o};
  deltaDist = new Vector3().subVectors(camera.position, takenObject.position);
  deltaDist.normalize()
  deltaDist.y = camera.position.y - takenObject.position.y;
  say("I'm taking " + what);
}

function dragTakenObj() {
  if (takenObject) {
    const dir = camera.getWorldDirection(playerDirection);
    deltaDist.x = -dir.x;
    deltaDist.z = -dir.z;

    takenObject.position.copy(camera.position).sub(deltaDist);
  }
}

const light = new THREE.PointLight( 0xffffff, 50, 100, 1 );
function flash(position) {
  light.position.set(position.x, position.y + 1.8, position.z);
  scene.add( light );
  setTimeout(() => {
    scene.remove(light);
  }, 100);
}

// text on a face
const cv = document.createElement( 'canvas' );
cv.width = 1536 //  3 * 512
cv.height = 512;
const ctx = cv.getContext( '2d' );
ctx.fillStyle = '#fefefe'; 
ctx.fillRect( 0, 0, cv.width, cv.height );
ctx.fillStyle = '#129912';
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';
ctx.font = 'bold 6vh Arial';
			// https://unicode.org/emoji/charts/full-emoji-list.html#1f642 (mark and copy - column Browser)
ctx.fillText( ' THREE  |                           three.js playground', 0, 0.1 * cv.height );
ctx.fillText( ' THREE  |                                              ', 0, 0.2 * cv.height );
ctx.fillText( ' THREE  |            with a flag 🏳, rotating squirrel 🐿, flower 🌻', 0, 0.3 * cv.height );
ctx.fillText( ' THREE  |                       and many other things  ', 0, 0.4 * cv.height );
ctx.fillText( ' THREE  |                       * learning by playing * ', 0, 0.5 * cv.height );
ctx.fillText( ' THREE  |                                              ', 0, 0.6 * cv.height);
ctx.fillText( ' THREE  |                😀   it should bring you joy     😀', 0, 0.7 * cv.height );
ctx.fillText( ' THREE  |                                              ', 0, 0.8 * cv.height );
ctx.fillText( ' THREE  |                  😂    ♠ ♣ ♥ ♦  🐞  ♪ ♫ ♭ ♮ ♯    😂 ', 0, 0.9 * cv.height );
const cvTexture = new THREE.Texture( cv );
cvTexture.needsUpdate = true; // otherwise all black only
const cvMaterial = new THREE.MeshBasicMaterial( { map: cvTexture  } );


document.body.addEventListener( 'mousemove', ( event ) => {

  if ( document.pointerLockElement === document.body ) {

    camera.rotation.y -= event.movementX / 500;
    camera.rotation.x -= event.movementY / 500;

  }

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function playerCollisions() {

  const result = worldOctree.capsuleIntersect( playerCollider );

  playerOnFloor = false;

  if ( result ) {

    playerOnFloor = result.normal.y > 0;

    if ( ! playerOnFloor ) {

      playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

    }

    if ( result.depth >= 1e-10 ) {

      playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

    }

  }

}

function updatePlayer( deltaTime ) {

  let damping = Math.exp( - 4 * deltaTime ) - 1;

  if ( ! playerOnFloor ) {

    playerVelocity.y -= GRAVITY * deltaTime;

    // small air resistance
    damping *= 0.1;

  }

  playerVelocity.addScaledVector( playerVelocity, damping );

  const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
  playerCollider.translate( deltaPosition );

  playerCollisions();

  camera.position.copy( playerCollider.end );

  checkZones();

  dragTakenObj();

}

let visitedModel = false;

function checkZones() {
  const dist2Model = camera.position.distanceTo(modelPosition);
  if (dist2Model < 5) {
    if (!visitedModel) {
      visitedModel = true;
      onVisitModel();
    }
  }
  if (dist2Model > 10) {
    visitedModel = false;
  }
}

function onVisitModel() {
  let foundIndex = -1;
  if (takenObject && whatIs(takenObject) === 'Cart') {
    foundIndex = takenObject.children.findIndex((child) => whatIs(child) === 'TShirt');
  }

  if (foundIndex === -1) {
    if (modelShirt.visible) {
      say("Hey, let's shoot photo in a next outfit! Could you please find something for me?");
    } else {
      say("Hello! Where are my clothes? Please, bring me some.");
    }
  } else {
    say("Thanks! I'll put it on now.");
    modelShirt.material = takenObject.children[foundIndex].material;
    takenObject.children.splice(foundIndex, 1);
    modelShirt.visible = true;
  }
}

function getForwardVector() {

  camera.getWorldDirection( playerDirection );
  playerDirection.y = 0;
  playerDirection.normalize();

  return playerDirection;

}

function getSideVector() {

  camera.getWorldDirection( playerDirection );
  playerDirection.y = 0;
  playerDirection.normalize();
  playerDirection.cross( camera.up );

  return playerDirection;

}

function controls( deltaTime ) {

  // gives a bit of air control
  const speedDelta = deltaTime * ( playerOnFloor ? 20 : 4 ) * (
   keyStates[ 'ShiftLeft' ] ? 2 : 1 // Shift for speedup
  );

  if ( keyStates[ 'KeyW' ] ) {
    playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );
  }

  if ( keyStates[ 'KeyS' ] ) {
    playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );
  }

  if ( keyStates[ 'KeyA' ] ) {
    playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );
  }

  if ( keyStates[ 'KeyD' ] ) {
    playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );
  }

  if ( playerOnFloor ) {

    if ( keyStates[ 'Space' ] ) {
      playerVelocity.y = 10;
    }
    if ( keyStates[ 'KeyB' ] ) {
      playerVelocity.y = 100;
    }
  }
}


let modelPosition = new Vector3();
let modelShirt = null;

setInterval(() => {
  if(!TV) {
    return;
  }

  const hash = Math.floor(Math.random() * 12) + 1;
  const texture = new THREE.TextureLoader().load('https://cataas.com/cat?type=small&hash=' + hash); 
  texture.flipY = false;
  const catMaterial = new THREE.MeshBasicMaterial( { map:texture } );
  TV.children[1].material = catMaterial;
}, 5000)

let TV = null;

const loader = new GLTFLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.5/")
loader.setDRACOLoader( dracoLoader );

loader.load( 'floor4.glb', ( gltf ) => {

  scene.add( gltf.scene );

  gltf.scene.updateWorldMatrix( true, true );

  let triangles = 0;
  gltf.scene.traverse( ( obj ) => {
    if (obj.name.startsWith('TV')) {
      TV = obj;
    }
    if (!obj.isMesh) return;
    if (!worldOctree.layers.test( obj.layers )) return;
    if(obj.name.startsWith('TShirt')) {
      obj.material = obj.material.clone();
      obj.material.color.setHex(0xffffff * Math.random());
    }

    if (obj.name.startsWith('Ceiling')) return;
    const patronym = obj.parent.name;
    if (patronym.startsWith('Monitor')) return;
    if (patronym.startsWith('Thinkpad')) return;
    if (patronym.startsWith('Chair')) return;
    if (patronym.startsWith('Cart')) return;


    let geometry, isTemp, is2Sided = false;

    if (patronym.startsWith('GridWall')) {
      is2Sided = true;
    }

    if (obj.name == 'MaleModel') {
      modelPosition = obj.position;
    }

    if (obj.name == 'TShirt') {
      modelShirt = obj;
      obj.visible = false;
    }

    if ( obj.geometry.index !== null ) {
      isTemp = true;
      geometry = obj.geometry.toNonIndexed();
    } else {
      geometry = obj.geometry;
    }

    const positionAttribute = geometry.getAttribute( 'position' );

    for ( let i = 0; i < positionAttribute.count; i += 3 ) {

      const v1 = new Vector3().fromBufferAttribute( positionAttribute, i );
      const v2 = new Vector3().fromBufferAttribute( positionAttribute, i + 1 );
      const v3 = new Vector3().fromBufferAttribute( positionAttribute, i + 2 );

      v1.applyMatrix4( obj.matrixWorld );
      v2.applyMatrix4( obj.matrixWorld );
      v3.applyMatrix4( obj.matrixWorld );

      worldOctree.addTriangle( new Triangle( v1, v2, v3 ) );
      triangles++;

      if ( is2Sided ) {
        worldOctree.addTriangle( new Triangle( v3, v2, v1 ) );
        triangles++;
      }

    }

    if ( isTemp ) {
      geometry.dispose();
    }

  });
  console.log( 'Triangles:', triangles );
	worldOctree.build();

  renderer.setAnimationLoop( animate );
});


function animate() {

  const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

  // we look for collisions in substeps to mitigate the risk of
  // an object traversing another too quickly for detection.

  for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

    controls( deltaTime );

    updatePlayer( deltaTime );

  }

  renderer.render( scene, camera );

  stats.update();

}
