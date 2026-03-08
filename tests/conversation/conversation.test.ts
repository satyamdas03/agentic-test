// ============================================================================
// Tests — Conversation Testing
// ============================================================================

import { describe, it, expect } from 'vitest';
import { executeConversation, createConversationalAdapter } from '../../src/conversation/index.js';
import { createMockAgent } from '../../src/mocks/mock-provider.js';
import { outputContains } from '../../src/assertions/output.js';
import { toolWasCalled, toolNotCalled } from '../../src/assertions/tools.js';
import type { AgentResponse } from '../../src/core/types.js';

describe('Conversation Testing', () => {
    it('executes multi-turn conversation with per-turn assertions', async () => {
        // Simple adapter that just uses the current input
        const agent = createMockAgent()
            .on('return')
            .respondWith({
                output: 'Sure, I can help with returns. What is your order number?',
                tokens: 30,
            })
            .on('ORD-123')
            .respondWith({
                output: 'Order #ORD-123 found. It is eligible for a refund of $49.99.',
                toolCalls: [{ name: 'lookupOrder', arguments: { orderId: 'ORD-123' } }],
                tokens: 50,
            })
            .on('yes')
            .respondWith({
                output: 'Refund processed! Confirmation #REF-789.',
                toolCalls: [{ name: 'processRefund', arguments: { orderId: 'ORD-123' } }],
                tokens: 40,
            })
            .build();

        const result = await executeConversation('Refund Flow', agent, [
            {
                user: 'I want to return my order',
                assertions: [
                    outputContains('order number'),
                    toolNotCalled('processRefund'),
                ],
            },
            {
                user: 'ORD-123',
                assertions: [
                    toolWasCalled('lookupOrder'),
                    outputContains('eligible'),
                    outputContains('$49.99'),
                ],
            },
            {
                user: 'yes, please process the refund',
                assertions: [
                    toolWasCalled('processRefund'),
                    outputContains('REF-789'),
                ],
            },
        ]);

        expect(result.name).toBe('Refund Flow');
        expect(result.turns).toHaveLength(3);
        expect(result.turns[0].passed).toBe(true);
        expect(result.turns[1].passed).toBe(true);
        expect(result.turns[2].passed).toBe(true);
        expect(result.passed).toBe(true);
        expect(result.totalTokens).toBe(120); // 30 + 50 + 40
    });

    it('fails on assertion failure in a turn', async () => {
        const agent = createMockAgent()
            .on('*')
            .respondWith({ output: 'OK', tokens: 10 })
            .build();

        const result = await executeConversation('Failing Flow', agent, [
            {
                user: 'hello',
                assertions: [outputContains('THIS WILL NOT BE FOUND')],
            },
        ]);

        expect(result.passed).toBe(false);
        expect(result.turns[0].passed).toBe(false);
    });

    it('works with conversational adapter that receives history', async () => {
        const chatAgent = createConversationalAdapter(async (messages, input) => {
            const turnCount = messages.length / 2 + 1;
            return {
                output: `Turn ${turnCount}: responding to "${input}" with ${messages.length} history entries`,
                toolCalls: [],
                tokens: 20,
                duration: 10,
            };
        });

        const result = await executeConversation('History Test', chatAgent, [
            {
                user: 'hello',
                assertions: [outputContains('Turn 1'), outputContains('0 history')],
            },
            {
                user: 'how are you',
                assertions: [outputContains('Turn 2'), outputContains('2 history')],
            },
            {
                user: 'goodbye',
                assertions: [outputContains('Turn 3'), outputContains('4 history')],
            },
        ]);

        expect(result.passed).toBe(true);
        expect(result.turns).toHaveLength(3);
    });
});
