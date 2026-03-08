// ============================================================================
// agentic-test — LLM-as-Judge Assertions
// ============================================================================

import type { Assertion, AssertionResult, AgentResponse } from '../core/types.js';

/**
 * Interface for LLM judge providers.
 */
export interface JudgeProvider {
    /** Ask the judge LLM to evaluate a response */
    judge(prompt: string): Promise<{ score: number; reasoning: string }>;
}

/**
 * Global judge provider.
 */
let globalJudge: JudgeProvider | null = null;

/**
 * Configure the global LLM judge provider.
 */
export function setJudgeProvider(provider: JudgeProvider): void {
    globalJudge = provider;
}

export function getJudgeProvider(): JudgeProvider | null {
    return globalJudge;
}

export function clearJudgeProvider(): void {
    globalJudge = null;
}

/**
 * OpenAI-based judge provider.
 *
 * @example
 * ```ts
 * setJudgeProvider(new OpenAIJudge({ apiKey: 'sk-...' }));
 * ```
 */
export class OpenAIJudge implements JudgeProvider {
    private apiKey: string;
    private model: string;
    private cache: Map<string, { score: number; reasoning: string }> = new Map();

    constructor(options?: { apiKey?: string; model?: string }) {
        this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
        this.model = options?.model ?? 'gpt-4o-mini';

        if (!this.apiKey) {
            throw new Error(
                'OpenAI API key required. Pass via constructor or set OPENAI_API_KEY env var.',
            );
        }
    }

    async judge(prompt: string): Promise<{ score: number; reasoning: string }> {
        // Check cache
        const cacheKey = prompt.substring(0, 200);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI response evaluator. You must respond ONLY with valid JSON in this exact format: {"score": <number 0-1>, "reasoning": "<brief explanation>"}. No other text.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0,
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as {
            choices: Array<{ message: { content: string } }>;
        };

        const content = data.choices[0].message.content.trim();

        try {
            const parsed = JSON.parse(content);
            const result = {
                score: Math.max(0, Math.min(1, Number(parsed.score) || 0)),
                reasoning: String(parsed.reasoning || 'No reasoning provided'),
            };
            this.cache.set(cacheKey, result);
            return result;
        } catch {
            return { score: 0, reasoning: `Failed to parse judge response: ${content}` };
        }
    }
}

// ============================================================================
// Judge Assertions
// ============================================================================

/**
 * Use an LLM to judge the agent's response against a custom rubric.
 *
 * @example
 * ```ts
 * judgedBy('Is this response helpful and accurate?', { threshold: 0.8 })
 * judgedBy('Rate the professionalism', { threshold: 0.7 })
 * ```
 */
export function judgedBy(
    rubric: string,
    options: { threshold?: number } = {},
): Assertion {
    const threshold = options.threshold ?? 0.7;

    return (response: AgentResponse): AssertionResult => {
        // Return async-capable result
        const result: AssertionResult & { _asyncEval?: () => Promise<AssertionResult> } = {
            passed: false,
            name: 'judgedBy',
            message: 'Pending LLM judge evaluation...',
            _asyncEval: async () => {
                const judge = globalJudge;
                if (!judge) {
                    return {
                        passed: false,
                        name: 'judgedBy',
                        message: 'No judge provider configured. Call setJudgeProvider() first.',
                    };
                }

                const prompt = `Evaluate the following AI agent response:\n\n---\nRESPONSE: ${response.output}\n---\n\nRUBRIC: ${rubric}\n\nScore from 0 (worst) to 1 (best).`;
                const evaluation = await judge.judge(prompt);
                const passed = evaluation.score >= threshold;

                return {
                    passed,
                    name: 'judgedBy',
                    message: passed
                        ? `LLM Judge: ${(evaluation.score * 100).toFixed(0)}% (threshold: ${(threshold * 100).toFixed(0)}%) — ${evaluation.reasoning}`
                        : `LLM Judge score too low: ${(evaluation.score * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}% — ${evaluation.reasoning}`,
                    expected: `score >= ${(threshold * 100).toFixed(0)}%`,
                    actual: `${(evaluation.score * 100).toFixed(0)}%`,
                };
            },
        };
        return result;
    };
}

/**
 * Pre-built rubric: overall output quality.
 */
export function outputQuality(options: { threshold?: number } = {}): Assertion {
    return judgedBy(
        'Rate the overall quality of this response. Consider: accuracy, completeness, clarity, and usefulness. Is it well-structured and informative?',
        options,
    );
}

/**
 * Pre-built rubric: helpfulness.
 */
export function outputHelpfulness(options: { threshold?: number } = {}): Assertion {
    return judgedBy(
        'Rate how helpful this response is to the user. Does it address their needs? Is it actionable? Would a user be satisfied?',
        options,
    );
}

/**
 * Pre-built rubric: accuracy given context.
 */
export function outputAccuracy(
    context: string,
    options: { threshold?: number } = {},
): Assertion {
    return judgedBy(
        `Given this context: "${context}"\n\nRate the accuracy of the response. Is all information factually correct given the context? Are there any hallucinations or inaccuracies?`,
        options,
    );
}

/**
 * Pre-built rubric: professional tone.
 */
export function outputProfessionalism(options: { threshold?: number } = {}): Assertion {
    return judgedBy(
        'Rate the professionalism of this response. Is the tone appropriate? Is it respectful? Would it be suitable in a business context?',
        options,
    );
}
