/**
 * @author Ahmad Adlouni
 */

"use strict";

const logger = document.getElementById('logger');

var swicthToOldUiExposedMethod;
var onRequestCameraPermissionExposedMethod;

let track = null;
let cameraView = null;
let cameraContainer = null;
let cameraTriggerContainer = null;
let cameraTrigger = null;
let innerActionContainer = null;
let cameraSound = null;
let isFirstLoad = true;
let nbOfTries = 0;
let switchToOldUi = false;

let currentConstraints = null;
let cameraConstraints = {
	default: {
		portraitSettings: { video: { resizeMode: 'crop-and-scale', facingMode: { exact: 'environment' }, width: { ideal: 630 },  height: { ideal: 1000 } }, audio: false },
		landscapeSettings: { video: { resizeMode: 'crop-and-scale', facingMode: { exact: 'environment' }, width: { ideal: 1000 }, height: { ideal: 630 } }, audio: false }
	},
	second: {
		portraitSettings: { video: { resizeMode: 'crop-and-scale', facingMode: { exact: 'environment' }, width: { min: 378, max: 630 }, height: { min: 600, max: 1000 } }, audio: false },
		landscapeSettings: { video: { resizeMode: 'crop-and-scale', facingMode: { exact: 'environment' }, width: { min: 630, max: 378 },  height: { min: 1000, max: 600 } }, audio: false }
	},
	third: {
		portraitSettings: { video: { resizeMode: 'crop-and-scale', facingMode: { exact: 'environment' }, width: { min: 200, max: 800 }, height: { min: 300, max: 1512 } }, audio: false },
		landscapeSettings: { video: { resizeMode: 'crop-and-scale', facingMode: { exact: 'environment' }, width: { min: 800, max: 200 }, height: { min: 1512, max: 300 } }, audio: false }
	},
  forth: {
    portraitSettings: { video: { width: 600, height: 378 }, audio: false },//{ video: { width: 378, height: 600 }, audio: false },
    landscapeSettings: { video: { width: 600, height: 378 }, audio: false }
  }
}

const LANDSCAPE_CLASS = 'landscape';

/**
 * This function is used to check whether the current orientation
 * is landscape or not
 * 
 * @return true if landscape orientation otherwise false
 */
function isLandscapeMode() {
	return window.matchMedia('(orientation: landscape)').matches;
}

/**
 * This function is used to check whether the current orientation
 * is portrait or not
 * 
 * @return true if portrait orientation otherwise false
 */
function isPortraitMode() {
	return window.matchMedia('(orientation: portrait)').matches;
}

/**
 * This function is used to check whether the media devices
 * is supported
 * 
 * @return true if mediaDevices is supported otherwise false
 */
function isMediaDevicesSupported() {
	return 'mediaDevices' in navigator;
}

/**
 * This function is used to play camera shutter sound
 */
function playCameraShutterSound() {
    console.log('Entering playCameraShutterSound() function')
    try {
        initializeCameraSound();
        cameraSound.play();
    } catch (e) {
        console.log('Error in playing camera shutter sound', e);
    }
    console.log('Exiting playCameraShutterSound() function');
}

function showCameraFlashEffect() {
	try {
		// $('.flash-effect')
		//    .show()
		//    .animate({opacity: 0.5}, 300) 
		//    .fadeOut(300)
		//    .css({'opacity': 1});

	} catch (e) {
		console.log('Error showing flash effect')
	}
}

function initializeFlashEffect() {
	// $('.flash-effect').hide();
}

/**
 * This function is used to open full screen mode.
 */
async function openFullScreen(query) {
    console.log(`Entering openFullScreen() for query = ${query}`);
    const element = document.querySelector(query);
    try {
        const data = await element.requestFullscreen({ navigationUI: "auto" });
        console.log('full screen data', data);
        lockScreen();
    } catch (e) {
        console.log('Error opening screen in full mode', e);
    }
    console.log('Exiting openFullScreen()');
}

/**
 * This function is used to exit full screen mode
 */
async function exitFullScreen() {
    console.log('Entering exitFullSCreen() function');
    try {
        const data = await document.exitFullscreen();
        console.log('full screen data', data);
    } catch (e) {
        console.log('error in exiting full screen', e);
    }
    console.log('Exiting exitFullSCreen() function');
}

