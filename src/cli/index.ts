#!/usr/bin/env node
// ============================================================================
// agentic-test — CLI Entry Point
// ============================================================================

import { Command } from 'commander';
import { resolve, join } from 'path';
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { pathToFileURL } from 'url';
import { AgenticTestRunner, getRegisteredSuites } from '../core/runner.js';
import { ConsoleReporter } from '../reporters/console.js';
import { JsonReporter } from '../reporters/json.js';
import { JUnitReporter } from '../reporters/junit.js';
import { GitHubActionsReporter } from '../reporters/github-actions.js';

const program = new Command();

program
    .name('agentic-test')
    .description('🤖 A testing framework for AI agent workflows')
    .version('0.1.0');

// ============================================================================
// `run` command
// ============================================================================
program
    .command('run')
    .description('Run agent tests')
    .option('-p, --pattern <glob>', 'Test file pattern', '**/*.agent.test.{ts,js,mts,mjs}')
    .option('-f, --filter <name>', 'Filter tests by name')
    .option('-r, --reporter <type>', 'Reporter: console, json, junit, github-actions', 'console')
    .option('-o, --output <path>', 'Output path for report file')
    .option('--retries <n>', 'Number of retries for failed tests', '0')
    .option('--timeout <ms>', 'Default timeout in milliseconds', '30000')
    .option('--parallel', 'Run suites in parallel')
    .action(async (options) => {
        const cwd = process.cwd();

        // Find test files
        const testFiles = findTestFiles(cwd, options.pattern);

        if (testFiles.length === 0) {
            console.log('\n🤖 agentic-test: No test files found.');
            console.log(`  Pattern: ${options.pattern}`);
            console.log(`  Directory: ${cwd}`);
            console.log('\n  Run "agentic-test init" to create an example test.\n');
            process.exit(0);
        }

        // Import all test files (this registers suites via describe())
        for (const file of testFiles) {
            const fileUrl = pathToFileURL(resolve(file)).href;
            await import(fileUrl);
        }

        // Get registered suites
        const suites = getRegisteredSuites();

        if (suites.length === 0) {
            console.log('\n🤖 agentic-test: No test suites found in test files.');
            process.exit(0);
        }

        // Create runner with selected reporter
        const runner = new AgenticTestRunner({
            timeout: parseInt(options.timeout),
            retries: parseInt(options.retries),
        });

        // Add reporter
        switch (options.reporter) {
            case 'json':
                runner.addReporter(new JsonReporter({ outputPath: options.output }));
                break;
            case 'junit':
                runner.addReporter(new JUnitReporter({ outputPath: options.output }));
                break;
            case 'github-actions':
                runner.addReporter(new GitHubActionsReporter());
                runner.addReporter(new ConsoleReporter());
                break;
            default:
                runner.addReporter(new ConsoleReporter());
        }

        // Run tests
        const result = await runner.run(suites);

        // Exit with appropriate code
        process.exit(result.failed > 0 ? 1 : 0);
    });

// ============================================================================
// `init` command
// ============================================================================
program
    .command('init')
    .description('Scaffold an example test file and config')
    .action(() => {
        const cwd = process.cwd();

        // Create test directory
        const testDir = join(cwd, '__agent_tests__');
        if (!existsSync(testDir)) {
            mkdirSync(testDir, { recursive: true });
        }

        // Create example test file
        const exampleTest = `import { describe, test } from 'agentic-test';
import {
  outputContains,
  toolWasCalled,
  toolCalledWith,
  completedWithin,
  toolCallOrder,
} from 'agentic-test/assertions';
import { createAdapter } from 'agentic-test';
import { createMockAgent } from 'agentic-test';

// Create a mock agent for demonstration
const agent = createMockAgent()
  .on('weather')
  .respondWith({
    output: 'The weather in New York is sunny, 72°F.',
    toolCalls: [
      { name: 'getWeather', arguments: { city: 'New York' }, result: { temp: 72, condition: 'sunny' } },
    ],
    tokens: 50,
  })
  .on('*')
  .respondWith({
    output: "I'm sorry, I don't understand that request.",
  })
  .build();

describe('Weather Agent', { adapter: agent }, () => {
  test('fetches weather for a city', {
    input: 'What is the weather in New York?',
    assertions: [
      toolWasCalled('getWeather'),
      toolCalledWith('getWeather', { city: 'New York' }),
      outputContains('sunny'),
      outputContains('72'),
      completedWithin(5000),
    ],
  });

  test('handles unknown requests gracefully', {
    input: 'Tell me a joke',
    assertions: [
      outputContains("don't understand"),
    ],
  });
});
`;

        const testFilePath = join(testDir, 'example.agent.test.ts');
        if (!existsSync(testFilePath)) {
            writeFileSync(testFilePath, exampleTest, 'utf-8');
            console.log(`✅ Created: ${testFilePath}`);
        } else {
            console.log(`⏭  Skipped: ${testFilePath} (already exists)`);
        }

        console.log();
        console.log('🤖 agentic-test initialized!');
        console.log();
        console.log('Next steps:');
        console.log('  1. Edit the example test to connect your agent');
        console.log('  2. Run: npx agentic-test run');
        console.log();
    });

// ============================================================================
// Utilities
// ============================================================================

/**
 * Find test files matching a glob pattern (simple implementation).
 */
function findTestFiles(dir: string, _pattern: string): string[] {
    const files: string[] = [];

    function walk(currentDir: string, depth: number = 0): void {
        if (depth > 5) return; // Limit recursion depth
        if (!existsSync(currentDir)) return;

        try {
            const entries = readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                        continue;
                    }
                    walk(fullPath, depth + 1);
                } else if (
                    entry.name.endsWith('.agent.test.ts') ||
                    entry.name.endsWith('.agent.test.js') ||
                    entry.name.endsWith('.agent.test.mts') ||
                    entry.name.endsWith('.agent.test.mjs')
                ) {
                    files.push(fullPath);
                }
            }
        } catch {
            // Skip unreadable directories
        }
    }

    walk(dir);
    return files;
}

program.parse();
