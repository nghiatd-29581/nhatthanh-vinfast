import type { NextConfig } from "next";

/**
 * Host ảnh được phép dùng với next/image.
 * - Supabase Storage của dự án (lấy từ NEXT_PUBLIC_SUPABASE_URL)
 * - Các host bổ sung khai báo qua NEXT_PUBLIC_IMAGE_HOSTS (phân tách bằng dấu phẩy),
 *   ví dụ: "vinfastauto.com,static-cms-prod.vinfastauto.com" — chỉ thêm khi bạn được phép dùng ảnh từ host đó.
 */
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const extraHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
      ...extraHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
