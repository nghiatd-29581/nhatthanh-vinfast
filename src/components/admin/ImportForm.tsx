"use client";
import { useActionState, useState } from "react";
import { AlertTriangle, CheckCircle2, FileJson, Loader2, XCircle } from "lucide-react";
import { importVehiclesAction, type ImportReport } from "@/app/admin/_actions/import";

export function ImportForm({ example }: { example: string }) {
  const [report, action, pending] = useActionState<ImportReport, FormData>(importVehiclesAction, { status: "idle", errors: [], warnings: [], rows: [] });
  const [json, setJson] = useState("");
  const [fileName, setFileName] = useState("");

  return (
    <form action={action} className="grid gap-5">
      <section className="rounded-2xl border border-silver bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="btn btn-ghost btn-sm cursor-pointer">
            <FileJson className="size-4" /> Chọn file .json
            <input type="file" accept=".json,application/json" className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFileName(f.name);
                setJson(await f.text());
                e.target.value = "";
              }} />
          </label>
          <span className="text-sm text-steel">{fileName ? `Đã tải: ${fileName}` : "Hoặc dán nội dung JSON vào ô bên dưới"}</span>
        </div>
        <textarea name="json" value={json} onChange={(e) => setJson(e.target.value)} rows={18} spellCheck={false}
          className="field mt-4 font-mono text-xs" placeholder={example} />
        <p className="mt-2 text-xs text-steel">
          Chấp nhận nguyên file “Xuất JSON”, một mảng xe, hoặc một/vài object copy từ file. Với xe đã có, giá trị <code>null</code> nghĩa là <b>giữ nguyên</b> dữ liệu hiện tại (ảnh, giá, thông số…); muốn xoá trắng một ô chữ thì ghi <code>""</code>.
          Xe khớp theo <b>slug</b> (không có slug thì tạo từ tên). Chỉ những trường có trong file mới được cập nhật.
        </p>
      </section>

      <section className="rounded-2xl border border-silver bg-white p-5">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="keep_status" className="mt-0.5 size-4" />
          <span>
            <b>Giữ trạng thái xuất bản và xác minh giá theo file</b> (<code>is_published</code>, <code>price_verified</code>).
            Chỉ tick khi bạn đã tự kiểm tra giá với nguồn chính thức. Giá chỉ được công khai nếu có <code>price_source</code>.
            <span className="block text-steel">Không tick: xe mới vào trạng thái nháp, giá trong file chờ bạn duyệt ở tab Giá; xe đã có giữ nguyên trạng thái xuất bản.</span>
          </span>
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          <button name="intent" value="check" className="btn btn-ghost btn-sm" disabled={pending || !json.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null} Kiểm tra file
          </button>
          <button name="intent" value="import" className="btn btn-primary btn-sm" disabled={pending || !json.trim()}>Nhập dữ liệu</button>
        </div>
      </section>

      {report.status !== "idle" && (
        <section className="rounded-2xl border border-silver bg-white p-5" aria-live="polite">
          {report.summary ? (
            <p className={`flex items-start gap-2 font-semibold ${report.status === "error" ? "text-signal" : "text-emerald-700"}`}>
              {report.status === "error" ? <XCircle className="mt-0.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" />} {report.summary}
            </p>
          ) : null}
          {report.errors.length ? (
            <div className="mt-3">
              <p className="flex items-center gap-2 font-semibold text-signal"><XCircle className="size-5" /> {report.errors.length} lỗi — chưa ghi dữ liệu nào nếu lỗi ở bước kiểm tra</p>
              <ul className="mt-2 max-h-72 list-disc space-y-1 overflow-auto pl-6 text-sm">{report.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          ) : null}
          {report.warnings.length ? (
            <div className="mt-4">
              <p className="flex items-center gap-2 font-semibold text-amber-700"><AlertTriangle className="size-5" /> Lưu ý</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">{report.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          ) : null}
          {report.rows.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-mist text-steel"><tr><th className="p-2">Xe</th><th className="p-2">Slug</th><th className="p-2">Thao tác</th><th className="p-2">Phiên bản</th><th className="p-2">Ảnh</th></tr></thead>
                <tbody>
                  {report.rows.map((r) => (
                    <tr key={r.slug} className="border-t border-silver">
                      <td className="p-2 font-semibold">{r.name}</td><td className="p-2 text-steel">{r.slug}</td>
                      <td className="p-2">{r.action === "create" ? "Tạo mới" : r.action === "restore" ? "Khôi phục từ thùng rác" : "Cập nhật"}</td><td className="p-2 tabular-nums">{r.variants}</td><td className="p-2 tabular-nums">{r.images}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      )}
    </form>
  );
}
