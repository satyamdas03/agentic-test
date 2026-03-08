// ============================================================================
// agentic-test — Public API (v1.0.0)
// ============================================================================
//
// Main entry point for the package.
//
// @example
// ```ts
// import { describe, test, createAdapter, createMockAgent } from 'agentic-test';
// import { outputContains, toolWasCalled } from 'agentic-test/assertions';
// ```
// ============================================================================

// Core test API (describe, test, it, hooks)
export {
    describe,
    test,
    it,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    AgenticTestRunner,
    getRegisteredSuites,
    clearRegisteredSuites,
} from './core/runner.js';

// Adapters
export { createAdapter } from './adapters/custom.js';
export type { AgentFunction } from './adapters/custom.js';

// Streaming adapter
export {
    createStreamingAdapter,
    collectStream,
} from './adapters/streaming.js';
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
    setEmbeddingProvider,
    getEmbeddingProvider,
    clearEmbeddingProvider,
    computeSemanticSimilarity,
    OpenAIEmbeddings,
    LocalEmbeddings,
} from './embeddings/index.js';
export type { EmbeddingProvider } from './embeddings/index.js';
export { cosineSimilarity, tfidfSimilarity } from './embeddings/cosine.js';

// Snapshots (v1.0.0)
export {
    recordAdapter,
    replayAdapter,
    listSnapshots,
} from './snapshot/recorder.js';
export type { RecordOptions } from './snapshot/recorder.js';
export type { Snapshot, SnapshotFile } from './snapshot/types.js';

// Statistical mode (v1.0.0)
export {
    executeStatisticalTest,
    formatStatisticalResult,
} from './core/statistical.js';
export type { StatisticalConfig, StatisticalResult } from './core/statistical.js';

// Conversation testing (v1.0.0)
export {
    executeConversation,
    createConversationalAdapter,
} from './conversation/index.js';
export type {
    ConversationTurn,
    ConversationTurnResult,
    ConversationResult,
    ConversationalAdapter,
} from './conversation/index.js';

// Types (re-exported for user convenience)
export type {
    AgentAdapter,
    AgentResponse,
    AdapterOptions,
    ToolCall,
    Assertion,
    AssertionResult,
    TestCaseConfig,
    TestResult,
    TestSuiteConfig,
    SuiteResult,
    RunResult,
    Reporter,
    AgenticTestConfig,
} from './core/types.js';
