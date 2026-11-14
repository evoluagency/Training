'use client';
// Avatar humanoide 3D ORIGINAL do EVOLU Intelligence, em tempo real no navegador (three, MIT).
// Aparência "EVOLU Design No-1" (referência do proprietário em docs/intelligence/referencias/), construída em código,
// sem modelo externo: casco branco brilhante, olhos verdes acesos com pálpebras, mandíbula articulada, pescoço de cabos,
// peitoral com a marca e barra de estado, ombros e braços. A barra do peito e os anéis dos ombros mostram o estado.
// Pisca, respira, mexe cabeça e sobrancelhas. A boca segue o volume do áudio real quando há um AnalyserNode
// (voz gerada no navegador) e, sem ele, o ritmo de sílabas e os limites de palavra da voz do navegador.
// Sem WebGL, cai no avatar ilustrado.
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {
  AmbientLight,CapsuleGeometry,LatheGeometry,SplineCurve,Vector2,Color,CylinderGeometry,DirectionalLight,Group,HemisphereLight,Mesh,MeshStandardMaterial,
  PerspectiveCamera,Scene,SphereGeometry,TorusGeometry,WebGLRenderer,CanvasTexture,MeshBasicMaterial,PlaneGeometry,SRGBColorSpace,type BufferGeometry,
} from 'three';
import {IllustratedAvatar} from './avatar';
import {NEUTRAL_VISEME,approach,levelFromSamples,moodTarget,visemeFor,type AvatarMood,type Viseme} from './avatar-motion';

export type Avatar3DHandle={word:(w?:string)=>void;setAnalyser:(a:AnalyserNode|null)=>void};

type Disposable={dispose:()=>void};

type Rig={
  root:Group;head:Group;jaw:Group;torso:Mesh;
  eyes:Group[];lids:Mesh[];brows:Mesh[];
  mouth:Mesh;mouthGlow:MeshStandardMaterial;upperLip:Mesh;lowerLip:Mesh;
  leds:MeshStandardMaterial[];
};

// Texto do peito desenhado em tela (sem arquivo de imagem nem fonte externa).
function chestLabel(track:(x:Disposable)=>void){
  const c=document.createElement('canvas');c.width=512;c.height=224;
  const g=c.getContext('2d');
  if(g){g.fillStyle='#2a302f';g.textBaseline='alphabetic';
    g.font='700 112px Arial, Helvetica, sans-serif';g.fillText('EVOLU',8,112);
    g.font='500 46px Arial, Helvetica, sans-serif';g.fillText('DESIGN NO-1',12,184)}
  const tex=new CanvasTexture(c);tex.colorSpace=SRGBColorSpace;tex.anisotropy=4;track(tex);
  const m=new MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});track(m);
  const geo=new PlaneGeometry(.52,.2275);track(geo);
  return new Mesh(geo,m);
}

