"use strict";

/**
 * requestAnimationFrame polyfill
 * https://gist.github.com/paulirish/1579671
 */
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
					callback(currTime + timeToCall);
				},
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());


var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;

var canvasStyleWidth = parseInt(window.getComputedStyle(canvas).width);
var scaleFactor = canvas.width / canvasStyleWidth;
var viewableArea = canvasStyleWidth * scaleFactor;
var imageLoaded = false;

$(document).ready(function() {


	if (isDefaultAndroidBrowser()) {
		console.log("Android Browser");
	}

	$(document).on("mousedown touchstart", ".upload", function() {
		if (!imageLoaded) {
			$('#imageLoader').trigger('click');
		}
		return false;
	});

	document.getElementById("changePhoto").addEventListener("click", function() {
		$('#imageLoader').trigger('click');
		return false;
	}, false);

	$(document).on("mousedown touchstart", "#resetPhoto", function() {
		images[currentSelection].xPos = canvas.width / 2;
		images[currentSelection].yPos = canvas.height / 2;
		images[currentSelection].currentWidth = scale(images[currentSelection].initHeight, viewableArea, images[currentSelection].initWidth);
		images[currentSelection].currentHeight = viewableArea;
		if (images[currentSelection].currentWidth < viewableArea) {
			images[currentSelection].currentWidth = viewableArea;
			images[currentSelection].currentHeight = scale(images[currentSelection].initWidth, viewableArea, images[currentSelection].initHeight);
		}
		images[currentSelection].angle = 0;
	});
});

/*
   ------------------------------------------
      image handling
   -------------------------------------------
*/
var images = [];

var imageLoader = document.getElementById("imageLoader");
addEventListener("change", handleImage, false);

function scale(oldSize, newSize, other) {
	var scaleFactor = newSize / oldSize;
	return other * scaleFactor;
}

