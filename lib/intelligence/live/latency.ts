// Latência por etapa do ciclo. Funções puras: o relógio vem de fora (ms).
export type TurnMarks={heardAt:number,answerAt?:number,firstSoundAt?:number};
export type Stages={resposta:number|null,voz:number|null,total:number|null};
export const LATENCY_GOAL_MS=2000;

/** heardAt = texto final do aluno pronto, answerAt = resposta recebida, firstSoundAt = primeiro som do avatar. */
export function stages(m:TurnMarks):Stages{
 const d=(a:number|undefined,b:number|undefined)=>a!=null&&b!=null&&b>=a?Math.round(b-a):null;
 return {resposta:d(m.heardAt,m.answerAt),voz:d(m.answerAt,m.firstSoundAt),total:d(m.heardAt,m.firstSoundAt)};
}
export function median(xs:number[]):number|null{
 if(!xs.length)return null;
 const s=[...xs].sort((a,b)=>a-b),h=s.length>>1;
 return s.length%2?s[h]:Math.round((s[h-1]+s[h])/2);
}
export type Summary={count:number,medianTotal:number|null,medianResposta:number|null,medianVoz:number|null,worstTotal:number|null,withinGoal:boolean|null};
export function summarize(list:TurnMarks[]):Summary{
 const st=list.map(stages),pick=(k:keyof Stages)=>st.map(s=>s[k]).filter((v):v is number=>v!=null);
 const tot=pick('total'),mt=median(tot);
 return {count:tot.length,medianTotal:mt,medianResposta:median(pick('resposta')),medianVoz:median(pick('voz')),worstTotal:tot.length?Math.max(...tot):null,withinGoal:mt==null?null:mt<=LATENCY_GOAL_MS};
}
export const fmtMs=(v:number|null)=>v==null?'-':v>=1000?(v/1000).toFixed(1)+' s':v+' ms';
