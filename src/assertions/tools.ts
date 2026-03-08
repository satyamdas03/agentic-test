// ============================================================================
// agentic-test — Tool Call Assertions
// ============================================================================

import type { Assertion, AssertionResult, AgentResponse } from '../core/types.js';

/**
 * Assert that a specific tool was called during agent execution.
 *
 * @example
 * ```ts
 * toolWasCalled('searchFlights')
 * ```
 */
export function toolWasCalled(toolName: string): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const found = response.toolCalls.some((tc) => tc.name === toolName);
        return {
            passed: found,
            name: 'toolWasCalled',
            message: found
                ? `Tool "${toolName}" was called`
                : `Expected tool "${toolName}" to be called, but it was not. Called tools: [${response.toolCalls.map((tc) => tc.name).join(', ')}]`,
            expected: toolName,
            actual: response.toolCalls.map((tc) => tc.name),
        };
    };
}

/**
 * Assert that a specific tool was NOT called.
 *
 * @example
 * ```ts
 * toolNotCalled('cancelFlight')
 * ```
 */
export function toolNotCalled(toolName: string): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const found = response.toolCalls.some((tc) => tc.name === toolName);
        return {
            passed: !found,
            name: 'toolNotCalled',
            message: !found
                ? `Tool "${toolName}" was not called`
                : `Expected tool "${toolName}" NOT to be called, but it was`,
            expected: `not "${toolName}"`,
            actual: response.toolCalls.map((tc) => tc.name),
        };
    };
}

/**
 * Assert that a tool was called with specific arguments (partial match).
 * Uses deep partial matching — only the specified keys need to match.
 *
 * @example
 * ```ts
 * toolCalledWith('bookFlight', { from: 'NYC', to: 'London' })
 * ```
 */
export function toolCalledWith(
    toolName: string,
    expectedArgs: Record<string, unknown>,
): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const matchingCalls = response.toolCalls.filter(
            (tc) => tc.name === toolName,
        );

        if (matchingCalls.length === 0) {
            return {
                passed: false,
                name: 'toolCalledWith',
                message: `Tool "${toolName}" was never called`,
                expected: { tool: toolName, args: expectedArgs },
                actual: response.toolCalls.map((tc) => tc.name),
            };
        }

        // Check if any call matches the expected args (partial match)
        const matched = matchingCalls.some((tc) =>
            partialMatch(tc.arguments, expectedArgs),
        );

        return {
            passed: matched,
            name: 'toolCalledWith',
            message: matched
                ? `Tool "${toolName}" was called with expected arguments`
                : `Tool "${toolName}" was called, but arguments did not match`,
            expected: expectedArgs,
            actual: matchingCalls.map((tc) => tc.arguments),
        };
    };
}

/**
 * Assert that tools were called in a specific order.
 * The expected order must appear as a subsequence of actual calls.
 *
 * @example
 * ```ts
 * toolCallOrder(['searchFlights', 'comparePrices', 'bookFlight'])
 * ```
 */
export function toolCallOrder(expectedOrder: string[]): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const actualNames = response.toolCalls.map((tc) => tc.name);

        // Check if expectedOrder is a subsequence of actualNames
        let orderIdx = 0;
        for (const name of actualNames) {
            if (orderIdx < expectedOrder.length && name === expectedOrder[orderIdx]) {
                orderIdx++;
            }
        }
        const passed = orderIdx === expectedOrder.length;

        return {
            passed,
            name: 'toolCallOrder',
            message: passed
                ? `Tools were called in the expected order: [${expectedOrder.join(' → ')}]`
                : `Expected tool call order [${expectedOrder.join(' → ')}], but actual order was [${actualNames.join(' → ')}]`,
            expected: expectedOrder,
            actual: actualNames,
        };
    };
}

/**
 * Assert that a tool was called exactly N times.
 *
 * @example
 * ```ts
 * toolCalledTimes('searchFlights', 2)
 * ```
 */
export function toolCalledTimes(toolName: string, count: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const actualCount = response.toolCalls.filter(
            (tc) => tc.name === toolName,
        ).length;
        const passed = actualCount === count;

        return {
            passed,
            name: 'toolCalledTimes',
            message: passed
                ? `Tool "${toolName}" was called ${count} time(s)`
                : `Expected tool "${toolName}" to be called ${count} time(s), but it was called ${actualCount} time(s)`,
            expected: count,
            actual: actualCount,
        };
    };
}

/**
 * Assert the total number of tool calls made.
 *
 * @example
 * ```ts
 * totalToolCalls(3)
 * ```
 */
export function totalToolCalls(count: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const actual = response.toolCalls.length;
        const passed = actual === count;

        return {
            passed,
            name: 'totalToolCalls',
            message: passed
                ? `Total tool calls: ${count}`
                : `Expected ${count} total tool calls, got ${actual}`,
            expected: count,
            actual,
        };
    };
}

/**
 * Assert that a tool returned a specific result (partial match).
 *
 * @example
 * ```ts
 * toolReturnedResult('searchFlights', { found: true })
 * ```
 */
export function toolReturnedResult(
    toolName: string,
    expectedResult: unknown,
): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const matchingCalls = response.toolCalls.filter(
            (tc) => tc.name === toolName,
        );

        if (matchingCalls.length === 0) {
            return {
                passed: false,
                name: 'toolReturnedResult',
                message: `Tool "${toolName}" was never called`,
                expected: expectedResult,
                actual: null,
            };
        }

        const matched = matchingCalls.some((tc) => {
            if (typeof expectedResult === 'object' && expectedResult !== null) {
                return partialMatch(
                    tc.result as Record<string, unknown>,
                    expectedResult as Record<string, unknown>,
                );
            }
            return tc.result === expectedResult;
        });

        return {
            passed: matched,
            name: 'toolReturnedResult',
            message: matched
                ? `Tool "${toolName}" returned expected result`
                : `Tool "${toolName}" did not return expected result`,
            expected: expectedResult,
            actual: matchingCalls.map((tc) => tc.result),
        };
    };
}

// ============================================================================
// Utility: Deep Partial Match
// ============================================================================

/**
 * Checks if `actual` contains all key-value pairs from `expected`.
 * Supports nested objects.
 */
function partialMatch(
    actual: Record<string, unknown> | undefined,
    expected: Record<string, unknown>,
): boolean {
    if (!actual) return false;

    for (const [key, expectedValue] of Object.entries(expected)) {
        const actualValue = actual[key];

        if (
            typeof expectedValue === 'object' &&
            expectedValue !== null &&
            !Array.isArray(expectedValue)
        ) {
            if (
                typeof actualValue !== 'object' ||
                actualValue === null ||
                Array.isArray(actualValue)
            ) {
                return false;
            }
            if (
                !partialMatch(
                    actualValue as Record<string, unknown>,
                    expectedValue as Record<string, unknown>,
                )
            ) {
                return false;
            }
        } else if (Array.isArray(expectedValue)) {
            if (!Array.isArray(actualValue)) return false;
            if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
                return false;
            }
        } else {
            if (actualValue !== expectedValue) return false;
        }
    }

    return true;
}
