import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { VitePWA } from "vite-plugin-pwa"; // disabled for dev
export default defineConfig({
    base: "/notenear/",
    build: { target: "es2020" },
    plugins: [
        react(),
        /* PWA disabled for dev — uncomment for production
        VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["icon-192.svg", "icon-512.svg"],
          manifest: {
            name: "乐邻",
            short_name: "乐邻",
            description: "社区艺术体验，连接你我",
            theme_color: "#8B5E3C",
            background_color: "#FAF6F1",
            display: "standalone",
            start_url: "/notenear/",
            icons: [
              { src: "/notenear/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
              { src: "/notenear/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
            ],
          },
        }),
        */
    ],
    server: {
        host: true,
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, "/api/v1"); },
            },
        },
    },
});
