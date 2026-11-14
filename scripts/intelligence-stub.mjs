// Serviço de mentira do Intelligence, só para testar a sala localmente (espelho, voz, latência). Sem dados reais, sem rede externa.
// Uso: node scripts/intelligence-stub.mjs   (porta 4173)
import http from 'node:http';
const json=(r,o,ms=0)=>setTimeout(()=>{r.setHeader('content-type','application/json');r.end(JSON.stringify(o))},ms);
http.createServer((q,r)=>{
 if(q.url.includes('lesson/ask'))return json(r,{speech:'Claro. Vamos ver isso passo a passo. Pode continuar quando quiser.',sources:[],route:'ANSWER'},600);
 json(r,{avatar:{label:'Avatar (IA)'},lesson:{run_status:'LIVE',title:'Aula de teste',sources:[]},interview:null,ok:true});
}).listen(4173,'127.0.0.1',()=>console.log('Serviço de mentira em http://127.0.0.1:4173'));
