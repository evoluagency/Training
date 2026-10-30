import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handle} from '../lib/training/service.ts';
import {getPublicCatalog,PUBLIC_COURSE_SQL,PUBLIC_MODULE_SQL} from '../lib/training/public-catalog.ts';
import {buildPublicHomeCategories} from '../lib/training/public-home.ts';
import {orderLessons} from '../lib/training/lesson-order.ts';
import {readTrainingResponse} from '../lib/training/client-response.ts';
import {visibleCourseCategories,lessonTitleFromFile} from '../lib/training/categories.ts';

test('next-lesson order respects modules when lesson positions restart at one',()=>{
 const modules=[{id:'second',position:2},{id:'first',position:1}];
 const lessons=[{id:'b1',module_id:'second',position:1},{id:'a2',module_id:'first',position:2},{id:'a1',module_id:'first',position:1},{id:'b2',module_id:'second',position:2}];
 assert.deepEqual(orderLessons(modules,lessons).map(l=>l.id),['a1','a2','b1','b2']);
 assert.equal(lessons[0].id,'b1');
});

test('client response preserves API errors and handles non-JSON failures safely',async()=>{
 assert.deepEqual(await readTrainingResponse(Response.json({role:'admin'})),{role:'admin'});
 await assert.rejects(()=>readTrainingResponse(Response.json({error:'Vagas esgotadas'},{status:409})),/Vagas esgotadas/);
 await assert.rejects(()=>readTrainingResponse(Response.json({error:{internal:'not a message'}},{status:500})),/Não foi possível concluir/);
 await assert.rejects(()=>readTrainingResponse(new Response('<html>Unavailable</html>',{status:503})),/resposta válida/);
});
const admin={userId:'owner',email:'owner@example.test',displayName:'Owner'};
const alice={userId:'alice',email:'alice@example.test',displayName:'Alice'};
const bob={userId:'bob',email:'bob@example.test',displayName:'Bob'};
const manager={userId:'manager',email:'manager@example.test',displayName:'Manager'};
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON;');sql.exec(readFileSync(new URL('../drizzle/0000_lush_nighthawk.sql',import.meta.url),'utf8'));sql.exec(readFileSync(new URL('../drizzle/0001_link_resources_to_lessons.sql',import.meta.url),'utf8'));sql.exec(readFileSync(new URL('../drizzle/0002_public_course_showcase.sql',import.meta.url),'utf8'));sql.exec(readFileSync(new URL('../drizzle/0003_company_profile.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));sql.exec(readFileSync(new URL('../drizzle/0004_learner_notes.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../drizzle/0005_content_editor.sql',import.meta.url),'utf8'));
 const db:any={prepare(query:string){let vals:any[]=[];return {bind(...v:any[]){vals=v;return this},async first(){return sql.prepare(query).get(...vals)??null},async all(){return {results:sql.prepare(query).all(...vals)}},async run(){return {meta:sql.prepare(query).run(...vals)}}}}};
 const objects=new Map<string,Uint8Array>();const bucket:any={async put(key:string,data:any){objects.set(key,new Uint8Array(await new Response(data).arrayBuffer()))},async delete(key:string){objects.delete(key)},async get(key:string){const v=objects.get(key);return v?{body:new Blob([new Uint8Array(v).buffer]).stream(),size:v.length}:null}};
 let clock=1700000000000;
 const ctx=(user:any)=>({db,bucket,user,adminEmail:admin.email,now:()=>clock});
 async function request(path:string,user:any=admin,body?:any,method='POST',origin='https://training.test'){
  const r=await handle(new Request('https://training.test/api/training/'+path,{method:body===undefined?'GET':method,headers:{origin,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),ctx(user));return {status:r.status,body:await r.json() as any};
 }
 const post=async(path:string,body:any,user:any=admin)=>{const r=await request(path,user,body);assert.ok(r.status<300,JSON.stringify(r));return r.body};
 async function setup(){const ca=await post('companies',{name:'A',seats:2}),cb=await post('companies',{name:'B',seats:2});const ma=await post('members',{companyId:ca.id,name:'Alice Full',jobTitle:'Analista',whatsapp:'+55 11 99999-0000',email:alice.email,role:'learner'}),mb=await post('members',{companyId:cb.id,name:'Bob Full',jobTitle:'Gestor',email:bob.email,role:'learner'});const cat=await post('catalogs',{title:'Catálogo'}),course=await post('courses',{catalogId:cat.id,title:'Curso',description:'Teste',hours:2,minutes:1,passing:70,attemptLimit:2,certificate:true});const mod=await post('course/'+course.id+'/module',{title:'Módulo',position:1});const lesson=await post('course/'+course.id+'/lesson',{moduleId:mod.id,title:'Aula',body:'Conteúdo',position:1,mode:'equivalent'});const q1=await post('course/'+course.id+'/question',{prompt:'Questão 1',options:['Certa','Errada'],correct:0,position:1});const q2=await post('course/'+course.id+'/question',{prompt:'Questão 2',options:['Errada','Certa'],correct:1,position:2});await post('course/'+course.id+'/publish',{});await post('grants',{companyId:ca.id,courseId:course.id});return {ca,cb,ma,mb,course,lesson,q1,q2};}
 return {sql,db,ctx,request,post,setup,advance:(n:number)=>{clock+=n},close:()=>sql.close()};
}
test('public homepage never exposes closed corporate courses without explicit approval',async()=>{
 const f=fixture(),d=await f.setup();
 assert.equal((await getPublicCatalog(f.db)).length,0);
 assert.equal((await f.request('course/'+d.course.id+'/home',alice,{visible:true})).status,403);
 assert.equal((await f.request('course/'+d.course.id+'/home',admin,{visible:'yes'})).status,400);
 await f.post('course/'+d.course.id+'/home',{visible:true});
 const published=await getPublicCatalog(f.db);
 assert.equal(published.length,1);
 assert.equal(published[0].id,d.course.id);
 assert.deepEqual(Object.keys(published[0]).sort(),['catalog_id','category','category_description','cover_image','description','hours','id','modules','title']);
 assert.deepEqual(published[0].modules,[{title:'Módulo',position:1}]);
 assert.equal(buildPublicHomeCategories(published)[0].course_count,1);
 assert.equal(buildPublicHomeCategories(published)[0].title,'Catálogo');
 assert.ok(PUBLIC_MODULE_SQL.includes("c.show_on_home=1"));
 assert.ok(PUBLIC_COURSE_SQL.includes("c.show_on_home=1"));
 const cat=await f.post('catalogs',{title:'Privado'});
 const draft=await f.post('courses',{catalogId:cat.id,title:'Ainda não publicado',hours:1,minutes:10,passing:70,attemptLimit:1});
 assert.equal((await f.request('course/'+draft.id+'/home',admin,{visible:true})).status,409);
 assert.equal((await getPublicCatalog(f.db)).length,1);
 assert.equal(buildPublicHomeCategories(await getPublicCatalog(f.db)).length,1);
 await f.post('course/'+d.course.id+'/home',{visible:false});
 assert.equal((await getPublicCatalog(f.db)).length,0);
 assert.deepEqual(buildPublicHomeCategories(await getPublicCatalog(f.db)),[]);
 f.close();
});
test('public homepage never invents categories or modules',()=>{
 assert.deepEqual(buildPublicHomeCategories([]),[]);
 const base={id:'c1',catalog_id:'cat1',title:'Curso real',category:'Compras',category_description:'',description:'',hours:2,cover_image:'',modules:[]};
 assert.deepEqual(buildPublicHomeCategories([base]),[{id:'cat1',title:'Compras',description:'',cover_image:'',course_count:1,courses:[base]}]);
 const second={...base,id:'c2',title:'Outro curso',modules:[{title:'Aula estruturada',position:1}]};
 const categories=buildPublicHomeCategories([base,second]);
 assert.equal(categories.length,1);
 assert.equal(categories[0].course_count,2);
 assert.deepEqual(categories[0].courses[0].modules,[]);
 assert.deepEqual(categories[0].courses[1].modules,second.modules);
});

test('public catalog lists only approved module titles without exposing lessons and private data',async()=>{
 const f=fixture(),d=await f.setup();
 const privateCat=await f.post('catalogs',{title:'Interno',description:'Categoria privada'});
 const hidden=await f.post('courses',{catalogId:privateCat.id,title:'Curso reservado',hours:3,minutes:60,passing:70,attemptLimit:2});
 await f.post('course/'+hidden.id+'/module',{title:'Módulo reservado',position:1});
 await f.post('course/'+d.course.id+'/home',{visible:true});
 const publicList=await getPublicCatalog(f.db);
 assert.deepEqual(publicList.map(c=>c.title),['Curso']);
 assert.deepEqual(publicList[0].modules,[{title:'Módulo',position:1}]);
 assert.ok(!JSON.stringify(publicList).includes('Módulo reservado'));
 assert.ok(!JSON.stringify(publicList).includes('Conteúdo'));
 assert.ok(!JSON.stringify(publicList).includes('alice@example.test'));
 f.close();
});
test('company seat amendments respect active capacity and reject non-admin writes',async()=>{const f=fixture();const company=await f.post('companies',{name:'Empresa',seats:2});const a=await f.post('members',{companyId:company.id,name:'Alice',jobTitle:'Analista',email:alice.email,role:'learner'});assert.equal((await f.request('companies/'+company.id,admin,{seats:1},'PATCH')).status,200);assert.equal((await f.request('companies/'+company.id,admin,{seats:0},'PATCH')).status,400);assert.equal((await f.request('companies/'+company.id,alice,{seats:2},'PATCH')).status,403);assert.equal((await f.request('members',admin,{companyId:company.id,name:'Bob',jobTitle:'Gestor',email:bob.email,role:'manager'})).status,409);await f.request('members/'+a.id,admin,{active:false},'PATCH');assert.equal((await f.request('companies/'+company.id,admin,{seats:1},'PATCH')).status,200);f.close()});
test('company profile accepts valid CNPJ and rejects duplicate',async()=>{const f=fixture();const cnpj='11.222.333/0001-81';const first=await f.post('companies',{name:'Empresa de teste',seats:2,cnpj,responsibleName:'Responsável',responsibleEmail:'responsavel@example.com'});assert.ok(first.id);assert.equal((await f.request('companies',admin,{name:'Duplicada',seats:1,cnpj})).status,409);assert.equal((await f.request('companies',admin,{name:'Inválida',seats:1,cnpj:'00.000.000/0000-00'})).status,400);f.close()});
test('private lesson notes are isolated by participant and revoked with the course',async()=>{const f=fixture(),d=await f.setup();const write=await f.request('notes/'+d.lesson.id,alice,{body:'Anotação particular'});assert.equal(write.status,200);assert.equal((await f.request('notes/'+d.lesson.id,alice)).body.body,'Anotação particular');assert.equal((await f.request('notes/'+d.lesson.id,bob)).status,403);await f.post('grants',{companyId:d.ca.id,courseId:d.course.id,revoke:true});assert.equal((await f.request('notes/'+d.lesson.id,alice)).status,403);f.close()});
test('administrative comment summary is restricted to admins and retains enterprise attribution',async()=>{const f=fixture(),d=await f.setup();await f.post('comments?course='+d.course.id+'&company='+d.ca.id,{text:'Dúvida do participante'},alice);const denied=await f.request('comments-summary',alice);assert.equal(denied.status,403);const allowed=await f.request('comments-summary',admin);assert.equal(allowed.status,200);assert.equal(allowed.body.length,1);assert.equal(allowed.body[0].company,'A');assert.equal(allowed.body[0].course,'Curso');assert.equal(allowed.body[0].body,'Dúvida do participante');f.close()});
test('admin activity timeline uses recorded completion events and rejects learners',async()=>{const f=fixture(),d=await f.setup();assert.equal((await f.request('activity',alice)).status,403);const initial=await f.request('activity',admin);assert.equal(initial.status,200);assert.equal(initial.body.days.length,7);assert.equal(initial.body.recent.length,0);await f.post('progress/'+d.lesson.id,{},alice);const after=await f.request('activity',admin);assert.equal(after.status,200);assert.equal(after.body.days.reduce((sum:number,day:any)=>sum+day.total,0),1);assert.equal(after.body.recent[0].kind,'lesson');assert.equal(after.body.recent[0].course,'Curso');f.close()});
test('anonymous user cannot access data',async()=>{const f=fixture();assert.equal((await f.request('overview',null)).status,401);f.close()});
test('no self enrolment and no admin escalation',async()=>{const f=fixture();await f.request('me');assert.equal((await f.request('me',alice)).body.role,'unassigned');assert.equal((await f.request('companies',alice,{name:'X',seats:1})).status,403);assert.equal((await f.request('me',{...admin,userId:'attacker'})).body.role,'unassigned');f.close()});
test('cross-origin writes rejected',async()=>{const f=fixture();assert.equal((await f.request('companies',admin,{name:'X',seats:1},'POST','https://evil.test')).status,403);f.close()});
test('seats reserve atomically, suspension releases, reactivation checks capacity',async()=>{const f=fixture();const c=await f.post('companies',{name:'A',seats:1});const a=await f.post('members',{companyId:c.id,name:'Alice',jobTitle:'Analista',email:alice.email,role:'learner'});assert.equal((await f.request('members',admin,{companyId:c.id,name:'Bob',jobTitle:'Analista',email:bob.email,role:'learner'})).status,409);await f.request('members/'+a.id,admin,{active:false},'PATCH');await f.post('members',{companyId:c.id,name:'Bob',jobTitle:'Analista',email:bob.email,role:'learner'});assert.equal((await f.request('members/'+a.id,admin,{active:true},'PATCH')).status,409);f.close()});
test('cargo and whatsapp are saved, identity binds only once',async()=>{const f=fixture();const d=await f.setup();const me=(await f.request('me',alice)).body;assert.equal(me.member.job_title,'Analista');assert.equal(me.member.whatsapp,'+5511999990000');assert.equal((await f.request('me',{...alice,userId:'other'})).body.role,'unassigned');f.close()});
test('learners cannot access other company courses or reports',async()=>{const f=fixture();const d=await f.setup();assert.equal((await f.request('course/'+d.course.id,bob)).status,403);assert.equal((await f.request('report',alice)).status,403);assert.equal((await f.request('overview',bob)).body.courses.length,0);f.close()});
test('course must have lessons and assessment before publishing',async()=>{const f=fixture();const cat=await f.post('catalogs',{title:'C'}),c=await f.post('courses',{catalogId:cat.id,title:'Empty',hours:1,minutes:10,passing:70,attemptLimit:2});assert.equal((await f.request('course/'+c.id+'/publish',admin,{})).status,400);f.close()});
test('published content is frozen',async()=>{const f=fixture(),d=await f.setup();assert.equal((await f.request('course/'+d.course.id+'/module',admin,{title:'New',position:2})).status,409);f.close()});
test('sector categories support management without exposing unassigned sectors to learners',async()=>{
 const f=fixture(),d=await f.setup();const current=(await f.request('course/'+d.course.id)).body;
 assert.equal((await f.request('categories',alice)).status,403);
 const category=await f.post('categories',{title:'Compras',description:'Cursos do setor de compras'});
 assert.equal((await f.request('categories',admin,{title:'compras'})).status,409);
 assert.equal((await f.request('categories/'+category.id,admin,{title:'Compras e Suprimentos'},'PATCH')).status,200);
 assert.equal((await f.request('course/'+d.course.id+'/category',alice,{categoryId:category.id})).status,403);
 assert.equal((await f.request('course/'+d.course.id+'/category',admin,{categoryId:'invalid'})).status,400);
 await f.post('course/'+d.course.id+'/category',{categoryId:category.id});
 const updated=(await f.request('course/'+d.course.id)).body;assert.equal(updated.course.category_title,'Compras e Suprimentos');assert.equal(updated.course.title,current.course.title);assert.equal(updated.course.content_locked,1);assert.deepEqual(updated.lessons,current.lessons);
 const hidden=await f.post('categories',{title:'Marketing'});await f.post('courses',{categoryId:hidden.id,title:'Curso não liberado',hours:1,minutes:10,passing:70,attemptLimit:1});
 const studentCourses=(await f.request('overview',alice)).body.courses;assert.deepEqual(visibleCourseCategories(studentCourses),[{id:category.id,title:'Compras e Suprimentos',courses:1}]);
 assert.equal(studentCourses.some((c:any)=>c.category_title==='Marketing'),false);
 const categories=(await f.request('categories')).body;assert.equal(categories.find((c:any)=>c.id===hidden.id).course_count,1);f.close();
});
test('lessons move only within their own editable course and retain PDF identity and bytes',async()=>{
 const f=fixture();const category=await f.post('categories',{title:'Compras'}),course=await f.post('courses',{categoryId:category.id,title:'Compras Estratégicas',hours:8,minutes:30,passing:70,attemptLimit:2});
 const first=await f.post('course/'+course.id+'/module',{title:'Planejamento',position:1}),second=await f.post('course/'+course.id+'/module',{title:'Custos',position:2});
 const another=await f.post('courses',{categoryId:category.id,title:'Outro curso',hours:1,minutes:10,passing:70,attemptLimit:1}),foreign=await f.post('course/'+another.id+'/module',{title:'Outro módulo',position:1});
 const bytes=new TextEncoder().encode('%PDF-1.4\nPreserved synthetic document');
 const response=await handle(new Request('https://training.test/api/training/module-upload?module='+first.id+'&name=Modulo_02_Custos_e_Negociacao.pdf',{method:'POST',headers:{origin:'https://training.test','content-type':'application/pdf','content-length':String(bytes.length)},body:bytes}),f.ctx(admin));assert.equal(response.status,201);const upload:any=await response.json();
 assert.equal((await f.request('lessons/'+upload.lessonId,admin,{moduleId:foreign.id},'PATCH')).status,400);
 assert.equal((await f.request('lessons/'+upload.lessonId,alice,{moduleId:second.id},'PATCH')).status,403);
 assert.equal((await f.request('lessons/'+upload.lessonId,admin,{moduleId:second.id,title:'Custos e negociação',position:1},'PATCH')).status,200);
 const detail=(await f.request('course/'+course.id)).body;assert.equal(detail.lessons[0].module_id,second.id);assert.equal(detail.lessons[0].course_id,course.id);assert.equal(detail.assets[0].id,upload.id);assert.equal(detail.assets[0].lesson_id,upload.lessonId);
 const download=await handle(new Request('https://training.test/api/training/asset/'+upload.id),f.ctx(admin));assert.deepEqual(new Uint8Array(await download.arrayBuffer()),bytes);
 await f.post('course/'+course.id+'/question',{prompt:'Questão',options:['Sim','Não'],correct:0,position:1});await f.post('course/'+course.id+'/publish',{});
 assert.equal((await f.request('lessons/'+upload.lessonId,admin,{moduleId:first.id},'PATCH')).status,409);f.close();
});
test('PDF-derived lesson names are readable and empty names have a useful fallback',()=>{
 assert.equal(lessonTitleFromFile('Modulo_01_Planejamento_de_Compras.pdf'),'Planejamento de Compras');
 assert.equal(lessonTitleFromFile('Módulo 02 - Custos.pdf'),'Custos');
 assert.equal(lessonTitleFromFile('.pdf'),'Material da aula');
});
test('module and lesson edits persist and are restricted to the editable course',async()=>{
 const f=fixture();const cat=await f.post('catalogs',{title:'Catálogo'}),course=await f.post('courses',{catalogId:cat.id,title:'Rascunho',hours:2,minutes:10,passing:70,attemptLimit:2});
 const module=await f.post('course/'+course.id+'/module',{title:'Módulo inicial',position:1});const lesson=await f.post('course/'+course.id+'/lesson',{moduleId:module.id,title:'Aula inicial',body:'',position:1,mode:'equivalent'});
 assert.equal((await f.request('modules/'+module.id,alice,{title:'Não autorizado'},'PATCH')).status,403);
 assert.equal((await f.request('modules/'+module.id,admin,{title:'Módulo editado',position:2},'PATCH')).status,200);
 assert.equal((await f.request('lessons/'+lesson.id,admin,{title:'Aula editada',body:'Objetivo revisto',position:3},'PATCH')).status,200);
 const detail=(await f.request('course/'+course.id)).body;assert.equal(detail.modules[0].title,'Módulo editado');assert.equal(detail.modules[0].position,2);assert.equal(detail.lessons[0].body,'Objetivo revisto');
 assert.equal((await f.request('modules/'+module.id,admin,{title:'',position:2},'PATCH')).status,400);f.close();
});
test('PDF attached directly to a module creates its lesson and preserves file bytes',async()=>{
 const f=fixture();const cat=await f.post('catalogs',{title:'C'}),course=await f.post('courses',{catalogId:cat.id,title:'PDF course',hours:1,minutes:10,passing:70,attemptLimit:1}),module=await f.post('course/'+course.id+'/module',{title:'Módulo PDF',position:1});
 const bytes=new TextEncoder().encode('%PDF-1.4\nSynthetic training document');
 const req=(user:any,mime='application/pdf')=>handle(new Request('https://training.test/api/training/module-upload?module='+module.id+'&name=Planejamento.pdf',{method:'POST',headers:{origin:'https://training.test','content-type':mime,'content-length':String(bytes.length)},body:bytes}),f.ctx(user));
 assert.equal((await req(alice)).status,403);assert.equal((await req(admin,'text/html')).status,400);
 assert.equal((await f.request('course/'+course.id)).body.lessons.length,0);
 const response=await req(admin);assert.equal(response.status,201);const result:any=await response.json();const detail=(await f.request('course/'+course.id)).body;
 assert.equal(detail.lessons.length,1);assert.equal(detail.lessons[0].id,result.lessonId);assert.equal(detail.lessons[0].title,'Planejamento');assert.equal(detail.assets[0].lesson_id,result.lessonId);
 const download=await handle(new Request('https://training.test/api/training/asset/'+result.id),f.ctx(admin));assert.deepEqual(new Uint8Array(await download.arrayBuffer()),bytes);
 const bad=await handle(new Request('https://training.test/api/training/module-upload?module='+module.id+'&name=bad.pdf',{method:'POST',headers:{origin:'https://training.test','content-type':'application/pdf','content-length':String(11*1024*1024)},body:bytes}),f.ctx(admin));assert.equal(bad.status,400);assert.equal((await f.request('course/'+course.id)).body.lessons.length,1);f.close();
});
test('status changes revoke learner access and cannot unlock published content',async()=>{
 const f=fixture(),d=await f.setup();await f.post('course/'+d.course.id+'/home',{visible:true});
 assert.equal((await f.request('course/'+d.course.id+'/status',alice,{status:'disabled'})).status,403);
 for(const status of ['disabled','archived']){await f.post('course/'+d.course.id+'/status',{status});assert.equal((await f.request('course/'+d.course.id,alice)).status,403);assert.equal((await getPublicCatalog(f.db)).length,0);assert.equal((await f.request('course/'+d.course.id+'/status',admin,{status:'draft'})).status,409);assert.equal((await f.request('course/'+d.course.id+'/module',admin,{title:'Unsafe',position:2})).status,409);await f.post('course/'+d.course.id+'/publish',{});assert.equal((await f.request('course/'+d.course.id,alice)).status,200);}
 assert.equal((await f.request('course/'+d.course.id+'/status',admin,{status:'published'})).status,400);f.close();
});
test('catalog covers are editable, inherited and never expose private storage keys publicly',async()=>{
 const f=fixture(),d=await f.setup();const catalogId=(await f.request('course/'+d.course.id)).body.course.catalog_id;
 assert.equal((await f.request('catalogs/'+catalogId,alice,{coverImage:'https://example.test/cover.jpg'},'PATCH')).status,403);
 assert.equal((await f.request('catalogs/'+catalogId,admin,{coverImage:'javascript:alert(1)'},'PATCH')).status,400);
 assert.equal((await f.request('catalogs/'+catalogId,admin,{title:'Catálogo editado',coverImage:'/training-media/dados_grafico_1280x720.webp'},'PATCH')).status,200);
 assert.equal((await f.request('course/'+d.course.id)).body.course.catalog_cover,'/training-media/dados_grafico_1280x720.webp');
 const bytes=new Uint8Array([137,80,78,71,13,10,26,10]);
 const response=await handle(new Request('https://training.test/api/training/cover-upload?kind=catalog&id='+catalogId,{method:'POST',headers:{origin:'https://training.test','content-type':'image/png','content-length':String(bytes.length)},body:bytes}),f.ctx(admin));assert.equal(response.status,201);
 assert.equal((await f.request('cover/catalog/'+catalogId,bob)).status,403);
 await f.post('course/'+d.course.id+'/home',{visible:true});const publicCourses=await getPublicCatalog(f.db);assert.equal(publicCourses[0].cover_image,'/api/capas/'+d.course.id);assert.equal(JSON.stringify(publicCourses).includes('storage:'),false);
 const download=await handle(new Request('https://training.test/api/training/cover/course/'+d.course.id),f.ctx(alice));assert.equal(download.headers.get('Content-Type'),'image/png');assert.deepEqual(new Uint8Array(await download.arrayBuffer()),bytes);f.close();
});
test('progress required before exam and no answer keys exposed',async()=>{const f=fixture(),d=await f.setup();assert.equal((await f.request('course/'+d.course.id+'/start',alice,{})).status,409);await f.post('progress/'+d.lesson.id,{},alice);const a=await f.post('course/'+d.course.id+'/start',{},alice);assert.equal(a.questions[0].correct,undefined);const r=(await f.request('course/'+d.course.id,alice)).body;assert.equal(r.questions,undefined);assert.equal(r.attempts[0].questions[0].correct,undefined);f.close()});
test('concurrent starts return the same attempt and preserve deadline',async()=>{const f=fixture(),d=await f.setup();await f.post('progress/'+d.lesson.id,{},alice);const [a,b]=await Promise.all([f.post('course/'+d.course.id+'/start',{},alice),f.post('course/'+d.course.id+'/start',{},alice)]);assert.equal(a.id,b.id);f.advance(1000);assert.equal((await f.post('course/'+d.course.id+'/start',{},alice)).deadline,a.deadline);f.close()});
test('deadline prevents late answers and grades saved answers',async()=>{const f=fixture(),d=await f.setup();await f.post('progress/'+d.lesson.id,{},alice);const a=await f.post('course/'+d.course.id+'/start',{},alice);await f.post('attempt/'+a.id+'/answer',{questionId:d.q1.id,choice:0},alice);f.advance(60001);assert.equal((await f.request('attempt/'+a.id+'/answer',alice,{questionId:d.q2.id,choice:1})).status,409);const r=(await f.request('attempt/'+a.id,alice)).body;assert.equal(r.status,'expired');assert.equal(r.score,50);assert.equal(r.passed,0);f.close()});
test('answers cannot be submitted to another participant attempt',async()=>{const f=fixture(),d=await f.setup();await f.post('progress/'+d.lesson.id,{},alice);const a=await f.post('course/'+d.course.id+'/start',{},alice);assert.equal((await f.request('attempt/'+a.id,bob)).status,404);f.close()});
test('attempt limit is enforced',async()=>{const f=fixture(),d=await f.setup();await f.post('progress/'+d.lesson.id,{},alice);for(let i=0;i<2;i++){const a=await f.post('course/'+d.course.id+'/start',{},alice);await f.post('attempt/'+a.id+'/submit',{},alice)}assert.equal((await f.request('course/'+d.course.id+'/start',alice,{})).status,409);f.close()});
test('certificate requires approval and survey step, can skip NPS, issuance idempotent',async()=>{const f=fixture(),d=await f.setup();assert.equal((await f.request('course/'+d.course.id+'/certificate',alice,{})).status,409);await f.post('progress/'+d.lesson.id,{},alice);const a=await f.post('course/'+d.course.id+'/start',{},alice);await f.post('attempt/'+a.id+'/answer',{questionId:d.q1.id,choice:0},alice);await f.post('attempt/'+a.id+'/answer',{questionId:d.q2.id,choice:1},alice);const result=await f.post('attempt/'+a.id+'/submit',{},alice);assert.equal(result.score,100);assert.equal(result.passed,1);assert.equal((await f.request('course/'+d.course.id+'/certificate',alice,{})).status,409);await f.post('course/'+d.course.id+'/survey',{skip:true},alice);const c=await f.post('course/'+d.course.id+'/certificate',{},alice);assert.equal(c.id,(await f.post('course/'+d.course.id+'/certificate',{},alice)).id);assert.equal(c.name,'Alice Full');assert.equal((await f.request('certificate/'+c.id,bob)).status,403);assert.equal((await f.request('attempt/'+a.id+'/answer',alice,{questionId:d.q1.id,choice:1})).status,409);f.close()});
test('NPS score zero does not change approval',async()=>{const f=fixture(),d=await f.setup();await f.post('progress/'+d.lesson.id,{},alice);const a=await f.post('course/'+d.course.id+'/start',{},alice);await f.post('attempt/'+a.id+'/answer',{questionId:d.q1.id,choice:0},alice);await f.post('attempt/'+a.id+'/answer',{questionId:d.q2.id,choice:1},alice);await f.post('attempt/'+a.id+'/submit',{},alice);await f.post('course/'+d.course.id+'/survey',{score:0,comment:'Melhorar'},alice);const cert=await f.post('course/'+d.course.id+'/certificate',{},alice);assert.equal(cert.score,100);assert.equal((await f.request('report')).body.nps[0].nps,-100);f.close()});
test('manager report cannot inspect another company via query',async()=>{const f=fixture(),d=await f.setup();await f.post('members',{companyId:d.ca.id,name:'Manager',jobTitle:'Diretor',email:manager.email,role:'manager'});await f.post('grants',{companyId:d.cb.id,courseId:d.course.id});const r=(await f.request('report?company='+d.cb.id,manager)).body;assert.ok(r.rows.length);assert.ok(r.rows.every((r:any)=>r.company==='A'));f.close()});
test('comments stay inside company and admin can reply',async()=>{const f=fixture(),d=await f.setup();await f.post('grants',{companyId:d.cb.id,courseId:d.course.id});const path='comments?course='+d.course.id+'&company='+d.ca.id;await f.post(path,{text:'Dúvida A'},alice);assert.equal((await f.request(path,bob)).body.length,0);await f.post(path,{text:'Resposta da administração'});const r=(await f.request(path,alice)).body;assert.equal(r.length,2);assert.ok(r.some((r:any)=>r.role==='admin'));f.close()});
test('individual resources restricted even inside same company',async()=>{const f=fixture(),d=await f.setup();await f.post('members',{companyId:d.ca.id,name:'Manager',jobTitle:'Diretor',email:manager.email,role:'manager'});await f.post('resources',{companyId:d.ca.id,memberId:d.ma.id,title:'Planilha Alice',href:'https://example.test/sheet'});assert.equal((await f.request('resources',alice)).body.length,1);assert.equal((await f.request('resources',manager)).body.length,0);assert.equal((await f.request('resources',bob)).body.length,0);assert.equal((await f.request('resources',admin,{companyId:d.ca.id,memberId:d.mb.id,title:'Bad',href:'https://example.test'})).status,400);assert.equal((await f.request('resources',admin,{companyId:d.ca.id,title:'Bad',href:'javascript:alert(1)'})).status,400);f.close()});
test('lesson tools are scoped to an authorized company, lesson and participant',async()=>{
 const f=fixture(),d=await f.setup();
 const item=await f.post('resources',{companyId:d.ca.id,lessonId:d.lesson.id,title:'Planilha da aula',href:'https://example.test/sheet'});
 const details=(await f.request('course/'+d.course.id,alice)).body;
 assert.equal(details.lessonResources.length,1);
 assert.equal(details.lessonResources[0].id,item.id);
 assert.equal((await f.request('course/'+d.course.id,bob)).status,403);
 assert.equal((await f.request('resources',bob)).body.length,0);
 assert.equal((await f.request('resources',admin,{companyId:d.cb.id,lessonId:d.lesson.id,title:'Sem permissão',href:'https://example.test'})).status,400);
 assert.equal((await f.request('resources',admin,{companyId:d.ca.id,memberId:d.mb.id,lessonId:d.lesson.id,title:'Pessoa de outra empresa',href:'https://example.test'})).status,400);
 assert.equal((await f.request('resources',admin,{companyId:d.ca.id,lessonId:'missing',title:'Aula inexistente',href:'https://example.test'})).status,400);
 const personal=await f.post('resources',{companyId:d.ca.id,memberId:d.ma.id,lessonId:d.lesson.id,title:'Privada',href:'https://example.test/private'});
 await f.post('members',{companyId:d.ca.id,name:'Manager',jobTitle:'Gestor',email:manager.email,role:'manager'});
 assert.equal((await f.request('course/'+d.course.id,manager)).body.lessonResources.length,1);
 assert.equal((await f.request('course/'+d.course.id,alice)).body.lessonResources.length,2);
 assert.ok((await f.request('resources',alice)).body.some((r:any)=>r.id===personal.id));
 await f.post('grants',{companyId:d.ca.id,courseId:d.course.id,revoke:true});
 assert.equal((await f.request('resources',alice)).body.length,0);
 assert.equal((await f.request('course/'+d.course.id,alice)).status,403);
 f.close();
});
test('suspension revokes login and existing course access',async()=>{const f=fixture(),d=await f.setup();await f.request('me',alice);await f.request('members/'+d.ma.id,admin,{active:false},'PATCH');assert.equal((await f.request('course/'+d.course.id,alice)).status,403);f.close()});
