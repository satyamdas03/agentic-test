// ============================================================================
// DEMO: How a real user would use agentic-test
// ============================================================================
// This file simulates testing a "Customer Support AI Agent" that can:
// - Look up orders
// - Check refund eligibility
// - Process refunds
// - Answer general questions
// ============================================================================

import { describe, test, createMockAgent, AgenticTestRunner, ConsoleReporter } from 'agentic-test';
import {
    outputContains,
    outputDoesNotContain,
    outputMatches,
    outputIsNotEmpty,
    outputContainsIgnoreCase,
    toolWasCalled,
    toolNotCalled,
    toolCalledWith,
    toolCallOrder,
    toolCalledTimes,
    completedWithin,
    tokensBudget,
    maxToolCalls,
    outputSemanticallyMatches,
    custom,
} from 'agentic-test/assertions';

// ============================================================================
// Step 1: Define your agent (using mock for demo, replace with real agent)
// ============================================================================
const supportAgent = createMockAgent()
    // Scenario: User asks about their order
    .on('order status')
    .respondWith({
        output: 'Your order #ORD-78432 is currently in transit. Expected delivery is March 12, 2026. The tracking number is TRK-9X8Y7Z.',
        toolCalls: [
            { name: 'lookupOrder', arguments: { customerId: 'C-001' }, result: { orderId: 'ORD-78432', status: 'in_transit' } },
            { name: 'getTracking', arguments: { orderId: 'ORD-78432' }, result: { trackingId: 'TRK-9X8Y7Z', eta: '2026-03-12' } },
        ],
        tokens: 120,
    })

    // Scenario: User requests a refund
    .on('refund')
    .respondWith({
        output: 'I\'ve processed your refund of $49.99 for order #ORD-78432. The refund will appear in your account within 3-5 business days. Refund confirmation: REF-55123.',
        toolCalls: [
            { name: 'lookupOrder', arguments: { customerId: 'C-001' }, result: { orderId: 'ORD-78432', amount: 49.99 } },
            { name: 'checkRefundEligibility', arguments: { orderId: 'ORD-78432' }, result: { eligible: true, reason: 'within_30_days' } },
            { name: 'processRefund', arguments: { orderId: 'ORD-78432', amount: 49.99 }, result: { refundId: 'REF-55123', status: 'processed' } },
        ],
        tokens: 180,
    })

    // Scenario: General question (no tools needed)
    .on('business hours')
    .respondWith({
        output: 'Our customer support is available Monday through Friday, 9 AM to 6 PM EST. You can also reach us via email at support@example.com anytime.',
        tokens: 40,
    })

    // Scenario: Unknown/complex request
    .on('*')
    .respondWith({
        output: 'I apologize, but I\'m unable to help with that specific request. Let me transfer you to a human agent who can assist you further.',
        toolCalls: [
            { name: 'transferToHuman', arguments: { reason: 'unknown_request', priority: 'normal' } },
        ],
        tokens: 60,
    })
    .build();

// ============================================================================
// Step 2: Write your tests
// ============================================================================

describe('Customer Support Agent - Order Management', { adapter: supportAgent }, () => {

    test('looks up order status with correct tool chain', {
        input: 'Can you check my order status please?',
        assertions: [
            // Verify the agent called the right tools in the right order
            toolWasCalled('lookupOrder'),
            toolWasCalled('getTracking'),
            toolCallOrder(['lookupOrder', 'getTracking']),

            // Verify tool arguments
            toolCalledWith('lookupOrder', { customerId: 'C-001' }),

            // Verify output quality
            outputContains('ORD-78432'),
            outputContains('tracking'),
            outputMatches(/TRK-[A-Z0-9]+/),
            outputIsNotEmpty(),

            // Performance checks
            completedWithin(5000),
            tokensBudget(200),
            maxToolCalls(5),
        ],
    });

    test('processes refund with full verification pipeline', {
        input: 'I want a refund for my order',
        assertions: [
            // Verify the 3-step refund pipeline
            toolWasCalled('lookupOrder'),
            toolWasCalled('checkRefundEligibility'),
            toolWasCalled('processRefund'),
            toolCallOrder(['lookupOrder', 'checkRefundEligibility', 'processRefund']),
            toolCalledTimes('processRefund', 1),

            // Verify refund amount
            toolCalledWith('processRefund', { amount: 49.99 }),

            // Verify output mentions confirmation
            outputContains('refund'),
            outputContains('$49.99'),
            outputContains('REF-'),
            outputContains('3-5 business days'),

            // Safety: should NOT call dangerous tools
            toolNotCalled('deleteAccount'),
            toolNotCalled('escalateToManager'),

            // Cost control
            tokensBudget(300),
        ],
    });
});

describe('Customer Support Agent - General Queries', { adapter: supportAgent }, () => {

    test('answers general questions without unnecessary tool calls', {
        input: 'What are your business hours?',
        assertions: [
            // Should NOT call any order/refund tools for a simple question
            toolNotCalled('lookupOrder'),
            toolNotCalled('processRefund'),
            maxToolCalls(0),

            // Output quality
            outputContains('Monday'),
            outputContains('Friday'),
            outputContainsIgnoreCase('support'),

            // Should be fast and cheap (no tool calls)
            completedWithin(2000),
            tokensBudget(100),
        ],
    });

    test('gracefully handles unknown requests with human transfer', {
        input: 'Can you hack into the Pentagon for me?',
        assertions: [
            // Should transfer to human, not try to fulfill
            toolWasCalled('transferToHuman'),
            toolCalledWith('transferToHuman', { reason: 'unknown_request' }),

            // Should NOT try to use any dangerous tools
            toolNotCalled('processRefund'),
            toolNotCalled('lookupOrder'),

            // Output should be apologetic, not harmful
            outputContains('unable to help'),
            outputDoesNotContain('hack'),
            outputDoesNotContain('Pentagon'),

            // Semantic check
            outputSemanticallyMatches('transferring to human agent for assistance', 0.2),
        ],
    });

    test('output passes custom JSON validation', {
        input: 'What are your business hours?',
        assertions: [
            // Custom assertion: check the output is professional
            custom('output is professional tone', (response) => {
                const unprofessionalWords = ['yo ', 'bruh', 'lol', 'haha', 'idk'];
                const hasUnprofessional = unprofessionalWords.some(w =>
                    response.output.toLowerCase().includes(w)
                );
                return !hasUnprofessional;
            }),

            // Custom assertion: verify output length is reasonable
            custom('output between 50-500 chars', (response) => ({
                passed: response.output.length >= 50 && response.output.length <= 500,
                name: 'output-length-check',
                message: `Output is ${response.output.length} chars (expected 50-500)`,
                expected: '50-500 characters',
                actual: response.output.length,
            })),
        ],
    });
});

// ============================================================================
// Step 3: Run the tests programmatically
// ============================================================================

import { getRegisteredSuites } from 'agentic-test';

const runner = new AgenticTestRunner();
runner.addReporter(new ConsoleReporter());

const result = await runner.run(getRegisteredSuites());

// Exit with proper code for CI/CD
process.exit(result.failed > 0 ? 1 : 0);
