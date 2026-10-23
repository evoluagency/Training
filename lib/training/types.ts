export type QueryValue=string|number|null;
export interface PreparedStatement {bind(...values:any[]):PreparedStatement;first<T=any>():Promise<T|null>;all<T=any>():Promise<{results:T[]}>;run():Promise<{meta:{changes:number|bigint}}>}
export interface Database {prepare(query:string):PreparedStatement;}
export interface FileBucket {
 put(key:string,body:ReadableStream<Uint8Array>,options:{httpMetadata:{contentType:string}}):Promise<unknown>;
 delete(key:string):Promise<unknown>;
 get(key:string,options?:{range?:Headers;downloadName?:string}):Promise<{body:ReadableStream<Uint8Array>;size:number;redirectUrl?:string;range?:{offset:number;length:number}}|null>;
}
