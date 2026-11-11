// Movimento do avatar 3D: funções puras (sem navegador, testáveis).
// Boca: abertura pelo volume do áudio (quando há áudio real) ou por ritmo de sílabas (voz do navegador),
// e formato aproximado pela vogal da palavra em curso (visema).
export type AvatarMood='idle'|'listening'|'thinking'|'speaking'|'routing';

/** Formato da boca: largura relativa, abertura máxima e arredondamento. */
export type Viseme={width:number;open:number;round:number;closed:boolean};
export const NEUTRAL_VISEME:Viseme={width:1,open:.8,round:0,closed:false};

const VOWEL_SHAPES:Record<string,Omit<Viseme,'closed'>>={
  a:{width:1.05,open:1,round:0},
  e:{width:1.15,open:.65,round:0},
  i:{width:1.25,open:.4,round:0},
  o:{width:.78,open:.8,round:.7},
  u:{width:.62,open:.45,round:1},
};

/** Visema aproximado pela primeira vogal da palavra (português). Lábios fechados no início com m, b ou p. */
export function visemeFor(word:string|undefined):Viseme{
  const w=String(word??'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const vowel=w.match(/[aeiou]/)?.[0];
  const shape=vowel?VOWEL_SHAPES[vowel]:null;
  return {...(shape??NEUTRAL_VISEME),closed:/^[mbp]/.test(w)};
}

/** Volume (0 a 1) a partir das amostras de forma de onda de um AnalyserNode (bytes centrados em 128). */
export function levelFromSamples(samples:ArrayLike<number>):number{
  if(!samples.length)return 0;
  let sum=0;
  for(let i=0;i<samples.length;i++){const v=(samples[i]-128)/128;sum+=v*v}
  const rms=Math.sqrt(sum/samples.length);
  return Math.max(0,Math.min(1,(rms-.015)*7));
}

/** Expressão-alvo por estado. Sobrancelhas em unidades do rosto, olhar em radianos, cor do indicador. */
export type MoodTarget={browLift:number;browTilt:number;gazeX:number;gazeY:number;headTilt:number;headNod:number;lidOpen:number;led:string;ledPulse:number};
export function moodTarget(mood:AvatarMood):MoodTarget{
  switch(mood){
    case 'listening':return {browLift:.03,browTilt:.05,gazeX:0,gazeY:0,headTilt:.06,headNod:.04,lidOpen:1,led:'#d8fc63',ledPulse:0};
    case 'thinking':return {browLift:.045,browTilt:-.12,gazeX:.28,gazeY:.22,headTilt:-.08,headNod:-.05,lidOpen:.85,led:'#d8fc63',ledPulse:1.6};
    case 'speaking':return {browLift:.015,browTilt:0,gazeX:0,gazeY:0,headTilt:0,headNod:0,lidOpen:1,led:'#d8fc63',ledPulse:0};
    case 'routing':return {browLift:.025,browTilt:.16,gazeX:0,gazeY:-.04,headTilt:.05,headNod:.06,lidOpen:.92,led:'#ffb547',ledPulse:.8};
    default:return {browLift:0,browTilt:0,gazeX:0,gazeY:0,headTilt:0,headNod:0,lidOpen:.95,led:'#7f9c45',ledPulse:.35};
  }
}

/** Estado do avatar a partir da sala. "Encaminhando" quando a resposta foi encaminhada a uma pessoa. */
export function avatarMood(s:{thinking:boolean;speaking:boolean;listening:boolean;routed:boolean}):AvatarMood{
  if(s.thinking)return 'thinking';
  if(s.speaking)return s.routed?'routing':'speaking';
  if(s.listening)return 'listening';
  return 'idle';
}

/** Aproximação suave exponencial independente da taxa de quadros. */
export function approach(current:number,target:number,rate:number,dt:number):number{
  return target+(current-target)*Math.exp(-rate*dt);
}
