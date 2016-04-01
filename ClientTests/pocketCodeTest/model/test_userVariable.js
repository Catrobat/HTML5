﻿/// <reference path="../../qunit/qunit-1.23.0.js" />
/// <reference path="../../../Client/smartJs/sj.js" />
/// <reference path="../../../Client/smartJs/sj-core.js" />
/// <reference path="../../../Client/smartJs/sj-event.js" />
/// <reference path="../../../Client/pocketCode/scripts/model/userVariable.js" />
'use strict';

QUnit.module("userVariable.js");


QUnit.test("UserVariableCollection", function (assert) {

    //var done = assert.async();
    //var done2 = assert.async();

    var uvc = new PocketCode.Model.UserVariableCollection(PocketCode.UserVariableType.SIMPLE, PocketCode.UserVariableScope.LOCAL);
    assert.ok(uvc instanceof PocketCode.Model.UserVariableCollection, "instance check");
    assert.ok(uvc.onVariableChange instanceof SmartJs.Event.Event, "variable change event");

    assert.ok(uvc._scope === PocketCode.UserVariableScope.LOCAL && uvc._type == PocketCode.UserVariableType.SIMPLE, "created and properties set correctly");
    assert.throws(function () { var test = new PocketCode.Model.UserVariableCollection(PocketCode.UserVariableType.SIMPLE, "wrong"); }, Error, "ERROR: invalid scope property");
    assert.throws(function () { var test = new PocketCode.Model.UserVariableCollection("wrong", PocketCode.UserVariableScope.GLOBAL); }, Error, "ERROR: invalid type property");

    var testVars = [
        { id: "1", name: "2", value: 3 },
        { id: "4", name: "5", value: 6 },
        { id: "7", name: "8" }];

    assert.throws(function () { uvc.initVariableList("error"); }, Error, "ERROR: initVariableList() argument");
    uvc.initVariableList(testVars);

    //reset: simple
    uvc.reset();
    assert.equal(uvc.getVariableById("1").value, undefined, "var 1 undefined after reset");
    assert.equal(uvc.getVariableById("4").value, undefined, "var 4 undefined after reset");
    assert.equal(uvc.getVariableById("7").value, undefined, "var 7 undefined after reset");

    uvc.initVariableList(testVars);
    assert.ok(uvc.getVariableById("1") instanceof PocketCode.Model.UserVariableSimple && uvc.getVariableById("4") instanceof PocketCode.Model.UserVariableSimple && uvc.getVariableById("7") instanceof PocketCode.Model.UserVariableSimple, "sdimple: variable getter: instance check");
    assert.ok(uvc.getVariableById("4")._id === "4" && uvc.getVariableById("4").name === "5" && uvc.getVariableById("4")._value === 6, "simple: variable created correctly");
    assert.ok(uvc.getVariables()["7"]._id === "7" && uvc.getVariables()["7"].name === "8" && uvc.getVariables()["7"]._value === undefined, "simple: variable created correctly (init value)");

    var first = uvc.getVariableById("1");
    assert.ok(first._id === "1" && first.name === "2" && first._value === 3 && first.value === 3, "getById check + value accessor");

    var varChangeCalled = 0;
    var varChangeHandler = function (e) {
        varChangeCalled++;
        assert.equal(e.target, first, "variable as event target");
        assert.equal(e.id, 1, "variable setter/getter");
        //done();
    };
    uvc.onVariableChange.addEventListener(new SmartJs.Event.EventListener(varChangeHandler, this));
    first.value = 23;
    assert.equal(varChangeCalled, 1, "var change: event handler called");

    uvc.initVariableList([]);
    assert.deepEqual(uvc.getVariables(), {}, "initVariableList: clear existing vars");

    assert.ok(uvc.getVariableById(null) instanceof PocketCode.Model.UserVariableSimple, "get a new instance (simple): based on a pocketcode bug");

    //using lists
    uvc = new PocketCode.Model.UserVariableCollection(PocketCode.UserVariableType.LIST, PocketCode.UserVariableScope.GLOBAL);
    testVars = [
        { id: 1, name: "2", value: [3, 13, 23] },
        { id: 4, name: "5", value: [6, 16, 26] },
        { id: 7, name: "8" }];

    uvc.initVariableList(testVars);
    assert.ok(uvc.getVariables()[1] instanceof PocketCode.Model.UserVariableList && uvc.getVariables()[4] instanceof PocketCode.Model.UserVariableList && uvc.getVariables()[7] instanceof PocketCode.Model.UserVariableList, "lists: variable getter: instance check");
    var test = uvc.getVariables()[4];
    assert.deepEqual(test._value, [6, 16, 26], "lists: variable created correctly");
    assert.ok(uvc.getVariables()[7]._id === 7 && uvc.getVariables()[7].name === "8" && uvc.getVariables()[7].length === 0, "lists: variable created correctly (init value) + length");

    assert.equal(uvc.getVariableById(4).name, 5, "get list var by id");
    assert.ok(uvc.getVariableById(null) instanceof PocketCode.Model.UserVariableList, "get a new instance (list): based on a pocketcode bug");

    //reset: list
    uvc.reset();
    assert.equal(uvc.getVariableById(1).length, 0, "var 1: empty list after reset");
    assert.equal(uvc.getVariableById(4).length, 0, "var 4: empty list after reset");
    assert.equal(uvc.getVariableById(7).length, 0, "var 7: empty list after reset");

});

