// ============================================================================
// Tests — Output Assertions
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
    outputContains,
    outputDoesNotContain,
    outputMatches,
    outputStartsWith,
    outputEndsWith,
    outputContainsIgnoreCase,
    outputMinLength,
    outputMaxLength,
    outputIsNotEmpty,
} from '../../src/assertions/output.js';
import type { AgentResponse } from '../../src/core/types.js';

const makeResponse = (output: string): AgentResponse => ({
    output,
    toolCalls: [],
    tokens: 0,
    duration: 100,
});

describe('Output Assertions', () => {
    describe('outputContains', () => {
        it('passes when output contains the text', () => {
            const result = outputContains('hello')(makeResponse('hello world'));
            expect(result.passed).toBe(true);
        });

        it('fails when output does not contain the text', () => {
            const result = outputContains('goodbye')(makeResponse('hello world'));
            expect(result.passed).toBe(false);
        });
    });

    describe('outputDoesNotContain', () => {
        it('passes when output does not contain the text', () => {
            const result = outputDoesNotContain('error')(makeResponse('all good'));
            expect(result.passed).toBe(true);
        });

        it('fails when output contains the text', () => {
            const result = outputDoesNotContain('error')(makeResponse('there was an error'));
            expect(result.passed).toBe(false);
        });
    });

    describe('outputMatches', () => {
        it('passes when output matches regex', () => {
            const result = outputMatches(/order #\d{5}/)(makeResponse('Your order #12345 is confirmed'));
            expect(result.passed).toBe(true);
        });

        it('fails when output does not match regex', () => {
            const result = outputMatches(/order #\d{5}/)(makeResponse('No order found'));
            expect(result.passed).toBe(false);
        });
    });

    describe('outputStartsWith', () => {
        it('passes when output starts with prefix', () => {
            const result = outputStartsWith('Sure,')(makeResponse('Sure, here is the answer'));
            expect(result.passed).toBe(true);
        });

        it('fails when output does not start with prefix', () => {
            const result = outputStartsWith('Sure,')(makeResponse('Here is the answer'));
            expect(result.passed).toBe(false);
        });
    });

    describe('outputEndsWith', () => {
        it('passes when output ends with suffix', () => {
            const result = outputEndsWith('.')(makeResponse('The answer is 42.'));
            expect(result.passed).toBe(true);
        });

        it('fails when output does not end with suffix', () => {
            const result = outputEndsWith('.')(makeResponse('The answer is 42'));
            expect(result.passed).toBe(false);
        });
    });

    describe('outputContainsIgnoreCase', () => {
        it('passes case-insensitively', () => {
            const result = outputContainsIgnoreCase('SUCCESS')(makeResponse('Operation was a success!'));
            expect(result.passed).toBe(true);
        });
    });

    describe('outputMinLength', () => {
        it('passes when output meets minimum length', () => {
            const result = outputMinLength(5)(makeResponse('hello world'));
            expect(result.passed).toBe(true);
        });

        it('fails when output is too short', () => {
            const result = outputMinLength(100)(makeResponse('hi'));
            expect(result.passed).toBe(false);
        });
    });

    describe('outputMaxLength', () => {
        it('passes when output is within max length', () => {
            const result = outputMaxLength(100)(makeResponse('hello'));
            expect(result.passed).toBe(true);
        });

        it('fails when output is too long', () => {
            const result = outputMaxLength(3)(makeResponse('hello'));
            expect(result.passed).toBe(false);
        });
    });

    describe('outputIsNotEmpty', () => {
        it('passes for non-empty output', () => {
            const result = outputIsNotEmpty()(makeResponse('hello'));
            expect(result.passed).toBe(true);
        });

        it('fails for empty output', () => {
            const result = outputIsNotEmpty()(makeResponse(''));
            expect(result.passed).toBe(false);
        });

        it('fails for whitespace-only output', () => {
            const result = outputIsNotEmpty()(makeResponse('   '));
            expect(result.passed).toBe(false);
        });
    });
});
