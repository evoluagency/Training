# Captação do capacitador em dois modos (rascunho 0.1)

Data: 14/11/2026. Sessão 1.16. Substitui a ideia de "sessão B só de tronco" do HANDOFF-1.15. Desenho a partir das decisões do proprietário em 14/11. Nada aqui foi implementado ainda.

## 1. Resumo

| | Modo selfie | Modo afastado |
|---|---|---|
| Para quê | voz, entonação e expressões do rosto, juntas | movimento do corpo e formato (silhueta, busto, braços, mãos) |
| Câmera | frontal, celular na mão ou apoiado, perto do rosto | traseira, com outra pessoa ou tripé |
| Áudio | sim, é a gravação de voz | não |
| Rosto | sim, com giros e olhares pedidos frase a frase | só um trecho curto de textura do rosto |
| Quem vê a tela | o próprio capacitador | o ajudante. O capacitador recebe orientação por som |
| Reaproveita | página e servidor da sessão A e do estúdio de voz | mesma página e servidor, com as trilhas de corpo e mãos |

O piloto usa da cintura para cima. O corpo inteiro é gravado mesmo assim, para não precisar repetir depois.

## 2. Modo selfie: voz e rosto na mesma tomada

### Fluxo de cada frase
1. A tela mostra a frase e uma instrução de rosto (exemplo: "vire um pouco para a direita e olhe para o horizonte").
2. Antes de gravar, a página confere enquadramento, luz e volume, e orienta até ficar bom.
3. O capacitador fala. Durante a fala a página mede o rosto e o áudio.
4. Ao terminar, a tomada recebe uma etiqueta com o que aconteceu de fato.
5. A voz decide se regrava. O rosto nunca reprova a tomada, só muda o que será pedido nas próximas.

As 200 frases do bloco A continuam válidas. O modo conjunto vale para as 400 que faltam (B 250, C 60, D 40, E 30, F 20).

### O que é medido
| Medida | De onde vem | Uso |
|---|---|---|
| Giro e inclinação da cabeça | matriz de posição do leitor de rosto (o mesmo da sessão A) | etiqueta de ângulo |
| Direção dos olhos | coeficientes de olhar do leitor de rosto | saber se o olho acompanhou o rosto ou ficou na câmera |
| Tamanho do rosto no quadro | pontos do rosto | "aproxime" ou "afaste" |
| Luz e contraluz | brilho médio do rosto contra o fundo | "procure mais luz", "a luz está atrás de você" |
| Nitidez e tremor | variação entre quadros | "apoie o celular" |
| Pico, volume e ruído do áudio | medidor que o estúdio de voz já tem | "áudio estourado", "fale mais perto" |
| Diferença para o padrão da voz | comparação simples de volume e timbre com as frases do bloco A | reduzir o ângulo pedido se o giro estiver mudando a voz |

### Mapa de cobertura
Em vez de aprovar ou reprovar o rosto, a página mantém um mapa do que já foi captado:

- giro: esquerda forte, esquerda leve, frente, direita leve, direita forte
- inclinação: para baixo, reto, para cima
- olhar: na câmera, acompanhando o rosto
- expressão: neutra, sorrindo, séria, dúvida, ênfase

Cada tomada preenche a casa que realmente aconteceu. A instrução da próxima frase vem da casa mais vazia. Exemplo do proprietário: pediu-se rosto à direita com olhar acompanhando, e a pessoa virou o rosto mas manteve o olho na câmera. A tomada entra na casa "direita, olhar na câmera", que também é útil, e a casa "direita, olhar acompanhando" continua na fila.

Regras do mapa:
- cerca de metade das frases de frente, para proteger a qualidade da voz
- giros começam moderados (até uns 30 graus). Se a comparação com o padrão da voz ficar boa, o mapa libera ângulos maiores. Se ficar ruim, recua
- voz ruim é o único motivo para pedir regravação

### Orientação em tempo real
Mensagens curtas na tela, uma por vez, na ordem: rosto fora do quadro, distância, luz, tremor, volume. A orientação falada só toca entre as tomadas, nunca durante, para não entrar na gravação da voz.

### Arquivos
Guardados separados, como o proprietário pediu:
- áudio da frase, no formato que o estúdio de voz já usa
- trilha do rosto (trilha-0.1, tipo `face`) e marcações (tipo `marks`) com a etiqueta da tomada
- vídeo bruto, mantido enquanto valer a regra de não apagar nada nos testes

