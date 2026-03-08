// ============================================================================
// agentic-test — Conversation Testing (Multi-Turn)
// ============================================================================

import type {
    AgentAdapter,
    AgentResponse,
    Assertion,
    AssertionResult,
    TestSuiteConfig,
} from '../core/types.js';
import { AgenticTestSuite } from '../core/suite.js';

/**
 * A single turn in a conversation test.
 */
export interface ConversationTurn {
    /** The user's message for this turn */
    user: string;
    /** Assertions to evaluate on the agent's response for this turn */
    assertions: Assertion[];
    /** Optional: expected system behavior description (for documentation) */
    description?: string;
}

/**
 * Result of a single conversation turn.
 */
export interface ConversationTurnResult {
    /** Turn index (0-based) */
    turnIndex: number;
    /** The user input */
    userInput: string;
    /** The agent's response */
    agentResponse: AgentResponse;
    /** Assertion results for this turn */
    assertions: AssertionResult[];
    /** Whether all assertions passed */
    passed: boolean;
    /** Duration of this turn */
    duration: number;
}

/**
 * Result of a full conversation test.
 */
export interface ConversationResult {
    /** Name of the conversation test */
    name: string;
    /** Results for each turn */
    turns: ConversationTurnResult[];
    /** Whether all turns passed */
    passed: boolean;
    /** Total duration */
    duration: number;
    /** Total tokens across all turns */
    totalTokens: number;
}

/**
 * A conversational agent adapter that maintains message history.
 */
export interface ConversationalAdapter {
    /** Run the agent with full conversation history */
    runWithHistory(
        messages: Array<{ role: 'user' | 'assistant'; content: string }>,
        currentInput: string,
    ): Promise<AgentResponse>;
    /** Optional cleanup */
    teardown?(): Promise<void>;
}

/**
 * Create a conversational adapter from a simple function.
 *
 * @example
 * ```ts
 * const chatAgent = createConversationalAdapter(async (messages, input) => {
 *   const result = await myChatBot.chat(messages, input);
 *   return { output: result.text, toolCalls: result.tools, tokens: result.usage, duration: 0 };
 * });
 * ```
 */
export function createConversationalAdapter(
    fn: (
        messages: Array<{ role: 'user' | 'assistant'; content: string }>,
        currentInput: string,
    ) => Promise<AgentResponse>,
): ConversationalAdapter {
    return {
        async runWithHistory(messages, currentInput) {
            const startTime = performance.now();
            const response = await fn(messages, currentInput);
            if (!response.duration) {
                response.duration = performance.now() - startTime;
            }
            return response;
        },
    };
}

/**
 * Define and execute a multi-turn conversation test.
 *
 * @example
 * ```ts
 * import { conversation } from 'agentic-test';
 *
 * conversation('Customer refund flow', { adapter: chatAgent }, [
 *   {
 *     user: 'I want to return my order',
 *     assertions: [
 *       outputContains('order number'),
 *       toolNotCalled('processRefund'),
 *     ],
 *   },
 *   {
 *     user: 'Order #ORD-12345',
 *     assertions: [
 *       toolWasCalled('lookupOrder'),
 *       outputContains('refund eligible'),
 *     ],
 *   },
 *   {
 *     user: 'Yes, please process the refund',
 *     assertions: [
 *       toolWasCalled('processRefund'),
 *       outputMatches(/REF-\d+/),
 *     ],
 *   },
 * ]);
 * ```
 */
export async function executeConversation(
    name: string,
    adapter: ConversationalAdapter | AgentAdapter,
    turns: ConversationTurn[],
): Promise<ConversationResult> {
    const startTime = performance.now();
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    const turnResults: ConversationTurnResult[] = [];
    let totalTokens = 0;
    let allPassed = true;

    for (let i = 0; i < turns.length; i++) {
        const turn = turns[i];
        const turnStart = performance.now();

        let response: AgentResponse;

        try {
            if ('runWithHistory' in adapter) {
                // Conversational adapter — gets full history
                response = await adapter.runWithHistory(history, turn.user);
            } else {
                // Standard adapter — just gets current input
                // (history is lost, but still works for simple agents)
                response = await adapter.run(turn.user);
            }
        } catch (err) {
            const turnResult: ConversationTurnResult = {
                turnIndex: i,
                userInput: turn.user,
                agentResponse: {
                    output: '',
                    toolCalls: [],
                    tokens: 0,
                    duration: performance.now() - turnStart,
                    error: err instanceof Error ? err : new Error(String(err)),
                },
                assertions: [{
                    passed: false,
                    name: 'execution',
                    message: `Turn ${i + 1} errored: ${err instanceof Error ? err.message : String(err)}`,
                }],
                passed: false,
                duration: performance.now() - turnStart,
            };
            turnResults.push(turnResult);
            allPassed = false;
            break; // Stop on error — conversation is broken
        }

        // Update history
        history.push({ role: 'user', content: turn.user });
        history.push({ role: 'assistant', content: response.output });

        // Evaluate assertions
        const assertionResults: AssertionResult[] = turn.assertions.map((assertion) => {
            try {
                return assertion(response);
            } catch (err) {
                return {
                    passed: false,
                    name: 'assertion-error',
                    message: `Assertion threw: ${err instanceof Error ? err.message : String(err)}`,
                };
            }
        });

        const turnPassed = assertionResults.every((r) => r.passed);
        if (!turnPassed) allPassed = false;

        totalTokens += response.tokens;

        turnResults.push({
            turnIndex: i,
            userInput: turn.user,
            agentResponse: response,
            assertions: assertionResults,
            passed: turnPassed,
            duration: response.duration ?? (performance.now() - turnStart),
        });
    }

    return {
        name,
        turns: turnResults,
        passed: allPassed,
        duration: performance.now() - startTime,
        totalTokens,
    };
}
