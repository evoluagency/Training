"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {ArrowLeft, ArrowRight, Calculator, RotateCcw, Printer, AlertTriangle, Truck, Scale, Info, ShieldCheck} from "lucide-react";
import "./comparador.css";

type Regime = "sn-puro" | "sn-hibrido" | "real" | "presumido" | "final";
type Annex = "I" | "II" | "III" | "IV" | "V";
type Kind = "goods" | "services";
type Operation = "buy" | "sell";
type Profile = {regime:Regime; uf:string; rbt12:number; annex:Annex};
type Offer = {price:number; profile:Profile; imported:boolean; manualIcms:boolean; icmsRate:number;
  freight:number; freightMode:"carrier"|"own"|"none"; freightPayer:"buyer"|"seller";
  freightRoute:"municipal"|"intermunicipal"|"interestadual"; freightIcmsRate:number; carrierRegular:boolean;
  ipi:number; st:number; difal:number; difalPayer:"buyer"|"seller"; costs:number};
type Simulation = {id:"A"|"B"; buyerCost:number; sellerNet:number; sellerMargin:number; cbsCredit:number;
  ibsCredit:number; icmsCredit:number; freightCredit:number; invoice:number; freightBuyer:number; freightSeller:number;
  sellerDAS:number; sellerICMS:number; sellerCBS:number; sellerIBS:number; sellerIPI:number; sellerST:number;
  sellerDIFAL:number; buyerDIFAL:number; cbsInvoice:number; ibsInvoice:number; freightTax:number; simRate:number;
  applicableIcmsRate:number; notes:string[]; buyerName:string; sellerName:string; valid:boolean;};
const UF = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const REGIMES:Record<Regime,string>={"sn-puro":"Simples Nacional · puro","sn-hibrido":"Simples Nacional · híbrido","real":"Lucro Real","presumido":"Lucro Presumido","final":"Não contribuinte / consumidor final"};
const ann:Record<Annex,{rate:number[];ded:number[];cbs:number[];ibs:number[];icms:number[]}> = {
 I:{rate:[4,7.3,9.5,10.7,14.3,18.9],ded:[0,5940,13860,22500,87300,378000],cbs:[15.33,15.33,15.33,15.33,15.33,34.02],ibs:[.17,.17,.17,.17,.17,0],icms:[34,34,33.5,33.5,33.5,0]},
 II:{rate:[4.5,7.8,10,11.2,14.7,29.9],ded:[0,5940,13860,22500,85500,720000],cbs:[13.85,13.85,13.85,13.85,13.85,25.22],ibs:[.15,.15,.15,.15,.15,0],icms:[32,32,32,32,32,0]},
 III:{rate:[6,11.2,13.5,16,21,32.9],ded:[0,9360,17640,35640,125640,648000],cbs:[15.43,16.91,16.42,16.42,15.43,19.29],ibs:[.17,.19,.19,.19,.17,0],icms:[0,0,0,0,0,0]},
 IV:{rate:[4.5,9,10.2,14,22,32.9],ded:[0,8100,12420,39780,183780,828000],cbs:[21.26,24.73,23.74,22.75,21.76,24.7],ibs:[.24,.27,.26,.25,.24,0],icms:[0,0,0,0,0,0]},
 V:{rate:[15.5,18,19.5,20.5,23,30.4],ded:[0,4500,9900,17100,62100,540000],cbs:[16.96,16.96,17.95,18.94,16.96,19.78],ibs:[.19,.19,.2,.21,.19,0],icms:[0,0,0,0,0,0]}
};
const bands=[180000,360000,720000,1800000,3600000,4800000];
const isSimple=(p:Profile)=>p.regime==="sn-puro"||p.regime==="sn-hibrido";
const isRegular=(p:Profile)=>p.regime==="real"||p.regime==="presumido"||p.regime==="sn-hibrido";
const isIcmsRegular=(p:Profile)=>p.regime==="real"||p.regime==="presumido";
const nonneg=(n:number,max=1e9)=>Math.min(max,Math.max(0,Number.isFinite(n)?n:0));
const money=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const pct=(n:number)=>new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+"%";
function splitDAS(p:Profile) {
 if(!isSimple(p))return {rate:0,cbs:0,ibs:0,icms:0,index:0};
 const rb=Math.max(1,Math.min(4800000,p.rbt12));
 const index=Math.max(0,bands.findIndex(v=>rb<=v));
 const spec=ann[p.annex];
 const rate=Math.max(0,(rb*spec.rate[index]/100-spec.ded[index])/rb);
 let cbs=rate*spec.cbs[index]/100;
 let ibs=rate*spec.ibs[index]/100;
 if(p.annex==="III"&&index===4&&rate>.1492537){cbs=Math.max(0,rate-.05)*.232;ibs=Math.max(0,rate-.05)*.0026;}
 if(p.annex==="IV"&&index===4&&rate>.125){cbs=Math.max(0,rate-.05)*.3627;ibs=Math.max(0,rate-.05)*.004;}
 return {rate,cbs,ibs,icms:rate*spec.icms[index]/100,index};
}
function suggestedICMS(origin:string,destination:string,imported:boolean){
 if(origin===destination)return 18;
 if(imported)return 4;
 const southSoutheast=["RS","SC","PR","SP","RJ","MG"];
 const low=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","PA","PB","PE","PI","RN","RO","RR","SE","TO"];
 return southSoutheast.includes(origin)&&low.includes(destination)?7:12;
}
const DEFAULT_A:Offer={price:10000,profile:{regime:"sn-puro",uf:"SP",rbt12:180000,annex:"I"},
 imported:false,manualIcms:false,icmsRate:18,freight:300,freightMode:"carrier",freightPayer:"buyer",
 freightRoute:"intermunicipal",freightIcmsRate:12,carrierRegular:true,ipi:0,st:0,difal:0,difalPayer:"buyer",costs:0};
