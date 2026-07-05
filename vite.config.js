import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pagesは https://<user>.github.io/sf6-punish-checker/ 配下で配信されるため、
// ビルド時のみサブパスをbaseにする（開発サーバはルートのまま）。
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/sf6-punish-checker/" : "/",
  server: { port: 5173 },
}));
