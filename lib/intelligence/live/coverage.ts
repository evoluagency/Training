// Modo selfie: etiqueta da tomada e mapa de cobertura (CAPTACAO_DOIS_MODOS.md, seção 2). Funções puras.
// O rosto nunca reprova a tomada. Só a voz ruim pede regravação.
export const YAW=['esq_forte','esq_leve','frente','dir_leve','dir_forte'] as const;
export const PITCH=['baixo','reto','cima'] as const;
export const GAZE=['camera','acompanha'] as const;
export const EXPR=['neutra','sorrindo','seria','duvida','enfase'] as const;
export type Yaw=typeof YAW[number];export type Pitch=typeof PITCH[number];export type Gaze=typeof GAZE[number];export type Expr=typeof EXPR[number];

export type Cell={yaw:Yaw,pitch:Pitch,gaze:Gaze,expr:Expr};
/** Etiqueta do que aconteceu de fato na tomada. */
export type TakeLabel=Cell&{take:string,voiceOk:boolean,yawDeg:number,pitchDeg:number};
export type Measure={yawDeg:number,pitchDeg:number,/** direção dos olhos relativa à câmera, em graus (positivo = direita) */gazeYawDeg:number,expr?:Expr};

export const LIMITS={yawLeve:8,yawForte:22,pitchMin:8,gazeFollowDeg:8,/** giro máximo pedido no início */startMaxDeg:30} as const;

export function yawCell(deg:number):Yaw{
 const a=Math.abs(deg);
 if(a<LIMITS.yawLeve)return 'frente';
 if(deg<0)return a>=LIMITS.yawForte?'esq_forte':'esq_leve';
 return a>=LIMITS.yawForte?'dir_forte':'dir_leve';
}
export function pitchCell(deg:number):Pitch{return deg<=-LIMITS.pitchMin?'baixo':deg>=LIMITS.pitchMin?'cima':'reto'}

/** Olhar acompanhando o rosto: os olhos viraram quase o mesmo tanto que a cabeça. Olho na câmera: o olhar ficou perto de zero apesar do giro. */
export function gazeCell(yawDeg:number,gazeYawDeg:number):Gaze{
 if(Math.abs(yawDeg)<LIMITS.yawLeve)return Math.abs(gazeYawDeg)>=LIMITS.gazeFollowDeg?'acompanha':'camera';
 return Math.abs(gazeYawDeg)>=Math.abs(yawDeg)*0.6?'acompanha':'camera';
}

/** Etiqueta da tomada a partir das medidas médias dela. */
export function labelTake(take:string,m:Measure,voiceOk:boolean):TakeLabel{
 return {take,voiceOk,yawDeg:Math.round(m.yawDeg),pitchDeg:Math.round(m.pitchDeg),yaw:yawCell(m.yawDeg),pitch:pitchCell(m.pitchDeg),gaze:gazeCell(m.yawDeg,m.gazeYawDeg),expr:m.expr??'neutra'};
}

export const cellKey=(c:Cell)=>`${c.yaw}|${c.pitch}|${c.gaze}|${c.expr}`;
export type Coverage=Record<string,number>;
export const emptyCoverage:Coverage={};

/** Preenche a casa que realmente aconteceu. Tomada com voz ruim não conta. */
export function addTake(cov:Coverage,l:TakeLabel):Coverage{
 if(!l.voiceOk)return cov;
 const k=cellKey(l);return {...cov,[k]:(cov[k]??0)+1};
}
export function buildCoverage(labels:TakeLabel[]):Coverage{return labels.reduce(addTake,emptyCoverage)}

const count=(cov:Coverage,f:(c:Cell)=>boolean)=>Object.entries(cov).reduce((n,[k,v])=>{const [yaw,pitch,gaze,expr]=k.split('|') as [Yaw,Pitch,Gaze,Expr];return f({yaw,pitch,gaze,expr})?n+v:n},0);

