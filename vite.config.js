import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig({
  base: "/TETRIS-project/",
  plugins: [createHtmlPlugin()],
});
