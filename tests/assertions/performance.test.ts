// ============================================================================
// Tests — Performance Assertions
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
    completedWithin,
    tokensBudget,
    maxToolCalls,
    minToolCalls,
    costBudget,
} from '../../src/assertions/performance.js';
import type { AgentResponse } from '../../src/core/types.js';

const makeResponse = (overrides: Partial<AgentResponse> = {}): AgentResponse => ({
    output: 'test output',
    toolCalls: overrides.toolCalls ?? [],
    tokens: overrides.tokens ?? 100,
    duration: overrides.duration ?? 500,
});

describe('Performance Assertions', () => {
    describe('completedWithin', () => {
        it('passes when within time budget', () => {
            const result = completedWithin(1000)(makeResponse({ duration: 500 }));
            expect(result.passed).toBe(true);
        });

        it('fails when exceeding time budget', () => {
            const result = completedWithin(100)(makeResponse({ duration: 500 }));
            expect(result.passed).toBe(false);
        });
    });

    describe('tokensBudget', () => {
        it('passes when within token budget', () => {
            const result = tokensBudget(200)(makeResponse({ tokens: 100 }));
            expect(result.passed).toBe(true);
        });

        it('fails when exceeding token budget', () => {
            const result = tokensBudget(50)(makeResponse({ tokens: 100 }));
            expect(result.passed).toBe(false);
        });
    });

    describe('maxToolCalls', () => {
        it('passes when within limit', () => {
            const result = maxToolCalls(5)(
                makeResponse({
                    toolCalls: [
                        { name: 'a', arguments: {} },
                        { name: 'b', arguments: {} },
                    ],
                }),
            );
            expect(result.passed).toBe(true);
        });

        it('fails when exceeding limit', () => {
            const result = maxToolCalls(1)(
                makeResponse({
                    toolCalls: [
                        { name: 'a', arguments: {} },
                        { name: 'b', arguments: {} },
                    ],
                }),
            );
            expect(result.passed).toBe(false);
        });
    });

    describe('minToolCalls', () => {
        it('passes when meeting minimum', () => {
            const result = minToolCalls(1)(
                makeResponse({
                    toolCalls: [{ name: 'a', arguments: {} }],
                }),
            );
            expect(result.passed).toBe(true);
        });

        it('fails when below minimum', () => {
            const result = minToolCalls(2)(
                makeResponse({
                    toolCalls: [{ name: 'a', arguments: {} }],
                }),
            );
            expect(result.passed).toBe(false);
        });
    });

    describe('costBudget', () => {
        it('passes when within cost budget', () => {
            const result = costBudget(0.05)(makeResponse({ tokens: 100 }));
            expect(result.passed).toBe(true);
        });

        it('fails when exceeding cost budget', () => {
            const result = costBudget(0.001)(makeResponse({ tokens: 10000 }));
            expect(result.passed).toBe(false);
        });
    });
});
