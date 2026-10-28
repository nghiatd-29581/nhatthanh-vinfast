import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-ink px-6 text-center text-white">
      <p className="display text-7xl">404</p>
      <p className="mt-4 text-lg text-white/70">Không tìm thấy trang hoặc mẫu xe này.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/xe" className="btn btn-light">Xem các dòng xe</Link>
        <a href="tel:+84349636567" className="btn btn-ghost-dark">Gọi 0349.63.65.67</a>
      </div>
    </main>
  );
}
