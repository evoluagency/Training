"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {ArrowLeft, ArrowRight, Calculator, RotateCcw, Printer, Info, TrendingDown, Layers3} from "lucide-react";
import "./melhorregime.css";

type SellerRegime = "simples" | "presumido" | "real";
type BuyerRegime = "real" | "presumido" | "simples-hibrido" | "simples-puro" | "nao-contribuinte";
type Anexo = "III" | "V";
type Result = {
  key:string; title:string; invoice:number; das:number; cbsDebit:number; sellerInputCredit:number;
  cbsToPay:number; buyerCredit:number; buyerCost:number; sellerNet:number; chainBalance:number;
};
const money = (n:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
const percent = (n:number,digits=2) => new Intl.NumberFormat("pt-BR",{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n)+"%";
const caps = [180000,360000,720000,1800000,3600000,4800000];
const annexes:Record<Anexo,{nominal:number[];deduction:number[];cbsShare:number[]}> = {
  III:{nominal:[6,11.2,13.5,16,21,32.9],deduction:[0,9360,17640,35640,125640,648000],cbsShare:[15.43,16.91,16.42,16.42,15.43,19.29]},
  V:{nominal:[15.5,18,19.5,20.5,23,30.4],deduction:[0,4500,9900,17100,62100,540000],cbsShare:[16.96,16.96,17.95,18.94,16.96,19.78]},
};
function nonnegative(value:number, max=100000000){return Math.min(max,Math.max(0,Number.isFinite(value)?value:0));}
function taxBand(revenue:number, annex:Anexo){
  const safe=Math.max(1,Math.min(4800000,revenue));
  const index=Math.max(0,caps.findIndex(cap=>safe<=cap));
  const a=annexes[annex];
  const effective=Math.max(0,((safe*a.nominal[index]/100)-a.deduction[index])/safe);
  // Na 5ª faixa do Anexo III, o ISS é limitado a 5%, com redistribuição da parcela federal.
  const cbsEffective=annex==="III" && index===4 && effective>0.1492537
    ? Math.max(0,effective-0.05)*0.232
    : effective*a.cbsShare[index]/100;
  return {index,effective,cbsEffective};
}
const buyerNames:Record<BuyerRegime,string>={
  real:"Lucro Real",presumido:"Lucro Presumido","simples-hibrido":"Simples híbrido",
  "simples-puro":"Simples puro","nao-contribuinte":"Não contribuinte / consumidor final"
};
export default function MelhorRegime(){
  const [sellerName,setSellerName]=useState("Artigus Artefatos");
  const [buyerName,setBuyerName]=useState("Artigus Comércio");
  const [sellerRegime,setSellerRegime]=useState<SellerRegime>("simples");
  const [buyerRegime,setBuyerRegime]=useState<BuyerRegime>("real");
  const [anexo,setAnexo]=useState<Anexo>("III");
  const [service,setService]=useState(10000);
  const [rbt12,setRbt12]=useState(180000);
  const [cbsRate,setCbsRate]=useState(11.2);
  const [eligiblePurchases,setEligiblePurchases]=useState(0);
  const [buyerUtilization,setBuyerUtilization]=useState(100);
  const regularBuyer=buyerRegime==="real"||buyerRegime==="presumido"||buyerRegime==="simples-hibrido";
  const rate=Math.min(30,Math.max(0,cbsRate))/100;
  const price=nonnegative(service,100000000);
  const inputBase=nonnegative(eligiblePurchases,100000000);
  const band=useMemo(()=>taxBand(rbt12,anexo),[rbt12,anexo]);
  const effectiveBuyerUtilization=regularBuyer?buyerUtilization/100:0;
  const cbsDebit=price*rate;
  const inputCredit=Math.min(cbsDebit,inputBase*rate);
  const embedded=price*band.cbsEffective;
  const dasPure=price*band.effective;
  const results:Result[]=sellerRegime==="simples"?[
    {key:"puro",title:"Simples puro",invoice:price,das:dasPure,cbsDebit:0,sellerInputCredit:0,
      cbsToPay:0,buyerCredit:embedded*effectiveBuyerUtilization,buyerCost:price-embedded*effectiveBuyerUtilization,
      sellerNet:price-dasPure,chainBalance:dasPure-embedded*effectiveBuyerUtilization},
    {key:"hibrido",title:"Simples híbrido",invoice:price+cbsDebit,das:dasPure-embedded,cbsDebit,
      sellerInputCredit:inputCredit,cbsToPay:cbsDebit-inputCredit,
      buyerCredit:cbsDebit*effectiveBuyerUtilization,
      buyerCost:price+cbsDebit-cbsDebit*effectiveBuyerUtilization,
      sellerNet:price+cbsDebit-(dasPure-embedded)-(cbsDebit-inputCredit),
      chainBalance:(dasPure-embedded)+(cbsDebit-inputCredit)-cbsDebit*effectiveBuyerUtilization}
  ]:[
    {key:"regular",title:sellerRegime==="real"?"Lucro Real":"Lucro Presumido",invoice:price+cbsDebit,das:0,
      cbsDebit,sellerInputCredit:inputCredit,cbsToPay:cbsDebit-inputCredit,
      buyerCredit:cbsDebit*effectiveBuyerUtilization,
      buyerCost:price+cbsDebit-cbsDebit*effectiveBuyerUtilization,
      sellerNet:price+cbsDebit-(cbsDebit-inputCredit),chainBalance:cbsDebit-inputCredit-cbsDebit*effectiveBuyerUtilization}
  ];
  const reset=()=>{setSellerName("Artigus Artefatos");setBuyerName("Artigus Comércio");setSellerRegime("simples");setBuyerRegime("real");setAnexo("III");setService(10000);setRbt12(180000);setCbsRate(11.2);setEligiblePurchases(0);setBuyerUtilization(100);};
  const difference=results.length===2?results[1].buyerCost-results[0].buyerCost:0;
  const chainDifference=results.length===2?results[1].chainBalance-results[0].chainBalance:0;
  const numeric=(value:number,setter:(value:number)=>void,min:number,max:number,step:number)=>(
    <input type="number" inputMode="decimal" min={min} max={max} step={step} value={value}
      onChange={e=>setter(nonnegative(Number(e.target.value),max))}/>
  );
  return <div className="evsim">
    <header className="evsim-header">
      <Link className="evsim-brand" href="/"><img src="/brand/evolu-white.png" width="137" height="29" alt="EVOLU"/><span>Training</span></Link>
      <Link className="evsim-home" href="/"><ArrowLeft size={16}/> Voltar ao Training</Link>
    </header>
    <main className="evsim-main">
      <div className="evsim-intro"><div><span className="evsim-kicker">FERRAMENTAS DE DECISÃO / REFORMA TRIBUTÁRIA</span><h1>Simulador de <em>regime tributário.</em></h1>
        <p>Compare a incidência da CBS em 2027, os créditos de quem compra e o resultado econômico de quem presta o serviço.</p></div>
        <span className="evsim-year">2027 <small>SIMULAÇÃO CBS</small></span>
      </div>
      <div className="evsim-card">
        <div className="evsim-cardtop"><div className="evsim-cardtitle"><Calculator size={19}/><div><h2>Simulador de operações B2B</h2><p>Artigus Artefatos → Artigus Comércio · Cenário editável</p></div></div><span className="evsim-pill">Cenário ilustrativo</span></div>
        <div className="evsim-parties">
          <div className="evsim-party"><span className="evsim-section-index">01 / QUEM VENDE</span>
            <label htmlFor="sellerName">Prestador ou fornecedor</label><input id="sellerName" type="text" maxLength={80} value={sellerName} onChange={e=>setSellerName(e.target.value)}/>
            <label htmlFor="sellerRegime">Regime tributário</label><select id="sellerRegime" value={sellerRegime} onChange={e=>setSellerRegime(e.target.value as SellerRegime)}>
              <option value="simples">Simples Nacional — comparar puro × híbrido</option><option value="presumido">Lucro Presumido</option><option value="real">Lucro Real</option>
            </select>
          </div>
          <div className="evsim-party"><span className="evsim-section-index">02 / QUEM COMPRA</span>
            <label htmlFor="buyerName">Contratante ou adquirente</label><input id="buyerName" type="text" maxLength={80} value={buyerName} onChange={e=>setBuyerName(e.target.value)}/>
            <label htmlFor="buyerRegime">Regime tributário</label><select id="buyerRegime" value={buyerRegime} onChange={e=>setBuyerRegime(e.target.value as BuyerRegime)}>
              {Object.entries(buyerNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="evsim-divider"/>
        <div className="evsim-inputs">
          <section><div className="evsim-fieldhead"><label htmlFor="serviceRange">Valor do serviço, antes da CBS</label><strong>{money(price)}</strong></div>
            <input id="serviceRange" className="evsim-range" type="range" min="1000" max="200000" step="1000" value={Math.min(200000,Math.max(1000,service))} onChange={e=>setService(Number(e.target.value))} />
            <div className="evsim-inputrow"><span>Valor exato (R$)</span>{numeric(service,setService,0,100000000,100)}</div>
          </section>
          <section><div className="evsim-fieldhead"><label htmlFor="cbsRange">CBS do regime regular — hipótese ajustável</label><strong>{percent(cbsRate,1)}</strong></div>
            <input id="cbsRange" className="evsim-range" type="range" min="0" max="20" step="0.1" value={cbsRate} onChange={e=>setCbsRate(Number(e.target.value))}/>
            <div className="evsim-inputrow"><span>Alíquota CBS (%)</span>{numeric(cbsRate,setCbsRate,0,30,0.1)}</div>
          </section>
          {sellerRegime==="simples"&&<section className="evsim-wide">
            <div className="evsim-fieldhead"><span className="evsim-fieldlabel">Anexo do Simples — publicidade / Fator R</span><span className="evsim-meta">{(band.index+1)}ª faixa · DAS {percent(band.effective*100)}</span></div>
            <div className="evsim-radios">
              <label className={anexo==="III"?"selected":""}><input type="radio" name="anexo" checked={anexo==="III"} onChange={()=>setAnexo("III")}/>Anexo III — Fator R ≥ 28%</label>
              <label className={anexo==="V"?"selected":""}><input type="radio" name="anexo" checked={anexo==="V"} onChange={()=>setAnexo("V")}/>Anexo V — Fator R &lt; 28%</label>
            </div>
            <div className="evsim-inputrow"><span>Receita bruta acumulada em 12 meses — RBT12 (R$)</span>{numeric(rbt12,setRbt12,1,4800000,1000)}</div>
            <p className="evsim-hint">A faixa é calculada com o RBT12 informado. Verifique se a atividade e o Fator R efetivo correspondem ao Anexo selecionado.</p>
          </section>}
          <section><div className="evsim-fieldhead"><label htmlFor="inputs">Aquisições da vendedora com crédito de CBS (R$)</label><strong>{money(inputBase)}</strong></div>
            <input id="inputs" type="number" inputMode="decimal" min="0" max="100000000" step="100" value={eligiblePurchases} onChange={e=>setEligiblePurchases(nonnegative(Number(e.target.value)))}/>
            <p className="evsim-hint">Aplica-se apenas a vendedor no regime regular da CBS. Crédito limitado ao débito calculado nesta operação.</p>
          </section>
          <section><div className="evsim-fieldhead"><label htmlFor="creditRange">Aproveitamento do crédito pelo comprador</label><strong>{regularBuyer?percent(buyerUtilization,0):"0%"}</strong></div>
            <input id="creditRange" className="evsim-range" type="range" min="0" max="100" step="5" value={regularBuyer?buyerUtilization:0} disabled={!regularBuyer} onChange={e=>setBuyerUtilization(Number(e.target.value))}/>
            <p className="evsim-hint">{regularBuyer?"Percentual do crédito calculado efetivamente aproveitável na operação.":"O regime selecionado não apropria crédito de CBS nesta simulação."}</p>
          </section>
        </div>
        <div className="evsim-resulthead"><div><span className="evsim-section-index">03 / RESULTADOS</span><h3>Comparativo tributário</h3></div><div className="evsim-actions"><button onClick={reset} type="button"><RotateCcw size={14}/> Reiniciar</button><button onClick={()=>window.print()} type="button"><Printer size={14}/> Imprimir</button></div></div>
        <div className="evsim-table-wrap"><table className="evsim-table"><thead><tr><th>Indicador</th>{results.map(r=><th key={r.key}>{r.title}</th>)}</tr></thead><tbody>
          <tr><td>Valor da nota, com CBS por fora quando aplicável</td>{results.map(r=><td key={r.key}>{money(r.invoice)}</td>)}</tr>
          <tr><td>DAS da vendedora {sellerRegime==="simples"?"":"(não aplicável)"}</td>{results.map(r=><td key={r.key}>{sellerRegime==="simples"?money(r.das):"—"}</td>)}</tr>
          <tr><td>CBS destacada fora do DAS</td>{results.map(r=><td key={r.key}>{money(r.cbsDebit)}</td>)}</tr>
          <tr><td>Crédito CBS das aquisições da vendedora (aproveitado)</td>{results.map(r=><td key={r.key}>{money(r.sellerInputCredit)}</td>)}</tr>
          <tr><td>CBS líquida a recolher pela vendedora</td>{results.map(r=><td key={r.key}>{money(r.cbsToPay)}</td>)}</tr>
          <tr><td>Crédito CBS aproveitado pelo comprador</td>{results.map(r=><td key={r.key}>{money(r.buyerCredit)}</td>)}</tr>
          <tr className="evsim-table-emphasis"><td>Custo líquido da compra, após crédito CBS</td>{results.map(r=><td key={r.key}>{money(r.buyerCost)}</td>)}</tr>
          <tr className="evsim-table-emphasis"><td>Saldo tributário parcial da operação*</td>{results.map(r=><td key={r.key}>{money(r.chainBalance)}</td>)}</tr>
        </tbody></table></div>
        <div className="evsim-summary">{results.map(r=><article key={r.key}><span>{r.title} · custo líquido de {buyerName||"quem compra"}</span><strong>{money(r.buyerCost)}</strong><small>Receita de {sellerName||"quem vende"} após os tributos simulados: {money(r.sellerNet)}</small></article>)}</div>
        {results.length===2&&<div className="evsim-conclusion"><TrendingDown size={18}/><div><strong>Leitura comparativa</strong>
          <p>{Math.abs(difference)<0.005?"O custo líquido de compra é igual nos dois cenários.":difference>0?"Com as premissas adotadas, o Simples puro reduz o custo líquido da compradora em "+money(difference)+" frente ao híbrido.":"Com as premissas adotadas, o Simples híbrido reduz o custo líquido da compradora em "+money(-difference)+" frente ao puro."}
          {" "}{Math.abs(chainDifference)<0.005?"O saldo tributário parcial da operação é equivalente.":chainDifference<0?"O híbrido reduz o saldo tributário parcial em "+money(-chainDifference)+", considerando o crédito aproveitado pela vendedora.":"O puro reduz o saldo tributário parcial em "+money(chainDifference)+"."}</p></div></div>}
        {sellerRegime!=="simples"&&<div className="evsim-conclusion"><Layers3 size={18}/><div><strong>Regime regular de CBS</strong><p>No recorte da CBS, Lucro Real e Lucro Presumido seguem o regime regular. A escolha entre eles exige calcular também IRPJ, CSLL, ISS, folha e demais fatores, que não estão neste simulador.</p></div></div>}
        <div className="evsim-footnote"><Info size={17}/><div><p><strong>Escopo e limites.</strong> Simulação didática de serviços em 2027, com valor-base mantido entre cenários. No híbrido ou regimes regulares, a CBS é adicionada por fora ao preço-base. O saldo tributário parcial (*) corresponde a DAS + CBS líquida da vendedora − crédito de CBS da compradora; não representa a carga de toda a cadeia. Foram excluídos IBS (apesar da alíquota de transição de 0,1% em 2027), ISS fora do DAS, IRPJ/CSLL no Lucro Real ou Presumido, tributos de etapas anteriores, regras especiais de base de cálculo, efeitos de formação de preço e limites individuais de créditos. A CBS de 11,2% é hipótese editável, não alíquota definitiva.</p><p>Na 6ª faixa do Simples, o ISS pode ser devido fora do DAS; este valor não é calculado. O creditamento pressupõe operação documentada e legalmente elegível. Se o RBT12 for incompatível com o Simples, ou houver impedimento societário, a projeção não deve ser usada para decisão.</p></div></div>
      </div>
      <div className="evsim-bottom"><div><span>BASE LEGAL</span><p>LC 214/2025, arts. 41 e 47; LC 123/2006, Anexos III e V (2027–2028).</p><div className="evsim-sources"><a href="https://www2.camara.leg.br/legin/fed/leicom/2025/leicomplementar-214-16-janeiro-2025-796905-normaatualizada-pl.html" target="_blank" rel="noopener noreferrer">Legislação consolidada <ArrowRight size={13}/></a><a href="https://legis.senado.gov.br/norma/40180341/publicacao/40181117" target="_blank" rel="noopener noreferrer">Anexo III <ArrowRight size={13}/></a><a href="https://legis.senado.leg.br/norma/40180341/publicacao/40181129" target="_blank" rel="noopener noreferrer">Anexo V <ArrowRight size={13}/></a></div></div><span className="evsim-footer-label">EVOLU TRAINING · FERRAMENTAS</span></div>
    </main>
    <footer className="evsim-footer"><Link href="/"><img src="/brand/evolu-white.png" width="105" height="23" alt="EVOLU"/> <span>TRAINING</span></Link><p>Estratégia, dados e decisões estruturadas.</p></footer>
  </div>;
}
