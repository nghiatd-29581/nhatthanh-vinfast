"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { allowedImageHosts } from "@/lib/env";
import { CarPlaceholder } from "./CarPlaceholder";

type Props = Omit<ImageProps, "src" | "alt"> & { src?: string | null; alt: string; dark?: boolean; placeholderLabel?: string };

function canOptimize(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return allowedImageHosts().includes(host);
  } catch {
    return false;
  }
}

/**
 * Ảnh an toàn: tối ưu bằng next/image khi host đã khai báo, nếu không dùng <img> thường;
 * khi URL lỗi → hiển thị placeholder có nhãn, không làm hỏng trang.
 */
export function SafeImage({ src, alt, dark, placeholderLabel, className, fill, sizes, priority, width, height, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <CarPlaceholder dark={dark} label={placeholderLabel} />;

  if (canOptimize(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        fill={fill}
        sizes={sizes}
        priority={priority}
        width={fill ? undefined : (width ?? 1600)}
        height={fill ? undefined : (height ?? 900)}
        onError={() => setFailed(true)}
        {...rest}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className ?? ""}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
