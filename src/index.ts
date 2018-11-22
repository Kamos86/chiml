import { ChildProcess, exec } from "child_process";
import { readFileSync as fsReadFileSync } from "fs";
import { safeLoad as yamlSafeLoad } from "js-yaml";
import { dirname as pathDirname, join as pathJoin, resolve as pathResolve } from "path";
import * as R from "ramda";
import { inspect as utilInspect } from "util";
import {
    AnyAsyncFunction, AnyFunction, IComponent, IDeclarativeConfig, IUserComponent, IUserDeclarativeConfig, TChimera,
} from "./interfaces/descriptor";

const FG_CYAN = "\x1b[36m";
const FG_RED = "\x1b[31m";
const FG_YELLOW = "\x1b[33m";
const RESET_COLOR = "\x1b[0m";

export const X: TChimera = Object.assign({}, R, {
    declarative,
    foldInput,
    spreadInput,
    concurrent,
    wrapCommand,
    wrapNodeback,
    wrapSync,
});

export function execute(containerFile: string, injectionFile: string = null): AnyFunction {
    const yamlScript = fsReadFileSync(containerFile).toString();
    const config = yamlSafeLoad(yamlScript);
    // define config.injection
    if (injectionFile === null && config.injection && config.injection[0] === ".") {
        const dirname = pathResolve(pathDirname(containerFile));
        injectionFile = pathJoin(dirname, config.injection);
    }
    if (injectionFile) {
        config.injection = require(injectionFile);
    } else {
        config.injection = X;
    }
    // get bootstrap and run it
    return X.declarative(config);
}

/**
 * @param declarativeConfig IDeclarativeConfig
 */
function declarative(partialDeclarativeConfig: Partial<IUserDeclarativeConfig>): AnyFunction {
    const declarativeConfig = _getCompleteDeclarativeConfig(partialDeclarativeConfig);
    const componentDict = declarativeConfig.component;
    const globalIns = declarativeConfig.ins;
    const globalOut = declarativeConfig.out;
    const { bootstrap } = declarativeConfig;
    const parsedDict = { ...declarativeConfig.injection };
    const componentNameList = Object.keys(componentDict);
    const globalState = {};
    // parse all `<key>`, create function, and register it to parsedDict
    componentNameList.forEach(
        (componentName) => _addToParsedDict(parsedDict, globalState, componentDict, componentName),
    );
    // return bootstrap function
    if (bootstrap in parsedDict) {
        function wrappedBootstrapFunction(...args) {
            if (globalIns !== null) {
                args.forEach((value, index) => {
                    const key = globalIns[index];
                    globalState[key] = value;
                });
            }
            const func = parsedDict[bootstrap];
            const wrappedFunction = bootstrap in componentDict ?
                func : _getWrappedFunction(bootstrap, func, globalIns, globalOut, globalState);
            const bootstrapOutput = wrappedFunction(...args);
            if (_isPromise(bootstrapOutput)) {
                if (globalOut === null) {
                    return bootstrapOutput;
                }
                return bootstrapOutput.then((val) => globalState[globalOut]);
            }
            return globalOut === null ? bootstrapOutput : globalState[globalOut];
        }
        return wrappedBootstrapFunction;
    }
    throw(new Error(`Bootstrap component \`${bootstrap}\` is not defined`));
}

function _getParsedParts(
    parsedDict: {[key: string]: any}, globalState: {[key: string]: any},
    componentDict: {[key: string]: any}, parentComponentName: string, parts: any,
): any {
    if (Array.isArray(parts)) {
        const newVals = parts.map(
            (element) => _getParsedParts(parsedDict, globalState, componentDict, parentComponentName, element),
        );
        return newVals;
    }
    if (typeof parts === "string") {
        const tagPattern = /^\s*<(.+)>\s*$/gi;
        const match = tagPattern.exec(parts);
        if (match) {
            const key = match[1];
            if (!(key in parsedDict) && (key in componentDict)) {
                _addToParsedDict(parsedDict, globalState, componentDict, key);
            }
            if (key in parsedDict) {
                return parsedDict[key];
            }
            throw(new Error(
                `Error parsing \`${parentComponentName}\` component: ` +
                    `Part \`${key}\` is not defined`,
            ));
        }
        return parts;
    }
    return parts;
}

