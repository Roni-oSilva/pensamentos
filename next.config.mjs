/** Host do Storage do Supabase (para next/image). Tolera erros comuns de colagem na variável. */
function supabaseHostname() {
  const v = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!v) return "localhost";
  const hosted = v.match(/([a-z0-9]{8,}\.supabase\.(?:co|in|net))/i);
  if (hosted) return hosted[1].toLowerCase();
  try {
    return new URL(v.replace(/^["']|["']$/g, "")).hostname;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL inválida (recebido: ${v.length} caracteres, começa com "${v.slice(0, 8)}…"). ` +
        "O valor deve ser o endereço do projeto, no formato https://xxxxxxxx.supabase.co",
    );
  }
}
const supabaseHost = supabaseHostname();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() { return [{ source: "/heresia", destination: "/palavra", permanent: true }]; },
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async headers() {
    // CSP com nonce é aplicada no middleware; aqui ficam os demais cabeçalhos.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