QUnit.test("UserVariableSimple", function (assert) {

    var uv = new PocketCode.Model.UserVariableSimple(1, "2");
    assert.ok(uv instanceof PocketCode.Model.UserVariableSimple, "instance check");
    assert.ok(uv.onChange instanceof SmartJs.Event.Event, "onChange event accessor");

    assert.ok(uv._id == 1 && uv.name === "2" && uv._value === undefined, "properties set correctly: value initialized");
    uv.value = "new val";
    assert.ok(uv._value === "new val" && uv.value === "new val", "value accessor: string");
    assert.equal(uv.valueAsNumber, 0, "string as number = 0");

    uv = new PocketCode.Model.UserVariableSimple(1, "2", 0);
    assert.equal(uv.value, 0, "ctr setter value: 0 as value");
    assert.equal(uv.valueAsNumber, 0, "0 as number = 0");

    uv = new PocketCode.Model.UserVariableSimple(1, "2");
    assert.equal(uv.toString(), "", "toString: empty value");
    assert.equal(uv.valueAsNumber, 0, "undefined as number = 0");
    uv.value = "2";
    assert.equal(uv.valueAsNumber, 2, "2 (string) as number = 2");

    uv = new PocketCode.Model.UserVariableSimple(1, "2", "3.4");
    assert.ok(uv._id == 1 && uv.name === "2" && uv._value === 3.4 && uv.value === 3.4, "properties set correctly: including value");
    assert.equal(uv.toString(), "3.4", "toString(): value");

    uv.value = "2,3";   //not detected as number
    assert.equal(uv.valueAsNumber, 0, "number string (not detected) as number = 0");

    var uv2 = new PocketCode.Model.UserVariableSimple(1, "2", uv);
    assert.equal(uv.toString(), "2,3", "assign user variable");

    var uvl = new PocketCode.Model.UserVariableList(1, "2", [3.4, 3.5, 3.6]);
    uv2.value = uvl;
    assert.equal(uv2.value, "3.4 3.5 3.6", "list is added as string");
    assert.equal(uv2.valueAsNumber, 0, "list string to number");

    uvl = new PocketCode.Model.UserVariableList(1, "2", [3.4]);
    uv2.value = uvl;
    assert.equal(uv2.value, 3.4, "list is added as string- single item casted");
    assert.equal(uv2.valueAsNumber, 3.4, "list string to number- single item casted");

    uv2.reset();
    assert.equal(uv2.value, undefined, "rest: to undefined");
});

