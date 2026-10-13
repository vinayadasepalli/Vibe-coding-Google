# ☕ Irani Chai & Osmania Biscuit Rush

> **A fast-paced Hyderabadi Irani café-themed time-attack multitasking clicker built with React, TypeScript, Tailwind CSS, and the Web Audio API.**

Inspired by the century-old heritage cafés of Hyderabad (such as Niloufer Café, Café Nimrah facing the Charminar, and Sarvi), this browser game challenges players to multitask across two bustling café counter stations before the clock runs out.

---

## 🎮 Dual-Station Side-by-Side Gameplay

The game presents two action stations simultaneously side-by-side:

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│     ZONE 1: OSMANIA BISCUIT CATCHER    │      ZONE 2: CHAI SAMOVAR BREWERY      │
│  (Left Station - Catch falling snacks) │     (Right Station - Rapid brewing)    │
│                                        │                                        │
│  🍪 Classic Osmania:      +10 pts      │  🫖 Heritage Copper Boiler             │
│  🌟 Golden Osmania:       +25 pts, +2s │  🥛 Cutting Glass Tumbler (0% -> 100%) │
│  🥛 Malai Glazed:         +15 pts, Cmb │  ☕ Pour Tap Button: +50 pts per cup   │
│  🔥 Burnt Hazard:         DODGE (-10)  │  ⚡ In-Run Counter Upgrades            │
│                                        │                                        │
│  ════════════[ BRASS PLATE ]═════════  │  ═══════════[ POUR BUTTON ]══════════  │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

### 1. Left Station: Osmania Biscuit Catcher
- **Catching Mechanism**: Glide an ornate traditional Hyderabadi brass thali/plate along the bottom countertop.
- **Biscuits**:
  - **Classic Osmania Biscuit** (+10 pts): Buttery, sweet-salty biscuit with iconic scalloped rim.
  - **Golden Royal Osmania** (+25 pts & +2.0s Time Bonus): Saffron-glazed rarity; keeps the timer alive!
  - **Malai Glazed Biscuit** (+15 pts): Infused with clotted cream; accelerates combo level.
  - **Burnt Kadak Biscuit** (-10 pts & combo reset): Dodge this hazard! Do not catch it on the plate.
- **Counter Floor Miss**: Letting edible biscuits crash onto the marble countertop drops your active combo by 1.

### 2. Right Station: Chai Samovar Brewery
- **Brewing Mechanism**: Rapidly tap the brass spigot or press `[Spacebar]` / `[Enter]` to pour steaming hot tea into the traditional cutting glass.
- **Glass Fill**: Watch the amber tea and creamy malai foam rise to 100%.
- **Cup Served Triumph**: Each completed cup awards **+50 base points**, rings the service bell, releases steam, and levels up your combo multiplier.
- **Counter Perks (Upgrades)**:
  - *Spigot Level*: Increases fill percentage per tap.
  - *Elaichi Blend*: Grants +20 bonus points per cup.
  - *Chotu Auto-Tap*: An apprentice helper that auto-pours every 0.8s.

---

## ⚡ Combos & The "Dunk Synergy"

- **Combo Multiplier (1x to 5x)**: Sustained rapid pours and plate catches multiply all incoming points up to 5x.
- **Dunk in Chai! (2x Double Points)**: Catching an Osmania biscuit within 2.2 seconds of serving a hot cup of chai triggers the legendary Hyderabadi *“Dunked in Chai!”* 2x multiplier toast.

---

## 🧑‍🍳 5-Stage Barista Avatar Progression

As your score rises in real time, your café character avatar evolves across 5 historical Hyderabadi stages:

| Stage | Avatar Rank | Score Range | Title & Lore |
|:---:|:---|:---:|:---|
| **1** | 🧑‍🍳 **Chai Chotu** | 0 – 199 | Counter apprentice learning the art of the pour and plate movement. |
| **2** | ⚡ **Cutting Pro** | 200 – 449 | Rapid server balancing scalding glass tumblers with two hands. |
| **3** | 🎖️ **Table Ustaad** | 450 – 799 | Seasoned café barista catching falling biscuits with effortless finesse. |
| **4** | 👑 **Café Baadshah** | 800 – 1199 | Heritage maestro commanding the boiling copper samovar with lightning speed. |
| **5** | 🌟 **Sultan of Samovars** | 1200+ | Royal Nizam master and legend of Charminar Irani café culture! |

---

## ⌨️ Controls & Multi-Device Mechanisms

| Action | Mouse / Touch Mechanism | Keyboard Shortcut |
|:---|:---|:---|
| **Move Brass Plate** | Move cursor horizontally across Left Zone / Drag on touch | `[←]` `[→]` or `[A]` `[D]` |
| **Pour Chai Tap** | Click large Pour Tap button / Tap on screen | `[Spacebar]` or `[Enter]` |
| **Pause / Resume** | Click in-game Pause button | `[P]` |
| **Return to Home** | Click Home icon in in-game HUD | `[Esc]` |
| **End Game** | Click End button in in-game HUD | — |
| **Toggle Music** | Music note button in top navigation bar | — |
| **Toggle Sound FX** | Speaker button in top navigation bar | — |

---

## 🎵 Procedural Web Audio API Engine

All sound effects and ambient music are synthesized on the fly via the browser's native **Web Audio API** with zero external audio files:
- **Biscuit Crunch**: Filtered bandpass noise + decaying triangle oscillator.
- **Golden Biscuit**: Royal 5-note pentatonic sitar/celeste arpeggio (Raag Bhupali).
- **Chai Served Bell & Steam**: High-Q resonant bell chime + highpass noise steam hiss.
- **Urgency Clock**: Woodblock ticks during final 10 seconds.
- **Ambient Café Music Loop**: Soothing multi-track Indian acoustic loop featuring:
  - Tanpura root drone on D3 & A3 with gentle chorus detuning.
  - Tabla / Matka rhythm pulse (deep bass 'Ghe' and high rim 'Tin' at 78 BPM).
  - Plucked acoustic Santoor/Sitar raga melody.
  - Simmering brass samovar steam ambiance.

---

## 🏛️ Hyderabadi Irani Café Cultural Lore

- **The Samovar**: Unlike standard milk tea, authentic Irani chai is slow-steeped in large cylindrical copper and brass samovars. The black tea decoction (*kahwa*) and sweetened condensed milk (*malai*) are brewed separately and combined directly inside the glass tumbler upon order.
- **The Osmania Biscuit**: Named after Mir Osman Ali Khan (the 7th Nizam of Hyderabad). Originally crafted in the kitchens of Nizamia Hospital, it balances a mild salty crust with buttery sweetness, designed specifically to be dipped into hot cutting chai.

---

## 🚀 Technical Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Sound**: Web Audio API (Zero dependencies, offline resilient)
- **Effects**: Canvas Confetti
- **Storage**: LocalStorage for high score persistence
