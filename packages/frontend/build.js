import * as esbuild from 'esbuild';

const shouldServe = process.argv.includes('--start');

if (shouldServe) {
  const ctx = await esbuild.context({
    entryPoints: ['src/script.ts'],
    bundle: true,
    minify: false,
    sourcemap: true,
    format: 'esm',
    platform: 'browser',
    outfile: 'public/out.js', 
  });
  await ctx.serve({
    servedir: 'public',
    port: 8000,
  });
} else {
  await esbuild.build({
    entryPoints: ['src/script.ts'],
    format: 'esm',
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'browser',
    outfile: 'public/out.js', 
  });
}