function handleImage(e) {
	var reader = new FileReader();
	reader.onload = function(event) {
		var img = new Image();
		img.onload = function() {
			images.length = 0;
			images.push(img);
			imageLoaded = true;

			img.xPos = w / 2;
			img.yPos = h / 2;
			img.initWidth = img.width;
			img.initHeight = img.height;
			img.currentWidth = scale(img.initHeight, viewableArea, img.initWidth);
			img.currentHeight = viewableArea;
			if (img.currentWidth < viewableArea) {
				img.currentWidth = viewableArea;
				img.currentHeight = scale(img.initWidth, viewableArea, img.initHeight);
			}
			img.initAngle = 0;
			img.angle = 0;
			$('#topButtons').show();
			$('.initial').hide();
			$('.plus').hide();
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(e.target.files[0]);
	if (supportsTouch()) {
		$('.guide').show();
	} else {
		$('.desktop-controll').show();
	}
	$(".upload").hide();
	$("#changePhoto").show();
}

var currentSelection;
var currentImage;
var relativeMouse;
var relativeTouch1;
var relativeTouch2;
var pointerOn = false;
var mouseDown = false;
var mouseMoving = false;
var mouse = {
	x: 0,
	y: 0
};

var touches = [];
var fingerSize = 24;
var touch = {
	touch1PosX: 0,
	touch1PosY: 0,
	touch2PosX: 0,
	touch2PosY: 0,
	initAngle: 0,
	angle: 0,
	angleChange: 0,
	initLength: 0,
	length: 0,
	fingerLength: 0,
	lengthChange: 0
};

document.getElementById("scaleUp").addEventListener("click", function() {
	adjustSize("add");
}, false);

document.getElementById("scaleDown").addEventListener("click", function() {
	adjustSize("subtract");
}, false);

document.getElementById("rotateLeft").addEventListener("click", function() {
	adjustAngle("left");
}, false);

document.getElementById("rotateRight").addEventListener("click", function() {
	adjustAngle("right");
}, false);

function supportsTouch() {
	return "ontouchstart" in window || navigator.msMaxTouchPoints;
};

if (!supportsTouch()) {

	canvas.addEventListener("mousedown", function(event) {
		if (!imageLoaded) {
			return;
		}
		mouseDown = true;
		var mouseRel = getRelative({
			x: event.clientX,
			y: event.clientY
		});
		mouse.x = mouseRel.x;
		mouse.y = mouseRel.y;
		touch.offsetX = mouse.x - images[currentSelection].xPos;
		touch.offsetY = mouse.y - images[currentSelection].yPos;

		touch.touch1PosX = mouse.x;
		touch.touch1PosY = mouse.y;
		pointerStart(event);
	});

	canvas.addEventListener("mousemove", function(event) {

		var mouseRel = getRelative({
			x: event.clientX,
			y: event.clientY
		});
		mouse.x = mouseRel.x;
		mouse.y = mouseRel.y;
		touch.touch1PosX = mouse.x;
		touch.touch1PosY = mouse.y;
		pointerMove(event);
	});

	canvas.addEventListener("mouseup", function() {
		mouseMoving = false;
		mouseDown = false;
		pointerEnd();
	});

}

canvas.addEventListener("touchstart", function(event) {
	pointerStart(event);
});

canvas.addEventListener("touchmove", function(event) {

	pointerMove(event);
});

canvas.addEventListener("touchend", function(event) {
	pointerEnd(event);
});

function pointerStart(event) {
	$('.guide').hide();
	pointerOn = true;
	var relativeTouch1;
	var relativeTouch2;
	if (!imageLoaded) {
		return;
	}
	// single touch
	if (event.touches !== undefined && event.touches.length === 1) {
		relativeTouch1 = getRelative(event.touches[0]);
		//position
		touch.touch1PosX = relativeTouch1.x;
		touch.touch1PosY = relativeTouch1.y;

		touch.offsetX = touch.touch1PosX - images[currentSelection].xPos;
		touch.offsetY = touch.touch1PosY - images[currentSelection].yPos;

	}
	// multi touch
	else if (event.touches !== undefined && event.touches.length > 1) {
		images[currentSelection].initAngle = images[currentSelection].angle;
		images[currentSelection].initWidth = images[currentSelection].currentWidth;
		images[currentSelection].initHeight = images[currentSelection].currentHeight;
		relativeTouch1 = getRelative(event.touches[0]);
		relativeTouch2 = getRelative(event.touches[1]);

		//position
		touch.touch1PosX = relativeTouch1.x;
		touch.touch1PosY = relativeTouch1.y;
		touch.touch2PosX = relativeTouch2.x;
		touch.touch2PosY = relativeTouch2.y;

		var mid = findMidPoint(relativeTouch1, relativeTouch2);
		touch.offsetX = mid.x - images[currentSelection].xPos;
		touch.offsetY = mid.y - images[currentSelection].yPos;

		//angle
		touch.initAngle = slopeAngle(relativeTouch1, relativeTouch2);
		touch.angle = slopeAngle(relativeTouch1, relativeTouch2);
		touch.angleChange = 0;
		//length
		touch.initLength = findLength(relativeTouch1, relativeTouch2);
		touch.lengthChange = 0;
	}
}

function pointerMove(event) {
	var relativeTouch1;
	var relativeTouch2;
	event.preventDefault();
	touches = event.touches;
	// single touch
	if (event.touches !== undefined && event.touches.length === 1) {
		relativeTouch1 = getRelative(event.touches[0]);

		//position
		touch.touch1PosX = relativeTouch1.x;
		touch.touch1PosY = relativeTouch1.y;

		relativeTouch1 = {
			x: touch.touch1PosX - touch.offsetX,
			y: touch.touch1PosY - touch.offsetY
		};
		moveImage(currentImage, relativeTouch1);
	}
	// multi touch
	if (event.touches !== undefined && event.touches.length > 1) {
		relativeTouch1 = getRelative(event.touches[0]);
		relativeTouch2 = getRelative(event.touches[1]);

		//position
		touch.touch1PosX = relativeTouch1.x;
		touch.touch1PosY = relativeTouch1.y;
		touch.touch2PosX = relativeTouch2.x;
		touch.touch2PosY = relativeTouch2.y;
		//angle
		touch.angle = slopeAngle(relativeTouch1, relativeTouch2);
		touch.angleChange = touch.angle - touch.initAngle;
		//length
		touch.length = findLength(relativeTouch1, relativeTouch2);
		touch.lengthChange = touch.length - touch.initLength;

		relativeTouch1 = {
			x: touch.touch1PosX,
			y: touch.touch1PosY
		};
		relativeTouch2 = {
			x: touch.touch2PosX,
			y: touch.touch2PosY
		};
		var mid = findMidPoint(relativeTouch1, relativeTouch2);

		twoFingerRotate(currentImage, mid);
		twoFingerResize(currentImage, mid);
		mid.x -= touch.offsetX;
		mid.y -= touch.offsetY;
		moveImage(currentImage, mid);
	}


	// Mouse
	if (mouseDown) {
		relativeMouse = {
			x: touch.touch1PosX - touch.offsetX,
			y: touch.touch1PosY - touch.offsetY
		};
		moveImage(currentImage, relativeMouse);
	}

}

function pointerEnd(event) {
	if (imageLoaded) {
		images[currentSelection].initAngle = images[currentSelection].angle;
		images[currentSelection].initWidth = images[currentSelection].currentWidth;
		images[currentSelection].initHeight = images[currentSelection].currentHeight;
	}
	pointerOn = false;
	//position
	//angle
	touch.angle = 0;
	touch.angleChange = 0;
	//length
	touch.length = 0;
	touch.lengthChange = 0;
	if (event !== undefined) {
		if (event.touches !== undefined && event.touches.length == 1) {
			relativeTouch1 = getRelative(event.touches[0]);
			touch.touch1PosX = relativeTouch1.x;
			touch.touch1PosY = relativeTouch1.y;
			console.log(" 2 touch turned into 1 touch -- ", event);
			touch.offsetX = touch.touch1PosX - images[currentSelection].xPos;
			touch.offsetY = touch.touch1PosY - images[currentSelection].yPos;
		}
	}

}

window.requestAnimationFrame(update);

function update() {
	currentSelection = 0;
	currentImage = images[currentSelection];

	context.clearRect(0, 0, w, h);
	context.fillStyle = "#fff";
	context.fillRect(0, 0, w, h);

	drawAllImages(images);

	// printImageData("imageData", currentImage);
	// printTouchData("touchData");
	window.requestAnimationFrame(update);
}

function isInsideImage(image, pointer) {
	return isInside(image.xPos - image.currentWidth / 2, image.yPos - image.currentHeight / 2, image.currentWidth, image.currentHeight, pointer.x, pointer.y);
}

function isInside(x1, y1, width1, height1, x2, y2) {
	return x2 >= x1 &&
		x2 < x1 + width1 &&
		y2 >= y1 &&
		y2 < y1 + height1;
}

function adjustSize(modifier) {
	var img = images[currentSelection];
	if (modifier === "add") {
		img.currentHeight = scale(img.currentWidth, img.currentWidth + 10, img.currentHeight);
		img.currentWidth += 10;
	}
	if (modifier === "subtract") {
		img.currentHeight = scale(img.currentWidth, img.currentWidth - 10, img.currentHeight);
		img.currentWidth -= 10;
	}
}

function adjustAngle(modifier) {
	if (modifier === "right") {
		images[currentSelection].angle += 0.05;
	}
	if (modifier === "left") {
		images[currentSelection].angle -= 0.05;
	}
}

function makeRelative(object) {
	var relativeCoords;

	//touch
	if (typeof object.clientX !== "undefined") {
		relativeCoords = {
			x: (object.clientX - canvas.getBoundingClientRect().left) * scaleFactor,
			y: (object.clientY - canvas.getBoundingClientRect().top) * scaleFactor
		};
		// mouse
	} else {
		relativeCoords = {
			x: (object.x - canvas.getBoundingClientRect().left) * scaleFactor,
			y: (object.y - canvas.getBoundingClientRect().top) * scaleFactor
		};
	}
	return relativeCoords;
}

function getRelative(position) {
	return {
		x: makeRelative(position).x,
		y: makeRelative(position).y
	};
}

function moveImage(image, location) {
	if (imageLoaded && isInsideImage(image, location)) {
		image.xPos = location.x;
		image.yPos = location.y;
	}
}

function resizeImage(image, newWidth) {
	if (imageLoaded) {
		var origHeight = image.currentHeight;
		var origWidth = image.currentWidth;

		if (newWidth < 100) {
			newWidth = 100;
		} else {
			newWidth = newWidth;
		}
		image.currentWidth = newWidth;
		image.currentHeight = (origHeight / origWidth) * newWidth;
	}
}

function twoFingerResize(image, location) {
	if (imageLoaded && isInsideImage(image, location)) {
		touch.lengthChange = touch.length - touch.initLength;
		resizeImage(image, image.initWidth + touch.lengthChange);
	}
}

function twoFingerRotate(image, location) {
	if (imageLoaded && isInsideImage(image, location)) {
		image.angle = image.initAngle - touch.angleChange;
	}
}

function adjustAngle(modifier) {
	if (modifier === "right") {
		images[currentSelection].angle += 0.05;
	}
	if (modifier === "left") {
		images[currentSelection].angle -= 0.05;
	}
}

function drawAllImages(imageArray) {
	if (imageLoaded) {
		for (var i = 0; i < imageArray.length; i++) {
			drawRotatedImage(imageArray[i]);
		}
	}
}

function drawRotatedImage(image) {
	context.save();
	context.translate(image.xPos, image.yPos);
	if (!isDefaultAndroidBrowser()) {
		context.rotate(image.angle);
	}
	context.translate(-image.xPos, -image.yPos);
	drawImageIOSFix(context, image, 0, 0, image.width, image.height, image.xPos - (image.currentWidth / 2), image.yPos - (image.currentHeight / 2), image.currentWidth, image.currentHeight);
	context.restore();
}

function getPercentChange(newVal, oldVal) {
	return (newVal - oldVal) / oldVal;
}

function findLength(start, end) {
	var a = end.x - start.x;
	var b = end.y - start.y;
	var csq = (a * a) + (b * b);
	return Math.floor(Math.sqrt(csq));
}

function findMidPoint(start, end) {
	return {
		x: (start.x + end.x) / 2,
		y: (start.y + end.y) / 2
	};
}

function slopeAngle(start, end) {
	var run = end.x - start.x;
	var rise = end.y - start.y;
	return Math.atan2(run, rise);
}

/**
 * http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
 * Detecting vertical squash in loaded image.
 * Fixes a bug which squash image vertically while drawing into canvas for some images.
 * This is a bug in iOS6 devices. This function from https://github.com/stomita/ios-imagefile-megapixel
 *
 */
function detectVerticalSquash(img) {
	var iw = img.naturalWidth,
		ih = img.naturalHeight;
	var canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = ih;
	var ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0);
	var data = ctx.getImageData(0, 0, 1, ih).data;
	// search image edge pixel position in case it is squashed vertically.
	var sy = 0;
	var ey = ih;
	var py = ih;
	while (py > sy) {
		var alpha = data[(py - 1) * 4 + 3];
		if (alpha === 0) {
			ey = py;
		} else {
			sy = py;
		}
		py = (ey + sy) >> 1;
	}
	var ratio = (py / ih);
	return (ratio === 0) ? 1 : ratio;
}

/**
 * A replacement for context.drawImage
 * (args are for source and destination).
 */
function drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
	var vertSquashRatio = detectVerticalSquash(img);
	// Works only if whole image is displayed:
	// ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
	// The following works correct also when only a part of the image is displayed:
	ctx.drawImage(img, sx * vertSquashRatio, sy * vertSquashRatio,
		sw * vertSquashRatio, sh * vertSquashRatio,
		dx, dy, dw, dh);
}

