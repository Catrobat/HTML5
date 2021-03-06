﻿/// <reference path="../qunit/qunit-2.4.0.js" />
/// <reference path="../../client/smartJs/sj.js" />
/// <reference path="../../client/smartJs/sj-core.js" />
/// <reference path="../../client/smartJs/sj-event.js" />
/// <reference path="../../client/smartJs/sj-components.js" />
/// <reference path="../../Client/smartJs/sj-animation.js" />
'use strict';

QUnit.module("sj-animation.js");

QUnit.test("SmartJs.AnimationFrame", function (assert) {

    var done = assert.async();

    assert.throws(function () { var frame = new SmartJs.AnimationFrame(); }, Error, "ERROR: static, no class definition/constructor");
    assert.throws(function () { SmartJs.AnimationFrame instanceof SmartJs.AnimationFrame }, Error, "ERROR: static class: no instanceof allowed");

    var frame = new SmartJs._AnimationFrame(); //recreate the static class to avoid side effects in test framework

    var handlerCalled = 0,
        handler = function (e) {
            handlerCalled++;
        },
        listener = new SmartJs.Event.EventListener(handler, this);

    frame.addEventListener(listener);
    frame.dispose();
    assert.ok(frame._disposed == undefined && frame._onUpdate.listenersAttached, "not disposed");

    window.setTimeout(validateHandler, 50);

    var currentCalls;
    function validateHandler() {
        currentCalls = handlerCalled;
        assert.ok(currentCalls > 0, "handler attached and called");
        frame.removeEventListener(listener);
        window.setTimeout(handlerRemoved, 50);
    }

    function handlerRemoved() {
        assert.equal(currentCalls, handlerCalled, "no call after remove");
        assert.equal(frame._frameId, undefined, "animation stopped");

        done();
    }
});


QUnit.test("SmartJs.Animation.Animation", function (assert) {

    var done1 = assert.async();
    var done2 = assert.async();

    var a = new SmartJs.Animation.Animation(10, 20, 320, SmartJs.Animation.Type.LINEAR);
    assert.ok(a instanceof SmartJs.Animation.Animation && a instanceof SmartJs.Core.Component, "instance check");

    assert.throws(function () { var b = new SmartJs.Animation.Animation(10, undefined, 1000, SmartJs.Animation.Type.LINEAR); }, Error, "ERROR: simple argument check");
    assert.throws(function () { var b = new SmartJs.Animation.Animation(10, 20, 1000, function (progress) { return 2 * progress; }); }, Error, "ERROR: render function argument check");

    a.dispose();
    assert.ok(a._disposed, "disposing and recreate");
    a = new SmartJs.Animation.Animation(10, 20, 320, SmartJs.Animation.Type.LINEAR);

    var events = [];
    var startTime;
    var updateEventHandler = function (e) {
        events.push({ delay: (Date.now() - startTime), value: e.value });
    };
    var executedEventHandler = function (e) {
        assert.ok(events.length > 0, "update event handler dispatched correctly");
        assert.ok(true, "executed event handler dispatched correctly");
        assert.equal(e.callId, "validArgs", "callback arguments passed correctly");

        assert.ok(events.length <= 10, events.length + ": max one update per step");
        var error = false;
        //console.log("Animation:");
        for (var i = 1, l = events.length; i < l; i++) {
            //console.log(events[i - 1].delay + ': ' + events[i - 1].value);
            if (events[i - 1].value < events[i].value)
                continue;

            error = true;
            break;
        }
        //console.log(events[events.length - 1].delay + ': ' + events[events.length - 1].value);
        assert.ok(!error, "continuous event & value update");
        assert.equal(events[events.length - 1].value, 20, "end position reached");
        done1();
    }
    a.onUpdate.addEventListener(new SmartJs.Event.EventListener(updateEventHandler, this));
    a.onExecuted.addEventListener(new SmartJs.Event.EventListener(executedEventHandler, this));

    startTime = Date.now();
    a.start({ callId: "validArgs" });

    var b = new SmartJs.Animation.Animation(10, 20, 320, SmartJs.Animation.Type.LINEAR);
    var count = 0;
    var executedEventHandler2 = function (e) {
        count++;
    };
    b.onExecuted.addEventListener(new SmartJs.Event.EventListener(executedEventHandler2, this));
    b.start();
    assert.ok(true, "start without argument");

    b.stop();
    window.setTimeout(function () {
        assert.equal(count, 0, "animation stopped");
        done2();
    }, 400);

});