function buildRig(scene:Scene,track:(x:Disposable)=>void):Rig{
  const mat=(color:string,o:Partial<{rough:number;metal:number;emissive:string;ei:number}>={})=>{
    const m=new MeshStandardMaterial({color:new Color(color),roughness:o.rough??.5,metalness:o.metal??.1});
    if(o.emissive){m.emissive=new Color(o.emissive);m.emissiveIntensity=o.ei??1}
    track(m);return m;
  };
  const geo=<G extends BufferGeometry>(g:G)=>{track(g);return g};
  // EVOLU Design No-1: casco branco brilhante, mecânica grafite aparente e cabos verdes acesos.
  const GREEN='#5cff3b';
  const shell=mat('#f3f5f2',{rough:.2,metal:.04}),shellFace=mat('#fafbf9',{rough:.24,metal:.02}),shellShade=mat('#d5d9d4',{rough:.3,metal:.05});
  const mech=mat('#4a5152',{rough:.4,metal:.45}),dark=mat('#14181a',{rough:.55,metal:.3});
  const cable=mat('#1f7a16',{rough:.4,emissive:GREEN,ei:1.1});
  const eyeGlow=mat('#2fbf1f',{rough:.3,emissive:GREEN,ei:1.5}),eyeCore=mat('#eaffe0',{rough:.3,emissive:'#d9ffc8',ei:1.6});
  const mouthGlow=mat('#0e1210',{rough:.6,emissive:GREEN,ei:0});
  const ledBar=mat('#7f9c45',{emissive:'#7f9c45',ei:.8}),ledRing=mat('#7f9c45',{emissive:'#7f9c45',ei:.8});

  const root=new Group();scene.add(root);
  // Peitoral branco, com barra de estado no centro e a marca ao lado.
  const chest=new Mesh(geo(new SphereGeometry(1,64,32)),shell);chest.scale.set(1.22,.85,.62);chest.position.set(0,-2.3,-.08);root.add(chest);
  const yoke=new Mesh(geo(new CapsuleGeometry(.34,1.7,12,32)),shell);yoke.rotation.z=Math.PI/2;yoke.scale.set(1,1,.8);yoke.position.set(0,-1.86,-.12);root.add(yoke);
  const bar=new Mesh(geo(new CapsuleGeometry(.026,.5,8,16)),ledBar);bar.scale.z=.5;bar.position.set(0,-2.3,.545);root.add(bar);
  const label=chestLabel(track);label.position.set(.4,-2.2,.525);label.rotation.set(-.06,.3,0);root.add(label);
  const hem=new Mesh(geo(new TorusGeometry(1,.012,8,96)),cable);hem.rotation.x=Math.PI/2;hem.scale.set(.86,.44,1);hem.position.set(0,-2.92,-.08);root.add(hem);
  // Abdômen mecânico com cabos.
  const core=new Mesh(geo(new CylinderGeometry(.5,.42,1,32)),mech);core.scale.z=.7;core.position.set(0,-3.35,-.1);root.add(core);
  for(let i=-3;i<=3;i++){const c=new Mesh(geo(new CylinderGeometry(.02,.02,.95,8)),cable);c.position.set(i*.13,-3.35,.26-Math.abs(i)*.03);c.rotation.z=i*.05;root.add(c)}
  // Ombros: junta grafite com anel aceso, capa branca e braço.
  for(const side of [-1,1]){
    const joint=new Mesh(geo(new SphereGeometry(.3,32,24)),mech);joint.position.set(side*1.36,-1.98,-.12);root.add(joint);
    const ring=new Mesh(geo(new TorusGeometry(.17,.02,10,40)),ledRing);ring.position.set(side*1.36,-1.98,.17);root.add(ring);
    const cap=new Mesh(geo(new SphereGeometry(.4,40,24)),shell);cap.scale.set(.95,.9,.95);cap.position.set(side*1.66,-1.92,-.14);root.add(cap);
    const arm=new Mesh(geo(new CapsuleGeometry(.24,1,12,24)),shell);arm.position.set(side*1.74,-2.95,-.14);arm.rotation.z=side*.05;root.add(arm);
    const seam=new Mesh(geo(new TorusGeometry(.245,.01,8,40)),cable);seam.rotation.x=Math.PI/2;seam.position.set(side*1.72,-2.5,-.14);root.add(seam);
  }
  // Pescoço: núcleo escuro, cabos verdes em volta, anéis e gola branca.
  const neck=new Mesh(geo(new CylinderGeometry(.19,.24,.9,32)),dark);neck.position.set(0,-1.3,-.05);root.add(neck);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const c=new Mesh(geo(new CylinderGeometry(.014,.014,.86,6)),cable);c.position.set(Math.sin(a)*.215,-1.3,-.05+Math.cos(a)*.215);root.add(c)}
  for(const y of [-1.05,-1.25,-1.45]){const r=new Mesh(geo(new TorusGeometry(.235+(-1.05-y)*.08,.018,10,40)),mech);r.rotation.x=Math.PI/2;r.position.set(0,y,-.05);root.add(r)}
  const collar=new Mesh(geo(new TorusGeometry(.36,.07,14,48)),shell);collar.rotation.x=Math.PI/2;collar.position.set(0,-1.62,-.06);root.add(collar);
  // Cabeça (pivô no topo do pescoço).
  const pivot=new Group();pivot.position.set(0,-.95,0);pivot.scale.setScalar(.8);root.add(pivot);
  const head=new Group();head.position.set(0,.95,0);pivot.add(head);
  // Perfil de cabeça humana (testa larga, mandíbula afinando) girado em torno do eixo vertical.
  const profile=[[0,1],[.45,.92],[.72,.65],[.82,.3],[.8,0],[.74,-.35],[.6,-.65],[.42,-.88],[.2,-1],[0,-1.02]].reverse().map(([x,y])=>new Vector2(x,y));
  const headGeo=geo(new LatheGeometry(new SplineCurve(profile).getPoints(64),72));headGeo.computeVertexNormals();
  const cranium=new Mesh(headGeo,shell);cranium.scale.set(1,1,.92);head.add(cranium);
  const faceMesh=new Mesh(headGeo,shellFace);faceMesh.scale.set(.78,.8,.88);faceMesh.position.set(0,-.12,.16);head.add(faceMesh);
  const crest=new Mesh(geo(new CapsuleGeometry(.012,.9,6,12)),shellShade);crest.rotation.x=Math.PI/2;crest.position.set(0,.985,-.05);head.add(crest);
  // Olhos acesos (o núcleo claro gira para olhar) e pálpebras brancas.
  const eyes:Group[]=[],lids:Mesh[]=[],brows:Mesh[]=[];
  for(const side of [-1,1]){
    const socket=new Group();socket.position.set(side*.25,.08,.79);socket.scale.set(1.3,.82,1);head.add(socket);
    const eye=new Group();socket.add(eye);eyes.push(eye);
    eye.add(new Mesh(geo(new SphereGeometry(.1,32,24)),eyeGlow));
    const ir=new Mesh(geo(new SphereGeometry(.045,32,16)),eyeCore);ir.scale.z=.35;ir.position.z=.092;eye.add(ir);
    const upper=new Mesh(geo(new SphereGeometry(.114,32,16,0,Math.PI*2,0,Math.PI/2)),shellFace);socket.add(upper);lids.push(upper);
    const lower=new Mesh(geo(new SphereGeometry(.112,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2)),shellFace);lower.rotation.x=.72;socket.add(lower);
    const brow=new Mesh(geo(new CapsuleGeometry(.03,.2,6,12)),shellFace);brow.rotation.z=Math.PI/2;brow.position.set(side*.25,.27,.76);head.add(brow);brows.push(brow);
  }
  // Boca: cavidade com brilho verde ao falar, lábio superior fixo e inferior na mandíbula.
  const mouth=new Mesh(geo(new SphereGeometry(1,32,16)),mouthGlow);mouth.position.set(0,-.4,.8);mouth.scale.set(.15,.012,.04);head.add(mouth);
  const upperLip=new Mesh(geo(new CapsuleGeometry(.02,.24,6,12)),shellShade);upperLip.rotation.z=Math.PI/2;upperLip.position.set(0,-.37,.82);head.add(upperLip);
  const nose=new Mesh(geo(new CapsuleGeometry(.04,.16,8,16)),shellFace);nose.scale.z=.7;nose.position.set(0,-.12,.83);head.add(nose);
  const jaw=new Group();jaw.position.set(0,-.2,.25);head.add(jaw);
  const lowerLip=new Mesh(geo(new CapsuleGeometry(.02,.2,6,12)),shellShade);lowerLip.rotation.z=Math.PI/2;lowerLip.position.set(0,-.255,.56);jaw.add(lowerLip);
  const chin=new Mesh(geo(new SphereGeometry(1,32,16)),shellFace);chin.scale.set(.2,.06,.07);chin.position.set(0,-.43,.4);jaw.add(chin);
  return {root,head:pivot,jaw,torso:chest,eyes,lids,brows,mouth,mouthGlow,upperLip,lowerLip,leds:[ledBar,ledRing]};
}

