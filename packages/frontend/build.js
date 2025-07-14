import * as esbuild from 'esbuild';
import { spawn } from 'child_process';

const shouldServe = process.argv.includes('--start');

if (shouldServe) {
  // First build the file
  await esbuild.build({
    entryPoints: ['src/script.ts'],
    bundle: true,
    minify: false,
    sourcemap: true,
    format: 'esm',
    platform: 'browser',
    outfile: 'public/out.js',
  });
  
  // Use http-server which is simpler and works well for LAN
  const server = spawn('npx', ['http-server', 'public', '-p', '8000', '-a', '0.0.0.0', '--cors'], {
    stdio: 'inherit'
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
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
