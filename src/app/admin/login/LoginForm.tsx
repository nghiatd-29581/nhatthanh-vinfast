"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "@/app/admin/_actions/auth";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signIn, { error: initialError });
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="block"><span className="label">Email</span><input name="email" type="email" autoComplete="username" required className="field" /></label>
      <label className="block"><span className="label">Mật khẩu</span><input name="password" type="password" autoComplete="current-password" required className="field" /></label>
      {state.error ? <p className="rounded-xl bg-signal/10 px-4 py-3 text-sm font-medium text-signal" role="alert">{state.error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : null} Đăng nhập</button>
    </form>
  );
}
