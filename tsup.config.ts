import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        assertions: 'src/assertions/index.ts',
        cli: 'src/cli/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    outDir: 'dist',
    external: ['chalk', 'commander'],
});
