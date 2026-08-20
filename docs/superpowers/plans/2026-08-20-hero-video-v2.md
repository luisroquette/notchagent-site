# Hero Video v2 — EN, solution-forward, cinematic

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the notchagent.app hero video entirely in English, showing the NotchAgent solution with more screen time, in a 2.39:1 cinematic letterbox montage.

**Architecture:** Narrative montage assembled with ffmpeg: Higgsfield Seedance clip (the problem — MacBook, night) → beat card "YOUR TOKENS JUST RAN OUT." → real recording of the credits error → beat card "NOTCHAGENT SEES WHAT'S LEFT." → Higgsfield clip of the notch gauge glowing (the discovery) → real recording of NotchAgent reporting → Ken Burns product still → English end card. Silent, autoplay-muted-loop-safe (fade from black, fade to black), film grain + vignette + letterbox.

**Tech Stack:** Higgsfield MCP (`seedance_2_5`, 5s, 1080p, no audio) · ffmpeg (xfade, fadeblack, zoompan, noise, vignette, pad) · Pillow (beat/end cards) · vision-gpt (frame validation).

## Global Constraints

- All on-screen text in **English** (cards, end card).
- **Silent**: no audio track (`-an`).
- Output: `public/videos/hero.mp4`, 1600×1030 canvas, content band 1600×670 (2.39:1), ≤ 2.5 MB, ~28 s.
- Palette (page tokens): ink `#1A1524`, coral `#FF654F`, lilac `#C9A7FF`, cream `#F5F2FA`.
- Poster: `public/img/hero-poster.jpg` from frame at ~2 s.
- Video element aria-label in `public/index.html` must describe the new narrative.
- Guards (`npm test`) stay green; `data-download` untouched.

---

### Task 1: Higgsfield clip A — the problem (MacBook at night)

**Files:** produces `/tmp/macbook2.mp4`

- [ ] **Step 1: Generate with Higgsfield MCP** (`generate_video`, model `seedance_2_5`, duration 5, resolution 1080p, aspect_ratio 16:9, generate_audio false):

> Cinematic 35mm film shot: a MacBook Pro open on a dark wooden desk at night, the screen glowing softly with a code editor, a developer's hands typing, warm practical lamp key light from the left, deep shadows, shallow depth of field, slow dolly-in, subtle film grain, teal-and-amber grade, photorealistic, no text overlays

- [ ] **Step 2: Poll** `job_status` until completed; download to `/tmp/macbook2.mp4`.
- [ ] **Step 3: Validate** one frame at 2.5 s via vision-gpt (MacBook present, no hand/typing anomalies).

### Task 2: Higgsfield clip B — the discovery (notch gauge)

**Files:** produces `/tmp/notch-clip.mp4`

- [ ] **Step 1: Generate with Higgsfield MCP** (same params as Task 1):

> Cinematic product commercial close-up of a MacBook Pro display's top edge and black notch cutout at night: a thin horizontal segmented fuel gauge of small glowing rectangles sits inside the notch, segments lit vivid coral orange with the last segments green, glowing softly against the dark screen, warm rim light on the laptop edge, shallow depth of field, subtle camera drift, film grain, photorealistic, premium tech commercial lighting, no people, no text

- [ ] **Step 2: Poll + download to `/tmp/notch-clip.mp4`.
- [ ] **Step 3: Validate** one frame via vision-gpt (glowing gauge inside a notch-like cutout; accept if close, else fall back to Ken Burns on `public/img/notch-compact.png` — see Task 4 fallback).

### Task 3: Beat and end cards (English, Pillow)

**Files:** creates `public/img/hero2-tokens.png`, `public/img/hero2-meet.png`, `public/img/hero2-end.png` (all 1600×670, ink background)

- [ ] **Step 1: Write the card script**

```bash
python3 - <<'EOF'
from PIL import Image, ImageDraw, ImageFont
W,H = 1600,670
F_BIG   = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 118)
F_MID   = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 64)
F_SMALL = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 40)
INK=(26,21,36); CORAL=(255,101,79); LILAC=(201,167,255); CREAM=(245,242,250)
def card(path, lines):
    img = Image.new('RGB',(W,H),INK); d = ImageDraw.Draw(img)
    y = H/2 - sum(l[1]==118 for l in lines)*60 - 40
    for text,size,color in lines:
        f = F_BIG if size==118 else F_MID if size==64 else F_SMALL
        b = d.textbbox((0,0),text,font=f)
        d.text(((W-b[2]-b[0])/2,y),text,font=f,fill=color)
        y += b[3]-b[1] + (30 if size==118 else 18)
    img.save(path)
card('/Users/luisroquette/Projects/notchagent-site/public/img/hero2-tokens.png',
     [('YOUR TOKENS',118,CORAL),('JUST RAN OUT.',118,CORAL)])
card('/Users/luisroquette/Projects/notchagent-site/public/img/hero2-meet.png',
     [('NOTCHAGENT',118,CORAL),('SEES WHAT IS LEFT.',118,CREAM)])
card('/Users/luisroquette/Projects/notchagent-site/public/img/hero2-end.png',
     [('NotchAgent',64,CREAM),('Your AI fuel gauge.',40,LILAC),('Free for macOS  ·  Download free',40,(167,159,181))])
print('cards ok')
EOF
```

- [ ] **Step 2: Run and verify** the three PNGs exist at 1600×670.

### Task 4: Assembly (ffmpeg montage)

**Files:** produces `public/videos/hero.mp4`, `public/img/hero-poster.jpg`

