import {createContext, runInNewContext} from "vm";
import {CommandType, FunctionalMode, Mode} from "../enums/singleTaskProperty";
import {ISingleTask} from "../interfaces/ISingleTask";
import {cmdComposedCommand} from "../libraries/cmd";
import {normalizeRawConfig, strToNormalizedConfig} from "../libraries/singleTaskConfigProcessor";
import {createHandlerScript} from "../libraries/singleTaskScriptGenerator";
import * as utilities from "../libraries/utilities";

export class SingleTask implements ISingleTask {
  public id: string;
  public src: string;
  public dst: string;
  public ins: string[];
  public out: string;
  public vars: {[key: string]: any};
  public mode: Mode;
  public branchCondition: string;
  public loopCondition: string;
  public command: string;
  public commandList: SingleTask[];
  public commandType: CommandType;
  public functionalMode: FunctionalMode;
  public accumulator: string;
  public expectLocalScope: boolean;
  public hasParent: boolean;

  constructor(config: any, parentId: string = "", id: number = 0) {
    const normalizedConfig: {[key: string]: any} = typeof config === "string" ?
      strToNormalizedConfig(config) : normalizeRawConfig(config);
    this.ins = normalizedConfig.ins;
    this.out = normalizedConfig.out;
    this.vars = normalizedConfig.vars;
    this.mode = normalizedConfig.mode;
    this.branchCondition = normalizedConfig.branchCondition;
    this.loopCondition = normalizedConfig.loopCondition;
    this.command = normalizedConfig.command;
    this.commandType = normalizedConfig.commandType;
    this.commandList = normalizedConfig.commandList;
    this.src = normalizedConfig.src;
    this.dst = normalizedConfig.dst;
    this.accumulator = normalizedConfig.accumulator;
    this.functionalMode = normalizedConfig.functionalMode;
    this.id = parentId + "_" + id;
    this.hasParent = parentId !== "";
    this.expectLocalScope = parentId === "" || this.functionalMode !== FunctionalMode.none;
    for (let i = 0; i < this.commandList.length; i++) {
      this.commandList[i] = new SingleTask(this.commandList[i], this.id, i);
    }
  }

  public getScript(): string {
    return createHandlerScript(this);
  }

  public execute(...inputs): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const sandbox: {[key: string]: any} = Object.assign({
          __dirname: process.cwd(),
          __isCompiled: false,
          require,
        }, utilities);
        const script = this.getScript();
        runInNewContext(script, sandbox);
        const handler = sandbox.__main_0;
        handler(...inputs).then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

}
