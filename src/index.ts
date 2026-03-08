// ============================================================================
// agentic-test — Public API (v2.0.0)
// ============================================================================

// Core test API
export {
    describe, test, it,
    beforeAll, afterAll, beforeEach, afterEach,
    AgenticTestRunner,
    getRegisteredSuites, clearRegisteredSuites,
} from './core/runner.js';

// Adapters
export { createAdapter } from './adapters/custom.js';
export type { AgentFunction } from './adapters/custom.js';
export { createStreamingAdapter, collectStream } from './adapters/streaming.js';
export type { StreamingAdapter, StreamChunk } from './adapters/streaming.js';

// Mock provider
export { createMockAgent, MockAgentBuilder } from './mocks/mock-provider.js';

// Reporters
export { ConsoleReporter } from './reporters/console.js';
export { JsonReporter } from './reporters/json.js';
export { JUnitReporter } from './reporters/junit.js';
export { GitHubActionsReporter } from './reporters/github-actions.js';

// Embeddings (v1.0.0)
export {
    setEmbeddingProvider, getEmbeddingProvider, clearEmbeddingProvider,
    computeSemanticSimilarity, OpenAIEmbeddings, LocalEmbeddings,
} from './embeddings/index.js';
export type { EmbeddingProvider } from './embeddings/index.js';
export { cosineSimilarity, tfidfSimilarity } from './embeddings/cosine.js';

// Snapshots (v1.0.0)
export { recordAdapter, replayAdapter, listSnapshots } from './snapshot/recorder.js';
export type { RecordOptions } from './snapshot/recorder.js';
export type { Snapshot, SnapshotFile } from './snapshot/types.js';

// Statistical mode (v1.0.0)
export { executeStatisticalTest, formatStatisticalResult } from './core/statistical.js';
export type { StatisticalConfig, StatisticalResult } from './core/statistical.js';

// Conversation testing (v1.0.0)
export { executeConversation, createConversationalAdapter } from './conversation/index.js';
export type { ConversationTurn, ConversationTurnResult, ConversationResult, ConversationalAdapter } from './conversation/index.js';

// Dashboard (v2.0.0)
export { startDashboard } from './dashboard/server.js';
export { saveRunResult, loadRunHistory } from './dashboard/history.js';

// Tracing (v2.0.0)
export { createTracer, Tracer } from './tracing/tracer.js';
export { spanExists, spanDurationWithin, spanTokensBudget, spanCount, traceDepthWithin, noSpanErrors } from './tracing/assertions.js';
export type { TraceAssertion } from './tracing/assertions.js';
export { exportTraceAsJSON, exportTraceAsMermaid, renderTraceTimeline } from './tracing/export.js';
export type { Span, Trace } from './tracing/types.js';

// LLM-as-Judge (v2.0.0)
export { setJudgeProvider, getJudgeProvider, clearJudgeProvider, OpenAIJudge } from './assertions/llm-judge.js';
export { judgedBy, outputQuality, outputHelpfulness, outputAccuracy, outputProfessionalism } from './assertions/llm-judge.js';
export type { JudgeProvider } from './assertions/llm-judge.js';

// CI (v2.0.0)
export { generateGitHubActionsWorkflow, scaffoldGitHubActions } from './ci/github-actions.js';

// Types
export type {
    AgentAdapter, AgentResponse, AdapterOptions, ToolCall,
    Assertion, AssertionResult, TestCaseConfig, TestResult,
    TestSuiteConfig, SuiteResult, RunResult, Reporter, AgenticTestConfig,
} from './core/types.js';
