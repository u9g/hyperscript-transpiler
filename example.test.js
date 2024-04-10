// sum.test.js
// import { sum } from "./sum";
import { expect, test } from "vitest";
const { run } = require("./index");

test("basic 1", async () => {
  expect(
    await run(`
  on "worldLoad"
    exampleWorldLoad()
    exampleWorldLoad2()
  end

  on "quit"
    sendLeave()
  end
  `)
  ).toMatchSnapshot();
});

test("basic 2", async () => {
  expect(
    await run(`
    on "click" call myJavascriptFunction()
    `)
  ).toMatchSnapshot();
});

test("basic 3", async () => {
  expect(
    await run(`
    on "click"
      call prompt('age fn?')
      call it()
    end
    `)
  ).toMatchSnapshot();
});

test("basic 4", async () => {
  expect(
    await run(`
    log "Hello"
    log "World!"
    `)
  ).toMatchSnapshot();
});

test("basic 5", async () => {
  expect(
    await run(`
      log "hello" then log "world" then log "!"
    `)
  ).toMatchSnapshot();
});

test("basic 6", async () => {
  expect(
    await run(`
      on "click" log "hello" then log "world"
    `)
  ).toMatchSnapshot();
});

test("basic 7", async () => {
  expect(
    await run(`
      on "click" call helloWorld() then log result
    `)
  ).toMatchSnapshot();
});

test("basic 8", async () => {
  expect(
    await run(`
      set x to "5"
    `)
  ).toMatchSnapshot();
});

test("basic 9", async () => {
  expect(
    await run(`
      set x to apple
    `)
  ).toMatchSnapshot();
});

test("basic 9", async () => {
  expect(
    await run(`
      set x to 45
    `)
  ).toMatchSnapshot();
});

test("basic 10", async () => {
  expect(
    await run(`
      set x to {name : "Joe", age: 35}
    `)
  ).toMatchSnapshot();
});

test("basic 11", async () => {
  expect(
    await run(`
      on "keyup" log it's x
    `)
  ).toMatchSnapshot();
});

test("basic 11", async () => {
  expect(
    await run(`
      set y to \\ x -> x then call y(5)
    `)
  ).toMatchSnapshot();
});

test("basic 12", async () => {
  expect(
    await run(`
      set y to \\-> true
    `)
  ).toMatchSnapshot();
});

test("basic 13", async () => {
  expect(
    await run(`
      set y to {a: \\ x -> x} then call y's a('a')
    `)
  ).toMatchSnapshot();
});

test("basic 14", async () => {
  expect(
    await run(`
      set x to 10
      set y to 20
      set sumOfSquares to (x * x) + (y * y)
    `)
  ).toMatchSnapshot();
});

test("basic 15", async () => {
  expect(
    await run(`
      set $apple to "red"
      set $orange to "orange"
      log $apple + $orange
    `)
  ).toMatchSnapshot();
});

test("basic 16", async () => {
  expect(
    await run(`
      set global apple to "red"
      set global orange to "orange"
      log $apple + $orange
    `)
  ).toMatchSnapshot();
});

test("basic 17", async () => {
  expect(
    await run(`
    on "worldLoad"
        log "Hello!"
        set $h's b to event's a
    end
    `)
  ).toMatchSnapshot();
});
