#! /usr/bin/env node

import { execute } from "./index";
const getArgs = require("get-args");

if (require.main === module) {
    const rawArgs = process.argv.slice(2);
    const processedArgs = getArgs(rawArgs);
    const args = processedArgs.arguments;
    const { options } = processedArgs;
    const injectionFile = options.i || options.injection || null;
    const containerFile = options.c || options.container || args.shift() || null;
    if (containerFile === null) {
        console.error("Container expected");
    } else {
        // get bootstrap and run it
        const bootstrap = execute(containerFile, injectionFile);
        const result = bootstrap(...args);
        if (typeof result === "object" && "then" in result) {
            result
                .then((realResult) => console.log(realResult))
                .catch((error) => console.error(error));
        } else {
            console.log(result);
        }
    }
}
