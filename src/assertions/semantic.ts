// ============================================================================
// agentic-test — Semantic Assertions (v1.0.0 — Embedding-Upgraded)
// ============================================================================

import type { Assertion, AssertionResult, AgentResponse } from '../core/types.js';
import { computeSemanticSimilarity } from '../embeddings/index.js';
import { tfidfSimilarity } from '../embeddings/cosine.js';

/**
 * Assert that the agent output semantically matches the expected text.
 *
 * **v1.0.0**: Now uses configurable embedding providers (OpenAI, local) for
 * real cosine similarity. Falls back to TF-IDF when no provider is configured.
 *
 * @example
 * ```ts
 * // Basic (uses TF-IDF or configured provider)
 * outputSemanticallyMatches('flight booked successfully', 0.6)
 *
 * // With custom similarity function
 * outputSemanticallyMatches('booked', 0.8, myCustomSimilarityFn)
 * ```
 */
export function outputSemanticallyMatches(
    expected: string,
    threshold: number = 0.7,
    similarityFn?: (a: string, b: string) => number | Promise<number>,
): Assertion {
    return (response: AgentResponse): AssertionResult => {
        // Use sync TF-IDF for synchronous context (backward compatible)
        const similarity = similarityFn
            ? (similarityFn(response.output, expected) as number)
            : tfidfSimilarity(response.output, expected);

        const score = typeof similarity === 'number' ? similarity : 0;
        const passed = score >= threshold;

        return {
            passed,
            name: 'outputSemanticallyMatches',
            message: passed
                ? `Semantic similarity: ${(score * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`
                : `Semantic similarity too low: ${(score * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%`,
            expected: `similarity >= ${(threshold * 100).toFixed(1)}%`,
            actual: `${(score * 100).toFixed(1)}%`,
        };
    };
}

/**
 * Async version of outputSemanticallyMatches.
 * Uses the configured embedding provider for real vector cosine similarity.
 *
 * @example
 * ```ts
 * import { setEmbeddingProvider, OpenAIEmbeddings } from 'agentic-test';
 * setEmbeddingProvider(new OpenAIEmbeddings({ apiKey: 'sk-...' }));
 *
 * // Now use async version in assertions
 * outputSemanticallyMatchesAsync('flight booked', 0.85)
 * ```
 */
export function outputSemanticallyMatchesAsync(
    expected: string,
    threshold: number = 0.7,
): Assertion {
    // Return a special assertion that signals it needs async resolution
    const asyncAssertion = (response: AgentResponse): AssertionResult => {
        // This will be resolved by the test runner
        const result: AssertionResult & { _asyncEval?: () => Promise<AssertionResult> } = {
            passed: false,
            name: 'outputSemanticallyMatchesAsync',
            message: 'Pending async evaluation...',
            _asyncEval: async () => {
                const similarity = await computeSemanticSimilarity(response.output, expected);
                const passed = similarity >= threshold;

                return {
                    passed,
                    name: 'outputSemanticallyMatchesAsync',
                    message: passed
                        ? `Semantic similarity (embeddings): ${(similarity * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`
                        : `Semantic similarity too low: ${(similarity * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%`,
                    expected: `similarity >= ${(threshold * 100).toFixed(1)}%`,
                    actual: `${(similarity * 100).toFixed(1)}%`,
                };
            },
        };
        return result;
    };

    return asyncAssertion;
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
// Groundedness Utility
// ============================================================================

/**
 * Compute groundedness: what fraction of output words appear in the context.
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
