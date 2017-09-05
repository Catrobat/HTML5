﻿/// <reference path="../../qunit/qunit-2.1.1.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/soundManager.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/device.js" />
'use strict';

QUnit.module("components/device.js");


QUnit.test("Device", function (assert) {

    var sm = new PocketCode.SoundManager();
    assert.throws(function () { var dev = new PocketCode.Device("sm"); }, Error, "ERROR: invalid cntr argument");
    var dev = new PocketCode.Device(sm);

    assert.ok(dev instanceof PocketCode.Device, "instance check");
    assert.ok(dev.onSpaceKeyDown instanceof SmartJs.Event.Event, "onSpaceKeyDown event check");

    assert.ok(dev.onInit instanceof SmartJs.Event.Event && dev.onSpaceKeyDown instanceof SmartJs.Event.Event, "event check");

    assert.ok(dev.initialized, "initialized getter");   //geo location not in use
    assert.equal(dev.isMobile, SmartJs.Device.isMobile, "isMobile: accessor");
    assert.equal(dev.isTouch, SmartJs.Device.isTouch, "isMobile: accessor");

    assert.equal(dev.unsupportedFeatureDetected, false, "unsupported feature detected: initial = false");
    assert.equal(dev.unsupportedFeatures.length, 0, "unsupported features: initial = []");

    assert.ok(typeof dev.mobileLockRequired == 'boolean', "mobileLockRequired: accessor"); //poor tests as we cannot set isMobile here

    assert.ok(!isNaN(dev.accelerationX), "accelerationX getter");
    assert.ok(!isNaN(dev.accelerationY), "accelerationY getter");
    assert.ok(!isNaN(dev.accelerationZ), "accelerationZ getter");
    assert.ok(!isNaN(dev.compassDirection), "compassDirection getter");
    assert.ok(!isNaN(dev.inclinationX), "inclinationX getter");
    assert.ok(!isNaN(dev.inclinationY), "inclinationY getter");

    assert.equal(dev.loudness, sm.volume, "loudness getter");
    
    dev._features.FLASH.inUse = false;
    assert.equal(dev.flashOn, false, "flashOn getter");
    assert.ok(dev._features.FLASH.inUse, "flashOn: flash inUser: after getter");
    dev._features.FLASH.inUse = false;
    dev.flashOn = true;
    assert.ok(dev._features.FLASH.inUse, "flashOn: flash inUser: after setter");
    assert.equal(dev.flashOn, true, "flashOn getter/setter");
    assert.throws(function () { dev.flashOn = ""; }, Error, "ERROR: invlalid setter: flash on");

    //lego nxt
    assert.ok(!isNaN(dev.nxt1), "nxt1 getter");
    assert.ok(!isNaN(dev.nxt2), "nxt2 getter");
    assert.ok(!isNaN(dev.nxt3), "nxt3 getter");
    assert.ok(!isNaN(dev.nxt4), "nxt4 getter");

    //phiro
    assert.ok(!isNaN(dev.phiroFrontLeft), "phiroFrontLeft getter");
    assert.ok(!isNaN(dev.phiroFrontRight), "phiroFrontRight getter");
    assert.ok(!isNaN(dev.phiroSideLeft), "phiroSideLeft getter");
    assert.ok(!isNaN(dev.phiroSideRight), "phiroSideRight getter");
    assert.ok(!isNaN(dev.phiroBottomLeft), "phiroBottomLeft getter");
    assert.ok(!isNaN(dev.phiroBottomRight), "phiroBottomRight getter");

    //arduino
    assert.ok(!isNaN(dev.getArduinoAnalogPin()), "Arduino analog getter");
    assert.ok(!isNaN(dev.getArduinoDigitalPin()), "Arduino digital getter");

    assert.equal(dev.vibrate(''), false, "vibrate call without valid parameter");
    dev._features.VIBRATE.supported = false; //disable
    assert.notOk(dev.vibrate("10"), "vibrate: invalid argument");
    assert.equal(dev.vibrate(10), false, "vibrate call with parameter");
    
    assert.equal(dev.emulationInUse, false, "emulationInUse getter: should always return false");

    assert.equal(dev.unsupportedFeatureDetected, true, "unsupported feature detected");
    assert.equal(dev.unsupportedFeatures.length, 8, "unsupported features: all");

    //dispose
    dev.dispose();
    assert.equal(dev._disposed, true, "dispose");
    assert.notEqual(sm._disposed, true, "sound manager not disposed during dispose");

    dev = new PocketCode.Device(sm);  //recreate to check if there are any side effects

});


