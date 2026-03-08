// ============================================================================
// agentic-test — Trace Assertions
// ============================================================================

import type { Span, Trace } from './types.js';
import type { AgentResponse, AssertionResult } from '../core/types.js';

/**
 * Trace assertion type — evaluates against an AgentResponse that optionally includes a trace.
 */
export type TraceAssertion = (response: AgentResponse) => AssertionResult;

/**
 * Assert that a span with the given name exists in the trace.
 */
export function spanExists(name: string): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'spanExists', message: 'No trace found in response' };
        }
        const found = findSpans(trace.rootSpan, name).length > 0;
        return {
            passed: found,
            name: 'spanExists',
            message: found ? `Span "${name}" found` : `Span "${name}" not found in trace`,
        };
    };
}

/**
 * Assert a span completed within a time limit.
 */
export function spanDurationWithin(name: string, maxMs: number): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'spanDurationWithin', message: 'No trace found in response' };
        }
        const spans = findSpans(trace.rootSpan, name);
        if (spans.length === 0) {
            return { passed: false, name: 'spanDurationWithin', message: `Span "${name}" not found` };
        }
        const dur = spans[0].duration ?? 0;
        const passed = dur <= maxMs;
        return {
            passed,
            name: 'spanDurationWithin',
            message: passed
                ? `Span "${name}" took ${Math.round(dur)}ms (max: ${maxMs}ms)`
                : `Span "${name}" too slow: ${Math.round(dur)}ms > ${maxMs}ms`,
        };
    };
}

/**
 * Assert a span's token usage is within budget.
 */
export function spanTokensBudget(name: string, maxTokens: number): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'spanTokensBudget', message: 'No trace found in response' };
        }
        const spans = findSpans(trace.rootSpan, name);
        if (spans.length === 0) {
            return { passed: false, name: 'spanTokensBudget', message: `Span "${name}" not found` };
        }
        const tokens = (spans[0].attributes.tokens as number) ?? 0;
        const passed = tokens <= maxTokens;
        return {
            passed,
            name: 'spanTokensBudget',
            message: passed
                ? `Span "${name}" used ${tokens} tokens (max: ${maxTokens})`
                : `Span "${name}" exceeded budget: ${tokens} > ${maxTokens}`,
        };
    };
}

/**
 * Assert the count of spans with a given name.
 */
export function spanCount(name: string, expected: number): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'spanCount', message: 'No trace found in response' };
        }
        const count = findSpans(trace.rootSpan, name).length;
        const passed = count === expected;
        return {
            passed,
            name: 'spanCount',
            message: passed
                ? `Span "${name}" appeared ${count} time(s)`
                : `Expected ${expected} spans named "${name}", found ${count}`,
        };
    };
}

/**
 * Assert the maximum depth of the trace tree.
 */
export function traceDepthWithin(maxDepth: number): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'traceDepthWithin', message: 'No trace found in response' };
        }
        const depth = computeDepth(trace.rootSpan);
        const passed = depth <= maxDepth;
        return {
            passed,
            name: 'traceDepthWithin',
            message: passed
                ? `Trace depth: ${depth} (max: ${maxDepth})`
                : `Trace too deep: ${depth} > ${maxDepth}`,
        };
    };
}

/**
 * Assert no span in the trace errored.
 */
export function noSpanErrors(): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'noSpanErrors', message: 'No trace found in response' };
        }
        const errors = findErrorSpans(trace.rootSpan);
        const passed = errors.length === 0;
        return {
            passed,
            name: 'noSpanErrors',
            message: passed
                ? 'No span errors'
                : `${errors.length} span(s) errored: ${errors.map(s => s.name).join(', ')}`,
        };
    };
}

// Helpers
function findSpans(span: Span, name: string): Span[] {
    const result: Span[] = [];
    if (span.name === name) result.push(span);
    for (const child of span.children) {
        result.push(...findSpans(child, name));
    }
    return result;
}

function findErrorSpans(span: Span): Span[] {
    const result: Span[] = [];
    if (span.status === 'error') result.push(span);
    for (const child of span.children) {
        result.push(...findErrorSpans(child));
    }
    return result;
}

function computeDepth(span: Span): number {
    if (span.children.length === 0) return 1;
    return 1 + Math.max(...span.children.map(computeDepth));
}
