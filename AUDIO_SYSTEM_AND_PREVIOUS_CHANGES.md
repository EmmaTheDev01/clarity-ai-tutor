# Audio System Architecture & Complete Development Changelog

This document provides an in-depth technical explanation of the **Audio Notes & Socratic Dialogue System**, followed by a chronological record of all previous platform changes, milestones, and architectural improvements.

---

## Part 1: How the Audio System Works

The Audio system in **Clarity AI Tutor** transforms written study materials, uploaded documents, and tutor chat discussions into a spoken, collaborative educational breakdown. It utilizes browser-native speech synthesis with AI-generated multi-speaker scripts, sophisticated voice-ranking heuristics, and dual UI playback modes.

### 1. Architectural Overview & Component Map

The audio feature is centered around three primary layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interaction Layer                          │
│   • @audio command in Chat      • Study Tools Bar                      │
│   • Note Card Action Button     • Interactive Chat Action Card         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    useSocraticAudio Hook & Engine                      │
│  - Session state (isPlaying, speed, active turn, available voices)     │
│  - LocalStorage audio cache (`notes_audio_v4_*`)                       │
│  - Web Speech API integration (window.speechSynthesis)                 │
│  - Voice ranking heuristics (natural/neural voice prioritization)      │
│  - Pronunciation cleaner (strips markdown & TTS artifacts)             │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────┐  ┌─────────────────────────────────┐
│     Full Modal Interface          │  │       Docked Mini-Player        │
│   [SocraticAudioModal.tsx]        │  │     [SocraticAudioMiniPopup]    │
│  - Full script transcript view    │  │  - Positioned above chat input  │
│  - Voice customization drawer     │  │  - Non-blocking multitasking    │
│  - Seekable timeline scrubber     │  │  - Compact playback controls    │
│  - Speaker waveform animation     │  │  - Scrubber & expand action     │
└───────────────────────────────────┘  └─────────────────────────────────┘
```

#### Key Files

- [`src/components/SocraticAudioModal.tsx`](file:///Users/macbook/Documents/Dev/clarity-ai-tutor/src/components/SocraticAudioModal.tsx): Core audio engine, custom hook `useSocraticAudio`, full modal, and mini-player.
- [`src/routes/app.index.tsx`](file:///Users/macbook/Documents/Dev/clarity-ai-tutor/src/routes/app.index.tsx): Integration with dashboard chat, `@audio` / `@all` command handling, and docked mini-player mounting.
- [`src/lib/gemini.ts`](file:///Users/macbook/Documents/Dev/clarity-ai-tutor/src/lib/gemini.ts): Gemini API structured schema generation for the dual-speaker dialogue.
- [`src/routes/index.tsx`](file:///Users/macbook/Documents/Dev/clarity-ai-tutor/src/routes/index.tsx): Landing page interactive demo and feature showcase.

---

### 2. Dialogue Generation & Prompt Engineering

When audio is initiated, the system aggregates the active note content, recent tutor explanations from the chat history, and any user-specified focus instructions. It then invokes Gemini (`generateGeminiStructured`) with strict pedagogical instructions:

1. **Explanation Only — Zero Q&A**:
   - The dialogue is strictly explanatory. Neither speaker interrogates the user or quizzes them.
   - Both speakers act as collaborative educators breaking down concepts for the listener.
2. **Two Complementary Pedagogical Roles**:
   - **Lead Explainer / Guide (`mentor`)**: Introduces high-level concepts, definitions, intuition, and relatable real-world analogies.
   - **Deep Dive Analyst (`student`)**: Unpacks mechanics, step-by-step logic, technical nuances, edge cases, and practical applications.
3. **Structured JSON Output**:
   The LLM returns an array of turns matching the schema:
   ```typescript
   interface SocraticTurn {
     speaker: "mentor" | "student";
     roleName: string; // e.g. "Guide" or "Analyst"
     text: string; // 2-3 engaging, conversational spoken sentences
   }
   ```
4. **Caching & Replay**:
   - Dialogue turns are cached in browser `localStorage` using a versioned key based on material ID and content signature (`notes_audio_v4_${materialId}_${contentSig}`).
   - Instant playback on subsequent visits without re-querying the API.
   - Built-in graceful offline fallback dialogue if network or API limits occur.

---

### 3. Voice Selection & Natural Speech Ranking

Browser `speechSynthesis` voices vary widely across platforms (macOS, Windows, iOS, Android, Linux). To avoid metallic and robotic voices, `SocraticAudioModal.tsx` implements custom scoring heuristics:

#### Anti-Robotic Blacklist

Filters out legacy novelty synths (e.g., _Albert_, _Bad News_, _Bahh_, _Bells_, _Boing_, _Cellos_, _Deranged_, _Fred_, _Zarvox_, non-enhanced _Alex_).

#### Inquirer & Mentor Scoring Heuristics

- **Neural & High-Fidelity Boost**: Voices containing `"natural"`, `"premium"`, `"enhanced"`, or `"neural"` receive +120 to +140 points.
- **Remote Neural Services**: Remote engines (`!voice.localService`, e.g., Google US English or Microsoft Online Natural) receive extra priority.
- **Role Differentiation**:
  - **Mentor (Guide)**: Prioritizes mature, authoritative neural voices like _Google UK English Male_, _Daniel_, _Oliver_, _Samantha_, or _Serena_.
  - **Analyst (Student)**: Prioritizes expressive, inquisitive voices like _Ava_, _Zoe_, _Jenny_, _Aria_, _Evan_, or _Nathan_, ensuring the two speakers sound distinct.
- **User Customization**: Users can open the Voice Settings drawer to manually select and test voices, persisted in `localStorage` under `socratic_mentor_voice` and `socratic_student_voice`.

---

### 4. Spoken Text Sanitization (`cleanSpokenText`)

Raw markdown or technical text causes speech synthesis engines to stutter or pronounce punctuation. The `cleanSpokenText` utility cleans text prior to speech:

- Strips markdown formatting (bold `**`, italics `*`, backticks `` ` ``, markdown links).
- Removes stage directions (e.g., `(pauses)`, `(curiously)`).
- Converts dashes (`—`, `–`) into comma pauses (`, `) for natural breathing cadences.
- Expands abbreviations phonetically (`e.g.` $\rightarrow$ "for example", `i.e.` $\rightarrow$ "that is", `etc.` $\rightarrow$ "etcetera").
- Collapses consecutive punctuation and whitespace.

