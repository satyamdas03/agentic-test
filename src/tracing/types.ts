// ============================================================================
// agentic-test — Trace/Span Types
// ============================================================================

/**
 * A span represents a single unit of work within an agent execution.
 */
export interface Span {
    /** Unique identifier for this span */
    id: string;
    /** Human-readable name (e.g., 'llm-call', 'tool-execution', 'retrieval') */
    name: string;
    /** Parent span ID (undefined for root spans) */
    parentId?: string;
    /** Start time (ms since epoch) */
    startTime: number;
    /** End time (ms since epoch) */
    endTime?: number;
    /** Duration in ms (computed from start/end) */
    duration?: number;
    /** Attributes: model, temperature, tokens, etc. */
    attributes: Record<string, unknown>;
    /** Status of this span */
    status: 'ok' | 'error' | 'running';
    /** Error message if status is 'error' */
    error?: string;
    /** Child spans */
    children: Span[];
}

/**
 * A trace is a complete execution tree of spans.
 */
export interface Trace {
    /** Unique trace identifier */
    traceId: string;
    /** Root span of the trace tree */
    rootSpan: Span;
    /** Total duration of the trace */
    totalDuration: number;
    /** Total tokens across all spans */
    totalTokens: number;
    /** When this trace started */
    startedAt: string;
}
