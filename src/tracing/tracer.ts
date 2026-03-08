// ============================================================================
// agentic-test — Tracer (span management & function wrapping)
// ============================================================================

import type { Span, Trace } from './types.js';

let idCounter = 0;
function genId(): string {
    return `span_${Date.now()}_${++idCounter}`;
}

/**
 * A tracer that manages spans for a single agent execution.
 *
 * @example
 * ```ts
 * const tracer = createTracer('my-agent');
 *
 * const llmCall = tracer.wrapFunction('llm-call', async (input) => {
 *   return await openai.chat({ messages: [{ role: 'user', content: input }] });
 * });
 *
 * const result = await llmCall('Hello');
 * const trace = tracer.getTrace();
 * ```
 */
export class Tracer {
    private traceId: string;
    private rootSpan: Span;
    private currentSpanStack: Span[] = [];
    private startedAt: string;

    constructor(name: string) {
        this.traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.startedAt = new Date().toISOString();
        this.rootSpan = {
            id: genId(),
            name,
            startTime: performance.now(),
            attributes: {},
            status: 'running',
            children: [],
        };
        this.currentSpanStack.push(this.rootSpan);
    }

    /**
     * Start a new child span under the current span.
     */
    startSpan(name: string, attributes: Record<string, unknown> = {}): string {
        const span: Span = {
            id: genId(),
            name,
            parentId: this.currentSpan().id,
            startTime: performance.now(),
            attributes,
            status: 'running',
            children: [],
        };

        this.currentSpan().children.push(span);
        this.currentSpanStack.push(span);
        return span.id;
    }

    /**
     * End a span by its ID.
     */
    endSpan(spanId: string, attributes?: Record<string, unknown>): void {
        const span = this.findSpan(spanId);
        if (span) {
            span.endTime = performance.now();
            span.duration = span.endTime - span.startTime;
            span.status = 'ok';
            if (attributes) {
                Object.assign(span.attributes, attributes);
            }
        }

        // Pop from stack if it's the current span
        if (this.currentSpanStack.length > 1 &&
            this.currentSpanStack[this.currentSpanStack.length - 1].id === spanId) {
            this.currentSpanStack.pop();
        }
    }

    /**
     * Mark a span as errored.
     */
    errorSpan(spanId: string, error: string): void {
        const span = this.findSpan(spanId);
        if (span) {
            span.endTime = performance.now();
            span.duration = span.endTime - span.startTime;
            span.status = 'error';
            span.error = error;
        }

        if (this.currentSpanStack.length > 1 &&
            this.currentSpanStack[this.currentSpanStack.length - 1].id === spanId) {
            this.currentSpanStack.pop();
        }
    }

    /**
     * Wrap an async function with a span — the easiest way to add tracing.
     */
    wrapFunction<TArgs extends unknown[], TReturn>(
        name: string,
        fn: (...args: TArgs) => Promise<TReturn>,
        attributesFn?: (...args: TArgs) => Record<string, unknown>,
    ): (...args: TArgs) => Promise<TReturn> {
        const tracer = this;

        return async (...args: TArgs): Promise<TReturn> => {
            const attrs = attributesFn ? attributesFn(...args) : {};
            const spanId = tracer.startSpan(name, attrs);

            try {
                const result = await fn(...args);
                tracer.endSpan(spanId, { result: typeof result === 'string' ? result.substring(0, 200) : '[object]' });
                return result;
            } catch (err) {
                tracer.errorSpan(spanId, err instanceof Error ? err.message : String(err));
                throw err;
            }
        };
    }

    /**
     * Finalize and return the complete trace.
     */
    getTrace(): Trace {
        // Ensure root span is closed
        if (!this.rootSpan.endTime) {
            this.rootSpan.endTime = performance.now();
            this.rootSpan.duration = this.rootSpan.endTime - this.rootSpan.startTime;
            this.rootSpan.status = 'ok';
        }

        return {
            traceId: this.traceId,
            rootSpan: this.rootSpan,
            totalDuration: this.rootSpan.duration ?? 0,
            totalTokens: this.sumTokens(this.rootSpan),
            startedAt: this.startedAt,
        };
    }

    /**
     * Get all spans as a flat list.
     */
    getAllSpans(): Span[] {
        const spans: Span[] = [];
        const collect = (span: Span) => {
            spans.push(span);
            span.children.forEach(collect);
        };
        collect(this.rootSpan);
        return spans;
    }

    private currentSpan(): Span {
        return this.currentSpanStack[this.currentSpanStack.length - 1];
    }

    private findSpan(id: string, root?: Span): Span | null {
        const span = root ?? this.rootSpan;
        if (span.id === id) return span;
        for (const child of span.children) {
            const found = this.findSpan(id, child);
            if (found) return found;
        }
        return null;
    }

    private sumTokens(span: Span): number {
        let tokens = (span.attributes.tokens as number) ?? 0;
        for (const child of span.children) {
            tokens += this.sumTokens(child);
        }
        return tokens;
    }
}

/**
 * Create a new tracer for an agent execution.
 */
export function createTracer(name: string = 'agent'): Tracer {
    return new Tracer(name);
}
