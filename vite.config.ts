import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' sayesinde site hem alperkosay.github.io kökünde hem de
// alperkosay.github.io/<repo>/ altında aynı build ile çalışır.
export default defineConfig({
  base: './',
  plugins: [react()],
});
