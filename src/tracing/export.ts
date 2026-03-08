// ============================================================================
// agentic-test — Trace Export & Visualization
// ============================================================================

import type { Span, Trace } from './types.js';

/**
 * Export trace as a flat JSON array of spans (OpenTelemetry-inspired).
 */
export function exportTraceAsJSON(trace: Trace): object[] {
    const spans: object[] = [];
    const flatten = (span: Span) => {
        spans.push({
            traceId: trace.traceId,
            spanId: span.id,
            parentSpanId: span.parentId ?? null,
            operationName: span.name,
            startTime: span.startTime,
            endTime: span.endTime,
            duration: span.duration,
            status: span.status,
            attributes: span.attributes,
            error: span.error ?? null,
        });
        span.children.forEach(flatten);
    };
    flatten(trace.rootSpan);
    return spans;
}

/**
 * Export trace as a Mermaid sequence diagram.
 */
export function exportTraceAsMermaid(trace: Trace): string {
    const lines: string[] = ['sequenceDiagram'];

    const actors = new Set<string>();
    const isMultiAgent = trace.rootSpan.children.some(c => c.attributes?.type === 'multi-agent-message' || c.attributes?.type === 'multi-agent-task');

    if (!isMultiAgent) {
        lines.push('  participant Agent');
    }

    const collectActors = (span: Span) => {
        if (span.attributes?.type === 'multi-agent-message') {
            actors.add(span.attributes.from as string);
            actors.add(span.attributes.to as string);
        } else if (span.attributes?.type === 'multi-agent-task') {
            actors.add(span.attributes.agent as string);
        } else if (!isMultiAgent && span.name !== trace.rootSpan.name) {
            actors.add(span.name);
        }
        span.children.forEach(collectActors);
    };
    collectActors(trace.rootSpan);
    actors.forEach((a) => lines.push(`  participant ${sanitizeMermaid(a)}`));

    const renderSpan = (span: Span, caller: string = 'Agent') => {
        for (const child of span.children) {
            const isMessage = child.attributes?.type === 'multi-agent-message';
            const isTask = child.attributes?.type === 'multi-agent-task';
            const dur = child.duration ? ` (${Math.round(child.duration)}ms)` : '';

            let source = caller;
            let target = sanitizeMermaid(child.name);
            let label = target;

            if (isMessage) {
                source = sanitizeMermaid(child.attributes!.from as string);
                target = sanitizeMermaid(child.attributes!.to as string);
                label = `Message${dur}`;
            } else if (isTask) {
                source = sanitizeMermaid(child.attributes!.agent as string);
                // The target is the task itself
            }

            if (child.status === 'error') {
                lines.push(`  ${source}-x${target}: ${label} ❌`);
            } else {
                lines.push(`  ${source}->>${target}: ${label}`);
                if (child.children.length > 0) {
                    renderSpan(child, isMessage ? target : (isTask ? target : target));
                }
                if (!isMessage) {
                    lines.push(`  ${target}-->>${source}: done`);
                }
            }
        }
    };

    // For multi-agent traces, the root span is just the container.
    if (isMultiAgent) {
        // Find the first task to determine the initial caller
        const firstTask = trace.rootSpan.children.find(c => c.attributes?.type === 'multi-agent-task');
        const initialCaller = firstTask ? sanitizeMermaid(firstTask.attributes!.agent as string) : 'System';
        if (!actors.has(initialCaller)) lines.push(`  participant ${initialCaller}`);
        renderSpan(trace.rootSpan, initialCaller);
    } else {
        renderSpan(trace.rootSpan);
    }

    return lines.join('\n');
}

/**
 * Render trace as an ASCII timeline.
 */
export function renderTraceTimeline(trace: Trace): string {
    const lines: string[] = [];
    const total = trace.totalDuration || 1;

    const render = (span: Span, indent: number = 0) => {
        const dur = span.duration ?? 0;
        const prefix = '  '.repeat(indent);
        const barWidth = 40;
        const filledWidth = Math.max(1, Math.round((dur / total) * barWidth));
        const bar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);
        const status = span.status === 'error' ? ' ❌' : '';
        const tokens = span.attributes.tokens ? ` ${span.attributes.tokens}tok` : '';

        lines.push(`${prefix}┌─ ${span.name} (${Math.round(dur)}ms${tokens})${status}`);
        lines.push(`${prefix}│  ${bar}`);

        for (const child of span.children) {
            render(child, indent + 1);
        }

        lines.push(`${prefix}└${'─'.repeat(barWidth + 4)}`);
    };

    render(trace.rootSpan);
    return lines.join('\n');
}

function sanitizeMermaid(s: string): string {
    return s.replace(/[^a-zA-Z0-9_-]/g, '_');
}
