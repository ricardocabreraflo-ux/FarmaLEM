import type { NextConfig } from "next";

// Id único por cada build/deploy (Netlify pone COMMIT_REF automáticamente).
// Se usa para avisar en el panel cuando hay una versión más nueva publicada,
// sin que haya que cerrar y volver a abrir la app instalada.
const BUILD_ID = process.env.COMMIT_REF || process.env.DEPLOY_ID || String(Date.now());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
};

export default nextConfig;
