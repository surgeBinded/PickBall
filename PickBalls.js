"use strict";

// * Initialize webGL and create a scene with camera and light
const canvas = document.getElementById("mycanvas");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setClearColor('rgb(255, 255, 255)');    // set background color

const scene = new THREE.Scene();
const fov = 45;
const aspect = canvas.width / canvas.height;
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(8, 18, 8);
camera.lookAt(scene.position);
const light = new THREE.PointLight();
light.position.copy(camera.position.clone());
scene.add(light);
scene.add(new THREE.AmbientLight(0x606060));

var axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// * Place balls randomly within outerRadius from center of world
const nBalls = 10;
const outerRadius = 8;
const ballMinRadius = 0.5;
const ballMaxRadius = 1.5;
const balls = [];
for (let k = 1; k <= nBalls; ++k) {
  // random color
  const rdColor = new THREE.Color(Math.random(), Math.random(), Math.random());
  // random radius
  const rdRadius = ballMinRadius + Math.random() * (ballMaxRadius - ballMinRadius);
  // random position
  const rd = () => 2 * Math.random() - 1;  // just a helper function
  let rdPos;
  while (true) {
    rdPos = new THREE.Vector3(outerRadius * rd(), outerRadius * rd(), outerRadius * rd());
    if (rdPos.lengthSq() <= outerRadius * outerRadius) {
      break;
    }
  }

  // store all the balls within balls array
  const ball = new THREE.Mesh(new THREE.SphereBufferGeometry(rdRadius, 32, 32),
    new THREE.MeshStandardMaterial({ color: rdColor }));
  ball.userData.radius = rdRadius;
  ball.position.copy(rdPos);
  scene.add(ball);
  balls.push(ball);
}

// * Implement picking functionionality
canvas.addEventListener('mousedown', event => {
  // calculate viewport pixel position:
  const rect = canvas.getBoundingClientRect();
  const xvp = event.clientX - rect.left;
  const yvp = event.clientY - rect.top;

  // highlight ball if it has been picked
  balls.forEach(b => pickBall(xvp, yvp, b));
});

/**
 * Find out if a ball is picked with the mouse. It it is, set the emissive color
 * of the material equal to its color.
 *
 * @param {Number} xvp the viewport x-coordinate (pixel units)
 * @param {Number} yvp the viewport y-coordinate (pixel units)
 * @param {Object} ball a THREE.Mesh storing the ball and its radius as ball.userData.radius.
 */
function pickBall(xvp, yvp, ball) {
  // viewport coordinates should be within the canvas
  console.assert(xvp >= 0 && xvp <= canvas.width, 'xvp=' + xvp);
  console.assert(yvp >= 0 && yvp <= canvas.height, 'yvp=' + yvp);

  //  the logic for computing the closest distance to a line  
  const cameraPosition = camera.position.clone();
  const clickInfo = new THREE.Vector3(xvp / canvas.clientWidth * 2 - 1, (1 - yvp / canvas.clientHeight) * 2 - 1, -1).unproject(camera);
  const directionVector = new THREE.Vector3().subVectors(clickInfo, cameraPosition).normalize();
  const distanceCameraBallVector = new THREE.Vector3().subVectors(ball.position, cameraPosition);

  const clickToProjectionDistance = distanceCameraBallVector.dot(directionVector);
  const projection = cameraPosition.add(directionVector.multiplyScalar(clickToProjectionDistance));
  const distance = (projection.clone().sub(ball.position)).length();

  if (distance <= ball.userData.radius) {
    ball.material.emissive.set(ball.material.color);
    console.log({
      NormalizedDeviceCoordinates: ball.position.clone().project(camera),
      CameraSpaceCoordinates: camera.worldToLocal(ball.position.clone()),
      WorldSpaceCoordinates: ball.position,
      BallDistance: distance
    });
  }

}

// Dehighlight ball if mouse is released
canvas.addEventListener('mouseup', event => {
  balls.forEach(ball => ball.material.emissive.set(0x000000));
});

// * Render loop
const controls = new THREE.TrackballControls(camera, renderer.domElement);
function render() {
  requestAnimationFrame(render);
  controls.update();
  renderer.render(scene, camera);
}
render();