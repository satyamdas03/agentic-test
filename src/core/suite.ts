// ============================================================================
// agentic-test — Test Suite (describe-level grouping)
// ============================================================================

import type {
    AgentAdapter,
    SuiteHooks,
    SuiteResult,
    TestCaseConfig,
    TestResult,
    TestSuiteConfig,
} from './types.js';
import { executeTestCase } from './test-case.js';

/**
 * Internal representation of a registered test within a suite.
 */
interface RegisteredTest {
    name: string;
    config: TestCaseConfig;
}

/**
 * AgenticTestSuite manages a group of related tests with shared configuration and hooks.
 */
export class AgenticTestSuite {
    public name: string;
    public config: TestSuiteConfig;
    public hooks: SuiteHooks;
    private tests: RegisteredTest[] = [];

    constructor(name: string, config: TestSuiteConfig = {}) {
        this.name = name;
        this.config = config;
        this.hooks = {
            beforeAll: [],
            afterAll: [],
            beforeEach: [],
            afterEach: [],
        };
    }

    /**
     * Register a test in this suite.
     */
    addTest(name: string, config: TestCaseConfig): void {
        this.tests.push({ name, config });
    }

    /**
     * Get all registered tests.
     */
    getTests(): RegisteredTest[] {
        return [...this.tests];
    }

    /**
     * Filter the registered tests by a regular expression match on the name.
     */
    filterTests(regex: RegExp): void {
        this.tests = this.tests.filter((t) => regex.test(t.name) || regex.test(this.name));
    }

    /**
     * Execute all tests in this suite.
     */
    async run(): Promise<SuiteResult> {
        const startTime = performance.now();

        if (this.config.skip) {
            const skippedTests: TestResult[] = this.tests.map((t) => ({
                name: t.name,
                status: 'skipped' as const,
                assertions: [],
                duration: 0,
                tokens: 0,
                toolCallCount: 0,
                retryCount: 0,
            }));

            return {
                name: this.name,
                tests: skippedTests,
                duration: 0,
            };
        }

        // Run beforeAll hooks
        try {
            for (const hook of this.hooks.beforeAll) {
                await hook();
            }
        } catch (err) {
            return {
                name: this.name,
                tests: [],
                duration: performance.now() - startTime,
                error: err instanceof Error ? err : new Error(String(err)),
            };
        }

        // Determine which tests to run
        const hasOnly = this.tests.some((t) => t.config.only);
        const testsToRun = hasOnly
            ? this.tests.filter((t) => t.config.only)
            : this.tests;

        // Execute tests
        const testResults: TestResult[] = [];

        if (this.config.parallel) {
            // Parallel execution
            const promises = testsToRun.map(async (t) => {
                await this.runBeforeEachHooks();
                const result = await executeTestCase(
                    t.name,
                    t.config,
                    this.config.adapter,
                    this.config.timeout,
                );
                await this.runAfterEachHooks();
                return result;
            });
            testResults.push(...(await Promise.all(promises)));
        } else {
            // Sequential execution
            for (const t of testsToRun) {
                await this.runBeforeEachHooks();
                const result = await executeTestCase(
                    t.name,
                    t.config,
                    this.config.adapter,
                    this.config.timeout,
                );
                testResults.push(result);
                await this.runAfterEachHooks();
            }
        }

        // Mark non-only tests as skipped when .only is active
        if (hasOnly) {
            for (const t of this.tests) {
                if (!t.config.only) {
                    testResults.push({
                        name: t.name,
                        status: 'skipped',
                        assertions: [],
                        duration: 0,
                        tokens: 0,
                        toolCallCount: 0,
                        retryCount: 0,
                    });
                }
            }
        }

        // Run afterAll hooks
        try {
            for (const hook of this.hooks.afterAll) {
                await hook();
            }
        } catch {
            // afterAll errors are logged but don't fail the suite
        }

        return {
            name: this.name,
            tests: testResults,
            duration: performance.now() - startTime,
        };
    }

    private async runBeforeEachHooks(): Promise<void> {
        for (const hook of this.hooks.beforeEach) {
            await hook();
        }
    }

    private async runAfterEachHooks(): Promise<void> {
        for (const hook of this.hooks.afterEach) {
            await hook();
        }
    }
}
