import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, checkPassword, createSessionCookieValue } from "@/lib/adminAuth";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, await createSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-6">
      <form action={login} className="flex w-full max-w-xs flex-col gap-3">
        <h1 className="text-center text-lg font-semibold text-zinc-900">Research dashboard</h1>
        {error && <p className="text-center text-sm text-red-600">Wrong password.</p>}
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoFocus
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <button type="submit" className="rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white">
          Log in
        </button>
      </form>
    </main>
  );
}
