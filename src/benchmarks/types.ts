// ============================================================================
// agentic-test — Benchmark Types (v3.0.0)
// ============================================================================

import type { AgentAdapter, Assertion } from '../core/types.js';

/**
 * A built-in benchmark type.
 */
export type BenchmarkType = 'rag' | 'react';

/**
 * Configuration options for running a benchmark suite.
 */
export interface BenchmarkOptions {
    /** The adapter to test */
    adapter: AgentAdapter;
    /** Output directory for the benchmark report (JSON/Markdown) */
    outputDir?: string;
    /** Maximum number of parallel benchmark test evaluations */
    concurrency?: number;
    /** Whether to run a mini-version of the benchmark (e.g. 5 questions instead of 50) for testing */
    mini?: boolean;
}

/**
 * Represents a single sample/question within a benchmark dataset.
 */
export interface BenchmarkSample {
    /** The input prompt or question */
    input: string;
    /** The expected target or exact text that should be produced */
    expected?: string;
    /** Information that should be found in traces or tool calls */
    expectedContext?: string[];
    /** A specific context (like a document) injected for RAG */
    context?: string;
}

/**
 * Report generated after running a benchmark suite.
 */
export interface BenchmarkReport {
    benchmark: string;
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    durationMs: number;
    averageTokens: number;
    details: {
        input: string;
        success: boolean;
        error?: string;
    }[];
}
