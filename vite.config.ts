import { pwa } from "./scripts/pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react(), pwa()] });
