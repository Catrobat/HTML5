﻿/// <reference path="../../qunit/qunit-2.4.0.js" />
/// <reference path="../../../Client/smartJs/sj.js" />
/// <reference path="../../../Client/smartJs/sj-event.js" />
/// <reference path="../../../Client/smartJs/sj-core.js" />
/// <reference path="../../../Client/smartJs/sj-components.js" />
/// <reference path="../../../Client/smartJs/sj-ui.js" />
/// <reference path="../../../Client/pocketCode/scripts/model/sprite.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/renderingItem.js" />
/// <reference path="../../../Client/pocketCode/scripts/ui/canvas.js" />
'use strict';

QUnit.module("ui/canvas.js");


QUnit.test("Canvas", function (assert) {

    var done = assert.async();
    var ALPHA_CHANNEL_IDX = 3;

    var alphaAtPoint = function (ctx, x, y) {
        return ctx.getImageData(x, y, 1, 1).data[ALPHA_CHANNEL_IDX];
    };

    var pixelHasAlpha = function (ctx, x, y) {
        return alphaAtPoint(ctx, x, y) > 0.;
    };

    var countPixels = function (ctx, canvasWidth, canvasHeight) {
        var pixels = 0;

        for (var i = 0; i < canvasHeight; i++) {
            for (var j = 0; j < canvasWidth; j++) {
                if (pixelHasAlpha(ctx, j, i)) {
                    pixels++;
                }
            }
        }
        return pixels;
    };

    var gameEngine = new PocketCode.GameEngine();
    var scene = new PocketCode.Model.Scene(gameEngine, undefined, []);
    var is = new PocketCode.ImageStore();
    gameEngine._imageStore = is;

    var baseUrl = "_resources/images/",
        images = [
            { id: "s1", url: "imgHelper14.png", size: 1 }, // 100% opaque red square
            { id: "s2", url: "imgHelper15.png", size: 1 }  // green square inside transparent area
        ];

    var viewportScaling = 1.5; // dont set too high, or scaled position wont be on canvas anymore

    is.onLoad.addEventListener(new SmartJs.Event.EventListener(runTests));
    var canvas = new PocketCode.Ui.Canvas();
    assert.ok(canvas instanceof PocketCode.Ui.Canvas && canvas instanceof SmartJs.Ui.Control, "instance check");
    assert.ok(canvas.onRenderingSpriteTouched instanceof SmartJs.Event.Event &&
        canvas.onTouchStart instanceof SmartJs.Event.Event &&
        canvas.onTouchMove instanceof SmartJs.Event.Event &&
        canvas.onTouchEnd instanceof SmartJs.Event.Event, "event accessors");

    assert.equal(canvas.contextTop, canvas._upperCanvasCtx, "upper context accessor");


    canvas.setDimensions(80, 40, 1, 1);
    is.loadImages(baseUrl, images, 1);

    //start tests after imageStore has loaded all required images/looks
    function runTests() {
        var looks1 = [{ resourceId: "s1", id: "s1", name: "look1" }];
        var looks2 = [{ resourceId: "s2", id: "s2", name: "look2" }];
        var sprite1 = new PocketCode.Model.Sprite(gameEngine, scene, { id: "id0", name: "sprite0", looks: looks1 });
        var sprite2 = new PocketCode.Model.Sprite(gameEngine, scene, { id: "id1", name: "sprite1", looks: looks2 });

        sprite1.initLooks();
        sprite2.initLooks();

        var renderingSpriteOpaque = sprite1.renderingSprite;
        var renderingSpriteTransparent = sprite2.renderingSprite;

        var opaqueImageWidth = renderingSpriteOpaque._cacheCanvas.width;
        var opaqueImageHeight = renderingSpriteOpaque._cacheCanvas.height;

        //move to top left
        renderingSpriteOpaque.x -= canvas.width * 0.5;
        renderingSpriteOpaque.y += canvas.height * 0.5;

        canvas.renderingSprites = [renderingSpriteOpaque];
        canvas.render();

        assert.notOk(canvas._isTargetTransparent(renderingSpriteOpaque, renderingSpriteOpaque), "target not transparent");

        var canvasELement = canvas._spritesCanvasEl,
            ctx = canvasELement.getContext('2d');
        assert.equal(countPixels(ctx, canvasELement.width, canvasELement.height), opaqueImageWidth * opaqueImageHeight / 4.0, "correct nr of pixels rendered on canvas");
        //check position
        var visible = 0, transparent = 0;
        var list = [{ x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 }, { x: 0, y: 4 }];
        for (var i = 0, l = list.length; i < l; i++) {
            if (pixelHasAlpha(ctx, list[i].x, list[i].y))
                visible++;
        }
        assert.equal(visible, 9, "visible boundary check: rendering position");

        list = [{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 5 }, { x: 0, y: 5 }];
        for (var i = 0, l = list.length; i < l; i++) {
            if (!pixelHasAlpha(ctx, list[i].x, list[i].y))
                transparent++;
        }
        assert.equal(transparent, 11, "transparent boundary check: rendering position");

        assert.throws(function () { canvas.renderingSprites = renderingSpriteTransparent; }, Error, "ERROR: invalid argument: rendering image setter");
        canvas.renderingSprites = [renderingSpriteTransparent];

        canvas.render();

        assert.ok(canvas._isTargetTransparent(renderingSpriteTransparent, { x: 3, y: 3 }), "isTargetTransparent returns true for transparent pixels");
        assert.ok(!canvas._isTargetTransparent(renderingSpriteTransparent, { x: 2, y: 2 }), "isTargetTransparent returns false for non transparent pixel");
        assert.ok(canvas._isTargetTransparent(renderingSpriteTransparent, { x: 8, y: 3 }), "isTargetTransparent returns true for transparent pixels");
        canvas.clear();

        //TODO: testing the canvas rendering Text does not only mean to check the setter but to render a text and check the output
        var renderingText = new PocketCode.RenderingText({ id: "rt_id", text: "TEXT", visible: true, x: 0, y: 0 });
        assert.throws(function () { canvas.renderingTexts = renderingText; }, Error, "ERROR: invalid argument: rendering texts setter");
        canvas.renderingTexts = [renderingText];
        assert.equal(canvas._renderingTexts[0], renderingText, "renderingTexts: setter");
        canvas.renderingTexts = [];

        var width = canvas.width;
        assert.throws(function () { canvas.width = "invalid"; }, Error, "ERROR: width setter");
        canvas.width = 45;
        assert.equal(canvas.width, 45, "width: getter/setter");
        canvas.width = width;

        var height = canvas.height;
        assert.throws(function () { canvas.height = "invalid"; }, Error, "ERROR: height setter");
        canvas.height = 50;
        assert.equal(canvas.height, 50, "height: getter/setter");
        canvas.height = height;

        //_getTargetAt
        var scalingAppliedToPointer = false;

        var previousScaling = { x: canvas._scalingX, y: canvas._scalingY };
        var scaling = 2.0;
        canvas.scale(scaling, scaling);
        var mockPointer = { x: -30, y: 10 }; //{ x: 10, y: 10 };

        canvas.getPointer = function () {
            return mockPointer;
        };

        canvas._isTargetTransparent = function () { return false; };

        var createMockRenderingObject = function (id, isPotentialTarget) {
            var ro = new PocketCode.RenderingSprite({ id: id, visible: true });
            //override containsPoint
            ro.containsPoint = function (pointer) {
                if (pointer.x === mockPointer.x / scaling && pointer.y === mockPointer.y / scaling)
                    scalingAppliedToPointer = true;
                return isPotentialTarget;
            };
            return ro;
            //return {
            //    id: id,
            //    visible: true,
            //    containsPoint: function (pointer) {
            //        if (pointer.x === mockPointer.x / scaling && pointer.y === mockPointer.y / scaling)
            //            scalingAppliedToPointer = true;
            //        return isPotentialTarget;
            //    }
            //}
        };

        var previousRenderingObjects = canvas._renderingSprites;
        var renderingSprites = [];
        renderingSprites.push(createMockRenderingObject(1, false));
        renderingSprites.push(createMockRenderingObject(2, false));
        renderingSprites.push(createMockRenderingObject(4, true));

        canvas.renderingSprites = renderingSprites;
        var target = canvas._getTargetAt(mockPointer);
        assert.strictEqual(target.id, 4, '_getTargetAt returns correct target');

        target.visible = false;
        target = canvas._getTargetAt(mockPointer);
        assert.ok(!target, "target not found if invisible");

        renderingSprites.push(createMockRenderingObject(5, false));
        renderingSprites.push(createMockRenderingObject(6, false));
        renderingSprites.push(createMockRenderingObject(7, true));

        canvas.renderingSprites = renderingSprites;
        assert.strictEqual(canvas._getTargetAt(mockPointer).id, 7, '_getTargetAt returns last correct target in renderingObjects');

        canvas._renderingSprites = [];
        renderingSprites = [];
        assert.ok(!canvas._getTargetAt(mockPointer), 'no target found if there are no rendering objects');

        renderingSprites.push(createMockRenderingObject(1, false));
        canvas.renderingSprites = renderingSprites;
        assert.ok(!canvas._getTargetAt(mockPointer), 'no target found if there are no target rendering objects');

        canvas.renderingSprites = previousRenderingObjects;
        canvas.scale(previousScaling.x, previousScaling.y);

        //event tests
        var imageTouchedEventArgs,
            touchStartEventArgs,
            touchMoveEventArgs,
            touchEndEventArgs;

        canvas.onRenderingSpriteTouched.dispatchEvent = function (e) {
            imageTouchedEventArgs = e;
        };
        canvas.onTouchStart.dispatchEvent = function (e) {
            touchStartEventArgs = e;
        };
        canvas.onTouchMove.dispatchEvent = function (e) {
            touchMoveEventArgs = e;
        };
        canvas.onTouchEnd.dispatchEvent = function (e) {
            touchEndEventArgs = e;
        };

        canvas._touchStartHandler({ button: 2, clientX: 0, clientY: 0, preventDefault: function () { }, stopPropagation: function () { } });   //mouse
        assert.equal(touchStartEventArgs.id, "m2", "touch start: mouse");
        assert.ok(canvas._activeTouchEvents.indexOf("m2") >= 0, "touch start added: mouse");
        canvas._touchStartHandler({ changedTouches: [{ identifier: 2, clientX: 0, clientY: 0 }], touches: [{ identifier: 2, clientX: 0, clientY: 0 }], preventDefault: function () { }, stopPropagation: function () { } });   //tab
        assert.equal(touchStartEventArgs.id, "t2", "touch start: touch");
        assert.ok(canvas._activeTouchEvents.indexOf("t2") >= 0, "touch start added: touch");

        canvas._activeTouchEvents = []; //reset
        canvas._touchStartHandler({ changedTouches: [{ identifier: 2, clientX: 40, clientY: 20 }], touches: [{ identifier: 2, clientX: 0, clientY: 0 }], preventDefault: function () { }, stopPropagation: function () { } });   //tab
        assert.equal(imageTouchedEventArgs.targetId, "id1", "image touched");

        canvas._touchMoveHandler({ button: 2, clientX: 0, clientY: 0, preventDefault: function () { }, stopPropagation: function () { } });   //mouse move
        assert.equal(touchMoveEventArgs, undefined, "mouse move: not registered");

        canvas._activeTouchEvents.push("m2");   //init mouse clicked
        canvas._touchMoveHandler({ button: 2, clientX: 0, clientY: 0, preventDefault: function () { }, stopPropagation: function () { } });   //mouse move
        assert.equal(touchMoveEventArgs.id, "m2", "mouse move: registered");

        canvas._touchMoveHandler({ button: 2, clientX: -60, clientY: -60, preventDefault: function () { }, stopPropagation: function () { } });   //mouse out
        assert.equal(touchEndEventArgs.id, "m2", "mose move: out");
        assert.ok(canvas._activeTouchEvents.indexOf("m2") == -1, "mouse event removed from active events list");

        canvas._activeTouchEvents.push("m2");   //init mouse clicked
        touchMoveEventArgs = undefined;
        canvas._touchMoveHandler({ which: 0, clientX: 0, clientY: 0, preventDefault: function () { }, stopPropagation: function () { } });   //mouse move
        assert.equal(touchMoveEventArgs, undefined, "mouse move without button pressed");

        // ********************* TEST WITH CANVAS SCALING ******************************************************************
        canvas.initScene("id", { width: 400, height: 800 });    //required for screenshot rendering
        canvas.setDimensions(80, 40, viewportScaling, viewportScaling);

        assert.equal(canvas._backgroundCanvasEl.height, 40, 'setDimensions sets height for background canvas');
        assert.equal(canvas._backgroundCanvasEl.width, 80, 'setDimensions sets width for background canvas');
        assert.equal(canvas._cameraCanvasEl.height, 40, 'setDimensions sets height for camera canvas');
        assert.equal(canvas._cameraCanvasEl.width, 80, 'setDimensions sets width for camera canvas');
        assert.equal(canvas._penStampCanvasEl.height, 40, 'setDimensions sets height for pen/stamp canvas');
        assert.equal(canvas._penStampCanvasEl.width, 80, 'setDimensions sets width for pen/stamp canvas');
        assert.equal(canvas._spritesCanvasEl.height, 40, 'setDimensions sets height for sprites canvas');
        assert.equal(canvas._spritesCanvasEl.width, 80, 'setDimensions sets width for sprites canvas');
        assert.equal(canvas._bubblesCanvasEl.height, 40, 'setDimensions sets height for bubbles canvas');
        assert.equal(canvas._bubblesCanvasEl.width, 80, 'setDimensions sets width for bubbles canvas');
        assert.equal(canvas._upperCanvasEl.height, 40, 'setDimensions sets height for upper canvas');
        assert.equal(canvas._upperCanvasEl.width, 80, 'setDimensions sets width for upper canvas');
        assert.equal(canvas._helperCanvasEl.height, 40, 'setDimensions sets height for helper canvas');
        assert.equal(canvas._helperCanvasEl.width, 80, 'setDimensions sets width for helper canvas');
        assert.equal(canvas._scalingX, viewportScaling, 'setDimensions sets scalingX');
        assert.equal(canvas._scalingY, viewportScaling, 'setDimensions sets scalingY');

        var contextScaling = 0;
        var drawCalledrenderingSprite = 0;
        var scaleX, scaleY;

        var context = canvas._spritesCanvasEl.getContext('2d');

        context.scale = function (x, y) {
            scaleX = x;
            scaleY = y;
        };

        var mockrenderingSprite = {
            draw: function () {
                contextScaling = scaleX;
                drawCalledrenderingSprite++;
            }
        };

        var drawCalledRenderingText = 0;
        var mockRenderingText = {
            draw: function () {
                drawCalledRenderingText++;
            }
        };

        canvas.renderingSprites = [mockrenderingSprite];
        canvas.renderingTexts = [mockRenderingText];
        canvas.scale(viewportScaling, viewportScaling); //scale triggers a render()
        canvas.render();

        assert.equal(contextScaling, viewportScaling, "viewportScaling used to scale context if it exists");
        assert.equal(drawCalledrenderingSprite, 2, "renderingSprite draw called on rendering");
        assert.equal(drawCalledRenderingText, 2, "renderingText draw called on rendering");

        canvas.render();

        assert.equal(contextScaling, canvas._scalingX, "canvas scalingX used to scale context if no viewportScaling passed");

        canvas.renderingSprites = [renderingSpriteOpaque];

        var scalingY = 50;
        var scalingX = 10;

        canvas.scale(scalingX, scalingY);
        assert.equal(canvas._scalingX, scalingX, "scalingX set correctly.");
        assert.equal(canvas._scalingY, scalingY, "scalingY set correctly.");

        var screenshotCanvas = document.createElement('canvas');
        var screenshotCanvasContext = screenshotCanvas.getContext('2d');

        screenshotCanvas.width = 80;
        screenshotCanvas.height = 40;
        screenshotCanvasContext.fillStyle = '#ffffff';
        screenshotCanvasContext.fillRect(0, 0, screenshotCanvas.width, screenshotCanvas.height);

        canvas.setDimensions(80, 40, 1, 1);
        canvas.render();

        // draw the image at pc-canvas coordinates on standard canvas
        var imageWidth = renderingSpriteOpaque._width, imageHeight = renderingSpriteOpaque._height;
        screenshotCanvasContext.drawImage(renderingSpriteOpaque._cacheCanvas, -imageWidth * 0.5, -imageHeight * 0.5);
        assert.ok(screenshotCanvas.toDataURL() == canvas.toDataURL(80, 40), 'Screenshot is correct');



        canvas.dispose();
        assert.equal(canvas._disposed, true, "canvas disposed");

        done();
    };

});

