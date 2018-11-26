import { X } from "chiml";
import { BaseInjection } from "./baseInjection";
import { IBaseAnimalCalendarInjection, TAnimalCalendarInjection } from "./interfaces/descriptor";

class CatInjection extends BaseInjection implements IBaseAnimalCalendarInjection {
    public imageFetcherCommand: string = "curl https://aws.random.cat/meow";
    public imageKey: string = "file";
    public writeHtmlCommand: string = `echo \${1} > "${__dirname}/../cat.html"`;
    public showCalendarCommand: string = `google-chrome file://${__dirname}/../cat.html`;
}

const injection: TAnimalCalendarInjection = Object.assign(new CatInjection(), X);
module.exports = injection;
