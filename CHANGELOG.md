# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Connected
- **Social Media & Community Links**: Connected footer links to external profiles on Twitter / X ([@CybeReazon](https://x.com/CybeReazon)), GitHub ([@EmmaTheDev01](https://github.com/EmmaTheDev01)), and Discord ([EmmaTheDev](https://discord.com/users/939201208235741184)).
- **Community Discord Integration**: Direct link to the official Discord server from the Community page.

## [1.7.0] - 2026-09-24

### Added
- **Resend Email Broadcast System**: Integrated Resend API with serverless Edge Functions (`send-email` and `send-transactional-email`) for scalable email dispatch.
- **Admin Email Broadcast Studio (`AdminEmailBroadcasts.tsx`)**: Full administrative suite featuring:
  - Real-time Markdown live editor & HTML preview.
  - Recipient segmentation filters (All Users, Verified Students, Approved Educators, Administrators).
  - Batching and queue management with real-time delivery status feedback.
  - Broadcast history log with recipient count, delivery metrics, and timestamp tracking.
- **Transactional Welcome Emails**: Automated trigger dispatching personalized onboarding emails with student getting-started guides upon registration.
- **Database Migrations for Email Logging**: Created `email_broadcasts` log table with RLS security policies and administrative controls (`20260924170000_email_broadcasts.sql`).

### Fixed
- **System Settings RLS**: Fixed permissions and row-level security on `system_settings` to ensure administrator write access for broadcast configuration (`20260924173500_fix_system_settings_rls.sql`).

## [1.6.0] - 2026-09-23

### Added
- **Socratic Audio Dialogue Assistant (`SocraticAudioModal.tsx`)**:
  - Spoken collaborative breakdown of study materials and chat history using browser-native Speech Synthesis.
  - Dual-role collaborative pedagogy: Lead Explainer (`mentor`) and Analytical Deep-Diver (`analyst`).
  - Voice ranking heuristics with automatic selection of natural and high-clarity OS voices.
  - Dual UI display: Full-screen interactive dialogue modal with live speaker waveform and seekable timeline scrubber.
  - Non-blocking docked mini-player (`SocraticAudioMiniPopup`) positioned above chat input for seamless multitasking.
- **In-Chat Quick Command System (`@`)**:
  - Interactive command shortcuts: `@quiz`, `@flashcards`, `@audio`, and `@all`.
  - Floating autocomplete palette with keyboard navigation (`Tab` and arrow keys) and instant trigger execution in `src/routes/app.index.tsx`.
- **Landing Page Modern Features Showcase**: Dynamic interactive showcase of Audio Notes, Scratchpad, and Command shortcuts on `src/routes/index.tsx`.

## [1.5.0] - 2026-09-22

### Added
- **Tablet & iPad Native Scratchpad (`/app/notepad`)**:
  - Touch- and stylus-optimized freehand digital notepad with Apple Pencil pressure sensitivity and palm rejection.
  - Drawing toolbar (`ScratchpadToolbar.tsx`) with pen, highlighter, eraser, color swatches, grid/blank backgrounds, undo/redo, and canvas image export.
  - **Socratic AI Drawer (`SocraticDrawer.tsx`)**: AI engine that analyzes handwritten math equations and diagrams, providing step-by-step Socratic hints without spoiling answers.
- **Interactive Guided App Tour (`InteractiveAppTour.tsx`)**: Step-by-step interactive onboarding modal introducing students to core platform tools.
- **SEO & Google Search Console Optimization**:
  - Comprehensive metadata, OpenGraph tags, Twitter card tags, and canonical URLs.
  - Generated `sitemap.xml`, `robots.txt`, and web manifest (`site.webmanifest`).

### Changed
- **Homepage Theme Normalization**: Standardized public marketing pages to a consistent clean dark/neutral aesthetic while retaining theme customizability within the authenticated portal.

## [1.4.0] - 2026-09-10

### Added
- **Persistent Daily Study Streaks (`lib/streak.ts`)**:
  - Timezone-aware streak continuity tracking with database synchronization against the secure cloud database.
  - Milestone streak multiplier badges and reward notifications.
- **Hick's Law Cognitive Gamification**:
  - Streamlined study choices to reduce cognitive fatigue for neurodiverse students.
  - Celebratory reward loops with dynamic confetti animations and sound feedback (`lib/celebration.ts`).
  - Full suite of bespoke vector achievement badges (`svg-badges.tsx`).
- **Strict Study Material Isolation**:
  - Flashcard sets and notes isolated strictly to the authenticated student for complete data privacy.
  - Material-bound quiz loops that track mastery percentages per document.

### Fixed
- **Analytics NaN Tooltip**: Resolved division-by-zero calculation causing `NaN` in Subject Focus chart tooltips (`src/routes/app.analytics.tsx`).
- **Subscription Upsert Conflict**: Replaced raw inserts with idempotent upsert queries on the `subscriptions` table to eliminate duplicate key violation errors.
- **Admin Dashboard Layout**: Resolved JSX mapping brace mismatch syntax error in admin metrics.

## [1.3.0] - 2026-07-25

### Added
- **Low Light Mode Theme**: Amber/sepia-tinted dark background designed to alleviate eye strain and reduce harsh blue light contrast.
- **Theme Persistence**: Theme preferences saved directly to the cloud profile (`profiles.theme_preference`), syncing automatically across user devices.
- **Dark Mode Color Tokens**: Extended CSS variable design system with `--elevated`, `--card`, `--popover`, and full dark/low-light palettes.
- **KaTeX Mathematical Formula Rendering**: Full block (`$$`) and inline (`$`) LaTeX formatting with math syntax highlighting.

### Fixed
- **Dropdown Backgrounds**: Unified header dropdown panels (Notifications, Cognitive Mode, User Menu) with `bg-popover`.
- **ADHD Chat Contrast**: Fixed hardcoded contrast styles in ADHD bubble mode with `text-primary-foreground`.
- **Card Styling**: Switched `Card` components to semantic `bg-card` for theme consistency.

## [1.2.0] - 2026-07-16

### Added
- **Google OAuth Authentication**: One-tap sign-in with Google, automatic profile avatar retrieval, and account synchronization.
- **Cognitive Accessibility Profiles**: ADHD bionic reading, Dyslexia-friendly typography, and Sensory Low-Stimulus calm reading modes.
- **Educator Verification System**: Administrative verification workflow and credential verification for educator accounts.

## [1.1.0] - 2026-06-28

### Added
- **Digital Note-Taking Engine**: Isolated note-taking panels with automatic Markdown-to-HTML formatting, live autosave, and export.
- **Peer Note Sharing**: Secure invite links with read-only permission enforcement.
- **XSS Sanitization**: Hardened markdown sanitization filters protecting against injection attacks in custom notes.

## [1.0.0] - 2026-06-10

### Added
- **Initial Platform Launch**:
  - Socratic AI conversational tutor powered by Google Gemini.
  - Document upload and synthesis for PDF, Markdown, and text study materials.
  - Flashcard generation and spaced repetition study engine.
  - TanStack Start SSR routing with secure cloud authentication and Row Level Security.
