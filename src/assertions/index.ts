// ============================================================================
// agentic-test — Assertion Index (re-exports all assertions)
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

// Semantic assertions
export {
    outputSemanticallyMatches,
    noHallucination,
    custom,
} from './semantic.js';