QUnit.test("Device: Touch", function (assert) {

    var sm = new PocketCode.SoundManager();
    var dev = new PocketCode.Device(sm);

    assert.equal(dev.lastTouchIndex, 0, "initial: no touch");
    dev.updateTouchEvent(PocketCode.UserActionType.TOUCH_START, "m1", 0, 0);
    assert.equal(dev.lastTouchIndex, 1, "touch added on touch start");
    dev.updateTouchEvent(PocketCode.UserActionType.TOUCH_MOVE, "m1", 1, 1);
    dev.updateTouchEvent(PocketCode.UserActionType.TOUCH_END, "m1", 2, 2);
    assert.equal(dev.lastTouchIndex, 1, "no touch added on move/end");

    dev.reset();
    assert.equal(dev.lastTouchIndex, 0, "initial: no touch (after clear/restart)");

    dev.updateTouchEvent(PocketCode.UserActionType.TOUCH_START, "m1", 0, 1);
    dev.updateTouchEvent(PocketCode.UserActionType.TOUCH_MOVE, "m1", 2, 3);

    assert.ok(dev.isTouched(1), "active touch");
    dev.updateTouchEvent(PocketCode.UserActionType.TOUCH_END, "m1", 4, 5);
    assert.notOk(dev.isTouched(1), "active touch = false");

    assert.equal(dev.getTouchX(1), 2, "x position, last edit (touch end positions ignored)");
    assert.equal(dev.getTouchY(1), 3, "y position, last edit (touch end positions ignored)");

    //out of range
    assert.notOk(dev.isTouched(2), "isTouched: out of range (idx >= length)");

    assert.equal(dev.getTouchX(2), 0.0, "x position: out of range (idx >= length)");
    assert.equal(dev.getTouchY(2), 0.0, "y position: out of range (idx >= length)");

    assert.notOk(dev.isTouched(0), "isTouched: out of range (idx <= 0)");

    assert.equal(dev.getTouchX(0), 0.0, "x position: out of range (idx <= 0)");
    assert.equal(dev.getTouchY(0), 0.0, "y position: out of range (idx <= 0)");

    //getLatestActiveTouchPosition
    assert.deepEqual(dev.getLatestActiveTouchPosition(), {}, "touch position: return empty object if not touch is active");
    dev._touchEvents.active["test"] = {}; //to make sure the quick check does not return an empty object
    dev._touchEvents.history = [{ active: true, x: 1, y: 2 }, { active: true, x: 3, y: 4 }];
    var pos = dev.getLatestActiveTouchPosition();
    assert.ok(pos.x == 3 && pos.y == 4, "latest active touch position");

    //geoLocation
    var sm = new PocketCode.SoundManager();
    var dev = new PocketCode.Device(sm);

    //setting internal values
    dev._geoLocationData.latitude = 1;
    dev._geoLocationData.longitude = 2;
    dev._geoLocationData.altitude = 3;
    dev._geoLocationData.accuracy = 4;

    assert.equal(dev.geoLatitude, 1, "latitude getter");
    assert.equal(dev.geoLongitude, 2, "longitude getter");
    assert.equal(dev.geoAltitude, 3, "altitude getter");
    assert.equal(dev.geoAccuracy, 4, "accuracy getter");

});

