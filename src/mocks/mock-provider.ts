// ============================================================================
// agentic-test — Mock Agent Provider
// ============================================================================

import type {
    AgentAdapter,
    AgentResponse,
    AdapterOptions,
    ToolCall,
} from '../core/types.js';

/**
 * Configuration for a mock response.
 */
interface MockResponseConfig {
    output: string;
    toolCalls?: ToolCall[];
    tokens?: number;
    duration?: number;
    error?: Error;
}

/**
 * A mock agent handler: either a static response config or a dynamic function.
 */
type MockHandler = MockResponseConfig | ((input: string) => MockResponseConfig);

/**
 * MockAgent allows deterministic testing of your test pipeline
 * without making real LLM API calls.
 *
 * @example
 * ```ts
 * const mock = createMockAgent()
 *   .on('book a flight')
 *   .respondWith({
 *     output: 'Flight booked! Confirmation #12345',
 *     toolCalls: [
 *       { name: 'searchFlights', arguments: { from: 'NYC' }, result: { found: 3 } },
 *       { name: 'bookFlight', arguments: { flightId: 'AA123' } },
 *     ],
 *     tokens: 150,
 *   })
 *   .on('*')
 *   .respondWith({
 *     output: "I don't understand that request.",
 *   })
 *   .build();
 * ```
 */
export class MockAgentBuilder {
    private handlers: Array<{
        pattern: string | RegExp;
        handler: MockHandler;
    }> = [];
    private defaultHandler: MockHandler = {
        output: 'Mock response: no handler matched.',
        toolCalls: [],
        tokens: 0,
    };

    /**
     * Register a pattern to match against input.
     */
    on(pattern: string | RegExp): MockResponseBuilder {
        return new MockResponseBuilder(this, pattern);
    }

    /**
     * Internal: register a handler for a pattern.
     */
    _addHandler(pattern: string | RegExp, handler: MockHandler): this {
        if (pattern === '*') {
            this.defaultHandler = handler;
        } else {
            this.handlers.push({ pattern, handler });
        }
        return this;
    }

    /**
     * Build the mock agent adapter.
     */
    build(): AgentAdapter {
        const handlers = [...this.handlers];
        const defaultHandler = this.defaultHandler;

        return {
            async run(input: string, _options?: AdapterOptions): Promise<AgentResponse> {
                const startTime = performance.now();

                // Find matching handler
                let matchedHandler: MockHandler = defaultHandler;

                for (const { pattern, handler } of handlers) {
                    if (typeof pattern === 'string') {
                        if (input.toLowerCase().includes(pattern.toLowerCase())) {
                            matchedHandler = handler;
                            break;
                        }
                    } else if (pattern.test(input)) {
                        matchedHandler = handler;
                        break;
                    }
                }

                // Resolve handler (could be a function)
                const config =
                    typeof matchedHandler === 'function'
                        ? matchedHandler(input)
                        : matchedHandler;

                // Simulate some delay
                const delay = config.duration ?? 10;
                await new Promise((resolve) => setTimeout(resolve, delay));

                return {
                    output: config.output,
                    toolCalls: config.toolCalls ?? [],
                    tokens: config.tokens ?? 0,
                    duration: config.duration ?? performance.now() - startTime,
                    error: config.error,
                };
            },
        };
    }
}

/**
 * Fluent builder for defining a mock response.
 */
class MockResponseBuilder {
    constructor(
        private parent: MockAgentBuilder,
        private pattern: string | RegExp,
    ) { }

    /**
     * Define the response for this pattern.
     */
    respondWith(config: MockResponseConfig): MockAgentBuilder {
        return this.parent._addHandler(this.pattern, config);
    }

    /**
     * Define a dynamic response for this pattern.
     */
    respondDynamically(
        fn: (input: string) => MockResponseConfig,
    ): MockAgentBuilder {
        return this.parent._addHandler(this.pattern, fn);
    }
}

/**
 * Create a new mock agent builder.
 *
 * @example
 * ```ts
 * const agent = createMockAgent()
 *   .on('hello').respondWith({ output: 'Hi there!' })
 *   .on('*').respondWith({ output: 'Fallback response' })
 *   .build();
 * ```
 */
export function createMockAgent(): MockAgentBuilder {
    return new MockAgentBuilder();
}
