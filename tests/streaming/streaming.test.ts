// ============================================================================
// Tests — Streaming Evaluation
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
    createStreamingAdapter,
    collectStream,
    streamCompletes,
    streamChunkCount,
    firstChunkWithin,
} from '../../src/adapters/streaming.js';

describe('Streaming Evaluation', () => {
    it('collects stream into AgentResponse', async () => {
        const streamAgent = createStreamingAdapter(async function* () {
            yield { text: 'Hello' };
            yield { text: ' world' };
            yield { text: '!', done: true, tokens: 3 };
        });

        const result = await collectStream(streamAgent, 'greet');

        expect(result.output).toBe('Hello world!');
        expect(result.chunkCount).toBe(3);
        expect(result.tokens).toBe(3);
        expect(result.timeToFirstChunk).toBeGreaterThan(0);
    });

    it('collects tool calls from stream', async () => {
        const streamAgent = createStreamingAdapter(async function* () {
            yield { text: 'Searching...' };
            yield { toolCall: { name: 'search', arguments: { q: 'flights' }, result: { count: 5 } } };
            yield { text: ' Found 5 flights!', done: true };
        });

        const result = await collectStream(streamAgent, 'find flights');

        expect(result.output).toBe('Searching... Found 5 flights!');
        expect(result.toolCalls).toHaveLength(1);
        expect(result.toolCalls[0].name).toBe('search');
    });

    describe('streamCompletes', () => {
        it('passes when no error', () => {
            const result = streamCompletes()({ output: 'ok', toolCalls: [], tokens: 0, duration: 100 });
            expect(result.passed).toBe(true);
        });

        it('fails when there is an error', () => {
            const result = streamCompletes()({
                output: '', toolCalls: [], tokens: 0, duration: 100, error: new Error('timeout'),
            });
            expect(result.passed).toBe(false);
        });
    });

    describe('streamChunkCount', () => {
        it('passes when chunk count is within range', () => {
            const response = { output: 'ok', toolCalls: [], tokens: 0, duration: 100, chunkCount: 5 } as any;
            const result = streamChunkCount(3, 10)(response);
            expect(result.passed).toBe(true);
        });

        it('fails when chunk count is below minimum', () => {
            const response = { output: 'ok', toolCalls: [], tokens: 0, duration: 100, chunkCount: 1 } as any;
            const result = streamChunkCount(3)(response);
            expect(result.passed).toBe(false);
        });
    });

    describe('firstChunkWithin', () => {
        it('passes when TTFC is within budget', () => {
            const response = { output: 'ok', toolCalls: [], tokens: 0, duration: 100, timeToFirstChunk: 50 } as any;
            const result = firstChunkWithin(200)(response);
            expect(result.passed).toBe(true);
        });

        it('fails when TTFC exceeds budget', () => {
            const response = { output: 'ok', toolCalls: [], tokens: 0, duration: 500, timeToFirstChunk: 400 } as any;
            const result = firstChunkWithin(100)(response);
            expect(result.passed).toBe(false);
        });
    });
});
