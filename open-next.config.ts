// Configuração simplificada para open-next com Cloudflare
const config = {
  default: {
    override: {
      wrapper: "cloudflare",
      incrementalCache: "cloudflare-kv",
      tagCache: "memory",
      queue: "memory",
    },
  },
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare",
      proxyExternalRequest: "fetch",
    },
  },
  dangerous: {
    enableCacheInterception: false,
  },
};

export default config;
