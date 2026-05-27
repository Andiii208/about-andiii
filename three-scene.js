/* Three.js ambient particles for the museum background. */
(function () {
  "use strict";

  const canvas = document.getElementById("threeCanvas");
  if (!canvas || typeof window.THREE === "undefined") return;

  const isMobile = window.innerWidth <= 900;
  const scene = new window.THREE.Scene();
  const camera = createCamera();
  const renderer = createRenderer(canvas);
  const state = { mouseX: 0, mouseY: 0, paused: false };
  const ambient = createAmbientParticles(isMobile ? 100 : 250);

  scene.add(ambient);
  bindEvents(state, ambient, renderer, camera);
  animate();

  function createCamera() {
    const nextCamera = new window.THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    nextCamera.position.z = 8;
    return nextCamera;
  }

  function createRenderer(targetCanvas) {
    const nextRenderer = new window.THREE.WebGLRenderer({
      canvas: targetCanvas,
      alpha: true,
      antialias: true,
    });
    nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    nextRenderer.setSize(window.innerWidth, window.innerHeight);
    return nextRenderer;
  }

  function createAmbientParticles(count) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index++)
      fillAmbientPosition(positions, index);
    const geometry = new window.THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new window.THREE.BufferAttribute(positions, 3),
    );
    const material = new window.THREE.PointsMaterial({
      size: 0.015,
      color: 0xf2eadb,
      transparent: true,
      opacity: 0.22,
    });
    return new window.THREE.Points(geometry, material);
  }

  function fillAmbientPosition(positions, index) {
    const offset = index * 3;
    positions[offset] = (Math.random() - 0.5) * 18;
    positions[offset + 1] = (Math.random() - 0.5) * 10;
    positions[offset + 2] = (Math.random() - 0.5) * 8;
  }

  function bindEvents(currentState, ambientParticles, rendererRef, cameraRef) {
    document.addEventListener("mousemove", (event) =>
      updateMouse(currentState, event),
    );
    window.addEventListener("resize", () => resize(rendererRef, cameraRef));
    window.galleryScene = {
      pause: () => setScenePaused(currentState, ambientParticles, true),
      resume: () => setScenePaused(currentState, ambientParticles, false),
    };
  }

  function updateMouse(currentState, event) {
    currentState.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    currentState.mouseY = -(event.clientY / window.innerHeight - 0.5) * 2;
  }

  function setScenePaused(currentState, ambientPoints, value) {
    currentState.paused = value;
    ambientPoints.visible = !value;
  }

  function resize(rendererRef, cameraRef) {
    cameraRef.aspect = window.innerWidth / window.innerHeight;
    cameraRef.updateProjectionMatrix();
    rendererRef.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    if (state.paused) {
      requestAnimationFrame(animate);
      return;
    }
    requestAnimationFrame(animate);
    ambient.rotation.y += 0.0008;

    /* mouse-reactive particle drift */
    const targetX = state.mouseX * 0.3;
    const targetY = state.mouseY * 0.3;
    ambient.position.x += (targetX - ambient.position.x) * 0.02;
    ambient.position.y += (targetY - ambient.position.y) * 0.02;

    renderer.render(scene, camera);
  }
})();
