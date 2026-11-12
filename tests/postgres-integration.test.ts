import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {postgresDatabase,postgresSql} from '../lib/training/postgres-adapter.ts';
import {handle} from '../lib/training/service.ts';
import {isPortalRoute,activePortalNav} from '../lib/training/navigation.ts';
const owner={userId:'qa-owner',email:'owner@example.test',displayName:'Owner'};
const student={userId:'qa-student',email:'student@example.test',displayName:'Student'};
const outsider={userId:'qa-outsider',email:'outsider@example.test',displayName:'Outsider'};
test('PostgreSQL migration and complete training lifecycle preserve permissions',async()=>{
 const pg=new PGlite();
 await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 await pg.exec(readFileSync(new URL('../supabase/migrations/20261023110552_training_portable.sql',import.meta.url),'utf8'));
 await pg.exec(readFileSync(new URL('../supabase/migrations/20261024153608_training_content_editor.sql',import.meta.url),'utf8'));
 const db=postgresDatabase(async(q,p)=>{const r=await pg.query<Record<string,any>>(q,p);return {rows:r.rows,affectedRows:r.affectedRows};});
 const bucket:any={put:async()=>{},delete:async()=>{},get:async()=>null};
 const api=async(path:string,body?:unknown,user=owner,method='POST')=>{const response=await handle(new Request('https://training.test/api/training/'+path,{method:body===undefined?'GET':method,headers:{'content-type':'application/json',origin:'https://training.test'},body:body===undefined?undefined:JSON.stringify(body)}),{db,bucket,user,adminEmail:owner.email});return {status:response.status,body:await response.json() as any};};
 const post=async(path:string,body:unknown,user=owner)=>{const r=await api(path,body,user);assert.ok(r.status<300,JSON.stringify(r));return r.body;};
 try{
  const company=await post('companies',{name:'QA Company',seats:1}),other=await post('companies',{name:'Other QA Company',seats:1});
  const member=await post('members',{companyId:company.id,name:'QA Student',jobTitle:'Analista',email:student.email,role:'learner'});
  await post('members',{companyId:other.id,name:'QA Outsider',jobTitle:'Gestor',email:outsider.email,role:'learner'});
  const catalog=await post('catalogs',{title:'QA Catalog'}),course=await post('courses',{catalogId:catalog.id,title:'QA Course',hours:2,minutes:1,passing:70,attemptLimit:2,certificate:true});
  const module=await post('course/'+course.id+'/module',{title:'QA Module',position:1});
  const lesson=await post('course/'+course.id+'/lesson',{moduleId:module.id,title:'QA Lesson',body:'QA Content',position:1,mode:'equivalent'});
  assert.equal((await api('modules/'+module.id,{title:'Módulo revisado',position:2},owner,'PATCH')).status,200);
  assert.equal((await api('lessons/'+lesson.id,{body:'Conteúdo revisado'},owner,'PATCH')).status,200);
  assert.equal((await api('catalogs/'+catalog.id,{coverImage:'/training-media/dados_grafico_1280x720.webp'},owner,'PATCH')).status,200);
  assert.equal((await api('course/'+course.id+'/status',{status:'review'})).status,200);
  const secondModule=await post('course/'+course.id+'/module',{title:'Segundo módulo',position:3});
  assert.equal((await api('lessons/'+lesson.id,{moduleId:secondModule.id,position:1},owner,'PATCH')).status,200);
  assert.equal((await api('course/'+course.id)).body.lessons[0].module_id,secondModule.id);
  const question=await post('course/'+course.id+'/question',{prompt:'QA Question',options:['Correct','Wrong'],correct:0,position:1});
  await post('grants',{companyId:company.id,courseId:course.id});await post('course/'+course.id+'/publish',{});
  const sector=await post('categories',{title:'Compras'});
  await post('course/'+course.id+'/category',{categoryId:sector.id});
  assert.equal((await api('course/'+course.id,undefined,student)).body.course.category_title,'Compras');
  assert.equal((await api('categories',undefined,student)).status,403);
  assert.equal((await api('course/'+course.id,undefined,outsider)).status,403);
  assert.equal((await api('course/'+course.id+'/status',{status:'disabled'})).status,200);
  assert.equal((await api('course/'+course.id,undefined,student)).status,403);
  assert.equal((await api('course/'+course.id+'/status',{status:'draft'})).status,409);
  assert.equal((await api('modules/'+module.id,{title:'Unsafe edit'},owner,'PATCH')).status,409);
  await post('course/'+course.id+'/publish',{});
  assert.equal((await api('course/'+course.id+'/start',{},student)).status,409);
  await post('progress/'+lesson.id,{},student);
  const attempt=await post('course/'+course.id+'/start',{},student);
  assert.equal('correct' in attempt.questions[0],false);
  await post('attempt/'+attempt.id+'/answer',{questionId:question.id,choice:0},student);
  const result=await post('attempt/'+attempt.id+'/submit',{},student);assert.equal(result.score,100);assert.equal(result.passed,1);
  assert.equal((await api('course/'+course.id+'/certificate',{},student)).status,409);
  await post('course/'+course.id+'/survey',{skip:true},student);
  const cert=await post('course/'+course.id+'/certificate',{},student);
  assert.equal((await api('certificates',undefined,student)).body[0].id,cert.id);
  assert.deepEqual((await api('certificates',undefined,outsider)).body,[]);
  assert.equal((await api('certificate/'+cert.id,undefined,outsider)).status,403);
  await pg.query('INSERT INTO training.assets(id,lesson_id,key,name,mime,size) VALUES ($1,$2,$3,$4,$5,$6)',['qa-file',lesson.id,'qa/file','qa.pdf','application/pdf',10]);
  const signed:any={...bucket,get:async()=>({body:new ReadableStream({start(c){c.close()}}),size:0,redirectUrl:'https://storage.example.test/signed-file'})};
  const file=await handle(new Request('https://training.test/api/training/asset/qa-file'),{db,bucket:signed,user:student,adminEmail:owner.email});assert.equal(file.status,302);assert.equal(file.headers.get('location'),'https://storage.example.test/signed-file');
  const deniedFile=await handle(new Request('https://training.test/api/training/asset/qa-file'),{db,bucket:signed,user:outsider,adminEmail:owner.email});assert.equal(deniedFile.status,403);
  await post('comments?course='+course.id,{text:'QA question'},student);
  assert.equal((await api('comments-summary')).body[0].body,'QA question');
  const activity=(await api('activity')).body;assert.equal(activity.days.reduce((sum:number,d:any)=>sum+d.total,0),3);
  const count=(await pg.query('SELECT count(*)::integer n FROM training.members WHERE company_id=$1',[company.id])).rows[0] as any;assert.equal(count.n,1);
  const rows=await pg.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='training' AND rowsecurity=false");assert.equal((rows.rows[0] as any).n,0);
 }finally{await pg.close();}
});
test('SQL placeholder conversion leaves quoted question marks untouched',()=>{
 assert.equal(postgresSql("SELECT '?' value WHERE id=?"),"SELECT '?' value WHERE id=$1");
 assert.equal(postgresSql('INSERT OR IGNORE INTO grants VALUES (?,?)'),'INSERT INTO grants VALUES ($1,$2) ON CONFLICT DO NOTHING');
});
test('connected portal routes select the current learning stage and reject unknown paths',()=>{
 const id='12345678-1234-1234-1234-123456789012';
 for(const step of ['avaliacao','pesquisa','certificado','comentarios'])assert.ok(isPortalRoute('/area/treinamentos/'+id+'/'+step,'learner'));
 assert.equal(activePortalNav('/area/treinamentos/'+id+'/pesquisa'),'/area/avaliacoes');
 assert.ok(isPortalRoute('/admin/certificados/'+id,'admin'));
 assert.equal(isPortalRoute('/area/qualquer-coisa','learner'),false);
 assert.equal(isPortalRoute('/area/treinamentos/'+id+'/nao-existe','learner'),false);
});

