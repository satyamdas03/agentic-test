// ============================================================================
// agentic-test — Performance Assertions
// ============================================================================

import type { Assertion, AssertionResult, AgentResponse } from '../core/types.js';

/**
 * Assert that the agent completed within the given time budget.
 *
 * @example
 * ```ts
 * completedWithin(5000) // max 5 seconds
 * ```
 */
export function completedWithin(maxMs: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.duration <= maxMs;
        return {
            passed,
            name: 'completedWithin',
            message: passed
                ? `Completed in ${Math.round(response.duration)}ms (budget: ${maxMs}ms)`
                : `Exceeded time budget: ${Math.round(response.duration)}ms > ${maxMs}ms`,
            expected: `<= ${maxMs}ms`,
            actual: `${Math.round(response.duration)}ms`,
        };
    };
}

/**
 * Assert that the agent used no more than the given number of tokens.
 *
 * @example
 * ```ts
 * tokensBudget(2000) // max 2000 tokens
 * ```
 */
export function tokensBudget(maxTokens: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.tokens <= maxTokens;
        return {
            passed,
            name: 'tokensBudget',
            message: passed
                ? `Used ${response.tokens} tokens (budget: ${maxTokens})`
                : `Exceeded token budget: ${response.tokens} > ${maxTokens}`,
            expected: `<= ${maxTokens}`,
            actual: response.tokens,
        };
    };
}

/**
 * Assert that the agent made no more than the given number of tool calls.
 * Useful to prevent infinite loops or excessive API calls.
 *
 * @example
 * ```ts
 * maxToolCalls(5) // max 5 tool invocations
 * ```
 */
export function maxToolCalls(max: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const actual = response.toolCalls.length;
        const passed = actual <= max;
        return {
            passed,
            name: 'maxToolCalls',
            message: passed
                ? `Made ${actual} tool call(s) (max: ${max})`
                : `Exceeded max tool calls: ${actual} > ${max}`,
            expected: `<= ${max}`,
            actual,
        };
    };
}

/**
 * Assert that the agent made at least the given number of tool calls.
 *
 * @example
 * ```ts
 * minToolCalls(1) // must call at least 1 tool
 * ```
 */
export function minToolCalls(min: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const actual = response.toolCalls.length;
        const passed = actual >= min;
        return {
            passed,
            name: 'minToolCalls',
            message: passed
                ? `Made ${actual} tool call(s) (min: ${min})`
                : `Expected at least ${min} tool call(s), got ${actual}`,
            expected: `>= ${min}`,
            actual,
        };
    };
}

/**
 * Assert that the estimated cost is within budget.
 * Uses a simple token-to-cost model (customizable rates).
 *
 * @example
 * ```ts
 * costBudget(0.05) // max $0.05
 * costBudget(0.05, { inputRate: 0.001, outputRate: 0.002 })
 * ```
 */
export function costBudget(
    maxCost: number,
    rates: { inputRate?: number; outputRate?: number } = {},
): Assertion {
    const { inputRate = 0.0001, outputRate = 0.0002 } = rates;

    return (response: AgentResponse): AssertionResult => {
        // Simple estimation: total tokens × average rate
        const avgRate = (inputRate + outputRate) / 2;
        const estimatedCost = response.tokens * avgRate;
        const passed = estimatedCost <= maxCost;

        return {
            passed,
            name: 'costBudget',
            message: passed
                ? `Estimated cost: $${estimatedCost.toFixed(4)} (budget: $${maxCost.toFixed(4)})`
                : `Exceeded cost budget: $${estimatedCost.toFixed(4)} > $${maxCost.toFixed(4)}`,
            expected: `<= $${maxCost.toFixed(4)}`,
            actual: `$${estimatedCost.toFixed(4)}`,
        };
    };
}
