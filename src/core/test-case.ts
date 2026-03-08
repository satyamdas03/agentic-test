// ============================================================================
// agentic-test — TestCase Execution Engine
// ============================================================================

import type {
    AgentAdapter,
    AgentResponse,
    Assertion,
    AssertionResult,
    TestCaseConfig,
    TestResult,
} from './types.js';

/**
 * Executes a single test case: runs the agent, evaluates assertions, handles retries.
 */
export async function executeTestCase(
    name: string,
    config: TestCaseConfig,
    suiteAdapter?: AgentAdapter,
    suiteTimeout?: number,
): Promise<TestResult> {
    // Skip if marked
    if (config.skip) {
        return {
            name,
            status: 'skipped',
            assertions: [],
            duration: 0,
            tokens: 0,
            toolCallCount: 0,
            retryCount: 0,
        };
    }

    const adapter = config.adapter ?? suiteAdapter;
    if (!adapter) {
        return {
            name,
            status: 'error',
            assertions: [],
            duration: 0,
            tokens: 0,
            toolCallCount: 0,
            retryCount: 0,
            error: new Error(
                `No adapter provided for test "${name}". Pass an adapter in the suite config or test config.`,
            ),
        };
    }

    const timeout = config.timeout ?? suiteTimeout ?? 30000;
    const maxRetries = config.retries ?? 0;

    let lastResult: TestResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await executeSingleAttempt(
            name,
            config.input,
            config.assertions,
            adapter,
            timeout,
            config.adapterOptions,
        );
        result.retryCount = attempt;

        if (result.status === 'passed') {
            return result;
        }

        lastResult = result;
    }

    return lastResult!;
}

/**
 * Runs a single attempt of a test case.
 */
async function executeSingleAttempt(
    name: string,
    input: string,
    assertions: Assertion[],
    adapter: AgentAdapter,
    timeout: number,
    adapterOptions?: import('./types.js').AdapterOptions,
): Promise<TestResult> {
    const startTime = performance.now();

    let agentResponse: AgentResponse;

    try {
        // Run the agent with a timeout
        agentResponse = await Promise.race([
            adapter.run(input, adapterOptions),
            createTimeout(timeout, name),
        ]);
    } catch (err) {
        const duration = performance.now() - startTime;
        return {
            name,
            status: 'error',
            assertions: [],
            duration,
            tokens: 0,
            toolCallCount: 0,
            retryCount: 0,
            error: err instanceof Error ? err : new Error(String(err)),
        };
    }

    const duration = performance.now() - startTime;

    // If the agent itself returned an error
    if (agentResponse.error) {
        return {
            name,
            status: 'error',
            assertions: [],
            duration,
            tokens: agentResponse.tokens,
            toolCallCount: agentResponse.toolCalls.length,
            retryCount: 0,
            error: agentResponse.error,
            agentResponse,
        };
    }

    // Evaluate all assertions
    const assertionResults: AssertionResult[] = assertions.map((assertion) => {
        try {
            return assertion(agentResponse);
        } catch (err) {
            return {
                passed: false,
                name: 'assertion-error',
                message: `Assertion threw: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    });

    const allPassed = assertionResults.every((r) => r.passed);

    return {
        name,
        status: allPassed ? 'passed' : 'failed',
        assertions: assertionResults,
        duration,
        tokens: agentResponse.tokens,
        toolCallCount: agentResponse.toolCalls.length,
        retryCount: 0,
        agentResponse,
    };
}

/**
 * Creates a timeout promise that rejects after the specified duration.
 */
function createTimeout(ms: number, testName: string): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Test "${testName}" timed out after ${ms}ms`));
        }, ms);
    });
}
