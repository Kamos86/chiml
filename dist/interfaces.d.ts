export declare type IValue = Promise<any>;
export declare type IWrappedFunction = (...args: any[]) => IValue;
export declare type IMapFunction = (data: any[]) => Promise<any[]>;
export declare type IFilterFunction = (data: any[]) => Promise<any[]>;
export declare type IReduceFunction = (data: any[], accumulator: any) => Promise<any>;
export declare type IAnyFunction = (...args: any[]) => any;
interface IMayBeBranchedStatement {
    if?: string;
}
interface IParallelStatement extends IMayBeBranchedStatement {
    parallel: IProgram[];
}
interface ISerialStatement extends IMayBeBranchedStatement {
    do: IProgram[];
}
interface ISingleStatementSkeleton extends IMayBeBranchedStatement {
    ins: string[];
    out: string;
    vars?: {
        [key: string]: string;
    };
}
interface ISingleStatement extends ISingleStatementSkeleton {
    do: string | IProgram;
}
interface IPipeStatement extends ISingleStatementSkeleton {
    pipe: IProgram[];
}
interface IMapStatement extends ISingleStatementSkeleton {
    map: string | IProgram;
}
interface IFilterStatement extends ISingleStatementSkeleton {
    filter: string | IProgram;
}
interface IReduceStatement extends ISingleStatementSkeleton {
    accumulator: string;
    reduce: string | IProgram;
}
export declare type IProgram = IParallelStatement | ISerialStatement | ISingleStatement | IMapStatement | IFilterStatement | IReduceStatement | IPipeStatement;
export {};
