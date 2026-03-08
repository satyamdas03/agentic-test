// ============================================================================
// Tests — Tracing System
// ============================================================================

import { describe, it, expect } from 'vitest';
import { createTracer } from '../../src/tracing/tracer.js';
import {
    spanExists, spanDurationWithin, spanTokensBudget,
    spanCount, traceDepthWithin, noSpanErrors,
} from '../../src/tracing/assertions.js';
import { exportTraceAsJSON, exportTraceAsMermaid, renderTraceTimeline } from '../../src/tracing/export.js';

describe('Tracer', () => {
    it('creates a trace with root span', () => {
        const tracer = createTracer('test-agent');
        const trace = tracer.getTrace();
        expect(trace.traceId).toBeTruthy();
        expect(trace.rootSpan.name).toBe('test-agent');
    });

    it('manages child spans', () => {
        const tracer = createTracer('agent');
        const spanId = tracer.startSpan('llm-call', { model: 'gpt-4' });
        tracer.endSpan(spanId, { tokens: 150 });
        const trace = tracer.getTrace();
        expect(trace.rootSpan.children).toHaveLength(1);
        expect(trace.rootSpan.children[0].name).toBe('llm-call');
        expect(trace.rootSpan.children[0].status).toBe('ok');
    });

    it('wraps functions with spans', async () => {
        const tracer = createTracer('agent');
        const wrapped = tracer.wrapFunction('compute', async (x: number) => x * 2);
        const result = await wrapped(5);
        expect(result).toBe(10);
        const trace = tracer.getTrace();
        expect(trace.rootSpan.children).toHaveLength(1);
        expect(trace.rootSpan.children[0].name).toBe('compute');
    });

    it('handles errors in wrapped functions', async () => {
        const tracer = createTracer('agent');
        const wrapped = tracer.wrapFunction('failing', async () => { throw new Error('boom'); });
        await expect(wrapped()).rejects.toThrow('boom');
        const trace = tracer.getTrace();
        expect(trace.rootSpan.children[0].status).toBe('error');
    });

    it('returns all spans as flat list', () => {
        const tracer = createTracer('agent');
        tracer.startSpan('a');
        tracer.startSpan('b'); // nested under a
        const spans = tracer.getAllSpans();
        expect(spans.length).toBeGreaterThanOrEqual(3); // root + a + b
    });
});

describe('Trace Assertions', () => {
    // Helper to mock AgentResponse wrapper
    const mockResponse = (trace: any) => ({ output: '', toolCalls: [], tokens: 0, duration: 0, trace });

    it('spanExists finds named span', () => {
        const tracer = createTracer('agent');
        const s = tracer.startSpan('llm-call');
        tracer.endSpan(s);
        const trace = tracer.getTrace();
        expect(spanExists('llm-call')(mockResponse(trace)).passed).toBe(true);
        expect(spanExists('nonexistent')(mockResponse(trace)).passed).toBe(false);
    });

    it('spanCount checks occurrences', () => {
        const tracer = createTracer('agent');
        tracer.endSpan(tracer.startSpan('tool'));
        tracer.endSpan(tracer.startSpan('tool'));
        const trace = tracer.getTrace();
        expect(spanCount('tool', 2)(mockResponse(trace)).passed).toBe(true);
    });

    it('traceDepthWithin limits depth', () => {
        const tracer = createTracer('agent');
        const s1 = tracer.startSpan('a');
        tracer.endSpan(tracer.startSpan('b'));
        tracer.endSpan(s1);
        const trace = tracer.getTrace();
        expect(traceDepthWithin(5)(mockResponse(trace)).passed).toBe(true);
        expect(traceDepthWithin(1)(mockResponse(trace)).passed).toBe(false);
    });

    it('noSpanErrors passes for clean traces', () => {
        const tracer = createTracer('agent');
        tracer.endSpan(tracer.startSpan('ok'));
        const trace = tracer.getTrace();
        expect(noSpanErrors()(mockResponse(trace)).passed).toBe(true);
    });
});

describe('Trace Export', () => {
    it('exports as JSON', () => {
        const tracer = createTracer('agent');
        tracer.endSpan(tracer.startSpan('llm'));
        const trace = tracer.getTrace();
        const json = exportTraceAsJSON(trace);
        expect(json).toHaveLength(2); // root + llm
    });

    it('exports as Mermaid', () => {
        const tracer = createTracer('agent');
        tracer.endSpan(tracer.startSpan('tool-search'));
        const trace = tracer.getTrace();
        const mermaid = exportTraceAsMermaid(trace);
        expect(mermaid).toContain('sequenceDiagram');
        expect(mermaid).toContain('tool-search');
    });

    it('renders ASCII timeline', () => {
        const tracer = createTracer('agent');
        tracer.endSpan(tracer.startSpan('llm-call'));
        const trace = tracer.getTrace();
        const timeline = renderTraceTimeline(trace);
        expect(timeline).toContain('agent');
        expect(timeline).toContain('llm-call');
    });
});
