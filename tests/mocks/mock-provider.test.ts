// ============================================================================
// Tests — Mock Provider
// ============================================================================

import { describe, it, expect } from 'vitest';
import { createMockAgent } from '../../src/mocks/mock-provider.js';

describe('MockAgentBuilder', () => {
    it('matches string patterns (case-insensitive substring)', async () => {
        const agent = createMockAgent()
            .on('weather')
            .respondWith({ output: 'It is sunny!', tokens: 10 })
            .build();

        const response = await agent.run('What is the weather?');
        expect(response.output).toBe('It is sunny!');
        expect(response.tokens).toBe(10);
    });

    it('matches regex patterns', async () => {
        const agent = createMockAgent()
            .on(/order #\d+/)
            .respondWith({ output: 'Order found', tokens: 5 })
            .build();

        const response = await agent.run('Check order #12345');
        expect(response.output).toBe('Order found');
    });

    it('falls back to default handler', async () => {
        const agent = createMockAgent()
            .on('weather')
            .respondWith({ output: 'Sunny' })
            .on('*')
            .respondWith({ output: 'Unknown request' })
            .build();

        const response = await agent.run('Tell me a joke');
        expect(response.output).toBe('Unknown request');
    });

    it('includes tool calls in response', async () => {
        const agent = createMockAgent()
            .on('book')
            .respondWith({
                output: 'Booked!',
                toolCalls: [
                    { name: 'search', arguments: { q: 'flights' }, result: { count: 5 } },
                    { name: 'book', arguments: { id: 1 } },
                ],
                tokens: 100,
            })
            .build();

        const response = await agent.run('Book a flight');
        expect(response.toolCalls).toHaveLength(2);
        expect(response.toolCalls[0].name).toBe('search');
        expect(response.toolCalls[1].name).toBe('book');
    });

    it('supports dynamic response handlers', async () => {
        const agent = createMockAgent()
            .on('greet')
            .respondDynamically((input) => ({
                output: `You said: ${input}`,
                tokens: input.length,
            }))
            .build();

        const response = await agent.run('greet me please');
        expect(response.output).toBe('You said: greet me please');
        expect(response.tokens).toBe('greet me please'.length);
    });

    it('uses first matching handler', async () => {
        const agent = createMockAgent()
            .on('hello')
            .respondWith({ output: 'Hi!' })
            .on('hello world')
            .respondWith({ output: 'Hello World!' })
            .build();

        const response = await agent.run('hello');
        expect(response.output).toBe('Hi!');
    });
});
