// ============================================================================
// agentic-test — Multi-Agent Tracing (v3.0.0)
// ============================================================================

import { Tracer, createTracer } from './tracer.js';
import type { Span } from './types.js';

/**
 * Extends the base Tracer to support tracking communications between multiple agents
 * in a multi-agent orchestration setup (like CrewAI, AutoGen, etc).
 */
export class MultiAgentTracer extends Tracer {
    /**
     * Records a message sent from one agent to another.
     * This creates a specialized span that assertions can easily parse.
     */
    public recordMessage(fromAgent: string, toAgent: string, payload: unknown): string {
        const spanId = this.startSpan(`msg:${fromAgent}->${toAgent}`);
        this.endSpan(spanId, {
            type: 'multi-agent-message',
            from: fromAgent,
            to: toAgent,
            payload: typeof payload === 'string' ? payload : JSON.stringify(payload)
        });
        return spanId;
    }

    /**
     * Records that an agent started working on a task.
     */
    public startAgentTask(agentName: string, taskDescription?: string): string {
        return this.startSpan(`agent:${agentName}`, {
            type: 'multi-agent-task',
            agent: agentName,
            task: taskDescription
        });
    }
}

/**
 * Creates a new Multi-Agent Tracer instance.
 */
export function createMultiAgentTracer(workflowName: string = 'multi-agent-workflow'): MultiAgentTracer {
    return new MultiAgentTracer(workflowName);
}
