<p align="center">
  <h1 align="center">🤖 agentic-test</h1>
  <p align="center">
    <strong>A lightweight, Jest-like testing framework for AI agent workflows.</strong>
  </p>
  <p align="center">
    Test tool calls, outputs, latency, costs, and semantic correctness — all with a familiar <code>describe/test</code> API.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agentic-test"><img src="https://img.shields.io/npm/v/agentic-test.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/agentic-test"><img src="https://img.shields.io/npm/dm/agentic-test.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/satyamdas03/agentic-test/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/agentic-test.svg?style=flat-square" alt="license"></a>
  <a href="https://github.com/satyamdas03/agentic-test"><img src="https://img.shields.io/github/stars/satyamdas03/agentic-test?style=flat-square" alt="GitHub stars"></a>
</p>

---

## Why agentic-test?

Existing tools for evaluating LLMs are either **heavy platforms** (LangSmith), **Python-only** (DeepEval), or **focused on prompt comparison** (promptfoo). None of them give you a simple, lightweight npm package to test multi-step AI agent workflows.

**agentic-test** fills that gap:

- 🎯 **Jest-like API** — `describe`, `test`, `beforeAll`, `afterAll` — you already know how to use it
- 🔧 **Agent-specific assertions** — `toolWasCalled()`, `toolCallOrder()`, `outputSemanticallyMatches()`
- ⚡ **Zero-config** — works with any agent via a simple adapter pattern
- 🎭 **Mock provider** — deterministic testing without LLM API calls
- 📊 **Cost tracking** — monitor token usage and estimated costs
- 🔄 **CI/CD ready** — JUnit XML, GitHub Actions annotations, JSON reporters
- 📦 **Tiny footprint** — only 2 runtime dependencies

## Installation

```bash
npm install agentic-test --save-dev
```

## Quick Start

### 1. Create a test file

Create `__agent_tests__/my-agent.agent.test.ts`:

```typescript
import { describe, test, createMockAgent } from 'agentic-test';
import {
  outputContains,
  toolWasCalled,
  toolCalledWith,
  completedWithin,
  toolCallOrder,
} from 'agentic-test/assertions';

// Mock agent for demo (replace with your real agent)
const agent = createMockAgent()
  .on('weather')
  .respondWith({
    output: 'The weather in New York is sunny, 72°F.',
    toolCalls: [
      { name: 'getWeather', arguments: { city: 'New York' }, result: { temp: 72 } },
    ],
    tokens: 50,
  })
  .on('*')
  .respondWith({ output: "I don't understand." })
  .build();

describe('Weather Agent', { adapter: agent }, () => {
  test('fetches weather for a city', {
    input: 'What is the weather in New York?',
    assertions: [
      toolWasCalled('getWeather'),
      toolCalledWith('getWeather', { city: 'New York' }),
      outputContains('sunny'),
      completedWithin(5000),
    ],
  });

  test('handles unknown requests', {
    input: 'Tell me a joke',
    assertions: [
      outputContains("don't understand"),
    ],
  });
});
```

### 2. Connect your real agent

Replace the mock with your actual agent using `createAdapter()`:

```typescript
import { createAdapter } from 'agentic-test';

const agent = createAdapter(async (input) => {
  const result = await myLangChainAgent.invoke({ input });
  return {
    output: result.output,
    toolCalls: result.intermediateSteps.map(step => ({
      name: step.action.tool,
      arguments: step.action.toolInput,
      result: step.observation,
    })),
    tokens: result.llmOutput?.tokenUsage?.totalTokens ?? 0,
    duration: 0, // auto-measured
  };
});
```

### 3. Run tests

```bash
npx agentic-test run
```

Output:
```
🤖 agentic-test v0.1.0
Running 1 test suite(s)...

  Weather Agent
    ✓ fetches weather for a city (15ms) [50 tokens] [1 tool calls]
    ✓ handles unknown requests (12ms)

──────────────────────────────────────────────────
   PASS   2 passed (2 total)
  Duration: 0.03s | Tokens: 50 | Suites: 1
```

## Assertions

### Output Assertions

```typescript
import {
  outputContains,          // substring check
  outputDoesNotContain,    // negation
  outputMatches,           // regex match
  outputStartsWith,        // prefix check
  outputEndsWith,          // suffix check
  outputContainsIgnoreCase,// case-insensitive
  outputMinLength,         // minimum length
  outputMaxLength,         // maximum length
  outputIsNotEmpty,        // non-empty check
} from 'agentic-test/assertions';
```