## 3. Modo afastado: corpo e formato

### Montagem
Celular em pé, câmera traseira, a 2 ou 3 metros, corpo inteiro no quadro com folga. Tripé ou outra pessoa segurando. Como a tela fica virada para o outro lado, a orientação ao capacitador sai por voz e por sinais sonoros, e o ajudante vê a tela.

### Roteiro proposto
| Bloco | O que se grava | Para quê |
|---|---|---|
| 1. Formato | parado de frente, braços um pouco abertos, e um giro lento completo | silhueta e proporções |
| 2. Roupa | o bloco 1 duas vezes: com roupa justa e lisa, e com a roupa habitual | separar corpo de roupa, para trocar roupas depois |
| 3. Postura | parado como quem ouve, como quem explica, troca de apoio | repouso natural do avatar |
| 4. Gestos de aula | cerca de 20 gestos: apontar, enumerar nos dedos, abrir as mãos, "mais ou menos", chamar, pausar | biblioteca de gestos |
| 5. Mãos de perto | os mesmos gestos a 1,2 ou 1,5 metro, da cintura para cima | a 3 metros as mãos ficam pequenas demais para leitura fina |
| 6. Rosto de perto | 20 a 30 segundos de rosto com a câmera traseira, girando devagar | textura de pele, barba e cabelo em melhor resolução |
| 7. Marcas | tatuagens e sinais visíveis, um a um | características da pessoa |

### Trilhas
As trilhas `pose` e `hands` já existem no formato trilha-0.1. O servidor já aceita. A página de captação precisa ganhar o leitor de corpo e o de mãos.

## 4. Ficha de aparência do capacitador

Tudo o que descreve a pessoa fica numa ficha com versão: rosto, cabelo, barba, formato do corpo, marcas. O capacitador pode abrir uma nova versão quando achar que mudou, regravando só os blocos afetados (por exemplo, só o rosto de perto depois de tirar a barba).

Roupa fica fora da ficha, como camada trocável. Isso abre a possibilidade de parceria ou patrocínio com marcas de roupa, registrada como ideia futura.

## 5. Vídeo bruto: guardar ou apagar

Guardar por enquanto. As trilhas guardam movimento, não aparência. Pele, barba, cabelo e tatuagem só existem nas imagens, e refazer o avatar com um modelo melhor exige o original. Rever quando o avatar com a aparência do proprietário estiver aprovado. A partir daí é possível guardar só a ficha e as trilhas, e apagar o bruto.

## 6. O que precisa de aceite ou revisão

- **Nova versão da training-api**, se a etiqueta da tomada precisar de campo novo no servidor. Ainda não aceita. Alternativa sem publicar: guardar a etiqueta dentro da trilha `marks`, que o servidor já aceita.
- **Termo de consentimento.** Corpo, tatuagens e marcas são dado pessoal sensível. O termo de captação (rascunho-0.1) precisa cobrir isso, com revisão do advogado.
- **Preview novo** para testar no celular de verdade. Ainda não aceito.

## 7. Ordem de construção sugerida

1. Teste de 10 frases no modo selfie com a página atual adaptada, comparando o áudio com o do bloco A.
2. Etiqueta da tomada e mapa de cobertura (funções puras, testáveis, sem servidor novo).
3. Orientação em tempo real de enquadramento, luz e volume.
4. Modo afastado: leitor de corpo e mãos, roteiro dos sete blocos.

## 8. Sobre "ninguém faz isso"

Pesquisa rápida de 14/11/2026: HeyGen e Tavus criam o avatar a partir de um vídeo curto com roteiro e dicas de luz e silêncio. A Synthesia grava em estúdio no plano personalizado. Não encontrei evidência de orientação corretiva em tempo real durante a gravação, nem de voz e rosto captados juntos com mapa de cobertura. Isso não prova que não existe. Antes de usar em material de venda, conferir a documentação desses fornecedores ou testar os fluxos.

Fontes:
- [HeyGen: como criar um gêmeo digital](https://www.heygen.com/blog/how-to-create-digital-twin-avatar)
- [HeyGen: instant avatar](https://www.heygen.com/tool/instant-avatar-maker)
- [Synthesia: comparação com HeyGen, Tavus e Anam](https://www.synthesia.io/post/synthesia-vs-heygen-vs-tavus-vs-anam)