/*
QUnit.test("MediaDevice", function (assert) {

    var sm = new PocketCode.SoundManager();
    var dev = new PocketCode.MediaDevice(sm);

    assert.ok(dev instanceof PocketCode.Device && dev instanceof PocketCode.MediaDevice, "instance check");

    dev._features.CAMERA.inUse = false;
    assert.equal(dev.selectedCamera, PocketCode.CameraType.BACK, "selected camera: default selected");
    assert.ok(dev._features.CAMERA.inUse, "camera inUser: after getter");
    dev._features.CAMERA.inUse = false;
    assert.throws(function () { dev.selectedCamera = "OTHER"; }, Error, "ERROR: camera setter: invalid value");
    assert.notOk(dev._features.CAMERA.inUse, "camera inUser: after invalid setter");
    dev._features.CAMERA.inUse = false;
    dev.selectedCamera = PocketCode.CameraType.FRONT;
    assert.ok(dev._features.CAMERA.inUse, "camera inUser: after setter");
    assert.equal(dev.selectedCamera, PocketCode.CameraType.FRONT, "selected camera: getter/setter");

    assert.equal(dev.cameraOn, false, "cameraOn: default");
    dev._features.CAMERA.inUse = false;
    assert.throws(function () { dev.cameraOn = "OTHER"; }, Error, "ERROR: cameraOn setter: invalid value");
    assert.notOk(dev._features.CAMERA.inUse, "cameraOn: camera inUser: after invalid setter");
    dev._features.CAMERA.inUse = false;
    dev.cameraOn = true;
    assert.ok(dev._features.CAMERA.inUse, "camera inUser: after setter");
    assert.ok(dev.cameraOn, "selected camera: getter/setter");

    dev._features.CAMERA.inUse = false;
    assert.ok(typeof dev.faceDetected === 'boolean', "faceDetected getter");
    assert.ok(dev._features.CAMERA.inUse, "camera inUser: after getter");
    assert.ok(!isNaN(dev.faceSize), "faceSize getter");
    assert.ok(!isNaN(dev.facePositionX), "facePositionX getter");
    assert.ok(!isNaN(dev.facePositionY), "facePositionY getter");


    assert.ok(false, "TODO");
});
*/

QUnit.test("DeviceEmulator", function (assert) {

    var sm = new PocketCode.SoundManager();
    var dev = new PocketCode.DeviceEmulator(sm);

    assert.ok(dev instanceof PocketCode.MediaDevice && dev instanceof PocketCode.DeviceEmulator, "instance check");

    assert.equal(dev.unsupportedFeatureDetected, false, "unsupported feature detected: initial = false");
    assert.equal(dev.unsupportedFeatures.length, 0, "unsupported features: initial = []");

    //dispose
    dev.dispose();
    assert.equal(dev._disposed, true, "dispose");
    assert.notEqual(sm._disposed, true, "sound manager not disposed during dispose");

    dev = new PocketCode.DeviceEmulator(sm);  //recreate to check if there are any side effects
    assert.equal(dev.emulationInUse, false, "emulationInUse getter: false on init");
    assert.ok(!isNaN(dev.inclinationX), "inclinationX getter");
    assert.ok(!isNaN(dev.inclinationY), "inclinationY getter");
    assert.equal(dev.emulationInUse, true, "emulationInUse getter: true after inclination in use");

    assert.equal(dev.unsupportedFeatureDetected, false, "unsupported feature detected: inclination emulation = false");
    assert.equal(dev.unsupportedFeatures.length, 0, "unsupported features: inclination emulation = []");

    assert.ok(!isNaN(dev.accelerationX), "accelerationX getter");
    assert.equal(dev.unsupportedFeatureDetected, true, "unsupported feature detected: acceleration");
    assert.equal(dev.unsupportedFeatures.length, 1, "unsupported features: acceleration");
    dev.unsupportedFeatures[0] == "deviceFeatureAccelerationNEW";
    assert.equal(dev.unsupportedFeatures[0], "lblDeviceAcceleration", "property and access check");

});