export const Avatar3D=forwardRef<Avatar3DHandle,{mood:AvatarMood;label:string}>(function Avatar3D({mood,label},ref){
  const host=useRef<HTMLDivElement>(null);
  const moodRef=useRef(mood),pulse=useRef(0),viseme=useRef<Viseme>(NEUTRAL_VISEME),analyser=useRef<AnalyserNode|null>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{moodRef.current=mood},[mood]);
  useImperativeHandle(ref,()=>({
    word(w){pulse.current=Math.min(1,pulse.current+.6);viseme.current=visemeFor(w)},
    setAnalyser(a){analyser.current=a},
  }),[]);

  useEffect(()=>{
    const el=host.current;if(!el)return;
    let renderer:WebGLRenderer;
    try{renderer=new WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'})}catch{setFailed(true);return}
    const owned:Disposable[]=[];
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setClearColor(0x000000,0);
    renderer.domElement.setAttribute('aria-hidden','true');
    el.appendChild(renderer.domElement);
    const scene=new Scene();
    const camera=new PerspectiveCamera(26,1,.1,50);
    scene.add(new HemisphereLight(0xffffff,0x3a4442,1.25));
    scene.add(new AmbientLight(0xffffff,.25));
    const key=new DirectionalLight(0xffffff,2.2);key.position.set(2.5,3,4);scene.add(key);
    const rim=new DirectionalLight(0x8cff6a,.7);rim.position.set(-3,1.5,-2.5);scene.add(rim);
    const rig=buildRig(scene,x=>owned.push(x));
    const ledColor=new Color();

    const fit=()=>{
      const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);
      renderer.setSize(w,h,false);camera.aspect=w/h;
      // Enquadra cabeça, ombros e peitoral em qualquer proporção (tela larga ou celular em pé).
      const dist=Math.max(4.6,4.5/camera.aspect)/(2*Math.tan(13*Math.PI/180));camera.position.set(0,-1.3,dist);camera.lookAt(0,-1.55,0);camera.updateProjectionMatrix();
    };
    fit();
    const ro=new ResizeObserver(fit);ro.observe(el);

    const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    const samples=new Uint8Array(1024);
    const st={open:0,width:1,round:0,browLift:0,browTilt:0,gazeX:0,gazeY:0,tilt:0,nod:0,lid:1,blink:0,nextBlink:1.5,saccX:0,saccY:0,nextSacc:1,led:0};
    let raf=0,last=performance.now();
    const frame=(now:number)=>{
      const dt=Math.min(.1,(now-last)/1000),t=now/1000;last=now;
      const m=moodRef.current,target=moodTarget(m),talking=m==='speaking'||m==='routing';
      // Boca: áudio real tem prioridade, senão ritmo de sílabas com reforço nos limites de palavra.
      let level=0;
      const a=analyser.current;
      if(a&&talking){const n=Math.min(samples.length,a.fftSize);const view=samples.subarray(0,n);a.getByteTimeDomainData(view);level=levelFromSamples(view)}
      else if(talking){level=reduced?.35:.3+.35*Math.abs(Math.sin(t*14.3))*(.6+.4*Math.sin(t*4.7))}
      pulse.current*=Math.exp(-dt*9);
      const v=viseme.current;
      let open=talking?Math.min(1,level+(a?0:pulse.current*.5))*v.open:0;
      if(talking&&v.closed&&pulse.current>.45)open*=.15;
      st.open=approach(st.open,open,22,dt);
      st.width=approach(st.width,talking?v.width:1,10,dt);
      st.round=approach(st.round,talking?v.round:0,10,dt);
      // Expressão do estado.
      for(const k of ['browLift','browTilt','gazeX','gazeY'] as const)st[k]=approach(st[k],target[k],4,dt);
      st.tilt=approach(st.tilt,target.headTilt,2.5,dt);st.nod=approach(st.nod,target.headNod,2.5,dt);
      st.lid=approach(st.lid,target.lidOpen,6,dt);
      // Piscar e movimentos rápidos dos olhos.
      st.nextBlink-=dt;if(st.nextBlink<=0){st.blink=1;st.nextBlink=2.4+Math.random()*3.2}
      st.blink=Math.max(0,st.blink-dt*7);
      st.nextSacc-=dt;if(st.nextSacc<=0){st.saccX=(Math.random()-.5)*.12;st.saccY=(Math.random()-.5)*.06;st.nextSacc=.8+Math.random()*2.2}
      const motion=reduced?.25:1;
      // Respiração e balanço da cabeça (soma de senos lentos).
      const breath=Math.sin(t*2*Math.PI/4.6);
      rig.torso.scale.y=.85*(1+.015*breath*motion);rig.root.position.y=.012*breath*motion;
      const emph=talking?st.open*.05:0;
      rig.head.rotation.x=st.nod+motion*(.025*Math.sin(t*.53)+.012*Math.sin(t*1.37))-emph;
      rig.head.rotation.y=motion*(.06*Math.sin(t*.31)+.025*Math.sin(t*.87))+st.gazeX*.25;
      rig.head.rotation.z=st.tilt+motion*.018*Math.sin(t*.41);
      // Olhos.
      for(const eye of rig.eyes){eye.rotation.y=st.gazeX+st.saccX*motion;eye.rotation.x=-st.gazeY-st.saccY*motion}
      const closedness=Math.max(1-st.lid,reduced?0:Math.sin(Math.min(1,st.blink)*Math.PI));
      for(const lid of rig.lids)lid.rotation.x=-.62+closedness*1.34;
      // Sobrancelhas: subir e inclinar (tilt positivo sobe a parte interna, preocupação).
      rig.brows.forEach((b,i)=>{const side=i===0?-1:1;b.position.y=.27+st.browLift+(talking?st.open*.012:0);b.rotation.z=Math.PI/2-side*st.browTilt*.5});
      // Boca e mandíbula.
      rig.jaw.rotation.x=st.open*.2;
      rig.mouth.scale.set(.15*st.width*(1-st.round*.25),.012+st.open*.085,.04);
      rig.upperLip.scale.set(1,st.width*(1-st.round*.3),1);rig.lowerLip.scale.set(1,st.width*(1-st.round*.3),1);
      rig.mouthGlow.emissiveIntensity=talking?.25+st.open*1.4:0;
      // Indicadores laterais.
      ledColor.set(target.led);
      const ledI=.7+(target.ledPulse?.5*Math.sin(t*target.ledPulse*Math.PI):0)+(talking?st.open*.8:0);
      for(const led of rig.leds){led.color.copy(ledColor);led.emissive.copy(ledColor);led.emissiveIntensity=ledI}
      renderer.render(scene,camera);
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>{
      cancelAnimationFrame(raf);ro.disconnect();
      for(const x of owned)x.dispose();
      renderer.dispose();renderer.domElement.remove();
    };
  },[]);

  if(failed)return <IllustratedAvatar speaking={mood==='speaking'||mood==='routing'} label={label}/>;
  return <div ref={host} className="ev-avatar3d" role="img" aria-label={label} data-mood={mood}/>;
});
