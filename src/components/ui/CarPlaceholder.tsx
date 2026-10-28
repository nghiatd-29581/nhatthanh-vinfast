/** Ảnh giữ chỗ trung tính — KHÔNG mô phỏng mẫu xe cụ thể, luôn có nhãn rõ ràng */
export function CarPlaceholder({ label = "Ảnh minh họa — đang cập nhật ảnh xe", dark = false, className = "" }: { label?: string; dark?: boolean; className?: string }) {
  const stroke = dark ? "rgba(255,255,255,.22)" : "rgba(16,17,20,.16)";
  const fill = dark ? "rgba(255,255,255,.04)" : "rgba(16,17,20,.03)";
  return (
    <div className={`relative flex h-full w-full items-center justify-center ${className}`} role="img" aria-label={label}>
      <svg viewBox="0 0 640 240" className="w-[86%] max-w-[720px]" aria-hidden>
        <path
          d="M40 176c0-14 8-24 22-28l70-18c26-30 62-56 120-60 70-5 140 4 196 34 22 12 40 24 66 30 50 10 80 18 86 38v24H40z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M168 128c30-30 64-46 112-48 46-2 98 6 136 30" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="160" cy="194" r="34" fill={dark ? "#101114" : "#fff"} stroke={stroke} strokeWidth="2" />
        <circle cx="480" cy="194" r="34" fill={dark ? "#101114" : "#fff"} stroke={stroke} strokeWidth="2" />
        <line x1="20" y1="229" x2="620" y2="229" stroke={stroke} strokeWidth="1" />
      </svg>
      <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-medium ${dark ? "bg-white/10 text-white/70" : "bg-ink/5 text-steel"}`}>
        {label}
      </span>
    </div>
  );
}
