# AFTERHOURS — Rhythm Club

A standalone four-lane rhythm game inspired by dance arcade games, with original synthesized music, 20 original instrumental tracks, three difficulties, hold notes, simultaneous steps on Hard, timing judgements, combo effects, ratings and separate local records for each track/difficulty.

## Run

`npm start` → http://127.0.0.1:5180/

No runtime dependencies. Node.js 18+ serves the browser files. `npm test` checks chart playability and scoring; `npm run build` produces a static `dist/` suitable for hosting.

## Controls

Left / Down / Up / Right, or A / S / W / D. Hold long notes until their tail reaches the hit line. Click/touch the four pads for touch play. Enter starts; Escape/P pauses. Switching tabs or windows automatically pauses. On resume there is a 300 ms grace period to re-grab active hold notes. Track and difficulty changes are locked during play; choose another track from the pause screen to abandon a run.

## Music and timing

Twenty original 96-beat instrumental compositions in Piano Pop, Acoustic, Disco and Chill, ranging from 92–128 BPM. The melodies, harmony and arrangement live in `tracks.js` and `scripts/render-music.mjs`. Piano (stretched partials, double strings, hammer), FM electric piano, Karplus-Strong guitar, marimba, FM bell, breathy flute, band-limited synth plucks, sub bass and detuned-saw pads/strings are synthesized without third-party samples, along with a full synthesized kit (kick, snare, clap, rim, hats, shaker, tambourine, toms, crash). Each genre has its own comping (pop piano, strummed guitar, disco stabs with octave bass, laid-back Chill keys), groove and swing. Each stereo MP3 has an intro, verse, bridge with a riser, a chorus with harmony and arpeggios, fills at every phrase end where the chart breathes, and a final chord. The mix uses kick sidechain on harmony and bass, a ping-pong delay, a Freeverb-style room, bus compression, mastering EQ and two-pass loudness matching to about -14.8 LUFS. BPM and the 96-beat length are unchanged, so charts stay on the beat. Audio is served locally from `audio/` (~21 MiB total); the game decodes the selected file with Web Audio and keeps at most three tracks cached. No third-party recordings are included. A four-beat count-in precedes each chart. Audio scheduling and gameplay share AudioContext.currentTime; suspending the context pauses both. The library supports title search, genre filtering, and 12-second chorus/verse previews; starting gameplay or changing tracks cancels previews. Volume and ±150 ms timing offset are available in Sound & timing. Positive offset compensates for consistently late input. Wired headphones are recommended; Bluetooth latency varies.

Perfect ±55 ms / Great ±105 ms / Good ±180 ms; later is a miss. Scores: 1000/800/500 per judgement unit. A hold has a head and a tail; releasing more than 100 ms early misses the tail. Empty taps cost 50 points, reset the combo and reduce accuracy. Accuracy is weighted successful units / (judged units + 0.2 × stray taps). S ≥97%, A ≥90%, B ≥80%, C ≥65%, otherwise D. No fail-out: finish the track and improve next time.

High scores are local-only, separated by track and difficulty. No online leaderboard or account connection is included. The game needs browser audio support and a click/key to activate sound. Optional Google Fonts have system fallbacks.


## Soft light edition

An off-white page with four large, blurred color fields that drift slowly. Each genre has its own palette (Piano Pop peach/rose/butter/lilac, Acoustic mint/sky/sage/sand, Disco pink/violet/aqua/peach, Chill periwinkle/lavender/teal/rose); colors cross-fade when you change tracks, and the light breathes slightly on each beat (motion stops with reduced motion). The album card, track list and pads follow the track color, and the side panels are frosted glass. The stage is a deep ink dance floor with glowing arrows, lane light beams, hit rings and a pulsing hit line. The scrollable 20-song library stays compact on desktop and becomes a horizontal strip on phones. All 60 track/difficulty combinations have separate local best scores.

To re-render the original music, run `npm run music:render` with FFmpeg installed (`npm run music:render -- <track-id>` renders one track). This writes final MP3s to `audio/` and temporary raw renders under `/private/tmp/afterhours-audio/`; FFmpeg is not needed to play the game. `audio/render-report.json` records source duration, peak and RMS. Music enjoyment is subjective: use the preview button to choose a style.
