import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TypeScript errors with cwd() if types aren't perfect
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Properly stringify the env object to prevent syntax errors in the build
      'process.env': JSON.stringify(env)
    }
  };
});