"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_USERNAME = "1234";
const ADMIN_PASSWORD = "1234";

export default function AdminPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem("admin-authenticated") === "true";
    setIsAuthenticated(auth);
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, isCheckingAuth, router]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setMessage(null);

    setIsLoggingIn(true);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("admin-authenticated", "true");
      setIsAuthenticated(true);
      setMessage("Login berhasil. Mengarahkan ke dashboard...");
    } else {
      setMessage("Username atau password salah. Gunakan 1234 / 1234 untuk pengujian sementara.");
    }

    setIsLoggingIn(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("admin-authenticated");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Login</h1>
      <p className="mt-3 text-sm text-slate-500">Masuk dengan kredensial admin sementara untuk keperluan pengujian.</p>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
        {isCheckingAuth ? (
          <p className="text-center text-sm text-slate-500">Memeriksa autentikasi...</p>
        ) : !isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-2xl bg-linear-to-r from-slate-900 via-slate-700 to-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition duration-200 hover:-translate-y-0.5 hover:from-slate-800 hover:to-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? "Masuk..." : "Login"}
            </button>
            <p className="text-center text-sm text-slate-500">Gunakan <strong>1234</strong> sebagai username dan password untuk pengujian sementara.</p>
            {message && <p className="text-center text-sm text-red-600">{message}</p>}
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-emerald-700">Anda sudah login sebagai admin.</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