export type Request=Cell&{texto:string};
const YAW_TXT:Record<Yaw,string>={esq_forte:'vire bem para a esquerda',esq_leve:'vire um pouco para a esquerda',frente:'fique de frente',dir_leve:'vire um pouco para a direita',dir_forte:'vire bem para a direita'};
const PITCH_TXT:Record<Pitch,string>={baixo:'olhe um pouco para baixo',reto:'mantenha a cabeça reta',cima:'olhe um pouco para cima'};
const GAZE_TXT:Record<Gaze,string>={camera:'com os olhos na câmera',acompanha:'olhando na direção do rosto'};

export function describe(c:Cell):string{return `${YAW_TXT[c.yaw]}, ${PITCH_TXT[c.pitch]}, ${GAZE_TXT[c.gaze]}`}

/**
 * Instrução da próxima frase: a casa mais vazia, com estas regras:
 * - cerca de metade das tomadas de frente (protege a voz);
 * - giros fortes só se liberados (`allowStrong`), que o chamador decide pela comparação com a voz do bloco A.
 */
export function nextRequest(cov:Coverage,opts:{allowStrong:boolean,expr?:Expr}={allowStrong:false}):Request{
 const total=count(cov,()=>true),front=count(cov,c=>c.yaw==='frente');
 const needFront=total===0||front<total/2;
 const yaws=YAW.filter(y=>needFront?y==='frente':y!=='frente').filter(y=>opts.allowStrong||(y!=='esq_forte'&&y!=='dir_forte'));
 let best:Cell|null=null,bestN=Infinity;
 for(const yaw of yaws)for(const pitch of PITCH)for(const gaze of GAZE){
  // Rosto de frente com olhar "acompanha" é a mesma coisa que "câmera": não pedir.
  if(yaw==='frente'&&gaze==='acompanha')continue;
  const cell:Cell={yaw,pitch,gaze,expr:opts.expr??'neutra'};
  const n=count(cov,c=>c.yaw===yaw&&c.pitch===pitch&&c.gaze===gaze);
  if(n<bestN){bestN=n;best=cell}
 }
 const cell=best??{yaw:'frente',pitch:'reto',gaze:'camera',expr:opts.expr??'neutra'};
 return {...cell,texto:describe(cell)};
}

/** Quanto do mapa (giro x inclinação x olhar, sem a expressão) já tem pelo menos uma tomada, de 0 a 1. */
export function coverageRatio(cov:Coverage,allowStrong:boolean):number{
 let have=0,all=0;
 for(const yaw of YAW){if(!allowStrong&&(yaw==='esq_forte'||yaw==='dir_forte'))continue;
  for(const pitch of PITCH)for(const gaze of GAZE){if(yaw==='frente'&&gaze==='acompanha')continue;all++;if(count(cov,c=>c.yaw===yaw&&c.pitch===pitch&&c.gaze===gaze)>0)have++}}
 return all?have/all:0;
}

/** Tomada em formato de marcação para a trilha `marks` (sem exigir servidor novo). Colunas inteiras, como pede a trilha-0.1. */
export const MARK_COLUMNS=['t','take','yaw','pitch','gaze','expr','voiceOk','yawDeg','pitchDeg'] as const;
export function labelToMarkRow(tMs:number,takeIndex:number,l:TakeLabel):number[]{
 return [Math.round(tMs),takeIndex,YAW.indexOf(l.yaw),PITCH.indexOf(l.pitch),GAZE.indexOf(l.gaze),EXPR.indexOf(l.expr),l.voiceOk?1:0,l.yawDeg,l.pitchDeg];
}
export function markRowToLabel(row:number[],take:string):TakeLabel{
 const [,,y,p,g,x,v,yd,pd]=row;
 return {take,yaw:YAW[y],pitch:PITCH[p],gaze:GAZE[g],expr:EXPR[x],voiceOk:v===1,yawDeg:yd,pitchDeg:pd};
}