const DEFAULT_B:Offer={...DEFAULT_A,price:9700,profile:{regime:"real",uf:"MG",rbt12:180000,annex:"I"},
 freight:650,freightRoute:"interestadual"};
function evaluate(id:"A"|"B",offer:Offer,own:Profile,mode:Operation,kind:Kind,cbsRate:number,costOfSale:number,
 cbsEligible:boolean,icmsEligible:boolean,cbsUtilization:number,icmsUtilization:number):Simulation {
 const seller=mode==="buy"?offer.profile:own;
 const buyer=mode==="buy"?own:offer.profile;
 const regularSeller=isRegular(seller);
 const regularBuyer=isRegular(buyer);
 const simpleSeller=isSimple(seller);
 const nominal=offer.price;
 const tax=splitDAS(seller);
 const across=seller.uf!==buyer.uf;
 const rateIcms=offer.manualIcms?offer.icmsRate:suggestedICMS(seller.uf,buyer.uf,offer.imported);
 const goods=kind==="goods";
 const cbsInvoice=regularSeller?nominal*cbsRate/100:0;
 const ibsInvoice=regularSeller?nominal*.001:0;
 const ipi=goods?offer.ipi:0;
 const st=goods?offer.st:0;
 const difal=goods?offer.difal:0;
 const sellerDAS=simpleSeller?nominal*Math.max(0,tax.rate-(seller.regime==="sn-hibrido"?tax.cbs+tax.ibs:0)):0;
 const outsideICMS=goods&&(isIcmsRegular(seller)||(simpleSeller&&tax.index===5));
 const sellerICMS=outsideICMS?nominal*rateIcms/100:0;
 const buyerCBS=regularBuyer&&cbsEligible?(regularSeller?cbsInvoice:nominal*tax.cbs)*cbsUtilization/100:0;
 const buyerIBS=regularBuyer&&cbsEligible?(regularSeller?ibsInvoice:nominal*tax.ibs)*cbsUtilization/100:0;
 const icmsDoc=goods?(outsideICMS?sellerICMS:(simpleSeller?nominal*tax.icms:0)):0;
 const buyerICMS=goods&&isIcmsRegular(buyer)&&icmsEligible?icmsDoc*icmsUtilization/100:0;
 const freight=goods&&offer.freightMode!=="none"?offer.freight:0;
 const freightBuyer=offer.freightPayer==="buyer"?freight:0;
 const freightSeller=offer.freightPayer==="seller"?freight:0;
 const freightTax=offer.freightMode==="carrier"&&goods&&offer.freightRoute!=="municipal"?
   freight*offer.freightIcmsRate/100:0;
 const freightCBS=offer.freightMode==="carrier"&&goods&&offer.carrierRegular?freight*cbsRate/100:0;
 const freightIBS=offer.freightMode==="carrier"&&goods&&offer.carrierRegular?freight*.001:0;
 const buyerFreightCredit=regularBuyer&&cbsEligible&&offer.freightPayer==="buyer"?
   (freightCBS+freightIBS)*cbsUtilization/100:0;
 const sellerFreightCredit=regularSeller&&offer.freightPayer==="seller"?
   (freightCBS+freightIBS):0;
 const buyerFreightICMS=isIcmsRegular(buyer)&&icmsEligible&&offer.freightPayer==="buyer"?freightTax*icmsUtilization/100:0;
 const sellerFreightICMS=isIcmsRegular(seller)&&offer.freightPayer==="seller"?freightTax:0;
 const buyerDIFAL=offer.difalPayer==="buyer"?difal:0;
 const sellerDIFAL=offer.difalPayer==="seller"?difal:0;
 const invoice=nominal+cbsInvoice+ibsInvoice+ipi+st;
 const buyerCost=invoice+freightBuyer+buyerDIFAL+offer.costs-buyerCBS-buyerIBS-buyerICMS-buyerFreightCredit-buyerFreightICMS;
 // ICMS is already embedded in price; the seller deducts it once, not from buyer invoice again.
 // IPI and ICMS-ST are included in invoice and passed through to the treasury, not seller margin.
 const sellerNet=nominal-sellerDAS-sellerICMS-sellerDIFAL-freightSeller+sellerFreightCredit+sellerFreightICMS;
 const sellerMargin=sellerNet-(mode==="sell"?costOfSale:0);
 const notes:string[]=[];
 if(simpleSeller&&seller.rbt12>4800000)notes.push("RBT12 do vendedor acima do limite geral do Simples: cenário inválido.");
 if(isSimple(buyer)&&buyer.rbt12>4800000)notes.push("RBT12 do comprador acima do limite geral do Simples: cenário inválido.");
 if(goods&&simpleSeller&&tax.index===5)notes.push("6ª faixa: ICMS fora do DAS estimado separadamente; conferir sublimite, recolhimento e benefícios estaduais.");
 if(goods&&seller.uf===buyer.uf)notes.push("Alíquota interna de ICMS é ilustrativa (18%) e exige validação por UF/NCM.");
 if(goods&&offer.st>0)notes.push("ICMS-ST informado manualmente; não há cálculo automático de MVA/base/CEST.");
 if(goods&&offer.difal>0)notes.push("DIFAL informado manualmente; incidência e responsável devem ser validados.");
 if(goods&&offer.freightMode==="carrier")notes.push("Tributos do frete são estimativas com transportadora do regime regular; CT-e e tomador determinam créditos.");
 if(goods&&offer.freightRoute==="municipal"&&offer.freightMode==="carrier")notes.push("Frete municipal: avaliar ISS, não calculado automaticamente.");
 if(!goods&&(seller.annex==="I"||seller.annex==="II")&&simpleSeller)notes.push("Serviços exigem enquadramento apropriado no Anexo III, IV ou V.");
 if(goods&&simpleSeller&&["III","IV","V"].includes(seller.annex))notes.push("Venda de mercadorias normalmente exige Anexo I ou II; confirme a atividade.");
 if(goods&&across&&!offer.manualIcms)notes.push("Alíquota interestadual sugerida; regras especiais, origem importada e NCM podem alterá-la.");
 return {id,buyerCost,sellerNet,sellerMargin,cbsCredit:buyerCBS,ibsCredit:buyerIBS,icmsCredit:buyerICMS,
   freightCredit:buyerFreightCredit+buyerFreightICMS,invoice,freightBuyer,freightSeller,sellerDAS,
   sellerICMS,sellerCBS:cbsInvoice-sellerFreightCredit*(cbsRate/(cbsRate+.1||1)),
   sellerIBS:ibsInvoice-sellerFreightCredit*(.1/(cbsRate+.1||1)),
   sellerIPI:ipi,sellerST:st,sellerDIFAL,buyerDIFAL,cbsInvoice,ibsInvoice,freightTax,
   simRate:tax.rate,applicableIcmsRate:rateIcms,notes,buyerName:mode==="buy"?"Sua empresa":"Cliente "+id,
   sellerName:mode==="buy"?"Fornecedor "+id:"Sua empresa",
   valid:notes.every(n=>!n.includes("cenário inválido"))};
}
const TextField=({label,value,onChange,min=0,max=1e9,step=1}:{
 label:string;value:number;onChange:(n:number)=>void;min?:number;max?:number;step?:number
})=><label className="cp-field"><span>{label}</span><input type="number" inputMode="decimal" value={value}
 min={min} max={max} step={step} onChange={e=>onChange(nonneg(Number(e.target.value),max))}/></label>;
