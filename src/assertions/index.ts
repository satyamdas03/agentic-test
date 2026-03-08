// ============================================================================
// agentic-test — Assertions Index (v1.0.0)
// ============================================================================

// Output assertions
export {
    outputContains,
    outputDoesNotContain,
    outputMatches,
    outputStartsWith,
    outputEndsWith,
    outputContainsIgnoreCase,
    outputMinLength,
    outputMaxLength,
    outputIsNotEmpty,
} from './output.js';

// Tool call assertions
export {
    toolWasCalled,
    toolNotCalled,
    toolCalledWith,
    toolCallOrder,
    toolCalledTimes,
    totalToolCalls,
    toolReturnedResult,
} from './tools.js';

// Performance assertions
export {
    completedWithin,
    tokensBudget,
    maxToolCalls,
    minToolCalls,
    costBudget,
} from './performance.js';

// Semantic assertions (v1.0.0: now with embedding support)
export {
    outputSemanticallyMatches,
    outputSemanticallyMatchesAsync,
    noHallucination,
    custom,
} from './semantic.js';

// Streaming assertions (v1.0.0)
export {
    streamCompletes,
    streamChunkCount,
    firstChunkWithin,
} from '../adapters/streaming.js';
