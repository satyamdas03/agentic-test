# Changelog

All notable changes to `agentic-test` will be documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

---

## [v2.0.0](https://github.com/satyamdas03/agentic-test/releases/tag/v2.0.0) — 2026-03-08

### 🚀 The Definitive AI Agent Testing Framework

v2.0.0 eliminates every remaining limitation, adding 7 major features.

#### 🖥️ Web Dashboard
- `agentic-test dashboard` — built-in glassmorphic dark-mode web UI
- Summary cards, pass-rate trend charts, expandable suite/test/assertion views
- Auto-refreshing, zero external dependencies (Node `http` + inline HTML)
- `--save` flag on `run` command persists results for history

#### 🔍 Trace/Span Analysis
- `createTracer()` — span-based execution tracing
- `wrapFunction()` — auto-instrument any async function
- 6 trace assertions: `spanExists`, `spanDurationWithin`, `spanTokensBudget`, `spanCount`, `traceDepthWithin`, `noSpanErrors`
- Export: JSON (OpenTelemetry-inspired), Mermaid sequence diagrams, ASCII timeline

#### 🛡️ Red Teaming (8 Safety Assertions)
- `noPromptInjection()` — detects injection patterns in output and tool args
- `noToxicity()` / `outputBelowToxicityThreshold()` — toxic content detection
- `noPII()` — SSN, credit card, email, phone, API key, IP detection
- `noJailbreak()` — jailbreak output pattern detection
- `safeForMinors()` — combined toxicity + adult content
- `noCodeExecution()` — `eval()`, `rm -rf`, `drop table` detection
- `noUnauthorizedDataAccess()` — SQL injection, path traversal in tool args

#### ⚖️ LLM-as-Judge
- `judgedBy(rubric, { threshold })` — custom rubric evaluation via LLM
- `OpenAIJudge` provider with response caching
- Pre-built rubrics: `outputQuality()`, `outputHelpfulness()`, `outputAccuracy()`, `outputProfessionalism()`
- Pluggable `JudgeProvider` interface

#### 🔧 GitHub Actions CI Generator
- `agentic-test ci --setup` — scaffolds `.github/workflows/agent-tests.yml`
- Configurable Node version, secrets, cron schedule, result artifacts

#### 📊 Enhanced CLI
- `agentic-test dashboard` — launch web dashboard
- `agentic-test ci --setup` — generate CI pipeline
- `--save` flag — persist results for dashboard
- `--verbose` flag — detailed assertion output

#### Updated Totals
- **35+ assertions** (from 27)
- **121 tests** (from 84)
- **14 test files** (from 10)

---

## [v1.0.0](https://github.com/satyamdas03/agentic-test/releases/tag/v1.0.0) — 2026-03-08

Embedding semantic eval, snapshot/replay, statistical mode, conversation testing, streaming evaluation. (84 tests)

---

## [v0.1.0](https://github.com/satyamdas03/agentic-test/releases/tag/v0.1.0) — 2026-03-08

Initial release: core engine, 24 assertions, mock provider, 4 reporters, CLI. (54 tests)
