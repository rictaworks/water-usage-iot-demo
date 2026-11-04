import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * 本番は output: "export" の静的書き出しを Cloudflare Workers Assets（src/worker）で配信する。
 * 同一オリジンのため /api/* は同じ Worker が受ける。
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // trailingSlash の自動リダイレクトが /api/* の rewrite より先に働くのを防ぐ。
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
};

// 開発時のみ、同一オリジン化のため /api/* を wrangler dev（既定 http://127.0.0.1:8787）へ転送する。
// output: "export" では rewrites が使えないため、本番では含めない。
if (process.env.NODE_ENV === 'development') {
  nextConfig.rewrites = async () => ({
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: `${process.env.API_ORIGIN ?? 'http://127.0.0.1:8787'}/api/:path*`,
      },
    ],
    afterFiles: [],
    fallback: [],
  });
}

export default withNextIntl(nextConfig);
