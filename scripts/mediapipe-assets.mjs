// Copia o WASM do @mediapipe/tasks-vision para public/intelligence/mediapipe/wasm e confere o SHA-256 de tudo que é servido.
// Falha se o pacote ou o modelo não forem os registrados em lib/intelligence/mediapipe-assets.ts.
import {createHash} from 'node:crypto';
import {copyFileSync,mkdirSync,readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const manifest=readFileSync(root+'lib/intelligence/mediapipe-assets.ts','utf8');
const sha=(p)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const expect=(name)=>{const m=manifest.match(new RegExp("'"+name.replace('.','\\.')+"':'([0-9a-f]{64})'"));if(!m)throw new Error('SHA-256 de '+name+' ausente no manifesto.');return m[1]};
const version=manifest.match(/version:'([^']+)'/)[1];
const pkg=JSON.parse(readFileSync(root+'node_modules/@mediapipe/tasks-vision/package.json','utf8'));
if(pkg.version!==version)throw new Error('@mediapipe/tasks-vision '+pkg.version+' instalado, esperado '+version+'.');
const out=root+'public/intelligence/mediapipe/wasm/';mkdirSync(out,{recursive:true});
for(const f of ['vision_wasm_internal.js','vision_wasm_internal.wasm']){
 const src=root+'node_modules/@mediapipe/tasks-vision/wasm/'+f;
 if(sha(src)!==expect(f))throw new Error('SHA-256 de '+f+' diferente do registrado.');
 if(!existsSync(out+f)||sha(out+f)!==expect(f))copyFileSync(src,out+f);
}
const model=root+'public/intelligence/mediapipe/face_landmarker.task';
const modelSha=manifest.match(/sha256:'([0-9a-f]{64})'/)[1];
if(sha(model)!==modelSha)throw new Error('SHA-256 do face_landmarker.task diferente do registrado.');
console.log('mediapipe: WASM '+version+' e modelo conferidos.');
