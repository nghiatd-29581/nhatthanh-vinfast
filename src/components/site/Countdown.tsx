"use client";
import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60) };
}

/** Đếm ngược — chỉ hiển thị khi ưu đãi có ngày kết thúc thật */
export function Countdown({ endAt }: { endAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (now == null) return null;
  const left = new Date(endAt).getTime() - now;
  if (left <= 0) return <span className="text-sm font-semibold text-steel">Đã kết thúc</span>;
  const p = parts(left);
  return (
    <span className="inline-flex items-baseline gap-1 text-sm font-semibold tabular-nums" aria-label={`Còn ${p.d} ngày ${p.h} giờ ${p.m} phút`}>
      Còn <b className="text-lg">{p.d}</b> ngày <b className="text-lg">{p.h}</b> giờ <b className="text-lg">{p.m}</b> phút
    </span>
  );
}
