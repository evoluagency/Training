// Roteiro da sessão A da captação (roteiro-expressoes-0.1). O texto é dado versionado: mudar um passo exige versão nova.
import roteiro01 from './roteiro-expressoes-0.1.json' with {type:'json'};

export type ExpressionStep={id:string;bloco:string;instrucao:string;duracaoS:number;repeticoes?:number;sincronia?:boolean;fala?:boolean};
export type ExpressionScript={versao:string;etapa:'face'|'body'|'lesson';duracaoAlvoMin:number;blocos:Record<string,string>;passos:ExpressionStep[]};

const scripts:Record<string,ExpressionScript>={[roteiro01.versao]:roteiro01 as ExpressionScript};
export const CURRENT_EXPRESSION_SCRIPT=roteiro01.versao;
export function expressionScript(version:string):ExpressionScript|null{return Object.hasOwn(scripts,version)?scripts[version]:null}
// Tempo de um passo com as repetições e 1 s de descanso entre elas.
export function stepMs(s:ExpressionStep):number{const r=s.repeticoes||1;return (s.duracaoS*r+(r-1))*1000}
export function scriptMs(s:ExpressionScript):number{return s.passos.reduce((a,p)=>a+stepMs(p),0)}
