import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// Copy pig icon from parent assets to dist
function copyAssets() {
  return {
    name: "copy-assets",
    writeBundle() {
      const distDir = resolve(__dirname, "dist");
      if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
      copyFileSync(
        resolve(__dirname, "../src/assets/pig_pfp.png"),
        resolve(distDir, "pig_icon.png")
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), copyAssets()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.jsx"),
        background: resolve(__dirname, "src/background.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "background"
            ? "background.js"
            : "[name].js";
        },
        assetFileNames: "[name].[ext]",
      },
    },
    minify: false,
  },
});
