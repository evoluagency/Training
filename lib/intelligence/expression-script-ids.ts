// Ids dos passos do roteiro de expressões, usados pelo servidor (training-api) para conferir sessão e marcas sem carregar o texto.
// Gerado de roteiro-expressoes-0.1.json. O teste 'expressões: ids do servidor iguais ao roteiro' falha se os dois divergirem.
export const EXPRESSION_SCRIPT_IDS:Record<string,readonly string[]>={
  'roteiro-expressoes-0.1':["P01", "P02", "N01", "N02", "G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08", "O01", "O02", "O03", "O04", "O05", "O06", "O07", "O08", "X01", "X02", "X03", "X04", "X05", "X06", "X07", "X08", "X09", "X10", "X11", "X12", "X13", "X14", "X15", "X16", "S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "L01", "F01", "F02"],
};
export const EXPRESSION_SCRIPT_STAGE:Record<string,'face'|'body'|'lesson'>={'roteiro-expressoes-0.1':'face'};
export function expressionScriptKnown(version:string):boolean{return Object.hasOwn(EXPRESSION_SCRIPT_IDS,version)}
export function expressionScriptStage(version:string):'face'|'body'|'lesson'|null{return Object.hasOwn(EXPRESSION_SCRIPT_STAGE,version)?EXPRESSION_SCRIPT_STAGE[version]:null}