const Dropdown=<T extends string,>({label,value,onChange,items}:{
 label:string;value:T;onChange:(v:T)=>void;items:Array<[T,string]>
})=><label className="cp-field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value as T)}>
 {items.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>;
const ufItems: Array<[string,string]> = UF.map(uf=>[uf,uf]);
const regimeItems: Array<[Regime,string]> = Object.entries(REGIMES) as Array<[Regime,string]>;
const annexItems: Array<[Annex,string]> = [["I","I · Comércio"],["II","II · Indústria"],["III","III · Serviços"],["IV","IV · Serviços"],["V","V · Serviços"]];
export default function MelhorRegime(){
 const [operation,setOperation]=useState<Operation>("buy");
 const [kind,setKind]=useState<Kind>("goods");
 const [own,setOwn]=useState<Profile>({regime:"real",uf:"SP",rbt12:180000,annex:"I"});
 const [offers,setOffers]=useState<[Offer,Offer]>([DEFAULT_A,DEFAULT_B]);
 const [cbsRate,setCbsRate]=useState(11.2);
 const [costOfSale,setCostOfSale]=useState(6000);
 const [cbsEligible,setCbsEligible]=useState(true);
 const [icmsEligible,setIcmsEligible]=useState(true);
 const [cbsUtilization,setCbsUtilization]=useState(100);
 const [icmsUtilization,setIcmsUtilization]=useState(100);
 function updateOwn<K extends keyof Profile>(key:K,val:Profile[K]){setOwn(prev=>({...prev,[key]:val}));}
 function updateOffer<K extends keyof Offer>(idx:number,key:K,val:Offer[K]){
   setOffers(prev=>prev.map((x,i)=>i===idx?{...x,[key]:val}:x) as [Offer,Offer]);
 }
 function updateCounter<K extends keyof Profile>(idx:number,key:K,val:Profile[K]){
   setOffers(prev=>prev.map((x,i)=>i===idx?{...x,profile:{...x.profile,[key]:val}}:x) as [Offer,Offer]);
 }
 const result=useMemo(()=>offers.map((v,i)=>evaluate(i===0?"A":"B",v,own,operation,kind,cbsRate,costOfSale,cbsEligible,icmsEligible,cbsUtilization,icmsUtilization)) as [Simulation,Simulation],
 [offers,own,operation,kind,cbsRate,costOfSale,cbsEligible,icmsEligible,cbsUtilization,icmsUtilization]);
 const basis=operation==="buy"?"buyerCost":"sellerMargin";
 const gap=Math.abs(result[0][basis]-result[1][basis]);
 const winner=(!result[0].valid||!result[1].valid)?null:operation==="buy"?
 (result[0].buyerCost<=result[1].buyerCost?"A":"B"):
 (result[0].sellerMargin>=result[1].sellerMargin?"A":"B");
 const ownDAS=splitDAS(own);
 function reset(){setOperation("buy");setKind("goods");setOwn({regime:"real",uf:"SP",rbt12:180000,annex:"I"});setOffers([DEFAULT_A,DEFAULT_B]);setCbsRate(11.2);setCostOfSale(6000);setCbsEligible(true);setIcmsEligible(true);setCbsUtilization(100);setIcmsUtilization(100);}
 const resultRows:Array<[string,(r:Simulation)=>number]> = [
 ["Preço-base da proposta",r=>offers[r.id==="A"?0:1].price],
 ["CBS destacada na operação",r=>r.cbsInvoice],
 ["IBS destacado (transição 2027)",r=>r.ibsInvoice],
 ["IPI informado",r=>r.sellerIPI],
 ["ICMS-ST informado",r=>r.sellerST],
 ["Total do documento fiscal estimado",r=>r.invoice],
 ["Frete suportado pelo comprador",r=>r.freightBuyer],
 ["DIFAL suportado pelo comprador",r=>r.buyerDIFAL],
 ["Crédito CBS do comprador",r=>r.cbsCredit],
 ["Crédito IBS do comprador",r=>r.ibsCredit],
 ["Crédito ICMS mercadoria",r=>r.icmsCredit],
 ["Créditos estimados do frete",r=>r.freightCredit],
 ["Custo líquido da compra",r=>r.buyerCost],
 ["DAS do vendedor",r=>r.sellerDAS],
 ["ICMS da operação, fora do DAS",r=>r.sellerICMS],
 ["CBS líquida estimada do vendedor",r=>r.sellerCBS],
 ["IBS líquido estimado do vendedor",r=>r.sellerIBS],
 ["IPI a recolher pelo vendedor",r=>r.sellerIPI],
 ["ICMS-ST a recolher pelo vendedor",r=>r.sellerST],
 ["DIFAL a recolher pelo vendedor",r=>r.sellerDIFAL],
 ["Frete suportado pelo vendedor",r=>r.freightSeller],
 ["Resultado estimado do vendedor*",r=>r.sellerMargin]
 ];
 return <div className="cp">
 <header className="cp-header"><Link href="/" className="cp-logo"><img src="/brand/evolu-black.png" width="145" height="31" alt="EVOLU"/><span>TRAINING</span></Link>
 <Link href="/" className="cp-back"><ArrowLeft size={16}/> Voltar ao Training</Link></header>
 <main className="cp-main">
 <div className="cp-intro"><span className="cp-eyebrow">INTELIGÊNCIA TRIBUTÁRIA / SIMULADOR 2027</span>
  <h1>Compare cenários.<br/><em>Decida pelo custo real.</em></h1>
  <p>Analise duas propostas com regimes distintos, origem e destino, frete, créditos e impostos. Nenhum nome de empresa é solicitado.</p></div>
 <section className="cp-panel"><div className="cp-heading"><div><Scale size={22}/><div><h2>Configuração da operação</h2><p>Defina seu papel, a atividade e o regime da sua empresa.</p></div></div><span className="cp-tag">2027 · Estimativa</span></div>
 <div className="cp-segment"><button type="button" className={operation==="buy"?"active":""} onClick={()=>setOperation("buy")}>Estou comprando</button>
 <button type="button" className={operation==="sell"?"active":""} onClick={()=>setOperation("sell")}>Estou vendendo</button></div>
 <div className="cp-grid cp-grid-3">
  <Dropdown label="Natureza da operação" value={kind} onChange={setKind} items={[["goods","Mercadoria"],["services","Prestação de serviço"]]}/>
  <Dropdown label="Meu regime tributário" value={own.regime} onChange={v=>updateOwn("regime",v)} items={regimeItems.filter(([key])=>key!=="final")}/>
  <Dropdown label="Meu estado (UF)" value={own.uf} onChange={v=>updateOwn("uf",v)} items={ufItems}/>
 </div>
 {isSimple(own)&&<div className="cp-simple"><div className="cp-grid cp-grid-2">
   <TextField label="Meu RBT12 (R$)" value={own.rbt12} onChange={v=>updateOwn("rbt12",v)} max={10000000} step={1000}/>
   <Dropdown label="Meu Anexo do Simples" value={own.annex} onChange={v=>updateOwn("annex",v)} items={annexItems}/>
 </div><p>Alíquota efetiva aproximada: <strong>{pct(ownDAS.rate*100)}</strong> · {ownDAS.index+1}ª faixa. A seleção do Anexo deve corresponder à atividade efetiva.</p></div>}
 <div className="cp-grid cp-grid-3 cp-parameters"><TextField label="Alíquota CBS regular (%) · hipótese" value={cbsRate} onChange={setCbsRate} max={30} step={0.1}/>
 <label className="cp-checkbox"><input type="checkbox" checked={cbsEligible} onChange={e=>setCbsEligible(e.target.checked)}/><span>Compra elegível a crédito de CBS/IBS</span></label>
 <label className="cp-checkbox"><input type="checkbox" checked={icmsEligible} onChange={e=>setIcmsEligible(e.target.checked)}/><span>Compra elegível a crédito de ICMS</span></label>
 <TextField label="Créditos CBS/IBS aproveitáveis (%)" value={cbsUtilization} onChange={setCbsUtilization} max={100} step={5}/>
 <TextField label="Créditos ICMS aproveitáveis (%)" value={icmsUtilization} onChange={setIcmsUtilization} max={100} step={5}/>
 {operation==="sell"&&<TextField label="Meu custo de mercadoria/serviço (R$)" value={costOfSale} onChange={setCostOfSale} step={100}/>}
 </div>
 <div className="cp-inline-warning"><Info size={16}/> Alíquota da CBS é editável; IBS regular de 0,1% está incluído. ICMS, ST e DIFAL exigem enquadramento fiscal e validação de NCM/UF.</div>
 </section>
 <section className="cp-offers">
 {offers.map((o,idx)=>{
  const id=idx===0?"A":"B";
  const seller=operation==="buy"?o.profile:own;
  const buyer=operation==="buy"?own:o.profile;
  const refICMS=suggestedICMS(seller.uf,buyer.uf,o.imported);
  const sim=splitDAS(o.profile);
  return <article key={id} className="cp-offer">
   <div className="cp-offer-head"><div><span className="cp-index">CENÁRIO {id}</span><h2>{operation==="buy"?"Fornecedor":"Cliente"} {id}</h2></div>
    <span className="cp-route">{seller.uf} → {buyer.uf}</span></div>
   <div className="cp-grid cp-grid-2">
    <TextField label={operation==="buy"?"Preço do fornecedor (R$)":"Preço de venda (R$)"} value={o.price} onChange={v=>updateOffer(idx,"price",v)} step={100}/>
    <Dropdown label={"Regime do "+(operation==="buy"?"fornecedor":"cliente")} value={o.profile.regime} onChange={v=>updateCounter(idx,"regime",v)} items={regimeItems}/>
    <Dropdown label={"UF do "+(operation==="buy"?"fornecedor":"cliente")} value={o.profile.uf} onChange={v=>updateCounter(idx,"uf",v)} items={ufItems}/>
    <label className="cp-checkbox cp-inline"><input type="checkbox" checked={o.imported} onChange={e=>updateOffer(idx,"imported",e.target.checked)}/><span>Mercadoria importada com ICMS interestadual de 4% (quando aplicável)</span></label>
   </div>
   {isSimple(o.profile)&&<div className="cp-simple cp-offer-simple"><div className="cp-grid cp-grid-2">
    <TextField label="RBT12 da contraparte (R$)" value={o.profile.rbt12} onChange={v=>updateCounter(idx,"rbt12",v)} max={10000000} step={1000}/>
    <Dropdown label="Anexo do Simples da contraparte" value={o.profile.annex} onChange={v=>updateCounter(idx,"annex",v)} items={annexItems}/>
    </div><p>Faixa {sim.index+1} · alíquota efetiva {pct(sim.rate*100)} · CBS no DAS {pct(sim.cbs*100)}.</p></div>}
   {kind==="goods"&&<><div className="cp-divider"/><h3 className="cp-group-title">Tributos sobre mercadoria</h3>
   <div className="cp-grid cp-grid-2">
     <label className="cp-checkbox"><input type="checkbox" checked={o.manualIcms} onChange={e=>updateOffer(idx,"manualIcms",e.target.checked)}/><span>Informar alíquota ICMS manualmente</span></label>
     <TextField label={o.manualIcms?"ICMS da operação (%)":"ICMS de referência (%) · auto"} value={o.manualIcms?o.icmsRate:refICMS} onChange={v=>{updateOffer(idx,"manualIcms",true);updateOffer(idx,"icmsRate",v);}} max={100} step={0.1}/>
     <TextField label="IPI adicional informado (R$)" value={o.ipi} onChange={v=>updateOffer(idx,"ipi",v)} step={10}/>
     <TextField label="ICMS-ST informado (R$)" value={o.st} onChange={v=>updateOffer(idx,"st",v)} step={10}/>
     <TextField label="DIFAL informado (R$)" value={o.difal} onChange={v=>updateOffer(idx,"difal",v)} step={10}/>
     <Dropdown label="Responsável pelo DIFAL informado" value={o.difalPayer} onChange={v=>updateOffer(idx,"difalPayer",v)} items={[["buyer","Comprador"],["seller","Vendedor"]]}/>
   </div>
   <div className="cp-divider"/><h3 className="cp-group-title"><Truck size={16}/> Logística e transporte</h3>
   <div className="cp-grid cp-grid-2">
    <Dropdown label="Como será realizado o transporte?" value={o.freightMode} onChange={v=>updateOffer(idx,"freightMode",v)} items={[["carrier","Transportadora (terceirizada)"],["own","Transporte próprio"],["none","Retirada / sem frete"]]}/>
    {o.freightMode!=="none"&&<><Dropdown label="Quem paga o transporte?" value={o.freightPayer} onChange={v=>updateOffer(idx,"freightPayer",v)} items={[["buyer","Comprador"],["seller","Vendedor"]]}/>
    <TextField label={o.freightMode==="carrier"?"Valor do frete contratado (R$)":"Custo do transporte próprio (R$)"} value={o.freight} onChange={v=>updateOffer(idx,"freight",v)} step={50}/>
    {o.freightMode==="carrier"&&<><Dropdown label="Abrangência do transporte" value={o.freightRoute} onChange={v=>updateOffer(idx,"freightRoute",v)} items={[["municipal","Dentro do município (ISS)"],["intermunicipal","Intermunicipal (ICMS)"],["interestadual","Interestadual (ICMS)"]]}/>
    {o.freightRoute!=="municipal"&&<TextField label="ICMS no CT-e (%) · estimado" value={o.freightIcmsRate} onChange={v=>updateOffer(idx,"freightIcmsRate",v)} max={100} step={0.1}/>}
    <label className="cp-checkbox"><input type="checkbox" checked={o.carrierRegular} onChange={e=>updateOffer(idx,"carrierRegular",e.target.checked)}/><span>Transportadora em regime regular da CBS/IBS</span></label></>}
    </>}
    <TextField label="Outros custos pagos pelo comprador (R$)" value={o.costs} onChange={v=>updateOffer(idx,"costs",v)} step={50}/>
   </div></>}
   {kind==="services"&&<div className="cp-inline-warning"><Info size={15}/> Para serviços, ISS e regras especiais não são apurados automaticamente; valide a incidência antes de decidir.</div>}
  </article>})}
 </section>
 <section className="cp-results"><div className="cp-results-head"><div><span className="cp-eyebrow">ANÁLISE COMPARATIVA</span><h2>{operation==="buy"?"Qual proposta apresenta menor custo?":"Qual operação entrega maior resultado?"}</h2></div>
 <div className="cp-actions"><button type="button" onClick={reset}><RotateCcw size={14}/> Reiniciar</button><button type="button" onClick={()=>window.print()}><Printer size={14}/> Imprimir</button></div></div>
 <div className="cp-score">
  {result.map(r=><div key={r.id} className={"cp-score-card "+(winner===r.id?"cp-best":"")}>
   <span>{operation==="buy"?"Fornecedor":"Cliente"} {r.id} {winner===r.id&&<strong>Menor custo / melhor resultado</strong>}</span>
   <b>{money(operation==="buy"?r.buyerCost:r.sellerMargin)}</b>
   <small>{operation==="buy"?"Custo líquido estimado da aquisição":"Resultado operacional estimado da venda"}</small>
   <p>Documento fiscal: {money(r.invoice)} · CBS da nota: {money(r.cbsInvoice)}</p>
  </div>)}
 </div>
 <div className="cp-decision">{winner?<><ShieldCheck size={20}/><div><strong>{operation==="buy"?"Menor custo estimado":"Maior resultado estimado"}: cenário {winner}</strong><p>Diferença entre propostas: {money(gap)}. A comparação considera os valores informados e os créditos assumidos. Não substitui apuração fiscal.</p></div></>:
 <><AlertTriangle size={20}/><div><strong>Comparação depende de validação</strong><p>Revise os dados de regime e RBT12. Não é possível recomendar um cenário com enquadramento inválido.</p></div></>}</div>
 <div className="cp-tablewrap"><table><thead><tr><th>Composição da operação</th><th>Cenário A</th><th>Cenário B</th></tr></thead><tbody>
 {resultRows.map(([label,compute])=><tr key={label} className={label==="Custo líquido da compra"||label.startsWith("Resultado estimado")?"cp-total":""}><td>{label}</td>{result.map(r=><td key={r.id}>{money(compute(r))}</td>)}</tr>)}
 </tbody></table></div>
 <div className="cp-detail-grid">{result.map(r=><article key={r.id}><h3>Cenário {r.id} · Condições e ressalvas</h3>
 <p><strong>ICMS de referência:</strong> {pct(r.applicableIcmsRate)} · <strong>ICMS no frete (dentro do valor):</strong> {money(r.freightTax)}.</p>
 {r.notes.length?r.notes.map((note,i)=><p key={i} className="cp-note"><AlertTriangle size={13}/>{note}</p>):<p className="cp-note">A operação ainda exige conferência documental e das hipóteses de crédito.</p>}
 </article>)}</div>
 <div className="cp-legal"><Info size={17}/><p><strong>Limites do modelo:</strong> esta ferramenta compara propostas de mercadorias ou serviços em 2027 por premissas editáveis. A CBS regular é hipotética (padrão 11,2%) e o IBS regular é 0,1%; ICMS interno de 18% é apenas referência ilustrativa. Para o Simples, aplica RBT12, Anexo e parcelas de CBS/IBS/ICMS do DAS. O cálculo ignora especificidades de NCM, CFOP, CSOSN/CST, benefícios, reduções, base de cálculo de ICMS por dentro, MVA/ST, partilha DIFAL, FCP, IPI especial e limites de crédito. IPI, ICMS-ST e DIFAL são valores informados, não calculados automaticamente. Na venda, resultado (*) não inclui IRPJ/CSLL fora do DAS, despesas indiretas nem créditos fiscais próprios de aquisições anteriores; pode não ser lucro econômico integral. Frete com transportadora considera tributos embutidos no valor contratado, sujeitos a CT-e e crédito permitido ao tomador. Não utilize o resultado como cálculo de guia ou nota fiscal sem validação contábil.</p></div>
 </section>
 <div className="cp-law"><span>BASES LEGAIS</span><p>LC 123/2006 · Anexos I–V (2027–2028) | LC 214/2025 · CBS e IBS | Senado: Res. 22/1989 e Res. 13/2012.</p><div><a href="https://www2.camara.leg.br/legin/fed/leicom/2006/leicomplementar-123-14-dezembro-2006-548099-normaatualizada-pl.html" target="_blank" rel="noreferrer">Simples Nacional <ArrowRight size={12}/></a>
 <a href="https://www2.camara.leg.br/legin/fed/leicom/2025/leicomplementar-214-16-janeiro-2025-796905-normaatualizada-pl.html" target="_blank" rel="noreferrer">CBS / IBS <ArrowRight size={12}/></a></div></div>

 <section className="cp-print-report" aria-label="Relatório de comparação em A4">
  <div className="cp-print-page">
   <header className="cp-print-top">
    <div className="cp-print-brand"><img src="/brand/evolu-black.png" width="130" height="30" alt="EVOLU"/><span>TRAINING · INTELIGÊNCIA TRIBUTÁRIA</span></div>
    <span className="cp-print-label">SIMULAÇÃO 2027</span>
   </header>
   <div className="cp-print-title">
    <div><span>RELATÓRIO COMPARATIVO</span><h2>{operation==="buy"?"Análise de fornecedores":"Análise de condições de venda"}</h2><p>{kind==="goods"?"Operação com mercadorias":"Prestação de serviços"} · {operation==="buy"?"Perspectiva do comprador":"Perspectiva do vendedor"}</p></div>
    <strong>2027</strong>
   </div>
   <div className="cp-print-context">
    <div><span>Regime do usuário</span><strong>{REGIMES[own.regime]}</strong></div>
    <div><span>UF de referência</span><strong>{own.uf}</strong></div>
    <div><span>CBS regular (premissa)</span><strong>{pct(cbsRate)}</strong></div>
    {isSimple(own)&&<div><span>Meu Simples (RBT12 / Anexo)</span><strong>{money(own.rbt12)} · {own.annex}</strong></div>}
   </div>
   <div className="cp-print-proposals">
    {result.map((r,i)=><article key={r.id}>
     <div className="cp-print-proposal-top"><b>CENÁRIO {r.id}</b><strong>{operation==="buy"?"Fornecedor":"Cliente"} {r.id}</strong></div>
     <div className="cp-print-description">{REGIMES[offers[i].profile.regime]} · {operation==="buy"?offers[i].profile.uf:own.uf} → {operation==="buy"?own.uf:offers[i].profile.uf}</div>
     {isSimple(offers[i].profile)&&<div className="cp-print-description">RBT12 {money(offers[i].profile.rbt12)} · Anexo {offers[i].profile.annex}</div>}
     <span>{operation==="buy"?"CUSTO LÍQUIDO DA COMPRA":"RESULTADO ESTIMADO DA VENDA"}</span>
     <strong className="cp-print-value">{money(operation==="buy"?r.buyerCost:r.sellerMargin)}</strong>
    </article>)}
   </div>
   <div className="cp-print-takeaway">
    {winner?<><strong>{operation==="buy"?"Menor custo":"Maior resultado"}: cenário {winner}</strong><span>Diferença estimada: {money(gap)} entre os dois cenários, considerando as premissas indicadas.</span></>:
    <><strong>Dados fiscais exigem revisão</strong><span>Não foi possível comparar com enquadramento válido em todos os cenários.</span></>}
   </div>
   <div className="cp-print-table-head"><h3>Composição financeira e tributária</h3><span>Valores em BRL</span></div>
   <table className="cp-print-table">
    <thead><tr><th>Indicador</th><th>Cenário A</th><th>Cenário B</th></tr></thead>
    <tbody>{resultRows.filter(([label])=>
      (kind==="goods"||!/(ICMS|IPI|DIFAL|frete)/i.test(label))&&
      ["Preço-base da proposta","CBS destacada na operação","IBS destacado (transição 2027)",
      "IPI informado","ICMS-ST informado","Total do documento fiscal estimado",
      "Frete suportado pelo comprador","DIFAL suportado pelo comprador",
      "Crédito CBS do comprador","Crédito IBS do comprador","Crédito ICMS mercadoria",
      "Créditos estimados do frete","Custo líquido da compra","DAS do vendedor",
      "ICMS da operação, fora do DAS","CBS líquida estimada do vendedor",
      "IBS líquido estimado do vendedor","DIFAL a recolher pelo vendedor",
      "Resultado estimado do vendedor*"].includes(label)
    ).map(([label,compute])=><tr key={label} className={label==="Custo líquido da compra"||label.startsWith("Resultado estimado")?"cp-print-total":""}>
     <td>{label}</td>{result.map(r=><td key={r.id}>{money(compute(r))}</td>)}</tr>)}</tbody>
   </table>
   <div className="cp-print-logistics">
    <h3>Condições de transporte e enquadramento</h3>
    <div>{result.map((r,i)=><div key={r.id}><strong>CENÁRIO {r.id}</strong>
     <p>Transporte: {offers[i].freightMode==="carrier"?"transportadora":offers[i].freightMode==="own"?"próprio":"sem frete"} · Responsável: {offers[i].freightPayer==="buyer"?"comprador":"vendedor"} · Frete: {money(offers[i].freightMode==="none"?0:offers[i].freight)}</p>
     <p>ICMS de referência: {pct(r.applicableIcmsRate)} · {r.valid?"Premissas sujeitas a validação fiscal.":"Atenção: possível enquadramento inválido."}</p>
    </div>)}</div>
   </div>
   <div className="cp-print-disclaimer"><strong>Nota metodológica:</strong> relatório ilustrativo, não substitui apuração fiscal. CBS regular é premissa ajustável; IBS e ICMS seguem hipóteses simplificadas. Conferir NCM, CFOP, CST/CSOSN, UF, CT-e, creditamento, ICMS-ST, DIFAL, IPI, ISS e regras de cada operação. Resultado da venda não representa lucro líquido contábil.</div>
   <div className="cp-print-bottom"><span>EVOLU TRAINING · SIMULADOR DE CENÁRIOS</span><span>Formato A4 · 210 × 297 mm</span></div>
  </div>
 </section>
 </main><footer className="cp-footer"><Link href="/"><img src="/brand/evolu-black.png" width="110" height="27" alt="EVOLU"/> <span>TRAINING</span></Link><p>Estratégia · Inteligência de negócios · Educação corporativa</p></footer></div>;
}
