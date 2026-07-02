import { defineConfig, type ServerOptions } from "vite";
import { loadViteDevConfig } from "@bb/config/vite-dev";
import { sharedViteConfig } from "./vite.config.js";

const viteDevConfig = loadViteDevConfig();
const devWebSocketBrowserUrl = readOptionalEnvUrl("BB_DEV_WS_URL");
const devWebSocketBrowserHostPortDefine =
  devWebSocketBrowserUrl === undefined
    ? JSON.stringify(viteDevConfig.serverWsOrigin.port)
    : "undefined";
const devWebSocketBrowserUrlDefine =
  devWebSocketBrowserUrl === undefined
    ? "undefined"
    : JSON.stringify(devWebSocketBrowserUrl);
const devHmrConfig = resolveDevHmrConfig(readOptionalEnvUrl("BB_DEV_HMR_URL"));

function readOptionalEnvUrl(name: string): string | undefined {
  const rawValue = process.env[name]?.trim();
  return rawValue === "" ? undefined : rawValue;
}

function resolveDevHmrConfig(
  rawUrl: string | undefined,
): ServerOptions["hmr"] | undefined {
  if (rawUrl === undefined) {
    return undefined;
  }

  const url = new URL(rawUrl);
  const secure = url.protocol === "https:" || url.protocol === "wss:";
  return {
    clientPort:
      url.port === "" ? (secure ? 443 : 80) : Number.parseInt(url.port, 10),
    host: url.hostname,
    protocol: secure ? "wss" : "ws",
  };
}

export default defineConfig({
  ...sharedViteConfig,
  define: {
    // Connect directly to the server in dev because Vite's WS proxy does not
    // handle upstream server restarts reliably.
    __BB_DEV_WS_BROWSER_HOST_PORT__: devWebSocketBrowserHostPortDefine,
    __BB_DEV_WS_URL__: devWebSocketBrowserUrlDefine,
  },
  server: {
    host: viteDevConfig.appHost,
    port: viteDevConfig.appPort,
    allowedHosts: true,
    ...(devHmrConfig === undefined ? {} : { hmr: devHmrConfig }),
    proxy: {
      "/api": {
        target: viteDevConfig.serverHttpOrigin,
        changeOrigin: true,
      },
    },
  },
});
