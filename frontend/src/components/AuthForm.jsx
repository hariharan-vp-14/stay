import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthForm({ role = "user", mode = "register" }) {
  const isRegister = mode === "register";
  const isLogin = mode === "login";

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
    <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 space-y-5 shadow-xl">
      <div className="text-center space-y-2">
        <span className="inline-block px-3 py-1 text-xs uppercase tracking-[0.2em] text-accent bg-accent/10 rounded-full border border-accent/20">
          {role === "owner" ? "Property Owner" : "User"} {isRegister ? "Registration" : "Login"}
        </span>
        <h2 className="text-2xl text-white font-semibold">
          {isRegister ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-sm text-mist/70">
          {isRegister
            ? "Join thousands of users finding their perfect stay"
            : "Sign in to continue to your dashboard"}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {isRegister && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-mist/80">
              Full name
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all placeholder:text-mist/40"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Enter your full name"
                required
              />
            </label>

            <label className="text-sm text-mist/80">
              Contact number
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all placeholder:text-mist/40"
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
          Email address
          <input
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all placeholder:text-mist/40"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="text-sm text-mist/80 block">
          Password
          <input
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
          />
        </label>

        {/* Forgot Password Link - Only show in login mode */}
        {isLogin && (
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-accent hover:text-accent/80 transition-colors hover:underline"
              onClick={() => {
                // For now, show an alert. You can implement a forgot password modal or page later.
                alert("Forgot password feature coming soon! Please contact support for password reset.");
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-accent to-accentDark text-night font-semibold py-2.5 disabled:opacity-60 hover:shadow-lg hover:shadow-accent/20 transition-all duration-200"
        >
          {loading ? "Please wait…" : isRegister ? "Create Account" : "Sign In"}
        </button>
      </form>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      {success && <p className="text-sm text-green-400 text-center">{success}</p>}

      {/* Toggle between Login and Register */}
      <div className="pt-4 border-t border-white/10 text-center">
        {isRegister ? (
          <p className="text-sm text-mist/70">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent font-medium hover:text-accent/80 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        ) : (
          <p className="text-sm text-mist/70">
            Don't have an account?{" "}
            <Link
              to={role === "owner" ? "/register/owner" : "/register/user"}
              className="text-accent font-medium hover:text-accent/80 hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