QUnit.test("Canvas: tests for pen/stamp functions", function (assert) {

    var done = assert.async();

    //movePen
    var penrenderingSprite = new PocketCode.RenderingSprite({id: "pen1", penDown: false, penX: 0, penY: 0, penColor: { r: 0, g: 255, b: 0 }});

    penrenderingSprite.x = 0;
    penrenderingSprite.y = 0;
    penrenderingSprite.penDown = true;
    penrenderingSprite.penX = 0;
    penrenderingSprite.penY = 0;

    var penCanvas = new PocketCode.Ui.Canvas();
    penCanvas.initScene("penScene1", {width: 400, height: 400});
    penCanvas._renderingSprites = [penrenderingSprite];
    penCanvas.renderingSprites;

    assert.equal(penCanvas.movePen("pen1", 10, 0), penCanvas._renderingSprites.id && penCanvas._renderingSprites.penX && penCanvas._renderingSprites.penY, "Pen moved right");

    penCanvas._renderingSprites.penX = 0;
    penCanvas._renderingSprites.penY = 10;

    assert.equal(penCanvas.movePen("pen1", 0, 10), penCanvas._renderingSprites.id && penCanvas._renderingSprites.penX && penCanvas._renderingSprites.penY, "Pen moved top");

    penCanvas._renderingSprites.penX = -10;
    penCanvas._renderingSprites.penY = 0;

    assert.equal(penCanvas.movePen("pen1", -10, 0), penCanvas._renderingSprites.id && penCanvas._renderingSprites.penX && penCanvas._renderingSprites.penY, "Pen moved left");

    penCanvas._renderingSprites.penX = 0;
    penCanvas._renderingSprites.penY = -10;

    assert.equal(penCanvas.movePen("pen1", 0, 10), penCanvas._renderingSprites.id && penCanvas._renderingSprites.penX && penCanvas._renderingSprites.penY, "Pen moved bottom");

    //drawStamp
    penCanvas._renderingSprites.penY = 0;

    assert.equal(penCanvas.drawStamp("pen1"), penCanvas._renderingSprites.id, "drawStamp");

    //test with drawing on the canvas
    penCanvas.initScene("penScene1", { width: 400, height: 400 });

    var tmp = penCanvas.toDataURL(400, 400);
    penCanvas.movePen("pen1", 100, 0);
    var tmp_right = penCanvas.toDataURL(400, 400);
    assert.notEqual(tmp, tmp_right, "Pen moved right");

    penCanvas.initScene("penScene2", { width: 400, height: 400 });
    var tmp = penCanvas.toDataURL(400, 400);
    penCanvas.movePen("pen1", 0, 100);
    var tmp_top = penCanvas.toDataURL(400, 400);
    assert.notEqual(tmp, tmp_top, "Pen moved up");

    penCanvas.initScene("penScene3", { width: 400, height: 400 });
    var tmp = penCanvas.toDataURL(400, 400);
    penCanvas.movePen("pen1", -100, 0);
    var tmp_left = penCanvas.toDataURL(400, 400);
    assert.notEqual(tmp, tmp_left, "Pen moved left");

    penCanvas.initScene("penScene4", { width: 400, height: 400 });
    var tmp = penCanvas.toDataURL(400, 400);
    penCanvas.movePen("pen1", 0, -100);
    var tmp_down = penCanvas.toDataURL(400, 400);
    assert.notEqual(tmp, tmp_down, "Pen moved down");

    penCanvas.initScene("penScene1", { width: 400, height: 400 });
    assert.equal(penCanvas.toDataURL(400, 400), tmp_right, "scene cached and reloaded");

    //clearPenStampCanvas
    penCanvas.clearPenStampCanvas();
    assert.ok(penCanvas.clearPenStampCanvas, "penStampCanvas cleared");

    //clearCurrentPenStampCache
    penCanvas.clearCurrentPenStampCache();
    assert.ok(penCanvas.clearCurrentPenStampCache, "clearCurrentPenStampCache cleared");

    //clearPenStampCache
    penCanvas.clearPenStampCache();
    assert.ok(penCanvas.clearPenStampCache, "clearPenStampCache cleared");

    penCanvas.dispose();
    assert.equal(penCanvas._disposed, true, "penCanvas disposed");

    done();
});
