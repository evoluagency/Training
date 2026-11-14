// Eventos e interfaces do ciclo ao vivo (ouvir, vez, responder, falar, animar).
// Cada caixa é um motor atrás de uma interface fixa. Os eventos são objetos pequenos com carimbo de tempo (ms),
// o que permite medir a latência de cada etapa e reproduzir uma conversa gravada em teste.
export type LiveEvent=
 |{type:'voz.inicio',at:number}
 |{type:'voz.fim',at:number}
 |{type:'ouvir.parcial',at:number,text:string}
 |{type:'ouvir.final',at:number,text:string}
 |{type:'vez.fim',at:number}
 |{type:'interrupcao.aluno',at:number}
 |{type:'interrupcao.avatar',at:number,motivo:InterruptReason}
 |{type:'resposta.inicio',at:number}
 |{type:'resposta.trecho',at:number,text:string}
 |{type:'resposta.fim',at:number}
 |{type:'fala.inicio',at:number}
 |{type:'fala.fim',at:number};
export type LiveEventType=LiveEvent['type'];
export type InterruptReason='fora_do_assunto'|'tempo_esgotado'|'erro_na_pratica';

export type Phoneme={ph:string,startMs:number,endMs:number};
export type SpeechChunk={audio:Float32Array,sampleRate:number,phonemes:Phoneme[]};

// Interfaces dos motores. Trocar o motor não muda as outras caixas.
export interface Listener{start():Promise<void>;stop():void;onEvent(cb:(e:LiveEvent)=>void):void}
export interface Responder{respond(input:{text:string,signal:AbortSignal}):AsyncIterable<string>}
export interface Speaker{speak(text:string,signal:AbortSignal):AsyncIterable<SpeechChunk>}
export interface Animator{frame(input:{phoneme:string|null,speaking:boolean,listening:boolean,thinking:boolean}):void}
