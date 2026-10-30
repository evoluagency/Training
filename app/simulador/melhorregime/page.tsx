"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {ArrowLeft, ArrowRight, Calculator, RotateCcw, Printer, Info, TrendingDown, Layers3} from "lucide-react";
import "./melhorregime.css";

type SellerRegime = "simples" | "presumido" | "real";
type BuyerRegime = "real" | "presumido" | "simples-hibrido" | "simples-puro" | "nao-contribuinte";
type Anexo = "III" | "V";
type Result = {
  key:string; title:string; base:number; invoice:number; das:number; cbsDebit:number; sellerInputCredit:number;
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
  const [sellerRegime,setSellerRegime]=useState<SellerRegime>("simples");
  const [buyerRegime,setBuyerRegime]=useState<BuyerRegime>("real");
  const [anexo,setAnexo]=useState<Anexo>("III");
  const [service,setService]=useState(10000);
  const [rbt12,setRbt12]=useState(180000);
  const [cbsRate,setCbsRate]=useState(11.2);
  const [eligiblePurchases,setEligiblePurchases]=useState(0);
  const [operatingCost,setOperatingCost]=useState(5000);
  const [hybridDiscount,setHybridDiscount]=useState(0);
  const [buyerUtilization,setBuyerUtilization]=useState(100);
  const regularBuyer=buyerRegime==="real"||buyerRegime==="presumido"||buyerRegime==="simples-hibrido";
  const rate=Math.min(30,Math.max(0,cbsRate))/100;
  const price=nonnegative(service,100000000);
  const inputBase=nonnegative(eligiblePurchases,100000000);
  const expense=nonnegative(operatingCost,100000000);
  const hybridBase=price*(1-hybridDiscount/100);
  const band=useMemo(()=>taxBand(rbt12,anexo),[rbt12,anexo]);
  const effectiveBuyerUtilization=regularBuyer?buyerUtilization/100:0;
  const cbsDebit=price*rate;
  const inputCredit=Math.min(cbsDebit,inputBase*rate);
  const embedded=price*band.cbsEffective;
  const dasPure=price*band.effective;
  const hybridCbs=hybridBase*rate;
  const hybridDas=hybridBase*band.effective;
  const hybridEmbedded=hybridBase*band.cbsEffective;
  const hybridInputCredit=Math.min(hybridCbs,inputBase*rate);
  const buyerParityDiscount=price>0?Math.max(0,Math.min(100,
    100*(1-(price-embedded*effectiveBuyerUtilization)/(price*(1+rate*(1-effectiveBuyerUtilization))))
  )):0;
  const results:Result[]=sellerRegime==="simples"?[
    {key:"puro",title:"Simples puro",base:price,invoice:price,das:dasPure,cbsDebit:0,sellerInputCredit:0,
      cbsToPay:0,buyerCredit:embedded*effectiveBuyerUtilization,buyerCost:price-embedded*effectiveBuyerUtilization,
      sellerNet:price-dasPure,chainBalance:dasPure-embedded*effectiveBuyerUtilization},
    {key:"hibrido",title:"Simples híbrido",base:hybridBase,invoice:hybridBase+hybridCbs,
      das:hybridDas-hybridEmbedded,cbsDebit:hybridCbs,
      sellerInputCredit:hybridInputCredit,cbsToPay:hybridCbs-hybridInputCredit,
      buyerCredit:hybridCbs*effectiveBuyerUtilization,
      buyerCost:hybridBase+hybridCbs-hybridCbs*effectiveBuyerUtilization,
      sellerNet:hybridBase-(hybridDas-hybridEmbedded)+hybridInputCredit,
      chainBalance:(hybridDas-hybridEmbedded)+(hybridCbs-hybridInputCredit)-hybridCbs*effectiveBuyerUtilization}
  ]:[
    {key:"regular",title:sellerRegime==="real"?"Lucro Real":"Lucro Presumido",base:price,
      invoice:price+cbsDebit,das:0,cbsDebit,sellerInputCredit:inputCredit,
      cbsToPay:cbsDebit-inputCredit,buyerCredit:cbsDebit*effectiveBuyerUtilization,
      buyerCost:price+cbsDebit-cbsDebit*effectiveBuyerUtilization,
      sellerNet:price+cbsDebit-(cbsDebit-inputCredit),
      chainBalance:cbsDebit-inputCredit-cbsDebit*effectiveBuyerUtilization}
  ];
  const reset=()=>{setSellerRegime("simples");setBuyerRegime("real");setAnexo("III");setService(10000);setRbt12(180000);setCbsRate(11.2);setEligiblePurchases(0);setOperatingCost(5000);setHybridDiscount(0);setBuyerUtilization(100);};
  const difference=results.length===2?results[1].buyerCost-results[0].buyerCost:0;
  const chainDifference=results.length===2?results[1].chainBalance-results[0].chainBalance:0;
  const marginFor=(result:Result)=>result.sellerNet-expense;
  const marginPercentFor=(result:Result)=>result.base>0?100*marginFor(result)/result.base:0;
  const marginDifference=results.length===2?marginFor(results[1])-marginFor(results[0]):0;
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
        <div className="evsim-cardtop"><div className="evsim-cardtitle"><Calculator size={19}/><div><h2>Simulador de operações comerciais</h2><p>Prestação de serviços · Cenário genérico e ajustável</p></div></div><span className="evsim-pill">Cenário ilustrativo</span></div>
        <div className="evsim-parties">
          <div className="evsim-party"><span className="evsim-section-index">01 / QUEM VENDE</span>
            <p className="evsim-party-role">Prestador / fornecedor</p>
            <label htmlFor="sellerRegime">Regime tributário</label><select id="sellerRegime" value={sellerRegime} onChange={e=>setSellerRegime(e.target.value as SellerRegime)}>
              <option value="simples">Simples Nacional — comparar puro × híbrido</option><option value="presumido">Lucro Presumido</option><option value="real">Lucro Real</option>
            </select>
          </div>
          <div className="evsim-party"><span className="evsim-section-index">02 / QUEM COMPRA</span>
            <p className="evsim-party-role">Contratante / adquirente</p>
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
        <div className="evsim-economics">
          <div className="evsim-economics-heading"><span className="evsim-section-index">03 / VIABILIDADE ECONÔMICA</span><h3>Custos e negociação</h3><p>Compare a margem da operação e o custo da contratação considerando os mesmos custos diretos.</p></div>
          <div className="evsim-inputs">
            <section><div className="evsim-fieldhead"><label htmlFor="operatingCost">Custo total da prestação (R$)</label><strong>{money(expense)}</strong></div>
              <input id="operatingCost" type="number" inputMode="decimal" min="0" max="100000000" step="100" value={operatingCost} onChange={e=>setOperatingCost(nonnegative(Number(e.target.value)))}/>
              <p className="evsim-hint">Informe o custo total da operação, incluindo a CBS paga nas compras. O mesmo custo é utilizado nas duas alternativas.</p>
            </section>
            {sellerRegime==="simples"&&<section><div className="evsim-fieldhead"><label htmlFor="discountRange">Desconto comercial no preço-base do híbrido</label><strong>{percent(hybridDiscount,1)}</strong></div>
              <input id="discountRange" className="evsim-range" type="range" min="0" max="30" step="0.1" value={Math.min(30,hybridDiscount)} onChange={e=>setHybridDiscount(Number(e.target.value))}/>
              <div className="evsim-inputrow"><span>Desconto exato (%)</span>{numeric(hybridDiscount,setHybridDiscount,0,100,0.1)}</div>
              <p className="evsim-hint">Desconto de equilíbrio aproximado para o custo do comprador: <strong>{percent(buyerParityDiscount,2)}</strong>.</p>
            </section>}
          </div>
        </div>
        <div className="evsim-resulthead"><div><span className="evsim-section-index">04 / RESULTADOS</span><h3>Comparativo tributário e econômico</h3></div><div className="evsim-actions"><button onClick={reset} type="button"><RotateCcw size={14}/> Reiniciar</button><button onClick={()=>window.print()} type="button"><Printer size={14}/> Imprimir</button></div></div>
        <div className="evsim-table-wrap"><table className="evsim-table"><thead><tr><th>Indicador</th>{results.map(r=><th key={r.key}>{r.title}</th>)}</tr></thead><tbody>
          <tr><td>Preço-base do serviço</td>{results.map(r=><td key={r.key}>{money(r.base)}</td>)}</tr>
          <tr><td>Valor da nota, com CBS por fora quando aplicável</td>{results.map(r=><td key={r.key}>{money(r.invoice)}</td>)}</tr>
          <tr><td>DAS da vendedora {sellerRegime==="simples"?"":"(não aplicável)"}</td>{results.map(r=><td key={r.key}>{sellerRegime==="simples"?money(r.das):"—"}</td>)}</tr>
          <tr><td>CBS destacada fora do DAS</td>{results.map(r=><td key={r.key}>{money(r.cbsDebit)}</td>)}</tr>
          <tr><td>Crédito CBS das aquisições da vendedora (aproveitado)</td>{results.map(r=><td key={r.key}>{money(r.sellerInputCredit)}</td>)}</tr>
          <tr><td>CBS líquida a recolher pela vendedora</td>{results.map(r=><td key={r.key}>{money(r.cbsToPay)}</td>)}</tr>
          <tr><td>Crédito CBS aproveitado pelo comprador</td>{results.map(r=><td key={r.key}>{money(r.buyerCredit)}</td>)}</tr>
          <tr><td>Custos diretos da prestação</td>{results.map(r=><td key={r.key}>{money(expense)}</td>)}</tr>
          <tr className="evsim-table-emphasis"><td>Resultado estimado do vendedor após tributos e custos</td>{results.map(r=><td key={r.key}>{money(marginFor(r))}</td>)}</tr>
          <tr><td>Margem estimada sobre o preço-base</td>{results.map(r=><td key={r.key}>{percent(marginPercentFor(r))}</td>)}</tr>
          <tr className="evsim-table-emphasis"><td>Custo líquido da compra, após crédito CBS</td>{results.map(r=><td key={r.key}>{money(r.buyerCost)}</td>)}</tr>
          <tr className="evsim-table-emphasis"><td>Saldo tributário parcial da operação*</td>{results.map(r=><td key={r.key}>{money(r.chainBalance)}</td>)}</tr>
        </tbody></table></div>
        <div className="evsim-summary">{results.map(r=><article key={r.key}><span>{r.title} · custo efetivo do comprador</span><strong>{money(r.buyerCost)}</strong><div className="evsim-summary-margin"><span>Resultado estimado do vendedor, após tributos e custos</span><b>{money(marginFor(r))}</b><small>Margem operacional estimada: {percent(marginPercentFor(r))}</small></div></article>)}</div>
        {results.length===2&&<div className="evsim-conclusion"><TrendingDown size={18}/><div><strong>Leitura comparativa</strong>
          <p>{Math.abs(difference)<0.005?"O custo líquido de compra é igual nos dois cenários.":difference>0?"Com as premissas adotadas, o Simples puro reduz o custo líquido da compradora em "+money(difference)+" frente ao híbrido.":"Com as premissas adotadas, o Simples híbrido reduz o custo líquido da compradora em "+money(-difference)+" frente ao puro."}
          {" "}{Math.abs(marginDifference)<0.005?"O resultado operacional estimado do vendedor é equivalente.":marginDifference>0?"O híbrido aumenta o resultado estimado do vendedor em "+money(marginDifference)+".":"O puro aumenta o resultado estimado do vendedor em "+money(-marginDifference)+"."}
          {" "}{Math.abs(chainDifference)<0.005?"O saldo tributário parcial da operação é equivalente.":chainDifference<0?"O híbrido reduz o saldo tributário parcial em "+money(-chainDifference)+", considerando o crédito aproveitado pela vendedora.":"O puro reduz o saldo tributário parcial em "+money(chainDifference)+"."}</p></div></div>}
        {sellerRegime!=="simples"&&<div className="evsim-conclusion"><Layers3 size={18}/><div><strong>Regime regular de CBS</strong><p>No recorte da CBS, Lucro Real e Lucro Presumido seguem o regime regular. A escolha entre eles exige calcular também IRPJ, CSLL, ISS, folha e demais fatores, que não estão neste simulador.</p></div></div>}
        <div className="evsim-footnote"><Info size={17}/><div><p><strong>Escopo e limites.</strong> Simulação didática de serviços em 2027. O preço-base é igual, exceto quando há desconto comercial aplicado ao híbrido. No híbrido ou regimes regulares, a CBS é adicionada por fora ao preço-base. O saldo tributário parcial (*) corresponde ao DAS + CBS líquida do vendedor − crédito de CBS do comprador; não representa a carga de toda a cadeia. O resultado e a margem do vendedor são estimativas operacionais simplificadas, não lucro líquido contábil: consideram apenas o custo direto informado, o DAS e a CBS simulados. O custo informado deve incluir CBS paga nas compras, e o crédito recuperável é demonstrado separadamente. Foram excluídos IBS (apesar da alíquota de transição de 0,1% em 2027), ISS fora do DAS, IRPJ/CSLL no Lucro Real ou Presumido, tributos de etapas anteriores, regras especiais de base de cálculo, despesas indiretas e limites individuais de créditos. A CBS de 11,2% é hipótese editável, não alíquota definitiva.</p><p>Na 6ª faixa do Simples, o ISS pode ser devido fora do DAS; este valor não é calculado. O creditamento pressupõe operação documentada e legalmente elegível. Se o RBT12 for incompatível com o Simples, ou houver impedimento societário, a projeção não deve ser usada para decisão.</p></div></div>
      </div>
      <div className="evsim-bottom"><div><span>BASE LEGAL</span><p>LC 214/2025, arts. 41 e 47; LC 123/2006, Anexos III e V (2027–2028).</p><div className="evsim-sources"><a href="https://www2.camara.leg.br/legin/fed/leicom/2025/leicomplementar-214-16-janeiro-2025-796905-normaatualizada-pl.html" target="_blank" rel="noopener noreferrer">Legislação consolidada <ArrowRight size={13}/></a><a href="https://legis.senado.gov.br/norma/40180341/publicacao/40181117" target="_blank" rel="noopener noreferrer">Anexo III <ArrowRight size={13}/></a><a href="https://legis.senado.leg.br/norma/40180341/publicacao/40181129" target="_blank" rel="noopener noreferrer">Anexo V <ArrowRight size={13}/></a></div></div><span className="evsim-footer-label">EVOLU TRAINING · FERRAMENTAS</span></div>
    </main>
    <footer className="evsim-footer"><Link href="/"><img src="/brand/evolu-white.png" width="105" height="23" alt="EVOLU"/> <span>TRAINING</span></Link><p>Estratégia, dados e decisões estruturadas.</p></footer>
  </div>;
}
