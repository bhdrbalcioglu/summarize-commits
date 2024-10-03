import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
//import { logoutOnExit } from "./vite-plugin-logout";

export default defineConfig({
  plugins: [vue()],
  css: {
    postcss: "./postcss.config.js",
  },
});