/**
 * This function is used to lock screen when going to full screen
 * mode
 * @param mode 
 */
async function lockScreen(mode = 'portrait') {
    console.log(`Entering lockScreen(${mode})`);
    try {
        const data = await screen.orientation.lock(mode);
        console.log('lock data', data);
    } catch (e) {
        console.log('error in screen locking', e);
    }
    console.log(`Exiting lockScreen(${mode})`);
}

/**
 * Access the device camera and stream to cameraView
 */
async function startCamera() {
	initializeFlashEffect();
	initializeCameraSound();
	initializeScanningElements();
  adjustScreen();

	nbOfTries = 0;
  initializeCamera();
}

function requestCameraPermission() {
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false
	})
	.then(stream => {
		stream.getTracks().forEach(track => track.stop());
		onRequestCameraPermissionExposedMethod(true);
	})
	.catch(e => {
		log(`Camera permission denied`);
		onRequestCameraPermissionExposedMethod(isCameraPermissionDenied(e) === true ? false : null)
	});
}

let printed = false;

async function initializeCamera(settings = 'default') {
	console.log('Starting the camera');
	try {
		nbOfTries++;

    
		
		// if already one of the current defined constraints worked
		// already set the settings with the current one
		// so no retries should be happened
		if (currentConstraints != null)
			settings = currentConstraints;
		
		// start the camera
    const stream = await navigator.mediaDevices.getUserMedia(getCameraSettings(settings));
    track = stream.getTracks()[0];

    if (!printed) {
      printed = true;
      const p = document.createElement('p');
      p.innerHTML = JSON.stringify(track.getCapabilities());
      logger.appendChild(p);
    }


    // track.applyConstraints({ focusMode });
    cameraView.srcObject = stream;
		
		// open the camera in full screen
		// openFullScreen('#scanningContainer');

		// set the current working camera constraints
		currentConstraints = settings;
    console.log('camera started successfully', stream);

    console.log('track', track.getCapabilities());

    log(`Camera started with ${settings} camera configuration`);
  } catch (e) {
    const p = document.createElement('p');
    // console.log(val);
    p.innerHTML = e.message;
    logger.appendChild(p);

      console.log(`Error in starting camera ${nbOfTries}`, e);
    if (nbOfTries == 1) {
      log(`Camera could not start with DEFAULT configuration, trying with SECOND configurations. Error: ${e}`);
      initializeCamera('second');
    }
    else if (nbOfTries == 2) {
      log(`Camera could not start with SECOND configuration, trying with THIRD configurations. Error: ${e}`);
      initializeCamera('third');
    }
    else if (nbOfTries == 3) {
      log(`Camera could not start with THIRD configuration, switching to OLD UI. Error: ${e}`);
      initializeCamera('forth');
    }
  }
}

function log(message) {
	try {
    console.log(message);
	} catch (e) {
		console.log('Error logging card scanning message');
	}
}

/**
 * This function is used to switch to the old card
 * scanning UI if the none of the camera constraints
 * works with the camera
 */
function switchToOldCardScanningUi() {
	switchToOldUi = true;
	swicthToOldUiExposedMethod();
}

function isSwitchToOldUi() {
	return switchToOldUi;
}

function setSwitchToOldUi(switchToOld) {
	switchToOldUi = switchToOld;
}

/**
 * This function is used to stop the camera streaming
 */
function stopCamera() {
	if (track !== null) {
		try {
			track.stop();
			track = null;
		} catch (e) {
			console.log('An error occurred while stoping the camera preview', e);	
		}
	}
}

/**
 * This function is used to take a snapshot
 */
