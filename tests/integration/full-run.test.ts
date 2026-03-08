// ============================================================================
// Tests — Full Integration Test
// ============================================================================

import { describe as vitestDescribe, it, expect } from 'vitest';
import {
    describe,
    test,
    AgenticTestRunner,
    getRegisteredSuites,
    clearRegisteredSuites,
} from '../../src/core/runner.js';
import { createMockAgent } from '../../src/mocks/mock-provider.js';
import { outputContains } from '../../src/assertions/output.js';
import {
    toolWasCalled,
    toolCalledWith,
    toolCallOrder,
} from '../../src/assertions/tools.js';
import { completedWithin, tokensBudget } from '../../src/assertions/performance.js';
import { ConsoleReporter } from '../../src/reporters/console.js';

vitestDescribe('Full Integration Test', () => {
    // Clean up before each test
    it('runs a complete test pipeline with mock agent', async () => {
        clearRegisteredSuites();

        // Create a mock agent
        const agent = createMockAgent()
            .on('weather')
            .respondWith({
                output: 'The weather in New York is sunny, 72°F with clear skies.',
                toolCalls: [
                    {
                        name: 'getWeather',
                        arguments: { city: 'New York' },
                        result: { temp: 72, condition: 'sunny' },
                    },
                ],
                tokens: 85,
            })
            .on('book flight')
            .respondWith({
                output: 'Flight booked! Confirmation #ABCDE',
                toolCalls: [
                    { name: 'searchFlights', arguments: { from: 'NYC', to: 'London' } },
                    { name: 'bookFlight', arguments: { flightId: 'BA456', from: 'NYC' } },
                ],
                tokens: 150,
            })
            .on('*')
            .respondWith({
                output: "I'm sorry, I don't understand that request.",
                tokens: 20,
            })
            .build();

        // Register test suites using our describe/test API
        describe('Weather Agent', { adapter: agent }, () => {
            test('fetches weather successfully', {
                input: 'What is the weather in New York?',
                assertions: [
                    toolWasCalled('getWeather'),
                    toolCalledWith('getWeather', { city: 'New York' }),
                    outputContains('sunny'),
                    outputContains('72'),
                    completedWithin(5000),
                    tokensBudget(200),
                ],
            });

            test('handles unknown requests', {
                input: 'Tell me a joke',
                assertions: [
                    outputContains("don't understand"),
                ],
            });
        });

        describe('Flight Booking Agent', { adapter: agent }, () => {
            test('books a flight with correct tool order', {
                input: 'Please book flight from NYC to London',
                assertions: [
                    toolWasCalled('searchFlights'),
                    toolWasCalled('bookFlight'),
                    toolCallOrder(['searchFlights', 'bookFlight']),
                    toolCalledWith('bookFlight', { from: 'NYC' }),
                    outputContains('Confirmation'),
                    completedWithin(5000),
                ],
            });
        });

        // Get all registered suites
        const suites = getRegisteredSuites();
        expect(suites).toHaveLength(2);

        // Create runner (suppress console output for test)
        const runner = new AgenticTestRunner();
        // Don't add console reporter to avoid noisy test output

        // Run all tests
        const result = await runner.run(suites);

        // Verify results
        expect(result.totalTests).toBe(3);
        expect(result.passed).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.skipped).toBe(0);
        expect(result.suites).toHaveLength(2);

        // Check first suite
        expect(result.suites[0].name).toBe('Weather Agent');
        expect(result.suites[0].tests).toHaveLength(2);
        expect(result.suites[0].tests[0].status).toBe('passed');
        expect(result.suites[0].tests[1].status).toBe('passed');

        // Check second suite
        expect(result.suites[1].name).toBe('Flight Booking Agent');
        expect(result.suites[1].tests).toHaveLength(1);
        expect(result.suites[1].tests[0].status).toBe('passed');

        // Check token tracking
        expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('correctly reports failed tests', async () => {
        clearRegisteredSuites();

        const agent = createMockAgent()
            .on('*')
            .respondWith({
                output: 'Some response without the expected content',
                tokens: 50,
            })
            .build();

        describe('Failing Suite', { adapter: agent }, () => {
            test('this should fail', {
                input: 'hello',
                assertions: [
                    outputContains('THIS WILL NOT BE FOUND'),
                    toolWasCalled('nonExistentTool'),
                ],
            });
        });

        const suites = getRegisteredSuites();
        const runner = new AgenticTestRunner();
        const result = await runner.run(suites);

        expect(result.totalTests).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.passed).toBe(0);

        const failedTest = result.suites[0].tests[0];
        expect(failedTest.status).toBe('failed');
        expect(failedTest.assertions.filter((a) => !a.passed)).toHaveLength(2);
    });

    it('handles skipped tests', async () => {
        clearRegisteredSuites();

        const agent = createMockAgent()
            .on('*')
            .respondWith({ output: 'ok' })
            .build();

        describe('Skip Suite', { adapter: agent }, () => {
            test('this is skipped', {
                input: 'hello',
                assertions: [outputContains('ok')],
                skip: true,
            });

            test('this runs', {
                input: 'hello',
                assertions: [outputContains('ok')],
            });
        });

        const suites = getRegisteredSuites();
        const runner = new AgenticTestRunner();
        const result = await runner.run(suites);

        expect(result.totalTests).toBe(2);
        expect(result.passed).toBe(1);
        expect(result.skipped).toBe(1);
    });

    it('works with console reporter without errors', async () => {
        clearRegisteredSuites();

        const agent = createMockAgent()
            .on('*')
            .respondWith({
                output: 'Hello!',
                toolCalls: [{ name: 'greet', arguments: { name: 'world' } }],
                tokens: 30,
            })
            .build();

        describe('Reporter Test', { adapter: agent }, () => {
            test('basic test', {
                input: 'hello',
                assertions: [outputContains('Hello')],
            });
        });

        const suites = getRegisteredSuites();
        const runner = new AgenticTestRunner();
        runner.addReporter(new ConsoleReporter());
        const result = await runner.run(suites);

        expect(result.passed).toBe(1);
    });
});
