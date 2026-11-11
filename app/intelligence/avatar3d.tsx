'use client';
// Avatar humanoide 3D ORIGINAL do EVOLU Intelligence, em tempo real no navegador (three, MIT).
// Construído em código (sem modelo externo): casco claro, rosto grafite, olhos com pálpebras, sobrancelhas,
// mandíbula articulada, pescoço segmentado e ombros. Indicadores laterais em lima (identidade do Training).
// Pisca, respira, mexe cabeça e sobrancelhas. A boca segue o volume do áudio real quando há um AnalyserNode
// (voz gerada no navegador) e, sem ele, o ritmo de sílabas e os limites de palavra da voz do navegador.
// Sem WebGL, cai no avatar ilustrado.
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {
  AmbientLight,CapsuleGeometry,LatheGeometry,SplineCurve,Vector2,Color,CylinderGeometry,DirectionalLight,Group,HemisphereLight,Mesh,MeshStandardMaterial,
  PerspectiveCamera,Scene,SphereGeometry,TorusGeometry,WebGLRenderer,type BufferGeometry,type Material,
} from 'three';
import {IllustratedAvatar} from './avatar';
import {NEUTRAL_VISEME,approach,levelFromSamples,moodTarget,visemeFor,type AvatarMood,type Viseme} from './avatar-motion';

export type Avatar3DHandle={word:(w?:string)=>void;setAnalyser:(a:AnalyserNode|null)=>void};

type Rig={
  root:Group;head:Group;jaw:Group;torso:Mesh;
  eyes:Group[];lids:Mesh[];brows:Mesh[];
  mouth:Mesh;mouthGlow:MeshStandardMaterial;upperLip:Mesh;lowerLip:Mesh;
  leds:MeshStandardMaterial[];
};

