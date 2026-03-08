// ============================================================================
// agentic-test — Custom Agent Adapter
// ============================================================================

import type { AgentAdapter, AgentResponse, AdapterOptions } from '../core/types.js';

/**
 * A function that takes an input string and returns an AgentResponse.
 */
export type AgentFunction = (
    input: string,
    options?: AdapterOptions,
) => Promise<AgentResponse> | AgentResponse;

/**
 * Create an adapter from a simple function.
 * This is the recommended way to integrate any custom agent.
 *
 * @example
 * ```ts
 * const adapter = createAdapter(async (input) => {
 *   const result = await myAgent.run(input);
 *   return {
 *     output: result.text,
 *     toolCalls: result.actions.map(a => ({
 *       name: a.tool,
 *       arguments: a.input,
 *       result: a.observation,
 *     })),
 *     tokens: result.tokenUsage.total,
 *     duration: result.elapsedMs,
 *   };
 * });
 * ```
 */
export function createAdapter(fn: AgentFunction): AgentAdapter {
    return {
        async run(input: string, options?: AdapterOptions): Promise<AgentResponse> {
            const startTime = performance.now();

            try {
                const response = await fn(input, options);

                // Ensure duration is populated
                if (!response.duration) {
                    response.duration = performance.now() - startTime;
                }

                return response;
            } catch (err) {
                return {
                    output: '',
                    toolCalls: [],
                    tokens: 0,
                    duration: performance.now() - startTime,
                    error: err instanceof Error ? err : new Error(String(err)),
                };
            }
        },
    };
}