function _addToParsedDict(
    parsedDict: {[key: string]: any}, globalState: {[key: string]: any},
    componentDict: {[key: string]: any}, componentName: string,
): void {
    componentDict[componentName] = _getCompleteComponent(componentDict[componentName]);
    const { ins, out, perform, parts } = componentDict[componentName];
    const parsedParts = _getParsedParts(parsedDict, globalState, componentDict, componentName, parts);
    try {
        const factory = parsedDict[perform];
        if (typeof factory !== "function") {
            throw new Error(`${perform} is not a function`);
        }
        const func = _isEmptyArray(parsedParts) ? factory : factory(...parsedParts);
        if (typeof func !== "function") {
            const partsAsString = _getArgsStringRepresentation(parsedParts);
            throw new Error(`${perform}${partsAsString} is not a function`);
        }
        parsedDict[componentName] = _getWrappedFunction(componentName, func, ins, out, globalState);
    } catch (error) {
        throw(_getEmbededError(
            error,
            `Error parsing \`${componentName}\` component. \`${perform}\` yield error:`,
        ));
    }
}

function _getArgsStringRepresentation(args: any[]) {
    return utilInspect(args).replace(/^\[/g, "(").replace(/\]$/g, ")");
}

function _getWrappedFunction(
    componentName: string, func: AnyFunction, ins: string[] | null, out: string | null, state: {[key: string]: any},
): AnyFunction {
    function wrappedFunction(...args) {
        const realArgs = ins === null ? args : _getArrayFromObject(ins, state);
        try {
            const funcOut = func(...realArgs);
            if (_isPromise(funcOut)) {
                const funcOutWithErrorHandler = funcOut.catch((error) => {
                    const realArgsAsString = _getArgsStringRepresentation(realArgs);
                    const errorMessage = `Error executing \`${componentName}${realArgsAsString}\` async component:`;
                    return Promise.reject(_getEmbededError(error, errorMessage));
                });
                if (out === null) {
                    return funcOutWithErrorHandler;
                }
                return funcOutWithErrorHandler.then((val) => {
                    state[out] = val;
                    return val;
                });
            }
            if (out != null) {
                state[out] = funcOut;
            }
            return funcOut;
        } catch (error) {
            const realArgsAsString = _getArgsStringRepresentation(realArgs);
            const errorMessage = `Error executing \`${componentName}${realArgsAsString}\` component:`;
            throw(_getEmbededError(error, errorMessage));
        }
    }
    return wrappedFunction;
}

function _getArrayFromObject(keys: string[], obj: {[key: string]: any}): any[] {
    const arr = [];
    keys.forEach((key) => arr.push(obj[key]));
    return arr;
}

function _getEmbededError(error: any, message: string): any {
    if (typeof error !== "object" || !error.message) {
        error = new Error(error);
    }
    error.message = `${message} ${error.message}`;
    return error;
}

function _getCompleteDeclarativeConfig(partialConfig: Partial<IUserDeclarativeConfig>): IDeclarativeConfig {
    const defaultDeclarativeConfig = {
        ins: null,
        out: null,
        injection: {},
        component: {},
        bootstrap: "main",
    };
    const completeConfig = Object.assign({}, defaultDeclarativeConfig, partialConfig) as IDeclarativeConfig;
    // make sure `completeConfig.ins` is either null or an array. Otherwise, turn it into an array
    if (completeConfig.ins !== null && !Array.isArray(completeConfig.ins)) {
        completeConfig.ins = [completeConfig.ins];
    }
    // complete all component in `completeConfig.component`
    Object.keys(completeConfig.component).forEach((componentName) => {
        const completeComponent = _getCompleteComponent(completeConfig.component[componentName]);
        completeConfig.component[componentName] = completeComponent;
    });
    return completeConfig;
}

function _getCompleteComponent(partialComponent: Partial<IUserComponent>): IComponent {
    const defaultComponent = {
        ins: null,
        out: null,
        perform: null,
        parts: [],
    };
    const component = Object.assign({}, defaultComponent, partialComponent) as IComponent;
    // make sure `component.ins` is either null or an array. Otherwise, turn it into an array
    if (component.ins !== null && !Array.isArray(component.ins)) {
        component.ins = [component.ins];
    }
    // make sure `component.parts` is an array. Otherwise, turn it into an array
    if (!Array.isArray(component.parts)) {
        component.parts = [component.parts];
    }
    return component;
}

/**
 * @param fn AnyFunction
 */
function spreadInput<TArg, TResult>(fn: (arr: TArg[]) => TResult): (...args: TArg[]) => TResult {
    function spreaded(...args: TArg[]): TResult {
        return fn(args);
    }
    return spreaded;
}