QUnit.test("SmartJs.Animation.Animation2D", function (assert) {

    var done1 = assert.async();

    var a = new SmartJs.Animation.Animation2D({ x: 10, y: 10 }, { x: 20, y: 20 }, 500, SmartJs.Animation.Type.LINEAR2D);
    assert.ok(a instanceof SmartJs.Animation.Animation && a instanceof SmartJs.Animation.Animation2D, "instance check");

    assert.throws(function () { var b = new SmartJs.Animation.Animation2D({ x: 10, y: 20 }, 20, 1000, SmartJs.Animation.Type.LINEAR2D); }, Error, "ERROR: simple argument check");
    assert.throws(function () { var b = new SmartJs.Animation.Animation2D({ x: 10, y: 20 }, { x: 20, y: 20 }, 1000, function (progress) { return { x: 2 * progress, y: progress }; }); }, Error, "ERROR: render function argument check");

    a.dispose();
    assert.ok(a._disposed, "disposing and recreate");
    a = new SmartJs.Animation.Animation2D({ x: 10, y: 10 }, { x: 20, y: 20 }, 500, SmartJs.Animation.Type.LINEAR2D);

    var events = [];
    var startTime;
    var updateEventHandler = function (e) {
        events.push({ delay: (Date.now() - startTime), value: e.value });
    };
    var executedEventHandler = function (e) {
        var stopTime = Date.now();

        assert.ok(events.length > 0, "update event handler dispatched correctly");
        assert.ok(true, "executed event handler dispatched correctly");
        assert.equal(e.callId, "validArgs", "callback arguments passed correctly");
        assert.ok(events.length <= 20, events.length + ": max one update per step");  //not vaid anymore due to sub-pixel rendering
        //ok: events.length >= 10 && events.length <= 20.. x & y value can change on different times (in theory: for other animation type)

        var errorX = false;
        var errorY = false;
        //no check on events.length == 0 because this only happens on error
        //console.log("Animation2D:");
        for (var i = 1, l = events.length; i < l; i++) {
            //console.log(events[i - 1].delay + ': ' + events[i - 1].value.x + ", " + events[i - 1].value.y);
            if (events[i - 1].value.x >= events[i].value.x) {
                errorX = true;
            }
            if (events[i - 1].value.y >= events[i].value.y) {
                errorY = true;
            }
        }
        //console.log(events[events.length - 1].delay + ': ' + events[events.length - 1].value.x + ", " + events[events.length - 1].value.y);
        assert.ok(!errorX, "continuous event & x value update");
        assert.ok(!errorX, "continuous event & y value update");
        assert.equal(events[events.length - 1].value.x, 20, "end position x reached");
        assert.equal(events[events.length - 1].value.y, 20, "end position y reached");

        assert.ok(stopTime - startTime > 600, "pause/resume checked");
        done1();
    }
    a.onUpdate.addEventListener(new SmartJs.Event.EventListener(updateEventHandler, this));
    a.onExecuted.addEventListener(new SmartJs.Event.EventListener(executedEventHandler, this));

    assert.throws(function () { a.start("errorArgs"); }, Error, "ERROR: validation callback args");
    startTime = Date.now();
    a.start({ callId: "validArgs" });

    window.setTimeout(function () { a.pause(); }, 120);
    window.setTimeout(function () { a.resume(); }, 220);

});


