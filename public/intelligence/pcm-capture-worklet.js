// Captura PCM do modo de voz: copia o canal 0 da entrada em blocos de 4096 amostras e manda para a página.
// Sem processamento: o áudio sai como chegou do microfone (eco, ruído e ganho automático desligados na página).
class EvoluPcmCapture extends AudioWorkletProcessor{
  constructor(){super();this.buf=new Float32Array(4096);this.n=0;this.on=true;
    this.port.onmessage=e=>{if(e.data==='flush'){this.send();this.port.postMessage('flushed')}else if(e.data==='stop'){this.send();this.on=false}}}
  send(){if(this.n>0){this.port.postMessage(this.buf.slice(0,this.n));this.n=0}}
  process(inputs){const ch=inputs[0]&&inputs[0][0];
    if(ch){let i=0;while(i<ch.length){const k=Math.min(ch.length-i,this.buf.length-this.n);this.buf.set(ch.subarray(i,i+k),this.n);this.n+=k;i+=k;if(this.n===this.buf.length)this.send()}}
    return this.on}
}
registerProcessor('evolu-pcm-capture',EvoluPcmCapture);