---

### 5. Playback Engine & Audio State

The `useSocraticAudio` hook maintains state synchronization:

- **Cadence & Pitch**: Utterance pitch is locked strictly at `1.0` to prevent metallic DSP distortion. Speaking rate is calibrated to standard human cadence (`0.85x` - `1.15x`, default `0.96x`).
- **Conversational Pauses**: When a turn completes (`utterance.onend`), a `400ms` setTimeout pause is inserted before the next speaker responds, simulating natural human turn-taking.
- **Auto-Scroll Sync**: As each turn begins, the transcript automatically scrolls the active turn card smoothly into view (`scrollIntoView({ behavior: "smooth", block: "nearest" })`).
- **Full Scrubbing**: Both the modal and mini-player include an interactive range scrubber allowing the user to click or drag to jump to any section of the audio breakdown.

---

### 6. Dual-Interface Experience

#### Mode A: Full-Screen Socratic Modal (`SocraticAudioModal`)

- Displays the complete transcript with speaker badges and live soundwave indicators.
- Allows clicking any turn in the transcript to jump playback directly to that segment.
- Features speed toggles (`0.8x`, `1.0x`, `1.1x`, `1.25x`), restart, mute, and voice customization.
- **Minimize to Background**: Closing the modal via the "X" does **not** stop the audio. Instead, it minimizes into the docked mini-player.

#### Mode B: Docked Mini-Player (`SocraticAudioMiniPopup`)

- Mounts directly above the chat input box in the main application shell.
- Allows students to continue reading notes, asking the AI tutor questions, or typing math formulas while audio continues uninterrupted.
- Includes playback controls, current speaker label, quote preview, progress scrubber, expand button (re-opens full modal), and close button (stops audio and dismisses player).

---

### 7. In-Chat `@audio` Command & Triggers

Audio can be launched from multiple touchpoints:

1. **Chat `@` Command**: Typing `@audio` (or selecting it from the `@` autocomplete popup) compiles notes and recent tutor responses and immediately launches playback.
2. **`@all` Command**: Generates Quiz, Flashcards, and Audio simultaneously.
3. **Study Tools Menu**: Quick action button located in the dashboard utility header.
4. **Learning Material Cards**: Action menu item on any uploaded document or note.
5. **Interactive Chat Cards**: Action buttons inside AI response message cards.

