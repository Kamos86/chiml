import {dirname as pathDirName, resolve as pathResolve} from "path";
import * as httpRequest from "request";
import {WebApp} from "./WebApp";

const testcaseDirPath = pathResolve(pathDirName(pathDirName(__dirname)), "testcase", "webApp");
const header = "<h1>Header</h1>";
const footer = "<footer>Footer</footer>";
const copyRight = "&copy; goFrendi";
const year = "2018";
const port = 3010;
const url = `http://localhost:${port}`;
const app = new WebApp();
let server;

it("able to add page (function) with custom outProcessor", (done) => {
  app.addPage("get", "/first", () => "Roses are red");
  done();
});

it("able to add page (function) with custom outProcessor", (done) => {
  app.addPage("get", "/second",
    () => "blue",
    (ctx, out) => ctx.body = `Violet is ${out}`,
  );
  done();
});

it("able to add middleware (function)", (done) => {
  app.addMiddleware(async (ctx, next) => {
    ctx.body = header;
    await next();
    ctx.body += year;
  });
  done();
});

it("able to add middleware (chiml file)", (done) => {
  app.addMiddleware(pathResolve(testcaseDirPath, "middleware.chiml"));
  done();
});

it("able to add middleware (chiml script)", (done) => {
  app.addMiddleware('(ctx, next) -> (ctx, next) => {return next().then(()=>{ctx.body += "<footer>Footer</footer>"});}');
  done();
});

it("able to add page (function)", (done) => {
  app.addPage("get", "/page-hello/:name", (name) => `Hello ${name}`);
  done();
});

it("able to add page (chiml file)", (done) => {
  app.addPage("get", "/page-hi/:name", pathResolve(testcaseDirPath, "page.chiml"));
  done();
});

it("able to add page (chiml script)", (done) => {
  app.addPage("get", "/page-bonjour/:name", "(name) -> (name) => `Bonjour ${name}`");
  done();
});

it("able to add route (function)", (done) => {
  app.addRoute("get", "/hello/:name", (ctx, name) => ctx.body += `Hello ${name}`);
  done();
});

it("able to add route (chiml file)", (done) => {
  app.addRoute("get", "/hi/:name", pathResolve(testcaseDirPath, "route.chiml"));
  done();
});

it("able to add route (chiml script)", (done) => {
  app.addRoute("get", "/bonjour/:name", "(ctx, name) -> (ctx, name) => ctx.body += `Bonjour ${name}`");
  done();
});

it("able to create server and run it", (done) => {
  server = app.createServer();
  server.listen(port);
  expect(server.listening).toBeTruthy();
  done();
});

it("able to send request to defined page (function)", (done) => {
  httpRequest(`${url}/first`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe("Roses are red");
    done();
  });
});

it("able to send request to defined page (function)", (done) => {
  httpRequest(`${url}/second`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe("Violet is blue");
    done();
  });
});

it("able to send request to undefined route", (done) => {
  httpRequest(url, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe(`${header}${footer}${copyRight}${year}`);
    done();
  });
});

it("able to send request to defined route (function)", (done) => {
  httpRequest(`${url}/hello/Frodo`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe(`${header}Hello Frodo${footer}${copyRight}${year}`);
    done();
  });
});

it("able to send request to defined route (chiml file)", (done) => {
  httpRequest(`${url}/hi/Luke`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe(`${header}Hi Luke${footer}${copyRight}${year}`);
    done();
  });
});

it("able to send request to defined route (chiml script)", (done) => {
  httpRequest(`${url}/bonjour/Kirk`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe(`${header}Bonjour Kirk${footer}${copyRight}${year}`);
    done();
  });
});

it("able to send request to defined page (function)", (done) => {
  httpRequest(`${url}/page-hello/Frodo`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe(`${header}Hello Frodo${footer}${copyRight}${year}`);
    done();
  });
});

it("able to send request to defined page (chiml file)", (done) => {
  httpRequest(`${url}/page-hi/Luke`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe(`${header}Hi Luke${footer}${copyRight}${year}`);
    done();
  });
});

it("able to send request to defined page (chiml script)", (done) => {
  httpRequest(`${url}/page-bonjour/Kirk`, (error, response, body) => {
    expect(error).toBeNull();
    expect(body).toBe(`${header}Bonjour Kirk${footer}${copyRight}${year}`);
    done();
  });
});

it("able to close server", (done) => {
  server.close();
  expect(server.listening).toBeFalsy();
  done();
});
