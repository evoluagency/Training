// API fictícia do modo de voz, só para a prévia local: guarda tudo na memória da página e relê o cabeçalho WAV
// com o mesmo leitor do servidor. Nada sai do navegador.
import {readWavHeader} from '../../../lib/training/wav';
import type {VoiceApi,VoiceConsent,VoiceProgress} from '../voice-capture';
import {voiceScript} from '../../../lib/intelligence/voice-script';

export function fakeVoiceApi():VoiceApi&{uploads:{line?:string;moment:string;durationMs:number;sampleRate:number;size:number}[]}{
  let consent:VoiceConsent|null=null;const uploads:{line?:string;moment:string;durationMs:number;sampleRate:number;size:number}[]=[];
  return {uploads,
    async consent(){return consent},
    async accept(policyVersion){consent={id:'previa-'+Date.now(),policyVersion,voice:true,acceptedAt:Date.now()};return consent},
    async revoke(){consent=null},
    async progress(script):Promise<VoiceProgress>{const s=voiceScript(script);const lines=new Map<string,{takes:number;durationMs:number}>();let roomTones=0;
      for(const u of uploads){if(u.moment==='room_tone'){roomTones++;continue}const c=lines.get(u.line!);lines.set(u.line!,{takes:(c?.takes||0)+1,durationMs:u.durationMs})}
      const list=[...lines].map(([id,v])=>({id,...v}));return {script,total:s?.frases.length??0,recorded:list.length,speechMs:list.reduce((a,l)=>a+l.durationMs,0),roomTones,lines:list}},
    async upload(u){const bytes=new Uint8Array(await u.wav.arrayBuffer());const h=readWavHeader(bytes);if(!h)throw new Error('Áudio inválido. Use WAV PCM 16 bits mono.');
      if(h.durationMs<300||h.durationMs>40000)throw new Error('Duração fora de 0,3 a 40 s.');
      uploads.push({line:u.line,moment:u.moment,durationMs:h.durationMs,sampleRate:h.sampleRate,size:bytes.byteLength});return {id:'item-'+uploads.length,durationMs:h.durationMs,sampleRate:h.sampleRate,size:bytes.byteLength}},
  };
}
