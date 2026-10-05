/** Host do Storage do Supabase (para next/image). Valor inválido não derruba o build: o erro é explicado. */
function supabaseHostname() {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!raw) return "localhost";
  try {
    return new URL(raw).hostname;
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL inválida. Use somente o endereço do projeto, no formato https://xxxxxxxx.supabase.co " +
        "(sem aspas, sem espaços, sem o texto 'SUPABASE_URL=' na frente).",
    );
  }
}
const supabaseHost = supabaseHostname();

/** @type {import('next').NextConfig} */
const nextConfig = {
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
