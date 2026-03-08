// ============================================================================
// agentic-test — Output Assertions
// ============================================================================

import type { Assertion, AssertionResult, AgentResponse } from '../core/types.js';

/**
 * Assert that the agent output contains the given substring.
 *
 * @example
 * ```ts
 * outputContains('confirmation number')
 * ```
 */
export function outputContains(text: string): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.output.includes(text);
        return {
            passed,
            name: 'outputContains',
            message: passed
                ? `Output contains "${text}"`
                : `Expected output to contain "${text}", but it was not found`,
            expected: text,
            actual: response.output.length > 200
                ? response.output.substring(0, 200) + '...'
                : response.output,
        };
    };
}

/**
 * Assert that the agent output does NOT contain the given substring.
 *
 * @example
 * ```ts
 * outputDoesNotContain('error')
 * ```
 */
export function outputDoesNotContain(text: string): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = !response.output.includes(text);
        return {
            passed,
            name: 'outputDoesNotContain',
            message: passed
                ? `Output does not contain "${text}"`
                : `Expected output NOT to contain "${text}", but it was found`,
            expected: `not "${text}"`,
            actual: response.output.length > 200
                ? response.output.substring(0, 200) + '...'
                : response.output,
        };
    };
}

/**
 * Assert that the agent output matches the given regular expression.
 *
 * @example
 * ```ts
 * outputMatches(/order #\d{5}/)
 * ```
 */
export function outputMatches(pattern: RegExp): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = pattern.test(response.output);
        return {
            passed,
            name: 'outputMatches',
            message: passed
                ? `Output matches ${pattern}`
                : `Expected output to match ${pattern}, but it did not`,
            expected: pattern.toString(),
            actual: response.output.length > 200
                ? response.output.substring(0, 200) + '...'
                : response.output,
        };
    };
}

/**
 * Assert that the agent output starts with the given prefix.
 *
 * @example
 * ```ts
 * outputStartsWith('Sure,')
 * ```
 */
export function outputStartsWith(prefix: string): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.output.startsWith(prefix);
        return {
            passed,
            name: 'outputStartsWith',
            message: passed
                ? `Output starts with "${prefix}"`
                : `Expected output to start with "${prefix}"`,
            expected: prefix,
            actual: response.output.substring(0, prefix.length + 20),
        };
    };
}

/**
 * Assert that the agent output ends with the given suffix.
 *
 * @example
 * ```ts
 * outputEndsWith('.')
 * ```
 */
export function outputEndsWith(suffix: string): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.output.endsWith(suffix);
        return {
            passed,
            name: 'outputEndsWith',
            message: passed
                ? `Output ends with "${suffix}"`
                : `Expected output to end with "${suffix}"`,
            expected: suffix,
            actual: response.output.substring(
                Math.max(0, response.output.length - suffix.length - 20),
            ),
        };
    };
}

/**
 * Assert that the agent output contains the given substring (case-insensitive).
 *
 * @example
 * ```ts
 * outputContainsIgnoreCase('SUCCESS')
 * ```
 */
export function outputContainsIgnoreCase(text: string): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.output.toLowerCase().includes(text.toLowerCase());
        return {
            passed,
            name: 'outputContainsIgnoreCase',
            message: passed
                ? `Output contains "${text}" (case-insensitive)`
                : `Expected output to contain "${text}" (case-insensitive), but it was not found`,
            expected: text,
            actual: response.output.length > 200
                ? response.output.substring(0, 200) + '...'
                : response.output,
        };
    };
}

/**
 * Assert that the agent output has a minimum length.
 *
 * @example
 * ```ts
 * outputMinLength(50)
 * ```
 */
export function outputMinLength(min: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.output.length >= min;
        return {
            passed,
            name: 'outputMinLength',
            message: passed
                ? `Output length (${response.output.length}) >= ${min}`
                : `Expected output length >= ${min}, got ${response.output.length}`,
            expected: `>= ${min}`,
            actual: response.output.length,
        };
    };
}

/**
 * Assert that the agent output has a maximum length.
 *
 * @example
 * ```ts
 * outputMaxLength(500)
 * ```
 */
export function outputMaxLength(max: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.output.length <= max;
        return {
            passed,
            name: 'outputMaxLength',
            message: passed
                ? `Output length (${response.output.length}) <= ${max}`
                : `Expected output length <= ${max}, got ${response.output.length}`,
            expected: `<= ${max}`,
            actual: response.output.length,
        };
    };
}

/**
 * Assert that the agent produced a non-empty output.
 *
 * @example
 * ```ts
 * outputIsNotEmpty()
 * ```
 */
export function outputIsNotEmpty(): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = response.output.trim().length > 0;
        return {
            passed,
            name: 'outputIsNotEmpty',
            message: passed
                ? 'Output is not empty'
                : 'Expected non-empty output, but output was empty',
        };
    };
}
