import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthForm({ role = "user", mode = "register" }) {
  const isRegister = mode === "register";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ✅ EXPLICIT API PATH (no ambiguity)
      const endpoint = isRegister
        ? `/${role}s/register`
        : `/${role}s/login`;

      const payload = isRegister
        ? form
        : { email: form.email, password: form.password };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: payload,
      });

      const token = data?.token;
      const profile = data?.user || data?.owner || null;

      if (!token) {
        throw new Error("Authentication token not received");
      }

      login(role, { token, profile });

      setSuccess("Success! Redirecting…");

      // slight delay for UX
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">
          {role} {mode}
        </p>
        <h2 className="text-xl text-white font-semibold">
          {isRegister ? "Create an account" : "Login to continue"}
        </h2>
        <p className="text-sm text-mist/70">
          {isRegister
            ? "Fill your details to get started."
            : "Welcome back."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {isRegister && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-mist/80">
              Full name
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none"
                name="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </label>

            <label className="text-sm text-mist/80">
              Contact number
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none"
                name="contactNumber"
                value={form.contactNumber}
                onChange={onChange}
                pattern="[6-9]\d{9}"
                placeholder="10-digit mobile number"
              />
            </label>
          </div>
        )}

        <label className="text-sm text-mist/80 block">
          Email
          <input
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />
        </label>

        <label className="text-sm text-mist/80 block">
          Password
          <input
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-accent to-accentDark text-night font-semibold py-2 disabled:opacity-60"
        >
          {loading ? "Please wait…" : isRegister ? "Sign up" : "Login"}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
    </div>
  );
}
