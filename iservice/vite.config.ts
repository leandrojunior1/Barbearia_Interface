import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";

export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === "development";
  const host = process.env.FIGMA_DEV_SERVER_HOST || "0.0.0.0";
  const port = Number.parseInt(process.env.PORT || "8443", 10);

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : "/",
    build: {
      sourcemap: emitSourcemaps ? "inline" : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      figmaSiteDefaults(),
      figmaErrorOverlayReplay(),
      figmaReactRefreshBoundaryFallback(),
      figmaMakeKitPlugin({ storiesGlob: "/src/**/*.stories.{ts,tsx,js,jsx}" }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host,
      port,
      strictPort: true,
      watch: { ignored: ["**/.figma/**"] },
    },
    preview: { host, port },
  };
});

function figmaSiteDefaults(): Plugin {
  return {
    name: "figma-site-defaults",
    transformIndexHtml(html) {
      return html
        .replace("<!-- figma:lang -->", "pt-BR")
        .replace("<!-- figma:title -->", "iService")
        .replace("<!-- figma:head-start -->", "")
        .replace("<!-- figma:head-end -->", "")
        .replace("<!-- figma:body-start -->", "")
        .replace("<!-- figma:body-end -->", "");
    },
  };
}

function figmaErrorOverlayReplay(): Plugin {
  return {
    name: "figma-error-overlay-replay",
    apply: "serve",
    configureServer(server) {
      let lastError: object | null = null;
      const originalSend = server.ws.send.bind(server.ws);

      server.ws.send = ((...args: Parameters<typeof server.ws.send>) => {
        const payload = args[0];
        if (payload && typeof payload === "object") {
          const type = Reflect.get(payload, "type");
          if (type === "error") lastError = payload;
          if (type === "update" || type === "full-reload") lastError = null;
        }
        return originalSend(...args);
      }) as typeof server.ws.send;

      server.ws.on("connection", (socket) => {
        if (lastError) socket.send(JSON.stringify(lastError));
      });
    },
  };
}

function figmaReactRefreshBoundaryFallback(): Plugin {
  const hadRefreshBoundary = new Map<string, boolean>();
  let sendFullReload: (() => void) | undefined;

  return {
    name: "figma-react-refresh-boundary-fallback",
    apply: "serve",
    enforce: "post",
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: "full-reload", path: "*" });
    },
    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes("/node_modules/")) return null;

      const moduleId = id.split("?")[0] ?? id;
      const hasBoundary = code.includes("registerExportsForReactRefresh");
      const hadBoundary = hadRefreshBoundary.get(moduleId);
      hadRefreshBoundary.set(moduleId, hasBoundary);
      if (hadBoundary && !hasBoundary) queueMicrotask(() => sendFullReload?.());
      return null;
    },
  };
}

function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob];
  const route = "/.figma/make/kit.html";
  const virtualId = "virtual:figma-stories";
  const resolvedId = `\0${virtualId}`;

  return {
    name: "figma-make-kit",
    apply: "serve",
    resolveId(id) {
      return id === virtualId ? resolvedId : null;
    },
    load(id) {
      return id === resolvedId
        ? `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
        : null;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if ((req.url || "").split("?")[0] !== route) return next();
        const html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><div id="figma-make-kit-root"></div><script type="module">import { stories } from 'virtual:figma-stories'; window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories }); window.dispatchEvent(new CustomEvent('figma.ready'));</script></body></html>`;
        try {
          res.setHeader("Content-Type", "text/html");
          res.end(await server.transformIndexHtml(route, html));
        } catch (error) {
          next(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },
  };
}
