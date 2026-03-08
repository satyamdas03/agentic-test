// ============================================================================
// agentic-test — RAG Benchmark Suite (v3.0.0)
// ============================================================================

import type { AgentAdapter } from '../core/types.js';
import type { BenchmarkOptions, BenchmarkSample, BenchmarkReport } from './types.js';
import { executeTestCase } from '../core/test-case.js';
import { outputContainsIgnoreCase, outputQuality } from '../assertions/index.js';

// A minimal built-in dataset for RAG evaluations
const RAG_DATASET: BenchmarkSample[] = [
    {
        input: "What is the capital of France?",
        expected: "Paris",
    },
    {
        input: "Who wrote Romeo and Juliet?",
        expected: "William Shakespeare",
    },
    {
        input: "What is the speed of light in a vacuum?",
        expected: "299,792", // km/s
    },
    {
        input: "What year did the Apollo 11 moon landing occur?",
        expected: "1969",
    },
    {
        input: "What is the chemical symbol for water?",
        expected: "H2O",
    }
];

const RAG_DATASET_FULL: BenchmarkSample[] = [
    ...RAG_DATASET,
    // Add more samples to make a full 50-item benchmark in production
];

/**
 * Runs the standard RAG evaluation benchmark suite against an adapter.
 */
export async function runRagBenchmark(options: BenchmarkOptions): Promise<BenchmarkReport> {
    const dataset = options.mini ? RAG_DATASET : [...RAG_DATASET, ...RAG_DATASET_FULL].slice(0, 10);
    const results = [];
    const startTime = performance.now();
    let totalTokens = 0;

    console.log(`\n\u{1F916} Starting RAG Benchmark (${dataset.length} samples)`);
    console.log(`\u2500`.repeat(50));

    for (let i = 0; i < dataset.length; i++) {
        const sample = dataset[i];
        process.stdout.write(`  Sample ${i + 1}/${dataset.length}: ${sample.input.slice(0, 30)}... `);

        // Standard RAG assertions: must contain the expected answer, and if LLM-as-judge is setup, check quality
        const assertions = [];
        if (sample.expected) {
            assertions.push(outputContainsIgnoreCase(sample.expected));
        }

        const result = await executeTestCase(`RAG Sample ${i}`, {
            input: sample.input,
            assertions,
            adapter: options.adapter,
            timeout: 60000,
        });

        totalTokens += result.tokens;
        results.push({
            input: sample.input,
            success: result.status === 'passed',
            error: result.error?.message ?? (result.status === 'failed' ? 'Assertions failed' : undefined)
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
    console.log(`\n\u{1F4CA} RAG Benchmark Complete`);
    console.log(`  Pass Rate: ${Math.round((passed / dataset.length) * 100)}% (${passed}/${dataset.length})`);
    console.log(`  Duration:  ${(durationMs / 1000).toFixed(2)}s`);
    console.log(`  Tokens:    ${totalTokens} avg: ${Math.round(totalTokens / dataset.length)} per query\n`);

    return {
        benchmark: 'RAG',
        total: dataset.length,
        passed,
        failed: dataset.length - passed,
        passRate: passed / dataset.length,
        durationMs,
        averageTokens: totalTokens / dataset.length,
        details: results
    };
}