Sources: [0] `/tmp/macbook2.mp4` (5 s) · [1] `hero2-tokens.png` (loop 1.6 s) · [2] `public/videos/credits-gone.mp4` trim 43.5:49.5 · [3] `hero2-meet.png` (loop 1.6 s) · [4] `/tmp/notch-clip.mp4` (5 s) · [5] `public/videos/notchagent-reports.mp4` trim 26:32 · [6] `public/img/now-cards.png` (Ken Burns, 3 s) · [7] `hero2-end.png` (loop 3.5 s)

- [ ] **Step 1: Run assembly**

```bash
ffmpeg -y -loglevel error \
 -i /tmp/macbook2.mp4 -loop 1 -t 1.6 -i public/img/hero2-tokens.png \
 -i public/videos/credits-gone.mp4 -loop 1 -t 1.6 -i public/img/hero2-meet.png \
 -i /tmp/notch-clip.mp4 -i public/videos/notchagent-reports.mp4 \
 -loop 1 -t 3 -i public/img/now-cards.png -loop 1 -t 3.5 -i public/img/hero2-end.png \
 -filter_complex "\
[0:v]scale=1600:900,crop=1600:670:0:115,fps=30,setsar=1[a];\
[1:v]scale=1600:670,fps=30,format=yuv420p[b];\
[2:v]trim=43.5:49.5,setpts=PTS-STARTPTS,scale=1600:670:force_original_aspect_ratio=increase,crop=1600:670:0:60,fps=30,setsar=1[c];\
[3:v]scale=1600:670,fps=30,format=yuv420p[d];\
[4:v]scale=1600:900,crop=1600:670:0:115,fps=30,setsar=1[e];\
[5:v]trim=26:32,setpts=PTS-STARTPTS,scale=1600:670:force_original_aspect_ratio=increase,crop=1600:670:0:0,fps=30,setsar=1[f];\
[6:v]scale=1600:-1,zoompan=z='min(1.08,1+0.08*on/90)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1600x670:fps=30[g];\
[7:v]scale=1600:670,fps=30,format=yuv420p[h];\
[a][b]xfade=transition=fadeblack:duration=0.4:offset=4.6[x1];\
[x1][c]xfade=transition=fadeblack:duration=0.4:offset=6.0[x2];\
[x2][d]xfade=transition=fadeblack:duration=0.4:offset=11.6[x3];\
[x3][e]xfade=transition=fade:duration=0.5:offset=12.8[x4];\
[x4][f]xfade=transition=fade:duration=0.5:offset=17.3[x5];\
[x5][g]xfade=transition=fade:duration=0.5:offset=22.8[x6];\
[x6][h]xfade=transition=fade:duration=0.5:offset=25.3[x7];\
[x7]noise=alls=5:allf=t,vignette=PI/5,pad=1600:1030:0:180:color=0x1A1524,fade=t=in:st=0:d=0.5,fade=t=out:st=28.3:d=0.5[v]" \
 -map "[v]" -an -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -movflags +faststart \
 public/videos/hero.mp4
```

- [ ] **Step 2: Verify** duration ≈ 28.8 s and size ≤ 2.5 MB (`ffprobe`, `ls -la`).
- [ ] **Step 3: Poster** — `ffmpeg -y -loglevel error -ss 2 -i public/videos/hero.mp4 -frames:v 1 -q:v 3 public/img/hero-poster.jpg`

### Task 5: Validation, page copy, ship

- [ ] **Step 1: Vision check** frames at 1 s, 5.3 s, 9 s, 14 s, 19 s, 24 s via vision-gpt: clips in order, cards EN, letterbox present, solution beats visible.
- [ ] **Step 2: Update aria-label** in `public/index.html` hero video to describe the v2 narrative (English text on cards).
- [ ] **Step 3: Tests** — `npm test` (guards green).
- [ ] **Step 4: Commit + push**

```bash
git add public/videos/hero.mp4 public/img/hero-poster.jpg public/img/hero2-*.png public/index.html docs/superpowers/plans/2026-08-20-hero-video-v2.md
git commit -m "feat(video): v2 hero — English, solution-forward, 2.39:1 cinematic"
git push origin main
```

---

## Iteration log (writing-plans loop)

- **Round 1 (initial):** plan above.
- **Round 2:** improvements applied — (a) solution screen time: D trimmed to 6 s, E+B+F+G give 15+ s of solution vs 5 s problem; (b) per-source crop offsets fixed (credits panel `y=60`, notch recording `y=0`); (c) clip B prompt tightened ("no people, no text", geometric gauge description); (d) loop seam: fade in from black at start, fade out to black at end; (e) fallback defined if clip B fails fidelity (Ken Burns on `notch-compact.png`); (f) grain/vignette added after letterbox pad so bars stay clean.
- **Round 3:** improvements applied — (a) added Task 5 aria-label update (spec: page must not describe the old video); (b) end-card CTA copy aligned to page ("Download free"); (c) poster extraction pinned to 2 s (inside clip A, warm frame); (d) `fadeblack` only on the two dramatic beats, plain `fade` elsewhere.
- **Round 4:** dry — no substantial improvements found (self-review: spec coverage complete, no placeholders, names consistent).
- **Round 5:** dry — no substantial improvements found. **Loop closed.**
- **Round 6 (execução):** bug real encontrado em Task 4 — `pad=1600:670` em fonte 16:9 não encolhe ("Padded dimensions cannot be smaller than input dimensions"). Fix aplicado: `crop=1600:670:0:115` para os clipes 16:9. Comando do Task 4 atualizado acima.
