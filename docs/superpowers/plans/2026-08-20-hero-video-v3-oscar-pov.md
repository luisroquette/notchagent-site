# Hero Video v3 — POV cinematográfico (lapidação em loop)

**Goal:** substituir as cenas de tela estática do hero por câmera em primeira pessoa (os olhos de quem usa o Mac), com transições de câmera e grading de cinema. Objetivo declarado do usuário: "algo digno do Oscar".

**Loop:** /goal — pelo menos 10 passadas + 2 rodadas consecutivas sem melhorias relevantes.

## Iteration log

- **P1 (arco emocional):** clímax cedo, resolução longa ✓; melhoria: o card "YOUR TOKENS JUST RAN OUT." entra por CORTE SECO após o clipe A (fadeblack suavizava o susto). Clipe A ganha "pull back and rest" (mãos param — o susto vem do corte).
- **P2 (prompt engineering Seedance):** "dark code editor" pode gerar texto ilegível → "unreadable blurred code". Reforçar "no watermark, no captions". Iluminação mista (lâmpada quente + brilho frio da tela nas mãos) = mais cinematográfico. Lente explícita: 35mm f/1.8.
- **P3 (cinematografia POV):** movimentos motivados pelo olhar: A = leve tilt de cabeça pra baixo; B = o olhar sobe do teclado, SEGURA no gauge e deriva (sacada curta); C = push-in como quem se inclina pra frente. Foreground desfocado, tela nítida (f/1.8).
- **P4 (transições):** A→card = CUT seco; card→gravação real = iris-out (circleopen); gravação→B = pan lateral (slideleft); B→gravação = iris; gravação→C = pan; C→end card = dissolve longo 0.8s; end card com zoom lento (zoompan 1.0→1.06).
- **P5 (grading):** eq=contrast=1.04:saturation=0.92 + colorbalance (sombras azuladas, realces quentes) + vignette + grain 5 + letterbox 2.39:1. Coral preservado (não saturar).
- **P6 (ritmo silencioso):** timeline: A 5s → card 1.6s → real 6s → B 5s → real 6s → C 4s → end 3.5s ≈ 29.5s total com overlaps. Loop seam: fade in/out preto. Poster no frame ~1.2s (dentro de A).
- **P7 (fidelidade):** gauge descrito geometricamente ("small rounded rectangles, coral, last two segments green") — igual ao app real (verde acima de 25%). Gravações reais continuam sendo a prova; POV = encenação de contexto, não dados.
- **P8 (riscos/fallbacks):** mãos = ponto fraco do Seedance → "hands mostly at rest, one finger taps" em C; em A, mãos só na borda inferior. Gerar 2 variantes por prompt (count 2) e escolher por visão. Se o gauge sair errado: reuso do clipe v2 (já aprovado).
- **P9 (tempos exatos):** offsets recalculados para xfade circleopen/slideleft/fade com durações 0.4–0.5s; total ≤ 30s; ≤ 2.5MB; crf 23.
- **P10 (a11y/entrega):** aria-label reescrito pra narrativa POV; prefers-reduced-motion → pausa o autoplay (poster estático); muted+playsinline mantidos.
- **P11 (releitura seca):** sem achados relevantes.
- **P12 (releitura seca):** sem achados relevantes. **Loop fechado** (10 passadas com melhorias + 2 secas).

## Prompts finais (aprovados no loop)

**A — O problema:**
> First-person point of view shot, the camera is the eyes of a developer sitting at a desk at night: a MacBook Pro screen fills the frame showing a softly glowing dark editor window with unreadable blurred code, warm desk lamp light from the left mixing with cool screen light on the hands, the developer's hands rise from the bottom edge of frame and type briefly, then pull back and rest, shallow depth of field f/1.8, 35mm lens, subtle handheld sway, slight head tilt down, anamorphic lens flare, cinematic film grain, teal-and-amber grade, photorealistic, no text, no watermark, no captions

**B — A descoberta:**
> First-person point of view shot, the camera is the eyes of a person using a MacBook Pro at night: the view tilts up from the blurred keyboard toward the top edge of the screen, inside the black notch cutout glows a thin horizontal segmented fuel gauge made of small rounded rectangles, vivid coral orange with the last two segments green, the camera holds still on the gauge for a moment then drifts gently, warm practical light, cool screen glow, 35mm lens f/1.8, subtle handheld, cinematic film grain, premium tech commercial lighting, photorealistic, no people, no text, no watermark

**C — O alívio:**
> First-person point of view shot from behind a developer at a desk at night: the MacBook screen shows a dark dashboard with thin coral progress bars, the developer's hands rest at the bottom edge of frame, mostly still, one finger taps a key, slow push-in toward the screen like leaning forward, warm desk lamp, shallow depth of field, cinematic film grain, teal-and-amber grade, photorealistic, no readable text, no watermark

## Montagem v3

A (5s) → CUT → card "YOUR TOKENS JUST RAN OUT." (1.6s, zoom 1.0→1.05) → IRIS → gravação real erro (6s) → PAN → B (5s) → IRIS → gravação real NotchAgent (6s) → PAN → C (4s) → DISSOLVE 0.8s → end card (3.5s, zoom lento). Grading global: contrast 1.04, sat 0.92, sombras frias/realces quentes, grain 5, vinheta, letterbox 2.39:1. Silencioso, loop com fade preto, ≤2.5MB.
