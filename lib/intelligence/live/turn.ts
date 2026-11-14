// Máquina de estados da vez: quem tem a palavra. Funções puras, sem relógio nem navegador.
import type {InterruptReason,LiveEvent} from './events.ts';

export type TurnState=
 |{phase:'idle'}
 |{phase:'student',since:number,voiceEndedAt:number|null}
 |{phase:'thinking',since:number}
 |{phase:'avatar',since:number,voiceSince:number|null};

export type TurnEffect=
 |{do:'parar.fala'}
 |{do:'cancelar.resposta'}
 |{do:'registrar.corte',spoken:true}
 |{do:'iniciar.resposta'}
 |{do:'ouvir.retomar'};

export const TURN_CONFIG={
 /** Fala real do aluno por esse tempo, com o avatar falando, corta o avatar. */
 bargeInMs:200,
 /** Silêncio mínimo para considerar que o aluno terminou, conforme o fim do texto. */
 silenceAfterSentenceMs:350,
 silenceDefaultMs:600,
 silenceAfterOpenEndMs:900,
 /** Fala curta demais no início da vez do aluno é ruído. */
 minStudentSpeechMs:150,
} as const;

export const initialTurn:TurnState={phase:'idle'};

const OPEN_END=/(,|\b(e|mas|que|porque|então|ou|se|quando|como|de|da|do|para|com|a|o|um|uma))\s*$/i;
const CLOSED_END=/[.!?]\s*$/;

/** Silêncio necessário, em ms, para dar a vez ao avatar. Sinal do texto: frase completa encurta, frase aberta alonga. */
export function silenceNeededMs(text:string):number{
 const t=text.trim();
 if(!t)return TURN_CONFIG.silenceDefaultMs;
 if(CLOSED_END.test(t))return TURN_CONFIG.silenceAfterSentenceMs;
 if(OPEN_END.test(t))return TURN_CONFIG.silenceAfterOpenEndMs;
 return TURN_CONFIG.silenceDefaultMs;
}

/** O aluno terminou a vez? `silentMs` é há quanto tempo a voz parou, `text` o que foi reconhecido até agora. */
export function studentFinished(silentMs:number,text:string):boolean{return silentMs>=silenceNeededMs(text)}

export type Step={state:TurnState,effects:TurnEffect[],emit:LiveEvent[]};
const stay=(state:TurnState):Step=>({state,effects:[],emit:[]});

/** Uma transição. Não muda o estado de entrada. */
export function stepTurn(state:TurnState,e:LiveEvent):Step{
 switch(e.type){
  case 'voz.inicio':{
   if(state.phase==='avatar'){
    // O detector já exige a duração mínima. Aqui o corte acontece e o avatar silencia.
    return {state:{phase:'student',since:e.at,voiceEndedAt:null},
     effects:[{do:'parar.fala'},{do:'cancelar.resposta'},{do:'registrar.corte',spoken:true},{do:'ouvir.retomar'}],
     emit:[{type:'interrupcao.aluno',at:e.at}]};
   }
   if(state.phase==='thinking'){
    // Aluno voltou a falar antes da resposta sair: descarta a resposta e escuta de novo.
    return {state:{phase:'student',since:e.at,voiceEndedAt:null},effects:[{do:'cancelar.resposta'}],emit:[{type:'interrupcao.aluno',at:e.at}]};
   }
   if(state.phase==='student')return stay({...state,voiceEndedAt:null});
   return stay({phase:'student',since:e.at,voiceEndedAt:null});
  }
  case 'voz.fim':
   return state.phase==='student'?stay({...state,voiceEndedAt:e.at}):stay(state);
  case 'vez.fim':
   // Só vale se o aluno estava falando. Passa a vez ao avatar (pensando).
   if(state.phase!=='student')return stay(state);
   return {state:{phase:'thinking',since:e.at},effects:[{do:'iniciar.resposta'}],emit:[]};
  case 'fala.inicio':
   return state.phase==='thinking'||state.phase==='idle'?stay({phase:'avatar',since:e.at,voiceSince:null}):stay(state);
  case 'fala.fim':
  case 'resposta.fim':
   if(state.phase==='avatar'&&e.type==='fala.fim')return {state:{phase:'idle'},effects:[{do:'ouvir.retomar'}],emit:[]};
   return stay(state);
  case 'interrupcao.avatar':
   // Avatar toma a palavra (regra explícita, desligável por aula).
   if(state.phase!=='student')return stay(state);
   return {state:{phase:'thinking',since:e.at},effects:[{do:'iniciar.resposta'}],emit:[]};
  default:
   return stay(state);
 }
}

/** Aplica uma sequência de eventos. Útil em teste e para reproduzir uma conversa gravada. */
export function runTurn(events:LiveEvent[],from:TurnState=initialTurn){
 let state=from;const effects:TurnEffect[]=[],emitted:LiveEvent[]=[];
 for(const e of events){const s=stepTurn(state,e);state=s.state;effects.push(...s.effects);emitted.push(...s.emit)}
 return {state,effects,emitted};
}

export const INTERRUPT_REASONS:readonly InterruptReason[]=['fora_do_assunto','tempo_esgotado','erro_na_pratica'];
