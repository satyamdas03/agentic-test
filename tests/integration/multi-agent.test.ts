// ============================================================================
// Multi-Agent Integration Tests
// ============================================================================

import { describe, test, expect } from 'vitest';
import { executeTestCase } from '../../src/core/test-case.js';
import { createMultiAgentTracer } from '../../src/tracing/multi-agent.js';
import { messagePassed, agentParticipated, routingPathMatches } from '../../src/assertions/multi-agent.js';
import { exportTraceAsMermaid } from '../../src/tracing/export.js';

// Simulate a multi-agent orchestrated workflow
async function mockMultiAgentWorkflow(input: string) {
    const tracer = createMultiAgentTracer('research-workflow');

    // Agent 1: Researcher
    const researcherTask = tracer.startAgentTask('Researcher', 'Find information on quantum computing.');
    await new Promise(r => setTimeout(r, 10));
    tracer.endSpan(researcherTask, { tokens: 100 });

    // Message Pass
    tracer.recordMessage('Researcher', 'Writer', 'Found 3 articles on quantum bits.');

    // Agent 2: Writer
    const writerTask = tracer.startAgentTask('Writer', 'Draft an article.');
    await new Promise(r => setTimeout(r, 10));
    tracer.endSpan(writerTask, { tokens: 50 });

    return {
        output: 'Draft completed about quantum bits.',
        toolCalls: [],
        tokens: 150,
        duration: 20,
        trace: tracer.getTrace()
    };
}

describe('Multi-Agent Integration Tests', () => {
    test('Asserts correct message routing paths across agents', async () => {
        const result = await executeTestCase('Multi-Agent Flow', {
            input: 'Write an article on quantum computing.',
            adapter: { run: mockMultiAgentWorkflow } as any,
            assertions: [
                messagePassed('Researcher', 'Writer'),
                agentParticipated('Writer'),
                routingPathMatches(['Researcher', 'Writer'])
            ]
        });

        expect(result.status).toBe('passed');
        expect(result.assertions.every(a => a.passed)).toBe(true);

        // Test Mermaid Export
        const mermaid = exportTraceAsMermaid(result.agentResponse!.trace!);
        expect(mermaid).toContain('Researcher->>Writer: Message');
    });
});