### Tool Call Assertions

```typescript
import {
  toolWasCalled,      // verify tool was invoked
  toolNotCalled,      // verify tool was NOT invoked
  toolCalledWith,     // verify tool args (partial match)
  toolCallOrder,      // verify execution sequence
  toolCalledTimes,    // verify call count
  totalToolCalls,     // verify total call count
  toolReturnedResult, // verify tool result
} from 'agentic-test/assertions';
```

### Performance Assertions

```typescript
import {
  completedWithin,   // latency budget (ms)
  tokensBudget,      // max tokens
  maxToolCalls,      // prevent infinite loops
  minToolCalls,      // ensure minimum work
  costBudget,        // estimated cost ($)
} from 'agentic-test/assertions';
```

### Semantic Assertions

```typescript
import {
  outputSemanticallyMatches,  // word-overlap similarity
  noHallucination,            // groundedness check
  custom,                     // user-defined assertion
} from 'agentic-test/assertions';

// Custom assertion example
custom('output is valid JSON', (response) => {
  try { JSON.parse(response.output); return true; }
  catch { return false; }
});
```

## Mock Agent

Test without LLM API calls using the mock provider:

```typescript
import { createMockAgent } from 'agentic-test';

const mock = createMockAgent()
  .on('book a flight')          // string pattern (substring match)
  .respondWith({
    output: 'Flight booked!',
    toolCalls: [{ name: 'bookFlight', arguments: { from: 'NYC' } }],
    tokens: 100,
  })
  .on(/order #\d+/)            // regex pattern
  .respondWith({ output: 'Order found' })
  .on('*')                     // default fallback
  .respondWith({ output: 'Unknown request' })
  .build();
```

## Reporters

| Reporter | Use Case |
|---|---|
| `console` (default) | Pretty terminal output with colors |
| `json` | Machine-readable JSON |
| `junit` | CI/CD pipelines (Jenkins, CircleCI) |
| `github-actions` | Inline PR annotations |

```bash
npx agentic-test run --reporter json --output results.json
npx agentic-test run --reporter junit --output results.xml
npx agentic-test run --reporter github-actions
```

## CLI Reference

```bash
npx agentic-test run                    # run all *.agent.test.ts files
npx agentic-test run --filter weather   # filter by name
npx agentic-test run --reporter json    # change reporter
npx agentic-test run --retries 3        # retry flaky tests
npx agentic-test run --timeout 10000    # set timeout (ms)
npx agentic-test init                   # scaffold example test
```

## Lifecycle Hooks

```typescript
import { describe, test, beforeAll, afterAll, beforeEach, afterEach } from 'agentic-test';

describe('My Agent', { adapter: agent }, () => {
  beforeAll(async () => { /* setup once */ });
  afterAll(async () => { /* cleanup */ });
  beforeEach(async () => { /* before each test */ });
  afterEach(async () => { /* after each test */ });

  test('...', { input: '...', assertions: [...] });
});
```

## Skip & Only

```typescript
import { describe, test } from 'agentic-test';

// Skip
describe.skip('Skipped Suite', { adapter }, () => { ... });
test.skip('skipped test', { ... });

// Focus
describe.only('Only this suite', { adapter }, () => { ... });
test.only('only this test', { ... });
```

## Programmatic Usage

```typescript
import { AgenticTestRunner, ConsoleReporter, describe, test, getRegisteredSuites } from 'agentic-test';

// Register suites...
describe('...', { adapter }, () => { ... });

// Run programmatically
const runner = new AgenticTestRunner();
runner.addReporter(new ConsoleReporter());

const result = await runner.run(getRegisteredSuites());
console.log(`${result.passed}/${result.totalTests} tests passed`);
```

## Roadmap

- [ ] Multi-agent orchestration testing (CrewAI, AutoGen)
- [ ] Streaming response evaluation
- [ ] Snapshot testing (record/replay agent runs)
- [ ] Statistical mode (run N times, assert on distributions)
- [ ] Built-in OpenAI and LangChain adapter packages
- [ ] Web dashboard for test results visualization
- [ ] VS Code extension

## Contributing

Contributions are welcome! Please open an issue or PR on [GitHub](https://github.com/satyamdas03/agentic-test).

## License

MIT © [Satyam Das](https://github.com/satyamdas03)
