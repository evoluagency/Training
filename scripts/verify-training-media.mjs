import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const repoRoot=join(dirname(fileURLToPath(import.meta.url)),'..');
const directory=join(repoRoot,'public','training-media');
const manifest=JSON.parse(await readFile(join(directory,'manifesto.json'),'utf8'));
let failures=0;
for(const asset of manifest.assets){
 try{
  const bytes=await readFile(join(directory,asset.filename));
  const sha=createHash('sha256').update(bytes).digest('hex');
  const isWebP=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  const valid=isWebP&&bytes.length===asset.size_bytes&&sha===asset.sha256;
  console.log((valid?'OK  ':'FAIL')+' '+asset.filename+' ('+bytes.length+' bytes)');
  if(!valid)failures++;
 }catch(e){console.error('MISSING '+asset.filename+' ('+e.code+')');failures++}
}
if(failures){console.error('Media verification failed: '+failures+'/'+manifest.assets.length);process.exitCode=1}
else console.log('Approved EVOLU Training media verified: '+manifest.assets.length+'/'+manifest.assets.length);
