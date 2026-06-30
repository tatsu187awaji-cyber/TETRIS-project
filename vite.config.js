import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/TETRIS-project/" : "/",
  plugins: [
    createHtmlPlugin({
      inject: {
        ejsOptions: {
          filename: path.resolve(__dirname, "index.html"),
        },
      },
    }),
  ],
}));
