<<<<<<< HEAD
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
=======
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: {
    ssr: {
      external: ["node:crypto"],
    },
  },
>>>>>>> 60b1fc0 (change ui)
});
