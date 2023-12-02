import WindowManager from './WindowManager.js';

const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let imagePlanes = [];  // Renamed from 'cubes' to 'imagePlanes'
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// Image URLs (replace with actual URLs)
const imageUrls = ['images/pic1.png', 'images/pic2.png', 'images/pic3.png', 'images/pic4.png'];
const textures = imageUrls.map(url => new t.TextureLoader().load(url));
const materials = textures.map(texture => new t.MeshBasicMaterial({ map: texture, transparent:true, alphaTest: 0.5}));

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime() {
    return (new Date().getTime() - today) / 1000.0;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function areImagePlanesNearEachOther() {
    let threshold = 50; // Define your threshold distance here
    for (let i = 0; i < imagePlanes.length; i++) {
        for (let j = i + 1; j < imagePlanes.length; j++) {
            let dist = distanceBetweenPoints(
                imagePlanes[i].position.x, imagePlanes[i].position.y,
                imagePlanes[j].position.x, imagePlanes[j].position.y
            );
			// console.log(dist)
            if (dist > threshold) {
                return false;
            }
        }
    }
    return true;
}


if (new URLSearchParams(window.location.search).get("clear")) {
    localStorage.clear();
} else {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState != 'hidden' && !initialized) {
            init();
        }
    });

    window.onload = () => {
        if (document.visibilityState != 'hidden') {
            init();
        }
    };

    function init() {
        initialized = true;

        setTimeout(() => {
            setupScene();
            setupWindowManager();
            resize();
            updateWindowShape(false);
            render();
            window.addEventListener('resize', resize);
        }, 500);
    }

    function setupScene() {
        camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);

        camera.position.z = 2.5;
        near = camera.position.z - .5;
        far = camera.position.z + 0.5;

        scene = new t.Scene();
        scene.background = new t.Color(0.0);
        scene.add(camera);

        renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
        renderer.setPixelRatio(pixR);

        world = new t.Object3D();
        scene.add(world);

        renderer.domElement.setAttribute("id", "scene");
        document.body.appendChild(renderer.domElement);
    }

    function setupWindowManager() {
        windowManager = new WindowManager();
        windowManager.setWinShapeChangeCallback(updateWindowShape);
        windowManager.setWinChangeCallback(windowsUpdated);

        let metaData = { foo: "bar" };
        windowManager.init(metaData);

        windowsUpdated();
    }

    function windowsUpdated() {
        updateNumberOfImages();
    }

    function updateNumberOfImages() {
        let wins = windowManager.getWindows();
        wins = wins.slice(0, 4);  // Limit to 4 windows

        imagePlanes.forEach((img) => {
            world.remove(img);
        });

        imagePlanes = [];

        for (let i = 0; i < wins.length; i++) {
            let win = wins[i];
            let geometry = new t.PlaneGeometry(500, 500);
            let imagePlane = new t.Mesh(geometry, materials[i % materials.length]);
            imagePlane.position.x = win.shape.x + (win.shape.w * 0.5);
            imagePlane.position.y = win.shape.y + (win.shape.h * 0.5);

       // Ensure the image is flat
	   imagePlane.rotation.x = 0;
	   imagePlane.rotation.y = 0;
	   imagePlane.rotation.z = 0;

            world.add(imagePlane);
            imagePlanes.push(imagePlane);
        }
    }

    function updateWindowShape(easing = true) {
        sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
        if (!easing) sceneOffset = sceneOffsetTarget;
    }

    function render() {
        let t = getTime();
        windowManager.update();

        let falloff = .05;
        sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
        sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

        world.position.x = sceneOffset.x;
        world.position.y = sceneOffset.y;

        let wins = windowManager.getWindows();

        for (let i = 0; i < imagePlanes.length; i++) {
            let imagePlane = imagePlanes[i];
            let win = wins[i];
            // let _t = 83723;
			let _t = 83908.500
			// console.log(t)
            let posTarget = { x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5) }

            imagePlane.position.x = imagePlane.position.x + (posTarget.x - imagePlane.position.x) * falloff;
            imagePlane.position.y = imagePlane.position.y + (posTarget.y - imagePlane.position.y) * falloff;
			// console.log(imagePlane.position.x)
			// console.log(imagePlane.position.y)
            imagePlane.rotation.x = _t * .1;
            imagePlane.rotation.y = _t * .9;
        };

		if (areImagePlanesNearEachOther()) {
			console.log("YAY");
		}

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    function resize() {
        let width = window.innerWidth;
        let height = window.innerHeight

        camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }


	
}
