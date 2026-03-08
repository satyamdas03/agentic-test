# Changelog

All notable changes to `agentic-test` will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

---

## [v1.0.0](https://github.com/satyamdas03/agentic-test/releases/tag/v1.0.0) — 2026-03-08

### 🚀 Major Release — The Revolutionary Upgrade

v1.0.0 transforms `agentic-test` from a testing utility into the **definitive** AI agent testing framework with 5 groundbreaking features.

#### ✨ Embedding-Based Semantic Evaluation
- **Pluggable `EmbeddingProvider` interface** — swap similarity engines freely
- **`OpenAIEmbeddings`** — real vector cosine similarity via OpenAI text-embedding-3-small (with caching)
- **`LocalEmbeddings`** — zero-API TF-IDF fallback for offline/CI testing
- **`setEmbeddingProvider()` / `clearEmbeddingProvider()`** — global configuration
- **`outputSemanticallyMatchesAsync()`** — new async assertion using configured embeddings
- **`cosineSimilarity()` / `tfidfSimilarity()`** — exported utility functions

#### 📸 Snapshot & Replay Testing
- **`recordAdapter(agent, options)`** — wraps any agent, saves responses to `.snap.json` files
- **`replayAdapter(options)`** — loads recorded responses for zero-API regression testing
- **`listSnapshots(options)`** — inventory all recorded snapshots
- JSON snapshot format with metadata (model, temperature, version)

#### 📊 Statistical Mode
- **`statistical: { runs: 10, passRate: 0.8 }`** in test config — run N times, assert on pass rate
- **Distribution analysis** — avg latency, avg tokens, standard deviation
- **`executeStatisticalTest()`** — programmatic API
- **`formatStatisticalResult()`** — human-readable formatting

#### 💬 Conversation Testing (Multi-Turn)
- **`executeConversation(name, adapter, turns)`** — test multi-turn dialogue flows
- **`createConversationalAdapter(fn)`** — adapter that receives message history
- Per-turn assertions with full history context
- Supports both standard and conversational adapters

#### 🌊 Streaming Evaluation
- **`createStreamingAdapter(fn)`** — wrap async generators
- **`collectStream(adapter, input)`** — gather chunks into AgentResponse
- **3 new streaming assertions**: `streamCompletes()`, `streamChunkCount(min, max)`, `firstChunkWithin(ms)`
- Time-to-first-chunk (TTFC) measurement

#### Updated Totals
- **27 assertions** (from 24) — 3 new streaming assertions + 1 async semantic
- **84 tests** (from 54) — 30 new tests for v1.0.0 features
- **10 test files** (from 5)

---

## [v0.1.0](https://github.com/satyamdas03/agentic-test/releases/tag/v0.1.0) — 2026-03-08

### 🎉 Initial Release

The first public release of `agentic-test` — a lightweight, Jest-like testing framework for AI agent workflows.

#### Core Features
- **`describe/test` API** — familiar Jest-like syntax for defining agent test suites
- **Lifecycle hooks** — `beforeAll`, `afterAll`, `beforeEach`, `afterEach`
- **`.skip` / `.only` modifiers** — focus or skip tests and suites
- **Retry support** — built-in retry logic for non-deterministic LLM tests
- **Timeout handling** — configurable per-test and per-suite timeouts

#### 24 Assertions (4 categories)
- **Output** (9): `outputContains`, `outputDoesNotContain`, `outputMatches`, `outputStartsWith`, `outputEndsWith`, `outputContainsIgnoreCase`, `outputMinLength`, `outputMaxLength`, `outputIsNotEmpty`
- **Tool Calls** (7): `toolWasCalled`, `toolNotCalled`, `toolCalledWith`, `toolCallOrder`, `toolCalledTimes`, `totalToolCalls`, `toolReturnedResult`
- **Performance** (5): `completedWithin`, `tokensBudget`, `maxToolCalls`, `minToolCalls`, `costBudget`
- **Semantic** (3): `outputSemanticallyMatches`, `noHallucination`, `custom`

#### Adapters & Mocking
- **`createAdapter()`** — wrap any agent in 5 lines
- **`createMockAgent()`** — fluent builder for deterministic testing

#### Reporters
- Console, JSON, JUnit XML, GitHub Actions

#### CLI
- `agentic-test run` / `agentic-test init`

#### Package
- Dual ESM/CJS with TypeScript declarations
- 74.2 KB packed, 3 runtime dependencies
