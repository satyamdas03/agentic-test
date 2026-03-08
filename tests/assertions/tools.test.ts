// ============================================================================
// Tests — Tool Call Assertions
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
    toolWasCalled,
    toolNotCalled,
    toolCalledWith,
    toolCallOrder,
    toolCalledTimes,
    totalToolCalls,
    toolReturnedResult,
} from '../../src/assertions/tools.js';
import type { AgentResponse, ToolCall } from '../../src/core/types.js';

const makeResponse = (
    output: string,
    toolCalls: ToolCall[],
): AgentResponse => ({
    output,
    toolCalls,
    tokens: 100,
    duration: 200,
});

const sampleToolCalls: ToolCall[] = [
    { name: 'searchFlights', arguments: { from: 'NYC', to: 'London' }, result: { found: 3 } },
    { name: 'comparePrices', arguments: { flights: [1, 2, 3] } },
    { name: 'bookFlight', arguments: { flightId: 'AA123', from: 'NYC' }, result: { confirmation: 'CONF-001' } },
];

describe('Tool Call Assertions', () => {
    describe('toolWasCalled', () => {
        it('passes when the tool was called', () => {
            const result = toolWasCalled('searchFlights')(makeResponse('ok', sampleToolCalls));
            expect(result.passed).toBe(true);
        });

        it('fails when the tool was not called', () => {
            const result = toolWasCalled('cancelFlight')(makeResponse('ok', sampleToolCalls));
            expect(result.passed).toBe(false);
        });
    });

    describe('toolNotCalled', () => {
        it('passes when the tool was not called', () => {
            const result = toolNotCalled('cancelFlight')(makeResponse('ok', sampleToolCalls));
            expect(result.passed).toBe(true);
        });

        it('fails when the tool was called', () => {
            const result = toolNotCalled('searchFlights')(makeResponse('ok', sampleToolCalls));
            expect(result.passed).toBe(false);
        });
    });

    describe('toolCalledWith', () => {
        it('passes with partial argument match', () => {
            const result = toolCalledWith('bookFlight', { from: 'NYC' })(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(true);
        });

        it('fails when arguments do not match', () => {
            const result = toolCalledWith('bookFlight', { from: 'LAX' })(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(false);
        });

        it('fails when the tool was never called', () => {
            const result = toolCalledWith('cancelFlight', { id: '1' })(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(false);
        });
    });

    describe('toolCallOrder', () => {
        it('passes when tools are called in order', () => {
            const result = toolCallOrder(['searchFlights', 'bookFlight'])(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(true);
        });

        it('passes for full order', () => {
            const result = toolCallOrder(['searchFlights', 'comparePrices', 'bookFlight'])(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(true);
        });

        it('fails when order is wrong', () => {
            const result = toolCallOrder(['bookFlight', 'searchFlights'])(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(false);
        });
    });

    describe('toolCalledTimes', () => {
        it('passes when count matches', () => {
            const result = toolCalledTimes('searchFlights', 1)(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(true);
        });

        it('fails when count does not match', () => {
            const result = toolCalledTimes('searchFlights', 2)(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(false);
        });
    });

    describe('totalToolCalls', () => {
        it('passes when total count matches', () => {
            const result = totalToolCalls(3)(makeResponse('ok', sampleToolCalls));
            expect(result.passed).toBe(true);
        });

        it('fails when total count does not match', () => {
            const result = totalToolCalls(5)(makeResponse('ok', sampleToolCalls));
            expect(result.passed).toBe(false);
        });
    });

    describe('toolReturnedResult', () => {
        it('passes with partial result match', () => {
            const result = toolReturnedResult('searchFlights', { found: 3 })(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(true);
        });

        it('fails when result does not match', () => {
            const result = toolReturnedResult('searchFlights', { found: 10 })(
                makeResponse('ok', sampleToolCalls),
            );
            expect(result.passed).toBe(false);
        });
    });
});
