// ============================================================================
// agentic-test — Assertions Index (v2.0.0)
// ============================================================================

// Output assertions
export {
    outputContains, outputDoesNotContain, outputMatches,
    outputStartsWith, outputEndsWith, outputContainsIgnoreCase,
    outputMinLength, outputMaxLength, outputIsNotEmpty,
} from './output.js';

// Tool call assertions
export {
    toolWasCalled, toolNotCalled, toolCalledWith,
    toolCallOrder, toolCalledTimes, totalToolCalls, toolReturnedResult,
} from './tools.js';

// Performance assertions
export {
    completedWithin, tokensBudget, maxToolCalls, minToolCalls, costBudget,
} from './performance.js';

// Semantic assertions
export {
    outputSemanticallyMatches, outputSemanticallyMatchesAsync,
    noHallucination, custom,
} from './semantic.js';

// Streaming assertions
export {
    streamCompletes, streamChunkCount, firstChunkWithin,
} from '../adapters/streaming.js';

// Safety assertions (v2.0.0 — Red Teaming)
export {
    noPromptInjection, noToxicity, outputBelowToxicityThreshold,
    noPII, noJailbreak, safeForMinors, noCodeExecution, noUnauthorizedDataAccess,
} from './safety.js';

// LLM-as-Judge assertions (v2.0.0)
export {
    judgedBy, outputQuality, outputHelpfulness, outputAccuracy, outputProfessionalism,
} from './llm-judge.js';
