```

### 2.2 Enforced JSON Schemas (`response_schema`)
For structured features such as quiz creation, adaptive assessment, or flashcard generation, enforce exact JSON structure at the API level.

```json
{
  "response_mime_type": "application/json",
  "response_schema": {
    "type": "OBJECT",
    "properties": {
      "question": { "type": "STRING" },
      "options": {
        "type": "ARRAY",
        "items": { "type": "STRING" }
      },
      "correct_index": { "type": "INTEGER" },
      "socratic_explanation": { "type": "STRING" }
    },
    "required": ["question", "options", "correct_index", "socratic_explanation"]
  }
}
```

### 2.3 Task Decomposition (Prompt Chaining)
Break complex learning workflows into sequential micro-prompts rather than issuing one multi-stage prompt:

```
[Student Submission]
       │
       ▼
┌──────────────┐      ┌───────────────────────┐      ┌─────────────────────┐
│ 1. Evaluate  │ ───► │ 2. Determine Mastery  │ ───► │ 3. Generate Next    │
│    Concept   │      │    & Difficulty Level │      │    Socratic Hint    │
└──────────────┘      └───────────────────────┘      └─────────────────────┘
```

---

## 3. Context Caching & Cost Efficiency

### 3.1 Implicit & Explicit Context Caching
Gemini automatically caches static prefix tokens when system prompts and course background materials exceed minimum length thresholds.

* **Cache Layer Structure:** Place massive static context (e.g., entire textbook chapters, syllabus outlines, base Socratic instructions) at the **top** of the payload.
* **Immutability:** Keep static prefixes strictly identical across calls to guarantee maximum cache hits and lower input token costs by 50%–80%.

```
┌───────────────────────────────────────────────────────────┐
│ System Instruction & Course Textbook / Core Syllabus     │  ◄── CACHED (Low Cost & Latency)
├───────────────────────────────────────────────────────────┤
│ Student Interaction History & New Prompt                  │  ◄── DYNAMICALLY PROCESSED
└───────────────────────────────────────────────────────────┘
```

---

## 4. Production Resilience & Architecture

### 4.1 Exponential Backoff & Fault Tolerance
Handle high concurrency and rate-limiting (`429 Too Many Requests`) gracefully:

1. Implement exponential backoff with randomized jitter on all API calls.
2. Maintain failover routing: If `gemini-flash-latest` encounters transient elevated latency or rate limits, seamlessly route non-critical requests to `gemini-2.5-flash` or `gemini-3.5-flash-lite`.

### 4.2 Endpoint Pinning Strategy
* **Development / Staging:** Test against `gemini-flash-latest`.
* **Production Deployment:** Pin to explicitly versioned stable endpoints (e.g., `gemini-2.5-flash`) to guarantee zero breaking changes from automated background model updates.

---

## 5. Actionable Implementation Checklist

- [ ] **Streaming:** Migrate student chat UI from standard HTTP POST to response chunk streaming.
- [ ] **Interactions API:** Update context management to pass `previous_interaction_id` for ongoing sessions.
- [ ] **System Instruction:** Refactor system prompts to separate Persona, Execution Loop, and Guardrails.
- [ ] **JSON Schemas:** Implement `response_schema` parameters on all quiz, diagnostic, and structured data endpoints.
- [ ] **Context Hierarchy:** Organize payloads so static course text always precedes dynamic chat logs to ensure context caching hits.
- [ ] **Resilience:** Wrap client API calls in an exponential backoff loop with automatic failover fallback models.