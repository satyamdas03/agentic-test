// ============================================================================
// agentic-test — Semantic Assertions
// ============================================================================

import type { Assertion, AssertionResult, AgentResponse } from '../core/types.js';

/**
 * Assert that the agent output semantically matches the expected text.
 * Uses a lightweight word-overlap similarity metric (no external dependencies).
 * For more advanced similarity, users can provide a custom similarity function.
 *
 * @example
 * ```ts
 * outputSemanticallyMatches('flight booked successfully', 0.6)
 * ```
 */
export function outputSemanticallyMatches(
    expected: string,
    threshold: number = 0.7,
    similarityFn?: (a: string, b: string) => number,
): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const similarity = similarityFn
            ? similarityFn(response.output, expected)
            : computeWordOverlapSimilarity(response.output, expected);

        const passed = similarity >= threshold;

        return {
            passed,
            name: 'outputSemanticallyMatches',
            message: passed
                ? `Semantic similarity: ${(similarity * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`
                : `Semantic similarity too low: ${(similarity * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%`,
            expected: `similarity >= ${(threshold * 100).toFixed(1)}%`,
            actual: `${(similarity * 100).toFixed(1)}%`,
        };
    };
}

/**
 * Assert that the agent output is grounded in the provided context.
 * Checks that key phrases from the output can be traced back to the context.
 *
 * @example
 * ```ts
 * noHallucination('The capital of France is Paris. It has the Eiffel Tower.')
 * ```
 */
export function noHallucination(
    context: string,
    threshold: number = 0.5,
): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const groundedness = computeGroundedness(response.output, context);
        const passed = groundedness >= threshold;

        return {
            passed,
            name: 'noHallucination',
            message: passed
                ? `Output grounded in context: ${(groundedness * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`
                : `Potential hallucination detected: groundedness ${(groundedness * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%`,
            expected: `groundedness >= ${(threshold * 100).toFixed(1)}%`,
            actual: `${(groundedness * 100).toFixed(1)}%`,
        };
    };
}

/**
 * Create a custom assertion with a user-defined function.
 *
 * @example
 * ```ts
 * custom('output is valid JSON', (response) => {
 *   try {
 *     JSON.parse(response.output);
 *     return true;
 *   } catch {
 *     return false;
 *   }
 * })
 * ```
 */
export function custom(
    name: string,
    fn: (response: AgentResponse) => boolean | AssertionResult,
): Assertion {
    return (response: AgentResponse): AssertionResult => {
        try {
            const result = fn(response);

            if (typeof result === 'boolean') {
                return {
                    passed: result,
                    name,
                    message: result ? `${name}: passed` : `${name}: failed`,
                };
            }

            return result;
        } catch (err) {
            return {
                passed: false,
                name,
                message: `${name}: threw error — ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    };
}

// ============================================================================
// Similarity Utilities (zero-dependency)
// ============================================================================

/**
 * Compute word-overlap similarity between two texts.
 * This is a lightweight alternative to cosine similarity on embeddings.
 * Range: 0.0 to 1.0
 */
function computeWordOverlapSimilarity(text1: string, text2: string): number {
    const words1 = tokenize(text1);
    const words2 = tokenize(text2);

    if (words1.size === 0 && words2.size === 0) return 1.0;
    if (words1.size === 0 || words2.size === 0) return 0.0;

    const intersection = new Set([...words1].filter((w) => words2.has(w)));

    // Dice coefficient (F1 of sets)
    return (2 * intersection.size) / (words1.size + words2.size);
}

/**
 * Compute groundedness: what fraction of output n-grams appear in the context.
 */
function computeGroundedness(output: string, context: string): number {
    const outputTokens = tokenize(output);
    const contextLower = context.toLowerCase();

    if (outputTokens.size === 0) return 1.0;

    let groundedCount = 0;
    for (const token of outputTokens) {
        if (contextLower.includes(token)) {
            groundedCount++;
        }
    }

    return groundedCount / outputTokens.size;
}

/**
 * Tokenize text into a set of normalized words.
 */
function tokenize(text: string): Set<string> {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
        'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet',
        'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few',
        'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same',
        'than', 'too', 'very', 'just', 'because', 'if', 'when', 'while',
        'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
        'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'their',
    ]);

    return new Set(
        text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 1 && !stopWords.has(w)),
    );
}
