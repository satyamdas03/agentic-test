// ============================================================================
// agentic-test — Streaming Adapter & Assertions
// ============================================================================

import type { Assertion, AssertionResult, AgentResponse, ToolCall } from '../core/types.js';

/**
 * A single chunk from a streaming response.
 */
export interface StreamChunk {
    /** Text content of this chunk */
    text?: string;
    /** Tool call if this chunk contains one */
    toolCall?: ToolCall;
    /** Whether this is the final chunk */
    done?: boolean;
    /** Token count for this chunk */
    tokens?: number;
}

/**
 * Interface for agents that produce streaming responses.
 */
export interface StreamingAdapter {
    /** Run the agent and return an async iterable of chunks */
    runStream(input: string): AsyncIterable<StreamChunk>;
}

/**
 * Create a streaming adapter from an async generator function.
 *
 * @example
 * ```ts
 * const streamAgent = createStreamingAdapter(async function* (input) {
 *   const stream = await openai.chat.completions.create({ stream: true, ... });
 *   for await (const chunk of stream) {
 *     yield { text: chunk.choices[0]?.delta?.content ?? '' };
 *   }
 * });
 * ```
 */
export function createStreamingAdapter(
    fn: (input: string) => AsyncIterable<StreamChunk>,
): StreamingAdapter {
    return {
        runStream: fn,
    };
}

/**
 * Collect a streaming response into a standard AgentResponse.
 * Useful for running streaming agents through non-streaming assertions.
 */
export async function collectStream(
    adapter: StreamingAdapter,
    input: string,
): Promise<AgentResponse & { chunks: StreamChunk[]; chunkCount: number; timeToFirstChunk: number }> {
    const startTime = performance.now();
    const chunks: StreamChunk[] = [];
    let output = '';
    const toolCalls: ToolCall[] = [];
    let totalTokens = 0;
    let timeToFirstChunk = 0;

    for await (const chunk of adapter.runStream(input)) {
        if (chunks.length === 0) {
            timeToFirstChunk = performance.now() - startTime;
        }

        chunks.push(chunk);

        if (chunk.text) {
            output += chunk.text;
        }
        if (chunk.toolCall) {
            toolCalls.push(chunk.toolCall);
        }
        if (chunk.tokens) {
            totalTokens += chunk.tokens;
        }
    }

    return {
        output,
        toolCalls,
        tokens: totalTokens,
        duration: performance.now() - startTime,
        chunks,
        chunkCount: chunks.length,
        timeToFirstChunk,
    };
}

// ============================================================================
// Streaming-Specific Assertions
// ============================================================================

/**
 * Assert that the stream completes without error.
 */
export function streamCompletes(): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const passed = !response.error;
        return {
            passed,
            name: 'streamCompletes',
            message: passed
                ? 'Stream completed successfully'
                : `Stream failed: ${response.error?.message}`,
        };
    };
}

/**
 * Assert the number of chunks received.
 */
export function streamChunkCount(min: number, max?: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const resp = response as AgentResponse & { chunkCount?: number };
        const count = resp.chunkCount ?? 0;
        const passed = count >= min && (max === undefined || count <= max);

        return {
            passed,
            name: 'streamChunkCount',
            message: passed
                ? `Received ${count} chunks (expected: ${min}${max !== undefined ? `-${max}` : '+'})`
                : `Chunk count ${count} outside range ${min}${max !== undefined ? `-${max}` : '+'}`,
            expected: `${min}${max !== undefined ? `-${max}` : '+'}`,
            actual: count,
        };
    };
}

/**
 * Assert time to first chunk (TTFC) — critical for streaming UX.
 */
export function firstChunkWithin(maxMs: number): Assertion {
    return (response: AgentResponse): AssertionResult => {
        const resp = response as AgentResponse & { timeToFirstChunk?: number };
        const ttfc = resp.timeToFirstChunk ?? response.duration;
        const passed = ttfc <= maxMs;

        return {
            passed,
            name: 'firstChunkWithin',
            message: passed
                ? `Time to first chunk: ${Math.round(ttfc)}ms (max: ${maxMs}ms)`
                : `Time to first chunk too slow: ${Math.round(ttfc)}ms > ${maxMs}ms`,
            expected: `<= ${maxMs}ms`,
            actual: `${Math.round(ttfc)}ms`,
        };
    };
}