QUnit.test("DeviceEmulator Key Events Left/Right", function (assert) {

    var doneLeft = assert.async();
    var doneLeftAlt = assert.async();
    var doneRight = assert.async();
    var doneRightAlt = assert.async();

    var doneLeftRight = assert.async();
    var doneLeftRightAlt = assert.async();

    var doneSpace = assert.async();

    var doneDispose = assert.async();

    var soundmanager = new PocketCode.SoundManager();
    var deviceEmulator = new PocketCode.DeviceEmulator(soundmanager);

    //Left key
    var validateSingleKeyLeft = function () {
        assert.ok(deviceEmulator.inclinationX > 0, "Left Key pressed: inclination to the left");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.LEFT});
        //console.log(deviceEmulator.inclinationX);
        assert.equal(deviceEmulator.inclinationX, 0, "Left Key released: no inclination");
        doneLeft();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.LEFT});
    //correct tests if console.log is there
    //console.log(deviceEmulator.inclinationX);
    setTimeout(validateSingleKeyLeft, 20);

    //Left key alternative
    var validateSingleKeyLeftAlternative = function () {
        assert.ok(deviceEmulator.inclinationX > 0, "Alternative Left Key pressed: inclination to the left");
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.LEFT});
        assert.equal(deviceEmulator.inclinationX, 0, "Alternative Left Key released: no inclination");
        doneLeftAlt();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._alternativeKeyCode.LEFT});
    //console.log(deviceEmulator.inclinationX);
    setTimeout(validateSingleKeyLeftAlternative, 30);

    //Right key
    var validateSingleKeyRight = function () {
        assert.ok(deviceEmulator.inclinationX < 0, "Right Key pressed: inclination to the right");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.RIGHT});
        assert.equal(deviceEmulator.inclinationX, 0, "Right Key released: no inclination");
        doneRight();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.RIGHT});
    setTimeout(validateSingleKeyRight, 40);

    //Right key alternative
    var validateSingleKeyRightAlternative = function () {
        //console.log(deviceEmulator.inclinationX);
        assert.ok(deviceEmulator.inclinationX < 0, "Alternative Right Key pressed: inclination to the right");
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.RIGHT});
        assert.equal(deviceEmulator.inclinationX, 0, "Alternative Right Key released: no inclination");
        doneRightAlt();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._alternativeKeyCode.RIGHT});
    //console.log(deviceEmulator.inclinationX);
    setTimeout(validateSingleKeyRightAlternative, 50);

    //Left and Right pressed
    var validateTwoKeysLeftRight = function () {
        deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.RIGHT});
        assert.equal(deviceEmulator._keyPress.LEFT, deviceEmulator._keyPress.RIGHT, "Left and Right Key pressed: inclination hold");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.LEFT});
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.RIGHT});
        assert.equal(deviceEmulator.inclinationX, 0, "Left and Right Key released: no inclination");
        doneLeftRight();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.LEFT});

    setTimeout(validateTwoKeysLeftRight, 60);

    //Alternative Left and Right pressed
    var validateTwoKeysLeftRightAlternative = function () {
        deviceEmulator._keyDown({keyCode: deviceEmulator._alternativeKeyCode.RIGHT});
        assert.equal(deviceEmulator._keyPress.LEFT, deviceEmulator._keyPress.RIGHT, "Alternative Left and Right Key pressed: inclination hold");
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.LEFT});
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.RIGHT});
        assert.equal(deviceEmulator.inclinationX, 0, "Alternative Left and Right Key released: no inclination");
        doneLeftRightAlt();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._alternativeKeyCode.LEFT});
    setTimeout(validateTwoKeysLeftRightAlternative, 70);

    var validateKeySpace = function () {
        assert.ok(deviceEmulator._keyPress.SPACE, "Space key pressed");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.SPACE});
        assert.notOk(deviceEmulator._keyPress.SPACE, "Space Key released");
        doneSpace();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.SPACE});
    setTimeout(validateKeySpace, 80);

    //dispose
    var testDispose = function () {
        deviceEmulator.dispose();
        assert.equal(deviceEmulator._disposed, true, "dispose");
        assert.notEqual(soundmanager._disposed, true, "sound manager not disposed during dispose");
        doneDispose();
    }
    setTimeout(testDispose, 90);

});

