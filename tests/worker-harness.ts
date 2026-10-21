// Local integration fixture only. Never imported by the application or production worker.
import {handle} from '../lib/training/service.ts';
export default {fetch(request:Request,env:{DB:D1Database,BUCKET:R2Bucket}){
 return handle(request,{db:env.DB,bucket:env.BUCKET,user:JSON.parse(request.headers.get('x-test-user')||'null'),adminEmail:'owner@storage.test'});
}};
