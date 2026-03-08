// ============================================================================
// agentic-test — Core Type Definitions
// ============================================================================

/**
 * Represents a single tool call made by an AI agent during execution.
 */
export interface ToolCall {
    /** The name of the tool that was called */
    name: string;
    /** The arguments passed to the tool */
    arguments: Record<string, unknown>;
    /** The result returned by the tool (if available) */
    result?: unknown;
    /** Duration of the tool call in milliseconds */
    duration?: number;
}

/**
 * Standardized response from an AI agent execution.
 * All adapters must transform their agent's response into this format.
 */
export interface AgentResponse {
    /** The final text output from the agent */
    output: string;
    /** All tool calls made during the agent's execution */
    toolCalls: ToolCall[];
    /** Total tokens consumed (prompt + completion) */
    tokens: number;
    /** Total execution time in milliseconds */
    duration: number;
    /** Raw/original response from the agent (for debugging) */
    raw?: unknown;
    /** Any error that occurred during execution */
    error?: Error;
    /** Tracing data for deep execution inspection (v2.0.0) */
    trace?: any;
}

/**
 * Options passed to the agent adapter when running a test.
 */
export interface AdapterOptions {
    /** Maximum time to wait for the agent to respond (ms) */
    timeout?: number;
    /** Additional context/system prompt for the agent */
    systemPrompt?: string;
    /** Temperature override for this test run */
    temperature?: number;
    /** Any extra options passed to the underlying agent */
    extra?: Record<string, unknown>;
}

/**
 * Interface that all agent adapters must implement.
 * This is the bridge between agentic-test and the user's agent.
 */
export interface AgentAdapter {
    /** Run the agent with the given input and return a standardized response */
    run(input: string, options?: AdapterOptions): Promise<AgentResponse>;
    /** Optional: clean up resources */
    teardown?(): Promise<void>;
}

/**
 * Result of evaluating a single assertion against an agent response.
 */
export interface AssertionResult {
    /** Whether the assertion passed */
    passed: boolean;
    /** Human-readable name of the assertion */
    name: string;
    /** Detailed message (especially useful on failure) */
    message: string;
    /** Expected value (for display) */
    expected?: unknown;
    /** Actual value received (for display) */
    actual?: unknown;
}

/**
 * An assertion function that evaluates an agent response.
 */
export type Assertion = (response: AgentResponse) => AssertionResult;

/**
 * Configuration for a single test case.
 */
export interface TestCaseConfig {
    /** The input/prompt to send to the agent */
    input: string;
    /** List of assertions to evaluate */
    assertions: Assertion[];
    /** Override adapter for this specific test */
    adapter?: AgentAdapter;
    /** Test-level timeout (ms) */
    timeout?: number;
    /** Number of retry attempts for flaky tests */
    retries?: number;
    /** Skip this test */
    skip?: boolean;
    /** Run only this test */
    only?: boolean;
    /** Additional adapter options */
    adapterOptions?: AdapterOptions;
    /**
     * Statistical mode: run the test N times and assert on pass rate.
     * @example
     * ```ts
     * test('reliable agent', {
     *   input: 'Book a flight',
     *   assertions: [...],
     *   statistical: { runs: 10, passRate: 0.8 },
     * });
     * ```
     */
    statistical?: {
        /** Number of times to run the test */
        runs: number;
        /** Minimum fraction of runs that must pass (0.0 to 1.0) */
        passRate: number;
    };
}

/**
 * Result of running a single test case.
 */
export interface TestResult {
    /** Name of the test */
    name: string;
    /** Overall status */
    status: 'passed' | 'failed' | 'skipped' | 'error';
    /** Individual assertion results */
    assertions: AssertionResult[];
    /** Execution duration in milliseconds */
    duration: number;
    /** Tokens consumed */
    tokens: number;
    /** Number of tool calls made */
    toolCallCount: number;
    /** Number of retry attempts used */
    retryCount: number;
    /** Error if the test errored (not just failed assertions) */
    error?: Error;
    /** The agent's response (for debugging) */
    agentResponse?: AgentResponse;
}

/**
 * Configuration for a test suite.
 */
export interface TestSuiteConfig {
    /** Adapter to use for all tests in this suite */
    adapter?: AgentAdapter;
    /** Default timeout for tests in this suite (ms) */
    timeout?: number;
    /** Default retry count for tests in this suite */
    retries?: number;
    /** Run tests in parallel within this suite */
    parallel?: boolean;
    /** Skip the entire suite */
    skip?: boolean;
    /** Run only this suite */
    only?: boolean;
}

/**
 * Result of running a test suite.
 */
export interface SuiteResult {
    /** Name of the suite */
    name: string;
    /** Results of all tests in the suite */
    tests: TestResult[];
    /** Total duration of the suite */
    duration: number;
    /** Suite-level error (e.g., beforeAll failed) */
    error?: Error;
}

/**
 * Lifecycle hooks for test suites.
 */
export interface SuiteHooks {
    beforeAll: Array<() => Promise<void> | void>;
    afterAll: Array<() => Promise<void> | void>;
    beforeEach: Array<() => Promise<void> | void>;
    afterEach: Array<() => Promise<void> | void>;
}

/**
 * Overall result of a full test run.
 */
export interface RunResult {
    /** Results from all suites */
    suites: SuiteResult[];
    /** Total number of tests */
    totalTests: number;
    /** Number of passed tests */
    passed: number;
    /** Number of failed tests */
    failed: number;
    /** Number of skipped tests */
    skipped: number;
    /** Total duration of the entire run */
    duration: number;
    /** Total tokens consumed across all tests */
    totalTokens: number;
}

/**
 * Reporter interface for outputting test results.
 */
export interface Reporter {
    /** Called when a test run starts */
    onRunStart?(totalSuites: number): void;
    /** Called when a suite starts */
    onSuiteStart?(suiteName: string): void;
    /** Called when a test completes */
    onTestResult?(suiteName: string, result: TestResult): void;
    /** Called when a suite completes */
    onSuiteEnd?(result: SuiteResult): void;
    /** Called when the entire run completes */
    onRunEnd?(result: RunResult): void;
}

/**
 * Configuration file schema for agentic-test.
 */
export interface AgenticTestConfig {
    /** Glob patterns for test file discovery */
    testMatch?: string[];
    /** Default timeout for all tests (ms) */
    timeout?: number;
    /** Default retry count */
    retries?: number;
    /** Reporters to use */
    reporters?: Array<'console' | 'json' | 'junit' | 'github-actions'>;
    /** Run tests in parallel */
    parallel?: boolean;
    /** Output directory for reports */
    outputDir?: string;
}