QUnit.test("DeviceEmulator Key Events Up/Down", function (assert) {

    var doneUp = assert.async();
    var doneUpAlt = assert.async();
    var doneDown = assert.async();
    var doneDownAlt = assert.async();

    var doneUpDown = assert.async();
    var doneUpDownAlt = assert.async();

    var doneSpace = assert.async();

    var doneDispose = assert.async();

    var soundmanager = new PocketCode.SoundManager();
    var deviceEmulator = new PocketCode.DeviceEmulator(soundmanager);

    //Up key
    var validateSingleKeyUp = function () {
        deviceEmulator
        assert.ok(deviceEmulator.inclinationY < 0, "Up Key pressed: inclination to the top");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.UP});
        assert.equal(deviceEmulator.inclinationY, 0, "Up Key released: no inclination");
        doneUp();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.UP});
    setTimeout(validateSingleKeyUp, 20);

    //Up key alternative
    var validateSingleKeyUpAlternative = function () {
        assert.ok(deviceEmulator.inclinationY < 0, "Alternative Up Key pressed: inclination to the top");
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.UP});
        assert.equal(deviceEmulator.inclinationY, 0, "Alternative Up Key released: no inclination");
        doneUpAlt();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._alternativeKeyCode.UP});
    setTimeout(validateSingleKeyUpAlternative, 20);

    //Down key
    var validateSingleKeyDown = function () {
        assert.ok(deviceEmulator.inclinationY > 0, "Down Key pressed: inclination to the bottom");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.DOWN});
        assert.equal(deviceEmulator.inclinationY, 0, "Down Key released: no inclination");
        doneDown();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.DOWN});
    setTimeout(validateSingleKeyDown, 20);

    //Down key alternative
    var validateSingleKeyDownAlternative = function () {
        assert.ok(deviceEmulator.inclinationY > 0, "Alternative Down Key pressed: inclination to the bottom");
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.DOWN});
        assert.equal(deviceEmulator.inclinationY, 0, "Alternative Down Key released: no inclination");
        doneDownAlt();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._alternativeKeyCode.DOWN});
    setTimeout(validateSingleKeyDownAlternative, 20);

    //Up and Down pressed
    var validateTwoKeysUpDown = function () {
        deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.DOWN});
        assert.equal(deviceEmulator._keyPress.UP, deviceEmulator._keyPress.DOWN, "Up and Down Key pressed: inclination hold");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.UP});
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.DOWN});
        assert.equal(deviceEmulator.inclinationY, 0, "Up and Down Key released: no inclination");
        doneUpDown();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.UP});
    setTimeout(validateTwoKeysUpDown, 20);

    //Alternative Up and Down pressed
    var validateTwoKeysUpDownAlternative = function () {
        deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.DOWN});
        assert.equal(deviceEmulator._keyPress.UP, deviceEmulator._keyPress.DOWN, "Alternative Up and Down Key pressed: inclination hold");
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.UP});
        deviceEmulator._keyUp({keyCode: deviceEmulator._alternativeKeyCode.DOWN});
        assert.equal(deviceEmulator.inclinationY, 0, "Alternative Up and Down Key released: no inclination");
        doneUpDownAlt();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.UP});
    setTimeout(validateTwoKeysUpDownAlternative, 20);

    var validateKeySpace = function () {
        assert.ok(deviceEmulator._keyPress.SPACE, "Space key pressed");
        deviceEmulator._keyUp({keyCode: deviceEmulator._keyCode.SPACE});
        assert.notOk(deviceEmulator._keyPress.SPACE, "Space Key released");
        doneSpace();
    }
    deviceEmulator._keyDown({keyCode: deviceEmulator._keyCode.SPACE});
    setTimeout(validateKeySpace, 20);

    //dispose
    var testDispose = function () {
        deviceEmulator.dispose();
        assert.equal(deviceEmulator._disposed, true, "dispose");
        assert.notEqual(soundmanager._disposed, true, "sound manager not disposed during dispose");
        doneDispose();
    }
    setTimeout(testDispose, 20);

});