---

## Part 2: Complete Project Changelog & Previous Changes

Below is the complete chronological history of platform updates, architectural additions, and bug fixes across all 53 git commits.

### Phase 1: Audio System, @ Commands & Landing Showcase (Sep 23, 2026)

- **Commit `13ba241`** (`audio integration and commands`):
  - Created [`src/components/SocraticAudioModal.tsx`](file:///Users/macbook/Documents/Dev/clarity-ai-tutor/src/components/SocraticAudioModal.tsx) (1,180+ lines) introducing speech synthesis, dual-role audio dialogues, voice ranking heuristics, and dual modal/mini-player modes.
  - Implemented the in-chat `@` commands system (`@quiz`, `@flashcards`, `@audio`, `@all`) with floating autocomplete popup, keyboard navigation (`Tab` / arrow keys), and execution handlers in [`src/routes/app.index.tsx`](file:///Users/macbook/Documents/Dev/clarity-ai-tutor/src/routes/app.index.tsx).
  - Added the `ModernFeaturesShowcase` component on the landing page highlighting Audio Notes, Tablet Scratchpad, and Command Shortcuts in [`src/routes/index.tsx`](file:///Users/macbook/Documents/Dev/clarity-ai-tutor/src/routes/index.tsx).

### Phase 2: SEO, Homepage Aesthetics & Tablet Scratchpad (Sep 22, 2026)

- **Commit `77cd797`** (`Added search keywords`):
  - Configured meta search keywords, structured SEO tags, and search engine indexing guidelines in `SEARCH_CONSOLE_SETUP.md`.
- **Commit `321d047`** (`Removed theme changing from homepage`):
  - Standardized the public landing page to a unified dark/neutral aesthetic while keeping theme switching inside the authenticated app.
- **Commit `12d7190`** (`Added scratchpad for brainstormin that is native for ipads and tablets users`):
  - Built a native touch/stylus canvas scratchpad optimized for iPads and tablets with Apple Pencil support, allowing students to sketch math derivations and brainstorming diagrams.

### Phase 3: Streaks, Analytics & Bug Fixes (Sep 7 – Sep 10, 2026)

- **Commit `ff1d384`** (`Added the consistent streak count`):
  - Created persistent daily streak calculation and database synchronization (`lib/streak.ts`), accounting for UTC vs local timezone shifts and streak continuity.
- **Commit `6a90cf7`** (`fix(analytics): resolve NaN on hover in Subject Focus chart tooltip`):
  - Resolved division-by-zero causing `NaN` in analytics chart tooltips when hovering over subjects with no prior study logs.
- **Commit `2a89bec`** (`fix(subscriptions): eliminate unique constraint duplicate key violation on subscribe`):
  - Replaced raw insert queries with idempotent upsert operations on the `subscriptions` table to prevent duplicate key crashes.
- **Commit `d6ec21e`** (`fix(admin): resolve JSX map closing brace syntax error`):
  - Fixed syntax and bracket mismatches in admin dashboard metric mapping.
- **Commit `01665a4`** (`Fixed some issues`):
  - Minor stability and type fixes across dashboard components.

### Phase 4: Gamification, Badges & Hick's Law Engagement (Sep 7, 2026)

- **Commit `b368ffa`** (`added accurate badge counting and subscriptions logic`):
  - Real-time badge counter auditing and premium tier check logic.
- **Commit `90e159a`** (`Added the real badge display and showing of user only flashcards`):
  - Enforced strict user-isolation on flashcards and introduced real badge rendering using SVG badges.
- **Commit `b7ea372`** (`Added Hicks law and made sure the system applies rewarding mechanism and makes learning more engaging and more smart`):
  - Applied Hick's Law to UI design: streamlined chat options to reduce decision fatigue, introduced celebratory reward triggers, confetti animations, and milestone celebrations.

### Phase 5: Socratic Guidance, Chat Animations & Skeletons (Sep 5, 2026)

- **Commit `fc3b6f5`** (`Fixed socratic guidance and added smooth chat animation`):
  - Refined AI prompt system instructions to prioritize inquiry-based guidance over direct answers.
  - Implemented smooth message entry animations for streaming chat bubbles.
- **Commit `ec0610e`** (`added skeleton for loading`):
  - Added shimmer skeleton loaders for learning materials, notes lists, and quiz generation states.
- **Commit `302ded5`** (`Fixed UI issues and data rendering issues`):
  - Fixed chat scroll anchor jumps and layout shifts during response streaming.

### Phase 6: Responsive Layouts & Demo Request Flow (Sep 4, 2026)

- **Commit `d15b97c`** (`Added fixes for content overflowing container`):
  - Corrected mobile viewport overflow on code blocks and wide mathematical equations.
- **Commit `d80d74e`** (`Added logo reset scrolls`):
  - Configured navbar logo click to smoothly scroll to top on landing pages.
- **Commit `5c6945d`** (`Fixed issue with scroll indicator and footer bg text`):
  - Improved contrast and positioning for the scroll indicator and footer background watermark.
- **Commit `a6fd4ac`** (`Fixed the request demo from modal to page and as well made sure the arrows are added on request demo button`):
  - Converted demo request interaction into a dedicated page with styled animated arrow buttons.
- **Commit `7c59e31`** (`Added noticable features such as UI fix scroll animations and added get demo`):
  - Added scroll-triggered reveal animations (`ScrollReveal`) and demo access buttons.

### Phase 7: Math Formatting, KaTeX & Deployments (Aug 13 – Sep 1, 2026)

- **Commit `3572847`** (`Added vercel json file`):
  - Configured `vercel.json` routing rewrites for TanStack Start SSR/SPA navigation.
- **Commit `b8ffb97`** (`fixed the closing braces issue on documents`):
  - Syntax fixes for document card rendering.
- **Commit `9e51133`** (`Fixed cards export name`):
  - Fixed flashcard export component names and imports.
- **Commit `ba2de17`** (`Fixed the formatting and look of the whole notes and color coding for programminbg syntaxes.`):
  - Added KaTeX mathematical formula rendering ($\LaTeX$) and language-specific syntax highlighting for code blocks.

### Phase 8: Cognitive Accessibility & Markdown Engine (Jul 20 – Jul 21, 2026)

- **Commit `c98efdc`** (`Added markdown and fixed responsiveness and appearance menu`):
  - Integrated rich markdown rendering with support for cognitive accessibility modes (ADHD bionic reading, Dyslexia fonts, Sensory calm mode).
- **Commit `8e09c9d`** (`Added the edirects and htaccess`):
  - Added Apache `.htaccess` redirects and static routing rules.

### Phase 9: Google OAuth, Dynamic XP & Profiles (Jul 16 – Jul 17, 2026)

- **Commit `e1d1142`** (`removed hardcoded logs`):
  - Cleaned up console debugging logs from production bundles.
- **Commit `af48a21`** (`added dynamic xp and fixed bugs on user avatar`):
  - Real-time XP tracking for chat interactions, study completions, and avatar profile display fixes.
- **Commit `05f406e`** (`Added xp tracking`):
  - Created base XP accumulation mechanisms in user state.
- **Commit `66f7025`** (`Added google login and restyled the heaaers`):
  - Integrated Supabase Google OAuth sign-in and refreshed navigation headers.
- **Commit `bf1c056`** (`Added readme and some few changes`):
  - Documented base project structure and dependencies.
- **Commit `281409d`** (`Added some new UI features and fixed the sidebar dropdown menu`):
  - Fixed mobile drawer interactions and user avatar menus.

### Phase 10: In-Chat Formatting & Foundation (Jul 9 – Jul 14, 2026)

- **Commits `8005dc8`, `6fca1de`, `35a68d2`, `2715c47`, `5fbfb0f`**:
  - Implemented in-chat message markdown formatting, collapsible note cards, and legal footer pages.
- **Commit `93842d1`** (`Added new features to handle notifications and fixed RLS policies affecting the system`):
  - Set up in-app notification bell system and hardened Supabase Row Level Security (RLS) policies for user data protection.
- **Commits `05b1ae8`, `808e5d7`, `ae67a37`, `3f80dac`**:
  - Initialized project with TanStack Start, TypeScript, and Tailwind CSS design tokens.
  - Implemented initial static UI shell, mock datasets, and landing hero section.
