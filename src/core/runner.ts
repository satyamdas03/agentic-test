// ============================================================================
// agentic-test — Test Runner (orchestrates test execution)
// ============================================================================

import type {
    AgenticTestConfig,
    Reporter,
    RunResult,
    TestSuiteConfig,
    TestCaseConfig,
} from './types.js';
import { AgenticTestSuite } from './suite.js';

/**
 * Global state for the current test registration context.
 * This enables the familiar describe/test API.
 */
let currentSuite: AgenticTestSuite | null = null;
const registeredSuites: AgenticTestSuite[] = [];

/**
 * Define a test suite (similar to Jest's describe).
 *
 * @example
 * ```ts
 * describe('My Agent', { adapter: myAdapter }, () => {
 *   test('does something', {
 *     input: 'hello',
 *     assertions: [outputContains('hi')],
 *   });
 * });
 * ```
 */
export function describe(
    name: string,
    configOrFn: TestSuiteConfig | (() => void),
    fn?: () => void,
): void {
    const config = typeof configOrFn === 'function' ? {} : configOrFn;
    const setupFn = typeof configOrFn === 'function' ? configOrFn : fn!;

    const suite = new AgenticTestSuite(name, config);
    const previousSuite = currentSuite;
    currentSuite = suite;

    try {
        setupFn();
    } finally {
        currentSuite = previousSuite;
    }

    registeredSuites.push(suite);
}

/**
 * Shorthand: describe.skip
 */
describe.skip = function skipDescribe(
    name: string,
    configOrFn: TestSuiteConfig | (() => void),
    fn?: () => void,
): void {
    const config = typeof configOrFn === 'function' ? {} : configOrFn;
    describe(name, { ...config, skip: true }, fn ?? (configOrFn as () => void));
};

/**
 * Shorthand: describe.only
 */
describe.only = function onlyDescribe(
    name: string,
    configOrFn: TestSuiteConfig | (() => void),
    fn?: () => void,
): void {
    const config = typeof configOrFn === 'function' ? {} : configOrFn;
    describe(name, { ...config, only: true }, fn ?? (configOrFn as () => void));
};

/**
 * Define a test case (similar to Jest's test/it).
 */
export function test(name: string, config: TestCaseConfig): void {
    if (!currentSuite) {
        throw new Error(
            `test("${name}") must be called inside a describe() block.`,
        );
    }
    currentSuite.addTest(name, config);
}

/**
 * Alias for test.
 */
export const it = test;

/**
 * Shorthand: test.skip
 */
test.skip = function skipTest(name: string, config: TestCaseConfig): void {
    test(name, { ...config, skip: true });
};

/**
 * Shorthand: test.only
 */
test.only = function onlyTest(name: string, config: TestCaseConfig): void {
    test(name, { ...config, only: true });
};

/**
 * Register a beforeAll hook for the current suite.
 */
export function beforeAll(fn: () => Promise<void> | void): void {
    if (!currentSuite) {
        throw new Error('beforeAll() must be called inside a describe() block.');
    }
    currentSuite.hooks.beforeAll.push(fn);
}

/**
 * Register an afterAll hook for the current suite.
 */
export function afterAll(fn: () => Promise<void> | void): void {
    if (!currentSuite) {
        throw new Error('afterAll() must be called inside a describe() block.');
    }
    currentSuite.hooks.afterAll.push(fn);
}

/**
 * Register a beforeEach hook for the current suite.
 */
export function beforeEach(fn: () => Promise<void> | void): void {
    if (!currentSuite) {
        throw new Error('beforeEach() must be called inside a describe() block.');
    }
    currentSuite.hooks.beforeEach.push(fn);
}

/**
 * Register an afterEach hook for the current suite.
 */
export function afterEach(fn: () => Promise<void> | void): void {
    if (!currentSuite) {
        throw new Error('afterEach() must be called inside a describe() block.');
    }
    currentSuite.hooks.afterEach.push(fn);
}

/**
 * AgenticTestRunner — the main orchestrator.
 * Executes all registered suites and collects results.
 */
export class AgenticTestRunner {
    private reporters: Reporter[] = [];
    private config: AgenticTestConfig;

    constructor(config: AgenticTestConfig = {}) {
        this.config = config;
    }

    /**
     * Add a reporter.
     */
    addReporter(reporter: Reporter): this {
        this.reporters.push(reporter);
        return this;
    }

    /**
     * Execute all registered suites and return results.
     */
    async run(suites?: AgenticTestSuite[]): Promise<RunResult> {
        const suitesToRun = suites ?? getRegisteredSuites();
        const startTime = performance.now();

        // Notify reporters of run start
        for (const reporter of this.reporters) {
            reporter.onRunStart?.(suitesToRun.length);
        }

        // Check for .only suites
        const hasOnlySuites = suitesToRun.some((s) => s.config.only);
        const filteredSuites = hasOnlySuites
            ? suitesToRun.filter((s) => s.config.only)
            : suitesToRun;

        const suiteResults = [];

        for (const suite of filteredSuites) {
            // Notify reporters
            for (const reporter of this.reporters) {
                reporter.onSuiteStart?.(suite.name);
            }

            const result = await suite.run();

            // Notify reporters of individual test results
            for (const testResult of result.tests) {
                for (const reporter of this.reporters) {
                    reporter.onTestResult?.(suite.name, testResult);
                }
            }

            // Notify reporters of suite end
            for (const reporter of this.reporters) {
                reporter.onSuiteEnd?.(result);
            }

            suiteResults.push(result);
        }

        // Build final result
        const allTests = suiteResults.flatMap((s) => s.tests);
        const runResult: RunResult = {
            suites: suiteResults,
            totalTests: allTests.length,
            passed: allTests.filter((t) => t.status === 'passed').length,
            failed: allTests.filter(
                (t) => t.status === 'failed' || t.status === 'error',
            ).length,
            skipped: allTests.filter((t) => t.status === 'skipped').length,
            duration: performance.now() - startTime,
            totalTokens: allTests.reduce((sum, t) => sum + t.tokens, 0),
        };

        // Notify reporters of run end
        for (const reporter of this.reporters) {
            reporter.onRunEnd?.(runResult);
        }

        return runResult;
    }
}

/**
 * Get all registered suites (and clear the global registry).
 */
export function getRegisteredSuites(): AgenticTestSuite[] {
    const suites = [...registeredSuites];
    registeredSuites.length = 0;
    return suites;
}

/**
 * Clear all registered suites (useful for testing the framework itself).
 */
export function clearRegisteredSuites(): void {
    registeredSuites.length = 0;
}
