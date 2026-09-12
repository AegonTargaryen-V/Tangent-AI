let scene, camera, renderer, controls;
let isInitialized = false;
let currentBackground = 0x1e1e1e; // Default dark grey from UI

function initThreeJS() {
    if (isInitialized) return;
    
    const container = document.getElementById('three-preview-container');
    const placeholder = document.getElementById('preview-placeholder');
    const fullscreenBtn = document.getElementById('fullscreen-toggle-btn');
    const textureSelector = document.getElementById('texture-selector');
    
    if(placeholder) placeholder.style.display = 'none';
    if(container) container.style.display = 'block';
    if(fullscreenBtn) fullscreenBtn.style.display = 'block';
    if(textureSelector) textureSelector.style.display = 'block';
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(currentBackground);
    
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding; // For older r128 compatibility
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Setup basic lighting for the material preview
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);
    
    // Load the 3D Sphere GLB model
    const loader = new THREE.GLTFLoader();
    // Using relative path to assets folder
    loader.load('../assets/PREVIEW/TEXTUREPREVIEW.glb', (gltf) => {
        const model = gltf.scene;
        // Center the model in the view
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Scale appropriately if it's too large or small
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if(maxDim > 0) {
            const scale = 3.0 / maxDim; // Fit within view
            model.scale.setScalar(scale);
        }

        scene.add(model);
    }, undefined, (error) => {
        console.error('An error happened while loading the GLB model.', error);
        // Fallback: if model fails to load, create a primitive sphere so the preview still works
        console.log("Falling back to primitive sphere due to load error (possibly CORS).");
        const geometry = new THREE.SphereGeometry(1.5, 64, 64);
        const material = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.1 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
    });
    
    window.addEventListener('resize', onWindowResize);
    // Observe container resizes (e.g. sidebar toggle or panel resize)
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            onWindowResize();
        });
        resizeObserver.observe(container);
    }
    
    animate();
    isInitialized = true;
}

function onWindowResize() {
    const container = document.getElementById('three-preview-container');
    if(!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    if(controls) controls.update();
    if(renderer && scene && camera) renderer.render(scene, camera);
}

function applySimulatedTexture() {
    // Give a visual "update" cue by slightly altering the model's material
    if (scene) {
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                // Randomize base color and roughness slightly to simulate a new procedural material
                child.material.color.setHSL(Math.random(), 0.5 + Math.random() * 0.5, 0.4 + Math.random() * 0.4);
                child.material.roughness = Math.random();
                child.material.metalness = Math.random() > 0.5 ? 0.8 : 0.1;
                child.material.needsUpdate = true;
            }
        });
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    const initBtn = document.getElementById('init-three-btn');
    if (initBtn) {
        initBtn.addEventListener('click', initThreeJS);
    }

    const fsBtn = document.getElementById('fullscreen-toggle-btn');
    const container = document.getElementById('three-preview-container');
    const textureSelector = document.getElementById('texture-selector');
    
    // Auto-load texture when generated
    window.addEventListener('textureGenerated', (e) => {
        initThreeJS();
        
        // Extract a clean name from the prompt
        let promptText = e.detail ? e.detail.prompt : 'Generated Texture';
        // Capitalize and truncate
        let name = promptText.trim().split('\n')[0];
        name = name.length > 25 ? name.substring(0, 25) + '...' : name;
        if(name.length === 0) name = 'Generated Texture';
        
        // Add to selector
        if (textureSelector) {
            const option = document.createElement('option');
            option.value = name;
            option.text = name;
            textureSelector.appendChild(option);
            textureSelector.value = name;
        }

        applySimulatedTexture();
    });
    
    if (textureSelector) {
        textureSelector.addEventListener('change', () => {
            applySimulatedTexture();
        });
    }
    
    if (fsBtn && container) {
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
        
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                // In fullscreen, we want the background to be black
                currentBackground = 0x000000;
                if (scene) scene.background = new THREE.Color(currentBackground);
            } else {
                // Out of fullscreen, normal dark grey background
                currentBackground = 0x1e1e1e;
                if (scene) scene.background = new THREE.Color(currentBackground);
            }
            
            // Force resize update slightly after transition
            setTimeout(onWindowResize, 100);
        });
    }
});
