import {CommandType, FunctionalMode, Mode} from "../enums/singleTaskProperty";
import {normalizeRawConfig, strToNormalizedConfig} from "./singleTaskConfigProcessor";

it("normalizeRawConfig works with complete config object", (done) => {
  const rawConfig = {do: "{(x,y) => x+y}", if: "a < b", ins: ["a", "b"],
    out: "c", vars: {foo: "bar"}, while: "c < 2 * (a + b)"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("c");
  expect(config.command).toBe("(x,y) => x+y");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("a < b");
  expect(config.loopCondition).toBe("c < 2 * (a + b)");
  done();
});

it("normalizeRawConfig works with object that has empty `do`", (done) => {
  const rawConfig = {do: ""};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(0);
  expect(config.out).toBe("__ans");
  expect(config.command).toBe("(x) => x");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with empty object", (done) => {
  const rawConfig = {};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(0);
  expect(config.out).toBe("__ans");
  expect(config.command).toBe("(x) => x");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with config object where ins is string and command is unflanked arrow function",
  (done) => {
  const rawConfig = {ins: "a, b", do: "(x,y) => x+y", out: "c"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("c");
  expect(config.command).toBe("(x,y) => x+y");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with config object where command is unflanked anonymous function", (done) => {
  const rawConfig = {ins: "a, b", do: "function (x,y) {return x+y;}", out: "c"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("c");
  expect(config.command).toBe("function (x,y) {return x+y;}");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with config object where command is flanked with square bracket", (done) => {
  const rawConfig = {ins: "a, b", do: "[function (x,y, callback) {callback(x+y)]", out: "c"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("c");
  expect(config.command).toBe("function (x,y, callback) {callback(x+y)");
  expect(config.commandType).toBe(CommandType.jsAsyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with config object where command is flanked with chevron", (done) => {
  const rawConfig = {ins: "", do: "<new Promise((resolve, reject) => {resolve(73);});>", out: "c"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(0);
  expect(config.out).toBe("c");
  expect(config.command).toBe("new Promise((resolve, reject) => {resolve(73);});");
  expect(config.commandType).toBe(CommandType.jsPromise);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with config object where command is cmd", (done) => {
  const rawConfig = {ins: "a", do: "cowsay", out: "b"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(1);
  expect(config.ins[0]).toBe("a");
  expect(config.out).toBe("b");
  expect(config.command).toBe("cowsay");
  expect(config.commandType).toBe(CommandType.cmd);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with empty config object", (done) => {
  const rawConfig = {};
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(0);
  expect(config.out).toBe("__ans");
  expect(config.command).toBe("(x) => x");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `(a, b) -> (x, y) => x+y -> c`", (done) => {
  const rawConfig = "(a, b) -> (x, y) => x+y -> c";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("c");
  expect(config.command).toBe("(x, y) => x+y");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `c <- (x, y) => x+y <- (a, b)`", (done) => {
  const rawConfig = "c <- (x, y) => x+y <- (a, b)";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("c");
  expect(config.command).toBe("(x, y) => x+y");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `(a, b) -> (x, y) => x+y`", (done) => {
  const rawConfig = "(a, b) -> (x, y) => x+y";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("__ans");
  expect(config.command).toBe("(x, y) => x+y");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `(x, y) => x+y <- (a, b)`", (done) => {
  const rawConfig = "(x, y) => x+y <- (a, b)";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("__ans");
  expect(config.command).toBe("(x, y) => x+y");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `() => 73 -> a`", (done) => {
  const rawConfig = "() => 73 -> a";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(0);
  expect(config.out).toBe("a");
  expect(config.command).toBe("() => 73");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `a <- () => 73`", (done) => {
  const rawConfig = "a <- () => 73";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(0);
  expect(config.out).toBe("a");
  expect(config.command).toBe("() => 73");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `a --> b`", (done) => {
  const rawConfig = "a --> b";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(1);
  expect(config.ins[0]).toBe("a");
  expect(config.out).toBe("b");
  expect(config.command).toBe("(x) => x");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `b <-- a`", (done) => {
  const rawConfig = "b <-- a";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(1);
  expect(config.ins[0]).toBe("a");
  expect(config.out).toBe("b");
  expect(config.command).toBe("(x) => x");
  expect(config.commandType).toBe(CommandType.jsSyncFunction);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("strToNormalizedConfig works with config string `ls`", (done) => {
  const rawConfig = "ls";
  const config = strToNormalizedConfig(rawConfig);
  expect(config.ins.length).toBe(0);
  expect(config.out).toBe("__ans");
  expect(config.command).toBe("ls");
  expect(config.commandType).toBe(CommandType.cmd);
  expect(config.mode).toBe(Mode.single);
  expect(config.branchCondition).toBe("true");
  expect(config.loopCondition).toBe("false");
  done();
});

it("normalizeRawConfig works with nested config object", (done) => {
  const rawConfig = {
    do: [
      {parallel: [
        "(a, b) -> (x, y) => x + y -> c",
        "(a, b) -> (x, y) => x - y -> d",
      ]},
      "(c, d) -> (x, y) => x * y -> e",
    ],
    ins: "a, b",
    out: "e",
  };
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("e");
  expect(config.mode).toBe(Mode.series);
  expect(config.commandList.length).toBe(2);
  done();
});

it("normalizeRawConfig works with nested config object", (done) => {
  const rawConfig = {
    ins: "a, b",
    out: "e",
    series: [
      {parallel: [
        "(a, b) -> (x, y) => x + y -> c",
        "(a, b) -> (x, y) => x - y -> d",
      ]},
      "(c, d) -> (x, y) => x * y -> e",
    ],
  };
  const config = normalizeRawConfig(rawConfig);
  expect(config.ins.length).toBe(2);
  expect(config.ins[0]).toBe("a");
  expect(config.ins[1]).toBe("b");
  expect(config.out).toBe("e");
  expect(config.mode).toBe(Mode.series);
  expect(config.commandList.length).toBe(2);
  done();
});

it("normalizeRawConfig recognize map", (done) => {
  const rawConfig = {map: "[1, 2, 3, 4, 5]", into: "square", do: "(x) => x * x"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.src).toBe("[1, 2, 3, 4, 5]");
  expect(config.dst).toBe("square");
  expect(config.functionalMode).toBe(FunctionalMode.map);
  expect(config.command).toBe("(x) => x * x");
  done();
});

it("normalizeRawConfig recognize filter", (done) => {
  const rawConfig = {filter: "[1, 2, 3, 4, 5]", into: "even", do: "(x) => x % 2"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.src).toBe("[1, 2, 3, 4, 5]");
  expect(config.dst).toBe("even");
  expect(config.functionalMode).toBe(FunctionalMode.filter);
  expect(config.command).toBe("(x) => x % 2");
  done();
});

it("normalizeRawConfig recognize reduce", (done) => {
  const rawConfig = {reduce: "[1, 2, 3, 4, 5]", into: "sum", do: "(x, y) => x + y"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.src).toBe("[1, 2, 3, 4, 5]");
  expect(config.dst).toBe("sum");
  expect(config.functionalMode).toBe(FunctionalMode.reduce);
  expect(config.command).toBe("(x, y) => x + y");
  expect(config.accumulator).toBe("0");
  done();
});

it("normalizeRawConfig recognize reduce (with accumulator)", (done) => {
  const rawConfig = {reduce: "[1, 2, 3, 4, 5]", into: "sum", accumulator: "1", do: "(x, y) => x + y"};
  const config = normalizeRawConfig(rawConfig);
  expect(config.src).toBe("[1, 2, 3, 4, 5]");
  expect(config.dst).toBe("sum");
  expect(config.functionalMode).toBe(FunctionalMode.reduce);
  expect(config.command).toBe("(x, y) => x + y");
  expect(config.accumulator).toBe("1");
  done();
});