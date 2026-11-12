// Roteiro de gravação da voz do proprietário (roteiro-voz-0.1). O texto é dado versionado, copiado sem
// alteração de intelligence docs/digital-instructor/voice/roteiro-voz-0.1.json. Mudar uma frase exige versão nova.
import roteiro01 from './roteiro-voz-0.1.json' with {type:'json'};

export type VoiceLine={id:string;bloco:string;frase:string;leitura?:string};
export type VoiceScript={versao:string;blocos:Record<string,string>;frases:VoiceLine[]};

const scripts:Record<string,VoiceScript>={[roteiro01.versao]:roteiro01 as VoiceScript};
const ids=new Map(Object.values(scripts).map(s=>[s.versao,new Set(s.frases.map(f=>f.id))]));

export const CURRENT_VOICE_SCRIPT=roteiro01.versao;
export function voiceScript(version:string):VoiceScript|null{return Object.hasOwn(scripts,version)?scripts[version]:null}
export function voiceLineExists(version:string,lineId:string):boolean{return ids.get(version)?.has(lineId)??false}
