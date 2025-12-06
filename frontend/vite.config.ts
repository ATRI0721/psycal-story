import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base: './',
  server: {
    port: 5173, // 你想要的端口号，例如 3000
    host: "127.0.0.1", // 可选，如果你想让局域网其他设备访问，设置为 '0.0.0.0'
    allowedHosts: ["d3799cef.natappfree.cc"], // 允许的域名列表
  },
});
