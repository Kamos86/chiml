import {resolve} from "path";
import {runInNewContext} from "vm";
import {SingleTask} from "../classes/SingleTask";
import {ISingleTask} from "../interfaces/ISingleTask";
import {cmdComposedCommand} from "./cmd";
import {createHandlerScript, renderTemplate} from "./singleTaskScriptGenerator";
import {doubleQuote} from "./stringUtil";

it("render template correctly", (done) => {
  const template = "function <%= functionName %> (<%= inputs.join(', ') %>){\n" +
    "  vars <%= vars.join(', ') %>;\n" +
    "  return true;\n" +
    "}";
  const config = {functionName: "fn", inputs: ["n1", "n2"], vars: ["a", "b", "c"]};

  const expect1 = "function fn (n1, n2){\n" +
    "  vars a, b, c;\n" +
    "  return true;\n" +
    "}";
  const result1 = renderTemplate(template, config);
  expect(result1).toBe(expect1);

  const expect2 = "  function fn (n1, n2){\n" +
    "    vars a, b, c;\n" +
    "    return true;\n" +
    "  }";
  const result2 = renderTemplate(template, config, 2);
  expect(result2).toBe(expect2);

  done();
});

function createScriptAndHandler(config): Promise<any> {
  const script = createHandlerScript(new SingleTask(config));
  const sandbox: {[key: string]: any} = {__cmd: cmdComposedCommand};
  runInNewContext(script, sandbox);
  const handler = sandbox.__main_0;
  return Promise.resolve({script, handler});
}

it("cmd handler works `(a, b) -> node add.js`", (done) => {
  const testProgramPath = resolve(__dirname, "cmd.test.add.js");
  const config = `(a, b) -> node ${testProgramPath}`;
  createScriptAndHandler(config).then(({script, handler}) => {
    handler(4, 5).then((result) => {
      expect(result).toBe(9);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("jsAsync handler works `(a,b) -> [(x, y, callback) => callback(null, x + y)]`", (done) => {
  const config = "(a,b) -> [(x, y, callback) => callback(null, x + y)]";
  createScriptAndHandler(config).then(({script, handler}) => {
    handler(4, 5).then((result) => {
      expect(result).toBe(9);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("jsSync handler works `(a,b) -> (x, y) => x + y`", (done) => {
  const config = "(a,b) -> (x, y) => x + y";
  createScriptAndHandler(config).then(({script, handler}) => {
    handler(4, 5).then((result) => {
      expect(result).toBe(9);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("jsPromise handler works `(a,b) -> <Promise.resolve(a + b)>`", (done) => {
  const config = "(a,b) -> <Promise.resolve(a + b)>";
  createScriptAndHandler(config).then(({script, handler}) => {
    handler(4, 5).then((result) => {
      expect(result).toBe(9);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("loop handler works", (done) => {
  const config = {
    do: "(a) -> (x) => x + 1 -> a",
    if: "a < 5",
    while: "a < 10",
  };
  createScriptAndHandler(config).then(({script, handler}) => {
    const promises = [handler(4), handler(8), handler(12)];
    Promise.all(promises).then((results) => {
      expect(results[0]).toBe(10);
      expect(results[1]).toBe(8);
      expect(results[2]).toBe(12);
      done();
    }).catch((error) => {
      expect(error).toBeNull();
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("series handler works", (done) => {
  const config = {
    do: [
      "(a) -> (x) => x + 1 -> b",
      "(b) -> (x) => x * 2",
    ],
    ins: "a",
  };
  createScriptAndHandler(config).then(({script, handler}) => {
    handler(4).then((result) => {
      expect(result).toBe(10);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("parallel handler works", (done) => {
  const config = {
    ins: "a",
    out: "b",
    parallel: [
      "(a) -> (x) => x + 1 -> b[0]",
      "(a) -> (x) => x * 2 -> b[1]",
    ],
    vars: {b: []},
  };
  createScriptAndHandler(config).then(({script, handler}) => {
    handler(4).then((result) => {
      expect(result[0]).toBe(5);
      expect(result[1]).toBe(8);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("map handler works", (done) => {
  const config = {
    do: "(n) -> (x) => x * x",
    into: "y",
    map: "x",
  };
  createScriptAndHandler(config).then(({script, handler}) => {
    handler([1, 2, 3, 4]).then((result) => {
      expect(result.length).toBe(4);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(4);
      expect(result[2]).toBe(9);
      expect(result[3]).toBe(16);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("filter handler works", (done) => {
  const config = {
    do: "(n) -> (x) => x % 2 === 0",
    filter: "x",
    into: "y",
  };
  createScriptAndHandler(config).then(({script, handler}) => {
    handler([1, 2, 3, 4]).then((result) => {
      expect(result.length).toBe(2);
      expect(result[0]).toBe(2);
      expect(result[1]).toBe(4);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("reduce handler works", (done) => {
  const config = {
    do: "(n, total) -> (x, acc) => x + acc",
    into: "y",
    reduce: "x",
  };
  createScriptAndHandler(config).then(({script, handler}) => {
    handler([1, 2, 3, 4]).then((result) => {
      expect(result).toBe(10);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});

it("complex handler works", (done) => {
  const config = {
    do: [
      {
        parallel: [
          {
            do: "(n) -> (x) => x*x",
            into: "squares",
            map: "input",
          },
          {
            do: "(n) -> (x) => x % 2 === 0",
            filter: "input",
            into: "even",
          },
          {
            do: "(n, total) -> (x, acc) => x + acc",
            into: "sum",
            reduce: "input",
          },
          {
            do: [
              "n <-- 0",
              {
                do: "(n+1) --> n",
                if: "n < 73",
                while: "n < 73",
              },
            ],
          },
        ],
      },
      "{even, squares, sum, n} --> output",
    ],
    ins: "input",
    out: "output",
  };
  createScriptAndHandler(config).then(({script, handler}) => {
    handler([1, 2, 3, 4]).then((result) => {
      const keys = Object.keys(result);
      expect(keys.length).toBe(4);
      expect(keys).toContain("even");
      expect(keys).toContain("squares");
      expect(keys).toContain("sum");
      expect(keys).toContain("n");
      expect(result.even.length).toBe(2);
      expect(result.even).toMatchObject([2, 4]);
      expect(result.squares.length).toBe(4);
      expect(result.squares).toMatchObject([1, 4, 9, 16]);
      expect(result.sum).toBe(10);
      expect(result.n).toBe(73);
      done();
    });
  }).catch((error) => {
    expect(error).toBeNull();
    done();
  });
});