function buildRig(scene:Scene,track:(x:BufferGeometry|Material)=>void):Rig{
  const mat=(color:string,o:Partial<{rough:number;metal:number;emissive:string;ei:number}>={})=>{
    const m=new MeshStandardMaterial({color:new Color(color),roughness:o.rough??.5,metalness:o.metal??.1});
    if(o.emissive){m.emissive=new Color(o.emissive);m.emissiveIntensity=o.ei??1}
    track(m);return m;
  };
  const geo=<G extends BufferGeometry>(g:G)=>{track(g);return g};
  const shell=mat('#e8eae4',{rough:.42,metal:.08}),shellShade=mat('#c9cdc6',{rough:.5}),face=mat('#1c2221',{rough:.45,metal:.2});
  const lid=mat('#2b3231',{rough:.35,metal:.2}),graphite=mat('#3a4241',{rough:.55,metal:.2}),dark=mat('#101413',{rough:.6});
  const sclera=mat('#eef2ea',{rough:.25,emissive:'#eef2ea',ei:.12}),iris=mat('#13201a',{rough:.2,metal:.3});
  const mouthGlow=mat('#0e1210',{rough:.6,emissive:'#d8fc63',ei:0});
  const ledL=mat('#7f9c45',{emissive:'#7f9c45',ei:.8}),ledR=mat('#7f9c45',{emissive:'#7f9c45',ei:.8});

  const root=new Group();scene.add(root);
  // Ombros e peito.
  const torso=new Mesh(geo(new CapsuleGeometry(.42,1.5,12,32)),graphite);torso.rotation.z=Math.PI/2;torso.scale.set(1,1,.75);torso.position.set(0,-1.92,-.12);root.add(torso);
  const chest=new Mesh(geo(new SphereGeometry(1,48,24)),graphite);chest.scale.set(1.05,.75,.6);chest.position.set(0,-2.35,-.08);root.add(chest);
  const plate=new Mesh(geo(new SphereGeometry(1,48,24)),shellShade);plate.scale.set(.5,.38,.2);plate.position.set(0,-2.05,.42);root.add(plate);
  // Pescoço segmentado.
  const neck=new Mesh(geo(new CylinderGeometry(.2,.25,.8,32)),graphite);neck.position.set(0,-1.3,-.05);root.add(neck);
  for(const y of [-1.08,-1.24,-1.4]){const r=new Mesh(geo(new TorusGeometry(.215+(-1.08-y)*.1,.016,10,40)),dark);r.rotation.x=Math.PI/2;r.position.set(0,y,-.05);root.add(r)}
  // Cabeça (pivô no topo do pescoço).
  const pivot=new Group();pivot.position.set(0,-.95,0);root.add(pivot);
  const head=new Group();head.position.set(0,.95,0);pivot.add(head);
  // Perfil de cabeça humana (testa larga, mandíbula afinando) girado em torno do eixo vertical.
  const profile=[[0,1],[.45,.92],[.72,.65],[.82,.3],[.8,0],[.74,-.35],[.6,-.65],[.42,-.88],[.2,-1],[0,-1.02]].reverse().map(([x,y])=>new Vector2(x,y));
  const headGeo=geo(new LatheGeometry(new SplineCurve(profile).getPoints(64),72));headGeo.computeVertexNormals();
  const cranium=new Mesh(headGeo,shell);cranium.scale.set(1,1,.92);head.add(cranium);
  const faceMesh=new Mesh(headGeo,face);faceMesh.scale.set(.78,.8,.88);faceMesh.position.set(0,-.12,.16);head.add(faceMesh);
  const crest=new Mesh(geo(new CapsuleGeometry(.05,.9,8,16)),shellShade);crest.rotation.x=Math.PI/2;crest.position.set(0,.98,-.05);head.add(crest);
  // Laterais com indicador de estado.
  const leds=[ledL,ledR];
  [-1,1].forEach((side,i)=>{
    const pod=new Mesh(geo(new CylinderGeometry(.2,.22,.16,40)),shellShade);pod.rotation.z=Math.PI/2;pod.position.set(side*.79,.02,0);head.add(pod);
    const ring=new Mesh(geo(new TorusGeometry(.13,.028,12,40)),leds[i]);ring.rotation.y=Math.PI/2;ring.position.set(side*.875,.02,0);head.add(ring);
  });
  // Olhos (globo que gira para olhar) e pálpebras superiores e inferiores.
  const eyes:Group[]=[],lids:Mesh[]=[],brows:Mesh[]=[];
  for(const side of [-1,1]){
    const socket=new Group();socket.position.set(side*.24,.08,.8);head.add(socket);
    const eye=new Group();socket.add(eye);eyes.push(eye);
    eye.add(new Mesh(geo(new SphereGeometry(.1,32,24)),sclera));
    const ir=new Mesh(geo(new SphereGeometry(.055,32,16)),iris);ir.scale.z=.35;ir.position.z=.092;eye.add(ir);
    const glint=new Mesh(geo(new SphereGeometry(.014,12,8)),mat('#ffffff',{emissive:'#ffffff',ei:1}));glint.position.set(.017,.018,.109);eye.add(glint);
    const upper=new Mesh(geo(new SphereGeometry(.114,32,16,0,Math.PI*2,0,Math.PI/2)),lid);socket.add(upper);lids.push(upper);
    const lower=new Mesh(geo(new SphereGeometry(.112,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2)),lid);lower.rotation.x=.72;socket.add(lower);
    const brow=new Mesh(geo(new CapsuleGeometry(.024,.15,6,12)),shell);brow.rotation.z=Math.PI/2;brow.position.set(side*.24,.27,.8);head.add(brow);brows.push(brow);
  }
  // Boca: cavidade com brilho lima ao falar, lábio superior fixo e inferior na mandíbula.
  const mouth=new Mesh(geo(new SphereGeometry(1,32,16)),mouthGlow);mouth.position.set(0,-.4,.8);mouth.scale.set(.15,.012,.04);head.add(mouth);
  const upperLip=new Mesh(geo(new CapsuleGeometry(.018,.26,6,12)),shellShade);upperLip.rotation.z=Math.PI/2;upperLip.position.set(0,-.37,.82);head.add(upperLip);
  const nose=new Mesh(geo(new CapsuleGeometry(.022,.12,6,12)),lid);nose.position.set(0,-.13,.86);head.add(nose);
  const jaw=new Group();jaw.position.set(0,-.2,.25);head.add(jaw);
  const lowerLip=new Mesh(geo(new CapsuleGeometry(.018,.22,6,12)),shellShade);lowerLip.rotation.z=Math.PI/2;lowerLip.position.set(0,-.255,.56);jaw.add(lowerLip);
  const chin=new Mesh(geo(new SphereGeometry(1,32,16)),lid);chin.scale.set(.22,.07,.1);chin.position.set(0,-.42,.45);jaw.add(chin);
  return {root,head:pivot,jaw,torso:chest,eyes,lids,brows,mouth,mouthGlow,upperLip,lowerLip,leds};
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
    const owned:(BufferGeometry|Material)[]=[];
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setClearColor(0x000000,0);
    renderer.domElement.setAttribute('aria-hidden','true');
    el.appendChild(renderer.domElement);
    const scene=new Scene();
    const camera=new PerspectiveCamera(26,1,.1,50);
    scene.add(new HemisphereLight(0xf2f5ee,0x1b2020,1.1));
    scene.add(new AmbientLight(0xffffff,.25));
    const key=new DirectionalLight(0xffffff,2.2);key.position.set(2.5,3,4);scene.add(key);
    const rim=new DirectionalLight(0xd8fc63,.9);rim.position.set(-3,1.5,-2.5);scene.add(rim);
    const rig=buildRig(scene,x=>owned.push(x));
    const ledColor=new Color();

    const fit=()=>{
      const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);
      renderer.setSize(w,h,false);camera.aspect=w/h;
      // Enquadra cabeça e ombros em qualquer proporção (tela larga ou celular em pé).
      const dist=w/h<.8?12.5:9.4;camera.position.set(0,-.3,dist);camera.lookAt(0,-.55,0);camera.updateProjectionMatrix();
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
      rig.torso.scale.y=.75*(1+.02*breath*motion);rig.root.position.y=.012*breath*motion;
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
