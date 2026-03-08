// ============================================================================
// agentic-test — ReAct Benchmark Suite (v3.0.0)
// ============================================================================

import type { AgentAdapter } from '../core/types.js';
import type { BenchmarkOptions, BenchmarkSample, BenchmarkReport } from './types.js';
import { executeTestCase } from '../core/test-case.js';
import { outputContainsIgnoreCase, toolWasCalled } from '../assertions/index.js';

// A minimal built-in dataset for ReAct (Reasoning and Acting) evaluations
const REACT_DATASET: BenchmarkSample[] = [
    {
        input: "What is the weather in New York?",
        expectedContext: ['getWeather'],
    },
    {
        input: "Search the database for user ID 12345.",
        expectedContext: ['queryDatabase'],
    },
    {
        input: "What is 15.4 * 9.2?",
        expectedContext: ['calculator'],
    },
    {
        input: "Translate 'Hello world' to French.",
        expectedContext: ['translate'],
    },
    {
        input: "Read the contents of README.md",
        expectedContext: ['readFile'],
    }
];

const REACT_DATASET_FULL: BenchmarkSample[] = [
    ...REACT_DATASET,
    // Add more samples to make a full 50-item benchmark in production
];

/**
 * Runs the standard ReAct evaluation benchmark suite against an adapter.
 */
export async function runReactBenchmark(options: BenchmarkOptions): Promise<BenchmarkReport> {
    const dataset = options.mini ? REACT_DATASET : [...REACT_DATASET, ...REACT_DATASET_FULL].slice(0, 10);
    const results = [];
    const startTime = performance.now();
    let totalTokens = 0;

    console.log(`\n\u{1F916} Starting ReAct Benchmark (${dataset.length} samples)`);
    console.log(`\u2500`.repeat(50));

    for (let i = 0; i < dataset.length; i++) {
        const sample = dataset[i];
        process.stdout.write(`  Sample ${i + 1}/${dataset.length}: ${sample.input.slice(0, 30)}... `);

        // Standard ReAct assertions: Must call the expected tool to retrieve info
        const assertions = [];
        if (sample.expectedContext) {
            for (const expectedTool of sample.expectedContext) {
                assertions.push(toolWasCalled(expectedTool));
            }
        }

        const result = await executeTestCase(`ReAct Sample ${i}`, {
            input: sample.input,
            assertions,
            adapter: options.adapter,
            timeout: 60000,
        });

        totalTokens += result.tokens;
        results.push({
            input: sample.input,
            success: result.status === 'passed',
            error: result.error?.message ?? (result.status === 'failed' ? 'Assertions failed (did not call expected tool)' : undefined)
        });

        if (result.status === 'passed') {
            console.log(`\x1b[32m\u2713 Passed\x1b[0m (${Math.round(result.duration)}ms)`);
        } else {
            console.log(`\x1b[31m\u2717 Failed\x1b[0m (${Math.round(result.duration)}ms)`);
        }
    }

    const durationMs = performance.now() - startTime;
    const passed = results.filter(r => r.success).length;

    console.log(`\u2500`.repeat(50));
    console.log(`\n\u{1F4CA} ReAct Benchmark Complete`);
    console.log(`  Pass Rate: ${Math.round((passed / dataset.length) * 100)}% (${passed}/${dataset.length})`);
    console.log(`  Duration:  ${(durationMs / 1000).toFixed(2)}s`);
    console.log(`  Tokens:    ${totalTokens} avg: ${Math.round(totalTokens / dataset.length)} per query\n`);

    return {
        benchmark: 'ReAct',
        total: dataset.length,
        passed,
        failed: dataset.length - passed,
        passRate: passed / dataset.length,
        durationMs,
        averageTokens: totalTokens / dataset.length,
        details: results
    };
}
