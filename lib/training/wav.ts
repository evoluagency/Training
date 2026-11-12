// Leitura do cabeçalho WAV no servidor (modo de voz): só RIFF/WAVE PCM 16 bits mono é aceito.
// Duração e taxa vêm do arquivo, nunca do cliente.
export type WavInfo={sampleRate:number;channels:number;bitsPerSample:number;dataBytes:number;durationMs:number};

export function readWavHeader(bytes:Uint8Array):WavInfo|null{
  if(bytes.byteLength<44)return null;
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const tag=(o:number)=>String.fromCharCode(bytes[o],bytes[o+1],bytes[o+2],bytes[o+3]);
  if(tag(0)!=='RIFF'||tag(8)!=='WAVE')return null;
  let o=12,fmt:{format:number;channels:number;sampleRate:number;byteRate:number;blockAlign:number;bits:number}|null=null;
  while(o+8<=bytes.byteLength){
    const id=tag(o),size=v.getUint32(o+4,true),body=o+8;
    if(id==='fmt '){
      if(size<16||body+16>bytes.byteLength)return null;
      fmt={format:v.getUint16(body,true),channels:v.getUint16(body+2,true),sampleRate:v.getUint32(body+4,true),byteRate:v.getUint32(body+8,true),blockAlign:v.getUint16(body+12,true),bits:v.getUint16(body+14,true)};
    }else if(id==='data'){
      if(!fmt||fmt.format!==1||fmt.channels!==1||fmt.bits!==16||fmt.blockAlign!==2||fmt.byteRate!==fmt.sampleRate*2||fmt.sampleRate<=0)return null;
      if(size===0||size%2!==0||body+size>bytes.byteLength)return null;
      return {sampleRate:fmt.sampleRate,channels:1,bitsPerSample:16,dataBytes:size,durationMs:Math.round(size/2/fmt.sampleRate*1000)};
    }
    o=body+size+(size%2);
  }
  return null;
}
