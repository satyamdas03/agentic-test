// ============================================================================
// agentic-test — Dashboard HTTP Server (zero dependencies)
// ============================================================================

import { createServer } from 'http';
import { DASHBOARD_HTML } from './html.js';
import { loadRunHistory } from './history.js';

/**
 * Start the dashboard HTTP server.
 */
export function startDashboard(options: { port?: number; historyDir?: string } = {}): void {
    const port = options.port ?? 3000;
    const historyDir = options.historyDir;

    const server = createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (req.url === '/api/results') {
            // API: return historical results
            const history = loadRunHistory(historyDir);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(history));
        } else {
            // Serve dashboard HTML
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(DASHBOARD_HTML);
        }
    });

    server.listen(port, () => {
        console.log();
        console.log('  🤖 agentic-test Dashboard');
        console.log(`  ┌──────────────────────────────────────┐`);
        console.log(`  │                                      │`);
        console.log(`  │   Local:  http://localhost:${port}      │`);
        console.log(`  │                                      │`);
        console.log(`  └──────────────────────────────────────┘`);
        console.log();
        console.log('  Press Ctrl+C to stop');
        console.log();
    });
}