test('PostgreSQL capture migration stores consent and items with RLS on and no client grants',async()=>{
 const pg=new PGlite();
 await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 for(const file of ['20261023110552_training_portable.sql','20261024153608_training_content_editor.sql','20261111230000_intelligence_capture.sql','20261112121709_intelligence_voice_capture.sql','20261112175107_intelligence_motion_capture.sql'])await pg.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 const db=postgresDatabase(async(q,p)=>{const r=await pg.query<Record<string,unknown>>(q,p);return {rows:r.rows,affectedRows:r.affectedRows};});
 const keys:string[]=[];const captureBucket={put:async(key:string,data:ReadableStream<Uint8Array>)=>{await new Response(data).arrayBuffer();keys.push(key)},delete:async()=>{},get:async()=>({body:new ReadableStream({start(c){c.close()}}),size:0,redirectUrl:'https://storage.example.test/signed-capture'})};
 const ctx=(user:typeof owner)=>({db,bucket:captureBucket,captureBucket,user,adminEmail:owner.email});
 const api=async(path:string,body?:unknown,user=owner)=>{const r=await handle(new Request('https://training.test/api/training/'+path,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',origin:'https://training.test'},body:body===undefined?undefined:JSON.stringify(body)}),ctx(user));return {status:r.status,body:await r.json() as Record<string,unknown>};};
 try{
  await api('me');
  const consent=await api('capture-consent',{mode:'interview',policyVersion:'rascunho-0.1',camera:true,photos:true,recording:true});assert.equal(consent.status,201,JSON.stringify(consent));
  assert.equal((await api('capture-consent',{mode:'interview',policyVersion:'rascunho-0.1',camera:true},student)).status,403);
  const bytes=new Uint8Array([0xff,0xd8,0xff,0xe0,0,0x10]);
  const up=await handle(new Request('https://training.test/api/training/capture-upload?consent='+consent.body.id+'&session=entrevista-0001&kind=photo&moment=answer_start',{method:'POST',headers:{origin:'https://training.test','content-type':'image/jpeg','content-length':String(bytes.byteLength)},body:bytes}),ctx(owner));assert.equal(up.status,201,await up.clone().text());
  const current=await api('capture-consent?mode=interview');assert.equal(current.body.consent.photos,true);assert.equal(current.body.consent.recording,true);
  const items=await api('capture-items?session=entrevista-0001');assert.equal(items.body.length,1);assert.equal(items.body[0].kind,'photo');
  const file=await handle(new Request('https://training.test/api/training/capture-item/'+items.body[0].id),ctx(owner));assert.equal(file.status,302);
  assert.equal((await api('capture-consent/'+consent.body.id+'/revoke',{})).status,200);
  const row=(await pg.query("SELECT revoked_at,camera FROM training.capture_consents")).rows[0] as {revoked_at:string,camera:boolean};assert.ok(Number(row.revoked_at)>0);assert.equal(row.camera,true);
  const bucketRow=(await pg.query("SELECT public,file_size_limit FROM storage.buckets WHERE id='intelligence-capture'")).rows[0] as {public:boolean};assert.equal(bucketRow.public,false);
  const rls=await pg.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='training' AND tablename LIKE 'capture_%' AND rowsecurity=true");assert.equal((rls.rows[0] as {n:number}).n,4);
  const grants=await pg.query("SELECT count(*)::integer n FROM information_schema.role_table_grants WHERE table_schema='training' AND table_name LIKE 'capture_%' AND grantee IN ('anon','authenticated','PUBLIC')");assert.equal((grants.rows[0] as {n:number}).n,0);
  assert.equal(keys.length,1);
 }finally{await pg.close();}
});

test('PostgreSQL voice migration keeps audio-only consents, WAV items per script line and no client grants',async()=>{
 const pg=new PGlite();
 await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 for(const file of ['20261023110552_training_portable.sql','20261024153608_training_content_editor.sql','20261111230000_intelligence_capture.sql','20261112121709_intelligence_voice_capture.sql','20261112175107_intelligence_motion_capture.sql'])await pg.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 const db=postgresDatabase(async(q,p)=>{const r=await pg.query<Record<string,unknown>>(q,p);return {rows:r.rows,affectedRows:r.affectedRows};});
 const keys:string[]=[];const captureBucket={put:async(key:string,data:ReadableStream<Uint8Array>)=>{await new Response(data).arrayBuffer();keys.push(key)},delete:async()=>{},get:async()=>null};
 const ctx=(user:typeof owner)=>({db,bucket:captureBucket,captureBucket,user,adminEmail:owner.email});
 const api=async(path:string,body?:unknown,user=owner)=>{const r=await handle(new Request('https://training.test/api/training/'+path,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',origin:'https://training.test'},body:body===undefined?undefined:JSON.stringify(body)}),ctx(user));return {status:r.status,body:await r.json() as Record<string,unknown> & {id:string}};};
 const wav=(ms:number,rate=48000)=>{const data=Math.round(rate*ms/1000)*2,b=new Uint8Array(44+data),v=new DataView(b.buffer);const w=(o:number,t:string)=>{for(let i=0;i<4;i++)b[o+i]=t.charCodeAt(i)};w(0,'RIFF');v.setUint32(4,36+data,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,data,true);return b};
 const send=async(consent:string,moment:string,line:string,bytes:Uint8Array)=>(await handle(new Request('https://training.test/api/training/capture-upload?'+new URLSearchParams({consent,session:'voz-sessao-0001',kind:'voice',moment,script:'roteiro-voz-0.1',...(line?{line}:{})}),{method:'POST',headers:{origin:'https://training.test','content-type':'audio/wav','content-length':String(bytes.byteLength)},body:bytes}),ctx(owner))).status;
 try{
  await api('me');
  const c=await api('capture-consent',{mode:'voice',policyVersion:'voz-rascunho-0.1',voice:true});assert.equal(c.status,201,JSON.stringify(c));
  assert.equal((await api('capture-consent',{mode:'voice',policyVersion:'voz-rascunho-0.1',voice:true},student)).status,403);
  assert.equal(await send(c.body.id,'room_tone','',wav(5000)),201);
  assert.equal(await send(c.body.id,'script_line','B007',wav(3200,44100)),201);
  assert.equal(await send(c.body.id,'script_line','B007',wav(90)),400);
  const p=(await api('capture-voice-progress?script=roteiro-voz-0.1')).body;assert.equal(p.recorded,1);assert.equal(p.roomTones,1);assert.equal(p.speechMs,3200);
  const row=(await pg.query("SELECT voice,camera FROM training.capture_consents WHERE mode='voice'")).rows[0] as {voice:boolean,camera:boolean};assert.equal(row.voice,true);assert.equal(row.camera,false);
  const item=(await pg.query("SELECT mime,line_id,duration_ms,sample_rate FROM training.capture_items WHERE moment='script_line'")).rows[0] as Record<string,unknown>;assert.deepEqual(item,{mime:'audio/wav',line_id:'B007',duration_ms:3200,sample_rate:44100});
  await assert.rejects(pg.query("UPDATE training.capture_consents SET camera=true WHERE mode='voice'"));
  await assert.rejects(pg.query("UPDATE training.capture_items SET mime='video/webm' WHERE kind='voice'"));
  await assert.rejects(pg.query("UPDATE training.capture_items SET line_id=null WHERE moment='script_line'"));
  const bucketRow=(await pg.query("SELECT public,allowed_mime_types FROM storage.buckets WHERE id='intelligence-capture'")).rows[0] as {public:boolean,allowed_mime_types:string[]};assert.equal(bucketRow.public,false);assert.ok(bucketRow.allowed_mime_types.includes('audio/wav'));
  const grants=await pg.query("SELECT count(*)::integer n FROM information_schema.role_table_grants WHERE table_schema='training' AND table_name LIKE 'capture_%' AND grantee IN ('anon','authenticated','PUBLIC')");assert.equal((grants.rows[0] as {n:number}).n,0);
  assert.equal(keys.length,2);
 }finally{await pg.close();}
});

import {gzipTrack,type MotionTrack} from '../lib/intelligence/motion-track.ts';
test('PostgreSQL motion migration with the 5 real migrations: motion consent, session, cameras, gzip tracks and no client grants',async()=>{
 const pg=new PGlite();
 await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 for(const file of ['20261023110552_training_portable.sql','20261024153608_training_content_editor.sql','20261111230000_intelligence_capture.sql','20261112121709_intelligence_voice_capture.sql','20261112175107_intelligence_motion_capture.sql'])await pg.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 const db=postgresDatabase(async(q,p)=>{const r=await pg.query<Record<string,unknown>>(q,p);return {rows:r.rows,affectedRows:r.affectedRows};});
 const keys:string[]=[];const captureBucket={put:async(key:string,data:ReadableStream<Uint8Array>)=>{await new Response(data).arrayBuffer();keys.push(key)},delete:async()=>{},get:async()=>null};
 const ctx=(user:typeof owner)=>({db,bucket:captureBucket,captureBucket,user,adminEmail:owner.email});
 const api=async(path:string,body?:unknown,user=owner)=>{const r=await handle(new Request('https://training.test/api/training/'+path,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',origin:'https://training.test'},body:body===undefined?undefined:JSON.stringify(body)}),ctx(user));return {status:r.status,body:await r.json() as Record<string,unknown> & {id:string,stage?:string,reextractions?:number,cameras?:{cameraId:string,syncOffsetMs:number,bytes:number,tracks:Record<string,unknown>}[]}};};
 try{
  await api('me');
  const c=await api('capture-consent',{mode:'motion',policyVersion:'imagem-rascunho-0.1',camera:true,motion:true});assert.equal(c.status,201,JSON.stringify(c));
  assert.equal((await api('capture-consent',{mode:'motion',policyVersion:'imagem-rascunho-0.1',camera:true,motion:true},student)).status,403);
  const s=await api('capture-session',{consent:c.body.id,script:'roteiro-expressoes-0.1'});assert.equal(s.status,201,JSON.stringify(s));assert.equal(s.body.stage,'face');
  assert.equal((await api('capture-camera',{session:s.body.id,cameraId:'ref',role:'reference',source:'browser',deviceLabel:'Webcam',width:1280,height:720,fps:30})).status,201);
  assert.equal((await api('capture-camera',{session:s.body.id,cameraId:'close',role:'close',source:'device_file'})).status,400);
  const file={session:s.body.id,cameraId:'close',role:'close',source:'device_file',location:'owner_disk',fileName:'IMG_0001.MOV',sha256:'a'.repeat(64),bytes:1500000000,durationMs:900000,width:3840,height:2160,fps:59.94,codec:'hevc'};
  assert.equal((await api('capture-camera',file)).status,201);assert.equal((await api('capture-camera',{...file,syncOffsetMs:-420,driftPpm:12.5})).status,200);
  const track:MotionTrack={schema:'evolu.motion-track',version:'0.1',track:'face',session:s.body.id,camera:'ref',t0Ms:0,durationMs:60000,extractor:{lib:'@mediapipe/tasks-vision',version:'0.10.x',model:'face_landmarker.task',modelSha256:'b'.repeat(64)},source:{kind:'browser'},columns:['t','jawOpen','yaw'],scale:{jawOpen:255,yaw:100},frames:[[0,10,-150],[33,12,-140],[60000,0,0]]};
  const send=async(t:MotionTrack,camera=t.camera)=>{const g=await gzipTrack(t);const r=await handle(new Request('https://training.test/api/training/capture-upload?'+new URLSearchParams({consent:c.body.id,session:s.body.id,kind:'track',moment:'track_chunk',camera,track:t.track,t0:String(t.t0Ms)}),{method:'POST',headers:{origin:'https://training.test','content-type':'application/gzip','content-length':String(g.byteLength)},body:g}),ctx(owner));return {status:r.status,body:await r.json() as Record<string,unknown>}};
  const first=await send(track);assert.equal(first.status,201,JSON.stringify(first));
  assert.equal((await send({...track,t0Ms:60000})).status,201);assert.equal((await send(track)).status,201);
  assert.equal((await send({...track,frames:[[60001,0,0]]})).status,400);
  assert.equal((await send(track,'wide')).status,400);
  const p=(await api('capture-session-progress?session='+s.body.id)).body;
  assert.equal(p.reextractions,1);const ref=p.cameras!.find((x:{cameraId:string})=>x.cameraId==='ref');assert.deepEqual(ref!.tracks.face,{chunks:2,coveredMs:120000,lastT0Ms:60000});
  const close=p.cameras!.find((x:{cameraId:string})=>x.cameraId==='close');assert.equal(close!.syncOffsetMs,-420);assert.equal(close!.bytes,1500000000);
  assert.equal((await api('capture-session/'+s.body.id+'/end',{})).status,200);
  const row=(await pg.query("SELECT mime,track,t0_ms,duration_ms,camera_id FROM training.capture_items WHERE kind='track' ORDER BY created_at LIMIT 1")).rows[0];assert.deepEqual(row,{mime:'application/gzip',track:'face',t0_ms:0,duration_ms:60000,camera_id:'ref'});
  assert.ok(keys.every(k=>new RegExp('^capture/motion/qa-owner/'+s.body.id+'/ref/face/\\d+-[0-9a-f-]{36}\\.json\\.gz$').test(k)));
  await assert.rejects(pg.query("UPDATE training.capture_consents SET voice=true WHERE mode='motion'"));
  await assert.rejects(pg.query("UPDATE training.capture_items SET mime='application/json' WHERE kind='track'"));
  await assert.rejects(pg.query("UPDATE training.capture_items SET camera_id='nao_existe' WHERE kind='track'"));
  await assert.rejects(pg.query("UPDATE training.capture_cameras SET sha256=null WHERE camera_id='close'"));
  const bucketRow=(await pg.query("SELECT allowed_mime_types FROM storage.buckets WHERE id='intelligence-capture'")).rows[0] as {allowed_mime_types:string[]};assert.ok(bucketRow.allowed_mime_types.includes('application/gzip'));
  const rls=await pg.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='training' AND tablename IN ('capture_sessions','capture_cameras','style_profiles') AND rowsecurity=true");assert.equal((rls.rows[0] as {n:number}).n,3);
  const grants=await pg.query("SELECT count(*)::integer n FROM information_schema.role_table_grants WHERE table_schema='training' AND (table_name LIKE 'capture_%' OR table_name='style_profiles') AND grantee IN ('anon','authenticated','PUBLIC')");assert.equal((grants.rows[0] as {n:number}).n,0);
  assert.equal(keys.length,3);
 }finally{await pg.close();}
});
