import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    // Android AAPT2 가 파일명 hash 의 특수문자(`-V`, `--` 등)에서 압축 실패.
    // 단순 이름(해시 없이)으로 출력해 playforge 빌드 호환성 확보.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