QUnit.test("SmartJs.Animation.Rotation", function (assert) {

    var done1 = assert.async();
    //var done2 = assert.async();

    var r = new SmartJs.Animation.Rotation(90);
    assert.ok(r instanceof SmartJs.Animation.Rotation && r instanceof SmartJs.Core.Component, "instance check");

    assert.throws(function () { var r2 = new SmartJs.Animation.Rotation("a"); }, Error, "ERROR: simple argument check");
    assert.ok(r.onUpdate instanceof SmartJs.Event.Event, "event accessor");

    assert.equal(r.angle, 90, "angle accessor: not started");
    var obj = r.toObject();
    assert.ok(obj.startAngle == 90 && obj.startTimestamp == undefined && obj.rotationSpeed == 0.0, "toObject: not started");

    r.dispose();
    assert.ok(r._disposed, "disposed");
    r = new SmartJs.Animation.Rotation(10.0);

    var updateCounter = 0,
        lastUpdate,
        onUpdateHandler = function (e) {
            updateCounter++;
            lastUpdate = e;
        };

    var r = new SmartJs.Animation.Rotation(370);
    r.onUpdate.addEventListener(new SmartJs.Event.EventListener(onUpdateHandler, this));

    //angle
    assert.equal(r.angle, 10, "angle returns values bewteen 0..360");
    assert.throws(function () { r.angle = "1"; }, Error, "ERRROR: invalid angle setter");
    r.angle = -20.0;
    assert.equal(lastUpdate.value, 340, "angle setter: update triggered (0..360)");
    assert.equal(r.angle, 340, "angle getter (0..360)");

    //rotation speed
    updateCounter = 0;
    assert.equal(r.rotationSpeed, 0, "rotation speed = 0 onInit");
    assert.throws(function () { r.rotationSpeed = "2"; }, Error, "ERROR: rotationSpeed: wrong setter parameter");

    r.rotationSpeed = 0;
    window.setTimeout(test_validateStart0, 20);

    function test_validateStart0() {
        assert.ok(updateCounter == 0, "animation not started if set to = 0");
        test_start2();
    }

    function test_start2() {
        r.rotationSpeed = 2;
        assert.equal(r.rotationSpeed, 2, "rotationSpeed: getter/setter");
        window.setTimeout(test_validateStart2, 20);
    }

    function test_validateStart2() {
        assert.ok(updateCounter > 0, "animation started on rotationSpeed != 0");
        assert.ok(lastUpdate.value > 0, "angle increases");
        r.rotationSpeed = 0;    //should stop now
        updateCounter = 0;
        window.setTimeout(test_validateStop0, 20);
    }

    function test_validateStop0() {
        assert.equal(updateCounter, 0, "rotation stopped if rotationSpeed set to 0");
        //start again
        r.rotationSpeed = 5;
        runTestsOnMethods();
    }

    //methods
    function runTestsOnMethods() {
        //(roation curretly started)
        r.angle = 24;

        var obj = r.toObject(),
            startedAt = obj.startTimestamp;
        assert.ok(obj.startAngle == 24 && Date.now() - startedAt < 10 && obj.rotationSpeed == 5, "toObject(): received object checked");

        obj.startAngle = 54;
        obj.rotationSpeed = 7;

        updateCounter = 0;
        r.setObject(obj);
        assert.equal(updateCounter, 1, "update event dispatched when calling setObject()");
        obj = r.toObject();
        assert.equal(Math.floor(lastUpdate.value), 54, "setObject() update event args");
        assert.ok(obj.startAngle == 54 && startedAt == obj.startTimestamp && obj.rotationSpeed == 7, "setObject() - cloning");

        window.setTimeout(test_pause, 10);
    }

    var currentAngle;
    function test_pause() {
        r.pause();
        r.rotationSpeed = 72;   //should not have an impact on paused rotation

        updateCounter = 0;
        currentAngle = r.angle;

        assert.ok(r._paused, "internal pause check (not required: just to make sure it is set)");
        window.setTimeout(test_validatePause, 20);
    }

    function test_validatePause() {
        assert.equal(updateCounter, 0, "paused: no update event dispatched during pause");
        assert.equal(currentAngle, r.angle, "paused: angle does not change");

        r.angle = 23;
        assert.equal(updateCounter, 1, "paused: set angle dispatched update event");

        r.resume();
        window.setTimeout(test_validateResume, 20);
    }

    function test_validateResume(){
        assert.ok(updateCounter > 0, "resume: events dispatched again");
        assert.ok(currentAngle != r.angle, "resume: angle changed");
        r.stop();
        updateCounter = 0;
        currentAngle = r.angle;
        window.setTimeout(test_validateStop, 20);
    }

    function test_validateStop() {
        assert.equal(updateCounter, 0, "stopped: no update event dispatched when stopped");
        assert.equal(currentAngle, r.angle, "stopped: angle does not change");

        done1();
    }
});