/**
 * @param fn AnyFunction
 */
function foldInput<TArg, TResult>(fn: (...args: TArg[]) => TResult): (arr: TArg[]) => TResult {
    function folded(arr: any[]): any {
        return fn(...arr);
    }
    return folded;
}

/**
 * @param fnList AnyAsynchronousFunction
 */
function concurrent(...fnList: AnyAsyncFunction[]): AnyAsyncFunction {
    function concurrentAction(...args: any[]): Promise<any> {
        const promises: Array<Promise<any>> = fnList.map((fn) => fn(...args));
        return Promise.all(promises);
    }
    return concurrentAction;
}

/**
 * @param fn AnyFunction
 */
function wrapSync<TArg, TResult>(fn: (...args: TArg[]) => TResult): (...args: TArg[]) => Promise<TResult> {
    async function wrappedSync(...args: TArg[]): Promise<TResult> {
        return Promise.resolve(fn(...args));
    }
    return wrappedSync;
}

/**
 * @param fn AnyFunction
 */
function wrapNodeback(fn: AnyFunction): AnyAsyncFunction {
    function wrappedNodeback(...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            function callback(error, ...result) {
                if (error) {
                    return reject(error);
                }
                if (result.length === 1) {
                    return resolve(result[0]);
                }
                return resolve(result);
            }
            const newArgs = Array.from(args);
            newArgs.push(callback);
            fn(...newArgs);
        });
    }
    return wrappedNodeback;
}

/**
 * @param stringCommand string
 */
function wrapCommand(stringCommand: string): AnyAsyncFunction {
    function wrappedCommand(...args: any[]): Promise<any> {
        const composedStringCommand = _getEchoPipedStringCommand(stringCommand, args);
        return _runStringCommand(composedStringCommand);
    }
    return wrappedCommand;
}

/**
 * @param strCmd string
 * @param ins any[]
 */
function _getEchoPipedStringCommand(strCmd: string, ins: any[]): string {
    if (ins.length === 0) {
        return strCmd;
    }
    const echoes = ins.map((element) => "echo " + _getDoubleQuotedString(String(element))).join(" && ");
    const commandWithParams = _getStringCommandWithParams(strCmd, ins);
    const composedCommand = `(${echoes}) | ${commandWithParams}`;
    return composedCommand;
}

/**
 * @param stringCommand string
 * @param options object
 */
function _runStringCommand(stringCommand: string, options?: { [key: string]: any }): Promise<any> {
    return new Promise((resolve, reject) => {
        // define subProcess
        const subProcess = exec(stringCommand, options, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            try {
                return resolve(JSON.parse(stdout));
            } catch (error) {
                return resolve(stdout.replace(/\s+$/, ""));
            }
        });
        // subProcess.stdout data listener
        subProcess.stdout.on("data", (chunk) => {
            process.stderr.write(FG_CYAN);
            process.stderr.write(String(chunk));
            process.stderr.write(RESET_COLOR);
        });
        // subProcess.stderr data listener
        subProcess.stderr.on("data", (chunk) => {
            process.stderr.write(FG_YELLOW);
            process.stderr.write(String(chunk));
            process.stderr.write(RESET_COLOR);
        });
    });
}

/**
 * @param strCmd string
 * @param ins any[]
 */
function _getStringCommandWithParams(strCmd: string, ins: any[]): string {
    if (strCmd.match(/.*\$\{[0-9]+\}.*/g)) {
        // command contains `${number}`
        let commandWithParams = strCmd;
        ins.forEach((value, index) => {
            const paramIndex = index + 1;
            const pattern = `$\{${paramIndex}}`;
            const replacement = _getDoubleQuotedString(String(value));
            commandWithParams = commandWithParams.replace(pattern, replacement);
        });
        return commandWithParams;
    }
    const inputs = ins.map((element) => _getDoubleQuotedString(String(element))).join(" ");
    return `${strCmd} ${inputs}`;
}

/**
 * @param str string
 */
function _getDoubleQuotedString(str: string): string {
    const newStr = str.replace(/"/g, "\\\"");
    return `"${newStr}"`;
}

/**
 * @param arr any[]
 */
function _isEmptyArray(arr: any[]): boolean {
    if (Array.isArray(arr) && arr.length === 0) {
        return true;
    }
    return false;
}

/**
 * @param obj any
 */
function _isPromise(obj: any): boolean {
    if (typeof obj === "object" && obj.then) {
        return true;
    }
    return false;
}
