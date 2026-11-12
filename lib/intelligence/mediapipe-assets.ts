// Arquivos do MediaPipe servidos pelo próprio Training (public/intelligence/mediapipe), sem CDN de terceiros.
// O modelo fica versionado. O WASM é copiado de node_modules por scripts/mediapipe-assets.mjs, que confere estes SHA-256.
// Licença: Apache 2.0 (pacote @mediapipe/tasks-vision e os três modelos do face_landmarker, conforme os cartões dos modelos).
export const MEDIAPIPE={
 lib:'@mediapipe/tasks-vision',
 version:'1.2.2',
 base:'/intelligence/mediapipe',
 wasm:{dir:'/intelligence/mediapipe/wasm',files:{'vision_wasm_internal.js':'f2b9c17131ea79716ec6bf07b117a087b2749a6f8a1e2f1f2e77a9382092db5b','vision_wasm_internal.wasm':'f5bd25147ac89d506074293ce2675969b10e827180db95a0d9689c2ed80764ab'}},
 face:{
  file:'face_landmarker.task',path:'/intelligence/mediapipe/face_landmarker.task',
  sha256:'64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',bytes:3758596,
  source:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  // Conteúdo do .task: detector BlazeFace (curta distância), Face Mesh V2 (478 pontos) e Blendshape V2 (52 expressões).
  cards:['MediaPipe BlazeFace Model Card (Short Range)','Model Card MediaPipe Face Mesh V2','Model Card Blendshape V2'],
  license:'Apache-2.0',
 },
} as const;
