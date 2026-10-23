// Local integration fixture only. Never imported by the application or production worker.
import {handle} from '../lib/training/service.ts';
export default {fetch(request:Request,env:{DB:D1Database,BUCKET:R2Bucket}){
 return handle(request,{db:env.DB,bucket:{async put(key:string,body:ReadableStream,options:any){const fixed=new FixedLengthStream(Number(request.headers.get('content-length')));await Promise.all([body.pipeTo(fixed.writable),env.BUCKET.put(key,fixed.readable,options)]);},delete:(key:string)=>env.BUCKET.delete(key),get:(key:string,options?:any)=>env.BUCKET.get(key,options?.range?{range:options.range}:undefined)},user:JSON.parse(request.headers.get('x-test-user')||'null'),adminEmail:'owner@storage.test'});
}};
