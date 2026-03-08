// ============================================================================
// agentic-test — Console Reporter (pretty terminal output)
// ============================================================================

import type { Reporter, RunResult, SuiteResult, TestResult } from '../core/types.js';

// We use simple ANSI codes directly to avoid chalk import issues with CJS/ESM
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const BG_GREEN = '\x1b[42m';
const BG_RED = '\x1b[41m';
const WHITE = '\x1b[37m';

const PASS = `${GREEN}✓${RESET}`;
const FAIL = `${RED}✗${RESET}`;
const SKIP = `${YELLOW}○${RESET}`;
const ERROR = `${RED}⚠${RESET}`;

/**
 * Pretty console reporter with colors and structured output.
 */
export class ConsoleReporter implements Reporter {
    onRunStart(totalSuites: number): void {
        console.log();
        console.log(`${BOLD}${CYAN}🤖 agentic-test${RESET} ${DIM}v2.0.0${RESET}`);
        console.log(`${DIM}Running ${totalSuites} test suite(s)...${RESET}`);
        console.log();
    }

    onSuiteStart(suiteName: string): void {
        console.log(`${BOLD}  ${suiteName}${RESET}`);
    }

    onTestResult(suiteName: string, result: TestResult): void {
        const icon =
            result.status === 'passed'
                ? PASS
                : result.status === 'skipped'
                    ? SKIP
                    : result.status === 'error'
                        ? ERROR
                        : FAIL;

        const duration =
            result.duration > 0 ? ` ${DIM}(${Math.round(result.duration)}ms)${RESET}` : '';
        const tokens =
            result.tokens > 0 ? ` ${DIM}[${result.tokens} tokens]${RESET}` : '';
        const tools =
            result.toolCallCount > 0
                ? ` ${DIM}[${result.toolCallCount} tool calls]${RESET}`
                : '';
        const retries =
            result.retryCount > 0
                ? ` ${YELLOW}(retry #${result.retryCount})${RESET}`
                : '';

        console.log(
            `    ${icon} ${result.name}${duration}${tokens}${tools}${retries}`,
        );

        // Show assertion details for failures
        if (result.status === 'failed' || result.status === 'error') {
            for (const assertion of result.assertions) {
                if (!assertion.passed) {
                    console.log(`      ${RED}→ ${assertion.name}: ${assertion.message}${RESET}`);
                    if (assertion.expected !== undefined) {
                        console.log(
                            `        ${DIM}Expected: ${formatValue(assertion.expected)}${RESET}`,
                        );
                    }
                    if (assertion.actual !== undefined) {
                        console.log(
                            `        ${DIM}Actual:   ${formatValue(assertion.actual)}${RESET}`,
                        );
                    }
                }
            }

            if (result.error) {
                console.log(`      ${RED}→ Error: ${result.error.message}${RESET}`);
            }
        }
    }

    onSuiteEnd(_result: SuiteResult): void {
        console.log();
    }

    onRunEnd(result: RunResult): void {
        const duration = (result.duration / 1000).toFixed(2);
        console.log(`${DIM}${'─'.repeat(50)}${RESET}`);

        // Summary line
        const parts: string[] = [];
        if (result.passed > 0)
            parts.push(`${GREEN}${result.passed} passed${RESET}`);
        if (result.failed > 0) parts.push(`${RED}${result.failed} failed${RESET}`);
        if (result.skipped > 0)
            parts.push(`${YELLOW}${result.skipped} skipped${RESET}`);

        const statusBg = result.failed > 0 ? BG_RED : BG_GREEN;
        const statusText = result.failed > 0 ? ' FAIL ' : ' PASS ';

        console.log(
            `  ${statusBg}${WHITE}${BOLD}${statusText}${RESET}  ${parts.join(', ')} ${DIM}(${result.totalTests} total)${RESET}`,
        );

        // Metadata
        console.log(
            `  ${DIM}Duration: ${duration}s | Tokens: ${result.totalTokens} | Suites: ${result.suites.length}${RESET}`,
        );
        console.log();
    }
}

/**
 * Format a value for display (handles objects, arrays, etc.)
 */
function formatValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    if (typeof value === 'object' && value !== null) {
        try {
            return JSON.stringify(value, null, 0);
        } catch {
            return String(value);
        }
    }
    return String(value);
}
