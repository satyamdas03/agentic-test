// ============================================================================
// agentic-test — Public API
// ============================================================================
//
// The main entry point for the package.
// Users import from 'agentic-test' for the test API and from
// 'agentic-test/assertions' for assertion functions.
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

// Mock provider
export { createMockAgent, MockAgentBuilder } from './mocks/mock-provider.js';

// Reporters
export { ConsoleReporter } from './reporters/console.js';
export { JsonReporter } from './reporters/json.js';
export { JUnitReporter } from './reporters/junit.js';
export { GitHubActionsReporter } from './reporters/github-actions.js';

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