QUnit.test("UserVariableList", function (assert) {

    var uv = new PocketCode.Model.UserVariableList(1, "2");
    assert.ok(uv instanceof PocketCode.Model.UserVariableList, "instance check");
    assert.ok(uv.onChange instanceof SmartJs.Event.Event, "onChange event check");

    assert.ok(uv._id == 1 && uv.name === "2" && uv.length === 0, "properties set correctly: value initialized");
    assert.equal(uv.toString(), "", "toString: empty value");

    assert.throws(function () { var test = new PocketCode.Model.UserVariableList(1, "2", 0); }, Error, "ERROR: invalid argument: value");

    var latestChange;
    var changeHandler = function (e) {
        latestChange = e;
    };

    uv = new PocketCode.Model.UserVariableList(1, "2", [3.4, 3.5, "3.6", "string"]);
    uv.onChange.addEventListener(new SmartJs.Event.EventListener(changeHandler, this));

    assert.ok(uv._id == 1 && uv.name === "2" && uv.length === 4, "properties set: check for list length");
    assert.deepEqual(uv._value, [3.4, 3.5, 3.6, "string"], "properties set: check on equal");
    assert.equal(uv.toString(), "3.4 3.5 3.6 string", "toString(): value");

    //length
    assert.equal(uv.length, 4, "length");

    //value at
    assert.equal(uv.valueAt(2), 3.5, "value at: 2");
    assert.equal(uv.valueAt(3), 3.6, "value at: 3");
    assert.equal(uv.valueAt(0), undefined, "value at: 0");
    assert.equal(uv.valueAt(-1), undefined, "value at: < 0");
    assert.equal(uv.valueAt(uv.length + 1), undefined, "value at: length + 1");

    //value as number
    assert.equal(uv.valueAsNumberAt(3), 3.6, "value as number at: 3");
    assert.equal(uv.valueAsNumberAt(4), 0, "value as number at: 4 (string");
    assert.equal(uv.valueAsNumberAt(0), 0, "value as number at: 0");
    assert.equal(uv.valueAsNumberAt(-1), 0, "value as number at: < 0");
    assert.equal(uv.valueAsNumberAt(uv.length + 1), 0, "value as number at: length + 1");

    //append
    uv.append("12");
    assert.deepEqual(uv._value, [3.4, 3.5, 3.6, "string", 12], "append()");
    assert.ok(latestChange.id === uv._id && latestChange.target === uv, "update event on append");
    latestChange = undefined;

    //insertAt
    uv.insertAt(2, true);
    assert.deepEqual(uv._value, [3.4, true, 3.5, 3.6, "string", 12], "insertAt(): simple");
    uv.insertAt(0, "invalidindex");
    assert.deepEqual(uv._value, [3.4, true, 3.5, 3.6, "string", 12], "insertAt(): position 0 - not allowed");
    uv.insertAt(-1, "invalidindex");
    assert.deepEqual(uv._value, [3.4, true, 3.5, 3.6, "string", 12], "insertAt(): negative position - not allowed");
    uv.insertAt(7, "invalidindex?");
    assert.deepEqual(uv._value, [3.4, true, 3.5, 3.6, "string", 12, "invalidindex?"], "insertAt(): length + 1 - allowed (appended)");

    uv.insertAt(9, "validIndex");
    assert.deepEqual(uv._value, [3.4, true, 3.5, 3.6, "string", 12, "invalidindex?"], "insertAt(): > length + 1 - not allowed");
    assert.ok(latestChange.id === uv._id && latestChange.target === uv, "update event on insert");
    latestChange = undefined;

    //replaceAt
    uv.replaceAt(2, false);
    assert.deepEqual(uv._value, [3.4, false, 3.5, 3.6, "string", 12, "invalidindex?"], "replaceAt(): valid index");
    uv.replaceAt(0, false);
    assert.deepEqual(uv._value, [3.4, false, 3.5, 3.6, "string", 12, "invalidindex?"], "replaceAt(): invalid index: 0");
    uv.replaceAt(8, false);
    assert.deepEqual(uv._value, [3.4, false, 3.5, 3.6, "string", 12, "invalidindex?"], "replaceAt(): invalid index: > length");
    assert.ok(latestChange.id === uv._id && latestChange.target === uv, "update event on replace");
    latestChange = undefined;

    //deleteAt
    uv.deleteAt(7);
    assert.deepEqual(uv._value, [3.4, false, 3.5, 3.6, "string", 12], "deleeteAt(): valid index");
    uv.deleteAt(0);
    assert.deepEqual(uv._value, [3.4, false, 3.5, 3.6, "string", 12], "deleteAt(): invalid index: 0");
    uv.deleteAt(7);
    assert.deepEqual(uv._value, [3.4, false, 3.5, 3.6, "string", 12], "deleteAt(): invalid index: > length");
    assert.ok(latestChange.id === uv._id && latestChange.target === uv, "update event on delete");
    latestChange = undefined;

    //contains
    uv.append("string");
    assert.equal(uv.contains(undefined), false, "contains: undefined");
    assert.equal(uv.contains("string"), true, "contains: string");
    assert.equal(uv.contains("12,0"), false, "contains: string (number not converted)");
    assert.equal(uv.contains(false), true, "contains: bool");
    assert.equal(uv.contains(3.5), true, "contains: number");
    assert.equal(uv.contains("12"), true, "contains: string number");

    //add uservars & list
    var uvs = new PocketCode.Model.UserVariableSimple(1, "2", "13.2");
    uv.append(uvs);
    assert.equal(uv.valueAt(uv.length), 13.2, "append: user variable added and casted");
    assert.equal(uv.valueAsNumberAt(uv.length), 13.2, "append: user variable added and casted: type check internal");

    uv.insertAt(1, uvs);
    assert.equal(uv.valueAt(1), 13.2, "insert: user variable added and casted");
    assert.equal(uv.valueAsNumberAt(1), 13.2, "insert: user variable added and casted: type check internal");

    uv.replaceAt(2, uvs);
    assert.equal(uv.valueAt(2), 13.2, "replace: user variable added and casted");
    assert.equal(uv.valueAsNumberAt(2), 13.2, "replace: user variable added and casted: type check internal");

    //lists: one test is enough as all setters are checked already
    var uv2 = new PocketCode.Model.UserVariableList(2, "new", [3.4]);
    uv.append(uv2);
    assert.equal(uv.valueAt(uv.length), 3.4, "append: user list: added and casted");
    //^^ please notice.. as a compare between string and number in qunit will/may assert TRUE even if the types are different the check below is needed
    assert.equal(uv.valueAsNumberAt(uv.length), 3.4, "append: user list: added and casted: type check internal");

    //reset
    uv2.reset();
    assert.equal(uv2.length, 0, "reset: empty list[]");
});
