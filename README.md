# Purelearn.ai

**An AI tutor made exactly for you.** 
Purelearn.ai dynamically adapts text to eliminate cognitive friction for neurodivergent learners. As a Socratic tutor, it guides students step-by-step rather than handing out direct answers.

---

## Inspiration
Today's students are overwhelmed, juggling disconnected apps—ChatGPT for answers, Notion for notes, Anki for flashcards—and constantly fighting formatting issues. For STEM students, copying a math equation from an AI chat to a notebook often results in broken, unreadable code. For neurodivergent learners (ADHD, Dyslexia), traditional dense academic text creates massive cognitive friction, leading to exhaustion before deep learning even begins.

Current AI tutors treat education like a simple chat interface. We believe it should be a cohesive, highly accessible workspace.

## What it does
**Purelearn.ai** is an AI-powered learning environment—a specialized "Notion for Learning"—that integrates generative artificial intelligence directly into a student’s study workflow. It seamlessly blends a conversational AI tutor with a robust, academic-grade rich text editor, allowing students to dynamically generate materials, create flashcards, and curate quizzes directly from their personal notes.

### Core Features
- **Deep Academic Formatting & Unbreakable Math**: A custom, highly resilient KaTeX/Markdown editor specifically engineered for STEM. Purelearn physically embeds MathML annotations so mathematical integrity is preserved during copy-paste operations.
- **Neuro-Inclusive Design Architecture**: A specialized presentation layer engineered to dynamically structure textual data. For ADHD, we use targeted typographical weighting. For Dyslexia, we deploy calibrated kerning, leading, and specialized fonts.
- **The Frictionless "Chat-to-Note" Pipeline**: Eradicates the "copy-paste" mental tax. With a single click, users can escalate a conversational AI explanation into a beautifully formatted study note.
- **True Textual Control & Socratic AI**: We give students absolute control over their materials through a genuine Rich Text Editor, guided by a Socratic AI methodology that fosters deep cognitive synthesis and actual comprehension.

## How we built it
Building an academic-grade AI-powered study environment required utilizing the most sophisticated generative models to handle complex semantic understanding, context retention, and specialized educational prompting. We specifically leveraged two major LLM systems:

* **GPT-5.6 for Socratic Cognitive Interactions**: We leveraged **GPT-5.6** to act as the primary brain of the conversational tutor. Thanks to its advanced reasoning capabilities, GPT-5.6 powers the Socratic methodology—instead of just giving the answer, it analyzes the student's prompt, identifies conceptual blind spots, and generates incremental hints. GPT-5.6 also handles the intricate task of reading users' long-form study notes and extracting highly accurate flashcards and targeted practice exams.
* **OpenAI Codex for Unbreakable Math & Formatting**: To solve the notorious problem of WYSIWYG LaTeX editing and math formatting, we utilized **Codex**. We relied on Codex to assist in structuring the logic of our underlying Markdown parsing engine. It empowered our system to cleanly intercept HTML DOM structures and guarantee flawless re-parsing of academic content, preserving complex tables, matrices, and nested equations between the chat interface and the rich text editor.

*Tech Stack*: React 18, TypeScript, TailwindCSS, Supabase (PostgreSQL, Auth), Google Cloud, and edge networking via Vercel/Cloudflare.

## Challenges we ran into
The hardest challenge was solving the copy-paste mathematical integrity problem. Most text editors completely break when transporting heavily nested LaTeX equations from an AI chat interface into a static document. Furthermore, prompting the AI models to **not** give the direct answer—but instead act as a strict Socratic tutor—required extensive prompt engineering and rigorous testing of the GPT-5.6 output schemas to ensure it always prioritized scaffolding over direct answers.

## Accomplishments that we're proud of
We are incredibly proud of our **Adaptive Cognitive Rendering Engine**. Seeing a massive, dense block of academic text instantly transform into a visually digestible format tailored specifically for ADHD or Dyslexic learners was a huge milestone. We've successfully bridged the gap between passive reading and active, neuro-inclusive learning.

## What we learned
We learned that achieving a truly "frictionless" user experience in EdTech requires a delicate balance between strict UI constraints and robust AI capabilities. Working with **GPT-5.6** taught us the immense power of deterministic output schemas for generating flashcards. Working with **Codex** highlighted how AI can be explicitly targeted to solve highly specific parsing anomalies in complex tree structures (like Markdown/MathML ASTs) that traditional Regex would fail to handle.

## What's next for purelearn.ai
Our roadmap focuses on expanding our multimodal and collaborative capabilities:
- **Multimodal Ingestion**: Integrating audio transcription to allow users to upload recorded lectures for instant summarization.
- **Automated Spaced Repetition (SRS)**: Implementing a native Anki-style algorithm to track flashcard recall rates and schedule optimized study sessions.
- **Collaborative Study Rooms**: Real-time multiplayer editing (via WebSockets/CRDTs) where multiple students can inhabit the same note space, querying the AI tutor collectively to solve complex group assignments.

---

*© 2026 purelearn.ai. All rights reserved.*
