import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pagesは https://<user>.github.io/sf6-punish-checker/ 配下で配信されるため、
// GitHub Actions上のビルドのみサブパスをbaseにする。
// Vercel等のルート配信ホスティングや開発サーバはルート("/")のまま。
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/sf6-punish-checker/" : "/",
  server: { port: 5173 },
});
