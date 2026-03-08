// ============================================================================
// agentic-test — Multi-Agent Assertions (v3.0.0)
// ============================================================================

import type { AgentResponse, AssertionResult } from '../core/types.js';
import type { Span, Trace } from '../tracing/types.js';
import type { TraceAssertion } from '../tracing/assertions.js';

/**
 * Asserts that a message was successfully sent from one agent to another during the trace.
 */
export function messagePassed(fromAgent: string, toAgent: string): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'messagePassed', message: 'No trace found in response' };
        }

        const messages = findSpansByType(trace.rootSpan, 'multi-agent-message');
        const found = messages.some(m => m.attributes.from === fromAgent && m.attributes.to === toAgent);

        return {
            passed: found,
            name: 'messagePassed',
            message: found
                ? `Message successfully routed from ${fromAgent} to ${toAgent}`
                : `No message found routing from ${fromAgent} to ${toAgent}`,
        };
    };
}

/**
 * Asserts that a specific agent actively participated in the workflow (had a task or sent a message).
 */
export function agentParticipated(agentName: string): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'agentParticipated', message: 'No trace found in response' };
        }

        const tasks = findSpansByType(trace.rootSpan, 'multi-agent-task');
        const messages = findSpansByType(trace.rootSpan, 'multi-agent-message');

        const foundTask = tasks.some(t => t.attributes.agent === agentName);
        const sentMessage = messages.some(m => m.attributes.from === agentName);
        const receivedMessage = messages.some(m => m.attributes.to === agentName);

        const participated = foundTask || sentMessage || receivedMessage;

        return {
            passed: participated,
            name: 'agentParticipated',
            message: participated
                ? `Agent ${agentName} participated in the orchestration`
                : `Agent ${agentName} did not participate in the orchestration`,
        };
    };
}

/**
 * Asserts the exact, ordered sequence of agents that messages were routed through.
 * E.g., ['UserProxyAgent', 'CoderAgent', 'ReviewerAgent', 'UserProxyAgent']
 */
export function routingPathMatches(expectedPath: string[]): TraceAssertion {
    return (response) => {
        const trace = response.trace as Trace | undefined;
        if (!trace?.rootSpan) {
            return { passed: false, name: 'routingPathMatches', message: 'No trace found in response' };
        }

        const messages = findSpansByType(trace.rootSpan, 'multi-agent-message');
        messages.sort((a, b) => a.startTime - b.startTime); // Ensure chronological order

        if (messages.length === 0) {
            return { passed: expectedPath.length === 0, name: 'routingPathMatches', message: 'No messages were passed in this orchestration' };
        }

        // Construct the actual path from the edges
        const actualPath: string[] = [];
        if (messages.length > 0) {
            actualPath.push(messages[0].attributes.from as string);
        }
        for (const msg of messages) {
            actualPath.push(msg.attributes.to as string);
        }

        // Compare paths
        if (actualPath.length !== expectedPath.length) {
            return {
                passed: false,
                name: 'routingPathMatches',
                message: `Path length mismatch. Expected ${expectedPath.length} hops, found ${actualPath.length}\nActual path: ${actualPath.join(' -> ')}`,
                expected: expectedPath.join(' -> '),
                actual: actualPath.join(' -> ')
            }
        }

        let passed = true;
        for (let i = 0; i < expectedPath.length; i++) {
            if (actualPath[i] !== expectedPath[i]) {
                passed = false;
                break;
            }
        }

        return {
            passed,
            name: 'routingPathMatches',
            message: passed
                ? `Orchestration routing path matches exactly: ${actualPath.join(' -> ')}`
                : `Orchestration skipped expected routes.\nExpected: ${expectedPath.join(' -> ')}\nActual: ${actualPath.join(' -> ')}`,
            expected: expectedPath.join(' -> '),
            actual: actualPath.join(' -> ')
        };
    };
}

// Helpers
function findSpansByType(span: Span, type: string): Span[] {
    const result: Span[] = [];
    if (span.attributes && span.attributes.type === type) {
        result.push(span);
    }
    for (const child of span.children) {
        result.push(...findSpansByType(child, type));
    }
    return result;
}
