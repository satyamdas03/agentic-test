// ============================================================================
// agentic-test — Statistical Mode (run N times, assert on distributions)
// ============================================================================

import type {
    AgentAdapter,
    AgentResponse,
    Assertion,
    AssertionResult,
    TestResult,
} from '../core/types.js';

/**
 * Configuration for statistical test execution.
 */
export interface StatisticalConfig {
    /** Number of runs to execute */
    runs: number;
    /** Minimum pass rate required (0.0 to 1.0) */
    passRate: number;
    /** Assertions to evaluate on each run */
    assertions: Assertion[];
}

/**
 * Result of a statistical test execution.
 */
export interface StatisticalResult {
    /** Total number of runs */
    totalRuns: number;
    /** Number of runs where all assertions passed */
    passedRuns: number;
    /** Actual pass rate achieved */
    actualPassRate: number;
    /** Required pass rate */
    requiredPassRate: number;
    /** Whether the statistical test passed */
    passed: boolean;
    /** Average latency across runs */
    avgDuration: number;
    /** Average tokens across runs */
    avgTokens: number;
    /** Standard deviation of tokens */
    stdDevTokens: number;
    /** Individual run results */
    runs: Array<{
        runIndex: number;
        passed: boolean;
        duration: number;
        tokens: number;
        assertions: AssertionResult[];
    }>;
}

/**
 * Execute a test case multiple times and analyze the distribution of results.
 * This is the correct way to handle LLM non-determinism.
 *
 * @example
 * ```ts
 * test('agent books flights reliably', {
 *   input: 'Book a flight to London',
 *   assertions: [toolWasCalled('searchFlights'), outputContains('booked')],
 *   statistical: { runs: 10, passRate: 0.8 },
 * });
 * ```
 */
export async function executeStatisticalTest(
    input: string,
    adapter: AgentAdapter,
    config: StatisticalConfig,
    adapterOptions?: import('../core/types.js').AdapterOptions,
): Promise<StatisticalResult> {
    const runs: StatisticalResult['runs'] = [];

    for (let i = 0; i < config.runs; i++) {
        const startTime = performance.now();

        let response: AgentResponse;
        try {
            response = await adapter.run(input, adapterOptions);
        } catch (err) {
            runs.push({
                runIndex: i,
                passed: false,
                duration: performance.now() - startTime,
                tokens: 0,
                assertions: [{
                    passed: false,
                    name: 'execution',
                    message: `Run ${i + 1} errored: ${err instanceof Error ? err.message : String(err)}`,
                }],
            });
            continue;
        }

        const duration = performance.now() - startTime;

        // Evaluate assertions
        const assertionResults: AssertionResult[] = config.assertions.map((assertion) => {
            try {
                return assertion(response);
            } catch (err) {
                return {
                    passed: false,
                    name: 'assertion-error',
                    message: `Assertion threw: ${err instanceof Error ? err.message : String(err)}`,
                };
            }
        });

        const allPassed = assertionResults.every((r) => r.passed);

        runs.push({
            runIndex: i,
            passed: allPassed,
            duration: response.duration ?? duration,
            tokens: response.tokens,
            assertions: assertionResults,
        });
    }

    // Compute statistics
    const passedRuns = runs.filter((r) => r.passed).length;
    const actualPassRate = passedRuns / config.runs;
    const durations = runs.map((r) => r.duration);
    const tokens = runs.map((r) => r.tokens);

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const avgTokens = tokens.reduce((a, b) => a + b, 0) / tokens.length;

    // Standard deviation of tokens
    const variance =
        tokens.reduce((sum, t) => sum + Math.pow(t - avgTokens, 2), 0) / tokens.length;
    const stdDevTokens = Math.sqrt(variance);

    return {
        totalRuns: config.runs,
        passedRuns,
        actualPassRate,
        requiredPassRate: config.passRate,
        passed: actualPassRate >= config.passRate,
        avgDuration,
        avgTokens,
        stdDevTokens,
        runs,
    };
}

/**
 * Format a statistical result for console display.
 */
export function formatStatisticalResult(result: StatisticalResult): string {
    const status = result.passed ? '✓' : '✗';
    const rate = (result.actualPassRate * 100).toFixed(0);
    const target = (result.requiredPassRate * 100).toFixed(0);

    return [
        `${status} (${result.totalRuns} runs: ${result.passedRuns}/${result.totalRuns} passed, ${rate}% pass rate, target: ${target}%)`,
        `    Avg latency: ${Math.round(result.avgDuration)}ms | Avg tokens: ${Math.round(result.avgTokens)} | Std dev: ±${Math.round(result.stdDevTokens)} tokens`,
    ].join('\n');
}
