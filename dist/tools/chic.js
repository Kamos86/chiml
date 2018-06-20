#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("../libraries/tools");
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error("Expect single parameter: `chiml file`");
    }
    else {
        const chiml = args[0];
        tools_1.compileChimlFile(chiml).then((jsFilePath) => {
            console.log(`JavaScript file created: ${jsFilePath}`);
        }).catch((error) => {
            console.error(error);
        });
    }
}
//# sourceMappingURL=chic.js.map