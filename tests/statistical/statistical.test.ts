// ============================================================================
// Tests — Statistical Mode
// ============================================================================

import { describe, it, expect } from 'vitest';
import { executeStatisticalTest, formatStatisticalResult } from '../../src/core/statistical.js';
import { createMockAgent } from '../../src/mocks/mock-provider.js';
import { outputContains } from '../../src/assertions/output.js';
import { toolWasCalled } from '../../src/assertions/tools.js';

describe('Statistical Mode', () => {
    it('runs test N times and reports pass rate', async () => {
        const agent = createMockAgent()
            .on('*')
            .respondWith({
                output: 'Flight booked! Confirmation #ABC',
                toolCalls: [{ name: 'bookFlight', arguments: {} }],
                tokens: 100,
            })
            .build();

        const result = await executeStatisticalTest('Book a flight', agent, {
            runs: 5,
            passRate: 0.8,
            assertions: [
                outputContains('booked'),
                toolWasCalled('bookFlight'),
            ],
        });

        expect(result.totalRuns).toBe(5);
        expect(result.passedRuns).toBe(5);
        expect(result.actualPassRate).toBe(1.0);
        expect(result.passed).toBe(true);
        expect(result.avgTokens).toBe(100);
        expect(result.runs).toHaveLength(5);
    });

    it('detects failures when pass rate is below threshold', async () => {
        let callCount = 0;
        const agent = createMockAgent()
            .on('*')
            .respondDynamically(() => {
                callCount++;
                // Alternate between passing and failing
                if (callCount % 2 === 0) {
                    return { output: 'Flight booked!', tokens: 100 };
                }
                return { output: 'Error occurred', tokens: 50 };
            })
            .build();

        const result = await executeStatisticalTest('Book a flight', agent, {
            runs: 4,
            passRate: 0.9,
            assertions: [outputContains('booked')],
        });

        // 2 out of 4 should pass (50%)
        expect(result.passedRuns).toBe(2);
        expect(result.actualPassRate).toBe(0.5);
        expect(result.passed).toBe(false); // 50% < 90%
    });

    it('computes standard deviation correctly', async () => {
        let call = 0;
        const agent = createMockAgent()
            .on('*')
            .respondDynamically(() => {
                call++;
                return { output: 'ok', tokens: call * 10 };
            })
            .build();

        const result = await executeStatisticalTest('test', agent, {
            runs: 3,
            passRate: 1.0,
            assertions: [outputContains('ok')],
        });

        // Tokens: 10, 20, 30 → avg: 20, stddev: ~8.16
        expect(result.avgTokens).toBeCloseTo(20, 0);
        expect(result.stdDevTokens).toBeGreaterThan(0);
    });

    it('formats result correctly', async () => {
        const agent = createMockAgent()
            .on('*')
            .respondWith({ output: 'ok', tokens: 50 })
            .build();

        const result = await executeStatisticalTest('test', agent, {
            runs: 3,
            passRate: 1.0,
            assertions: [outputContains('ok')],
        });

        const formatted = formatStatisticalResult(result);
        expect(formatted).toContain('3 runs');
        expect(formatted).toContain('100% pass rate');
    });
});
