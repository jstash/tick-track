import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authAPI, getAuthToken } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState("login");

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [regStatus, setRegStatus] = useState({ type: "idle", message: "" });

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    if (!form.username.trim() || !form.password) {
      setStatus({ type: "error", message: "Username and password are required." });
      return;
    }

    try {
      setStatus({ type: "loading", message: "Signing you in..." });
      await authAPI.login(form.username.trim(), form.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Login failed. Please try again.",
      });
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegStatus({ type: "idle", message: "" });

    if (
      !regForm.name ||
      !regForm.email ||
      !regForm.password ||
      !regForm.confirmPassword
    ) {
      setRegStatus({ type: "error", message: "All fields are required." });
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setRegStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    try {
      setRegStatus({ type: "loading", message: "Creating your account..." });

      const full_name = regForm.name.trim();
      const email = regForm.email.trim();
      let username = (email.split("@")[0] ?? "")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 16);
      if (!username) {
        username =
          full_name
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "")
            .slice(0, 16) || "user";
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          full_name,
          email,
          password: regForm.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Registration failed. Please try again.");
      }

      setRegStatus({
        type: "success",
        message: "Account created! You can now log in.",
      });
      setRegForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setRegStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  const showLoginPanel = () => {
    setPanel("login");
    setStatus({ type: "idle", message: "" });
  };

  const showRegisterPanel = () => {
    setPanel("register");
    setRegStatus({ type: "idle", message: "" });
  };

  if (getAuthToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  const isLoginSubmitting = status.type === "loading";
  const isRegisterSubmitting = regStatus.type === "loading";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md rounded-xl bg-slate-900/80 p-8 shadow-xl border border-slate-800">
        {panel === "login" ? (
          <>
            <h1 className="text-2xl font-semibold text-center mb-2">Log in</h1>
            <p className="text-sm text-slate-400 text-center mb-6">
              Welcome back. Enter your username and password.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1 text-slate-200"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleLoginChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Your account username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1 text-slate-200"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleLoginChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              {status.type !== "idle" && (
                <p
                  className={`text-sm ${
                    status.type === "error" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="mt-2 w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoginSubmitting ? "Signing in..." : "Log in"}
              </button>
            </form>

            <button
              type="button"
              onClick={showRegisterPanel}
              className="mt-6 flex w-full items-center justify-center rounded-lg border border-slate-600 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-200 hover:border-indigo-500 hover:bg-slate-800/60 transition-colors"
            >
              Create account
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-center mb-2">Create account</h1>
            <p className="text-sm text-slate-400 text-center mb-6">
              Sign up to start tracking your ticks.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-sm font-medium mb-1 text-slate-200"
                >
                  Name
                </label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={regForm.name}
                  onChange={handleRegisterChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-sm font-medium mb-1 text-slate-200"
                >
                  Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={regForm.email}
                  onChange={handleRegisterChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-sm font-medium mb-1 text-slate-200"
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={regForm.password}
                  onChange={handleRegisterChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-confirmPassword"
                  className="block text-sm font-medium mb-1 text-slate-200"
                >
                  Confirm password
                </label>
                <input
                  id="reg-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={regForm.confirmPassword}
                  onChange={handleRegisterChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              {regStatus.type !== "idle" && (
                <p
                  className={`text-sm ${
                    regStatus.type === "error" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {regStatus.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isRegisterSubmitting}
                className="mt-2 w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isRegisterSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-xs text-slate-500 text-center">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>

            <button
              type="button"
              onClick={showLoginPanel}
              className="mt-6 block w-full text-center text-sm font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              Log in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