function takeSnapshot() {
	console.log('Taking a snapshot');
	
	try {    
		const cameraSensor = document.createElement('canvas');
    const context = cameraSensor.getContext('2d');

    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    context.drawImage(cameraView, 0, 0, cameraSensor.width, cameraSensor.height);

    let src = cv.matFromImageData(context.getImageData(0, 0, cameraSensor.width, cameraSensor.height));
    let dst = new cv.Mat();
    let men = new cv.Mat();
    let menO = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    
    // You can try more different parameters
    var t = cv.Laplacian(src, dst, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
    console.log(t, cv.meanStdDev(dst, menO, men), menO.data64F[0], men.data64F[0]);
    
    if (men.data64F[0] > 10)
      alert('NOT BLURRED');
    else
      alert('Image is BLURRED');
    
    src.delete(); 
    dst.delete();

    return cameraSensor.toDataURL();
	} catch (e) {
		console.log('An error occurred while taking a snapshot', e);
	}
}

/**
 * This function is used to initialize the required scanning
 * elements
 */
function initializeScanningElements() {
	cameraView = document.querySelector('#camera-view');
	cameraContainer = document.querySelector('.camera-viewer-container');
	cameraTriggerContainer = document.querySelector('.camera-trigger-container');
	cameraTrigger = document.querySelector('#camera-shutter-button');
	innerActionContainer = document.querySelector('.inner-camera-trigger-container');
}

/**
 * This function is used to adjust camera elements
 * (depending on the orientation) when the user rotates 
 * his phone
 */
function adjustScreen() {
	try {
		if (isLandscapeMode()) {
      cameraView.classList.add('h-100');
      cameraContainer.classList.add(LANDSCAPE_CLASS);
      cameraTriggerContainer.classList.add(LANDSCAPE_CLASS);
      innerActionContainer.classList.add(LANDSCAPE_CLASS);
    }
    else {
      cameraView.classList.remove('h-100');
      cameraContainer.classList.remove(LANDSCAPE_CLASS);
      cameraTriggerContainer.classList.remove(LANDSCAPE_CLASS);
      innerActionContainer.classList.remove(LANDSCAPE_CLASS);
    }
	} catch (e) {}
}

/**
 * This function is used to load the camera
 * shutter sound
 */
function initializeCameraSound() {
	if (cameraSound === null) {
		try {
			cameraSound = new Audio('patientportal/camera-shutter-sound.mp3');
		} catch (e) {
			console.log('An error occurred while initializing the camera shutter sound.', e);
		}
	}
}

/**
 * This function is used to get the camera settings
 * depending on the current device orientation
 */
function getCameraSettings(type = 'default') {
	
	let constraints = null;
	if (type == 'default')
		constraints = cameraConstraints.default;
	else if (type == 'second')
		constraints = cameraConstraints.second;
	else if (type == 'third')
		constraints = cameraConstraints.third;
  else 
    constraints = cameraConstraints.forth;


  console.log('Camera Settings', constraints);
  
  const constraint = isPortraitMode() ? constraints.portraitSettings : constraints.landscapeSettings;
	
 console.log('constraint', constraint);
 return constraint;
}

/**
 * This function is used to check wether the current device
 * is iOS or not
 *
 * @return <code>true</code> if iOS otherwise <code>false</code>
 */
function is_iOS_device() {
	return [
	    'iPad Simulator',
	    'iPhone Simulator',
	    'iPod Simulator',
	    'iPad',
	    'iPhone',
	    'iPod'
	  ].includes(navigator.platform)
	  // iPad on iOS 13 detection
	  || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

function isCameraPermissionDenied(error) {
	const errorSplit = `${error}`.split(':');
	return errorSplit !== undefined && errorSplit !== null && errorSplit[0] && errorSplit[0] === 'NotAllowedError';
}

window.addEventListener('resize', async () => {
	adjustScreen();
	
	if (!isFirstLoad && track !== null) {
		
		try {
			stopCamera();
			
			const stream = await navigator.mediaDevices.getUserMedia(getCameraSettings(currentConstraints == null ? 'default' : currentConstraints));
	        track = stream.getTracks()[0];
	        cameraView.srcObject = stream;
		} catch (e) {}
		
	}
	
	isFirstLoad = false;
});

// laptop/desktop constraints (for desktop camera testing)
//	const constraints = { video: { facingMode: 'environment', width: 600, height: 378 }, audio: false };

(function () {
  const startCameraButton = document.querySelector('#openCamera');
  startCameraButton.addEventListener('click', async () => {
    startCamera();
  });

  const shutterBtn = document.querySelector('#shutterButton');
  shutterBtn.addEventListener('click', () => takeSnapshot());
})();