function is_touch_device() {
	try {
		document.createEvent("TouchEvent");
		return true;
	} catch (e) {
		return false;
	}
}

function isDefaultAndroidBrowser() {
	var userAgent = navigator.userAgent;
	return ((userAgent.indexOf('Mozilla/5.0') > -1 && userAgent.indexOf('Android ') > -1 && userAgent.indexOf('AppleWebKit') > -1) && !(userAgent.indexOf('Chrome') > -1));
}

function printImageData(tag, image) {
	if (imageLoaded) {
		document.getElementById(tag).innerHTML = "<strong>Current Image data</strong>" + "<br/> x: " + image.xPos + " ," + "<br/> x: " + image.yPos + " ," + "<br/> initX: " + image.initX + " ," + "<br/> initY: " + image.initY + " ," + "<br/> initAngle: " + image.initAngle + " ," + "<br/> angle: " + image.angle + " ," + "<br/> initWidth: " + image.initWidth + " ," + "<br/> initHeight: " + image.initHeight + " ," + "<br/> currentWidth: " + image.currentWidth + " ," + "<br/> currentHeight: " + image.currentHeight + " ";
	}
}

function printTouchData(tag) {
	document.getElementById(tag).innerHTML = "<strong>Current Touch data</strong>" + "<br/> : " + +" ," + "<br/> : " + +" ," + "<br/> Touch 1 x: " + touch.touch1PosX + " ," + "<br/> Touch 1 y: " + touch.touch1PosY + " ," + "<br/> Touch 2 x: " + touch.touch2PosX + " ," + "<br/> Touch 2 y: " + touch.touch2PosY + " ," + "<br/> Initial Angle (radians): " + touch.initAngle + " ," + "<br/> Current Angle (radians): " + touch.angle + " ," + "<br/> Angle  Change: " + touch.angleChange + "," + "<br/>Initial Length (px): " + touch.initLength + " ," + "<br/>Current Length (px): " + touch.length + " ," + "<br/> Current Finger Length (px): " + touch.fingerLength + " ," + "<br/> Length Change (px): " + touch.lengthChange + "<br/> touch offset (px): " + touch.offsetX + ", " + touch.offsetY;
}