import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function GoogleButton({ role = "user" }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSuccess = async (credentialResponse) => {
    setError("");
    setStatus("Authenticating with Google…");

    // Debug: Log credential response
    console.log("Google credential received:", credentialResponse.credential ? "Yes" : "No");

    if (!credentialResponse.credential) {
      setError("No credential received from Google");
      setStatus("");
      return;
    }

    try {
      // ✅ Send the raw Google ID token to backend for verification
      const payload = {
        idToken: credentialResponse.credential,
      };

      // ✅ Correct backend endpoint
      const endpoint = `/${role}s/google-login`;

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: payload,
      });

      const token = data?.token;
      const profile = data?.user || data?.owner;

      if (!token) {
        throw new Error("Token not received from server");
      }

      login(role, { token, profile });
      setStatus("Google login successful. Redirecting…");

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (err) {
      console.error("Google login error:", err);
      const errorMessage = 
        err?.response?.data?.message ||
        err?.message ||
        "Google login failed";
      setError(errorMessage);
      setStatus("");
    }
  };

  const onError = () => {
    setError("Google authentication failed.");
  };

  return (
    <div className="glass p-4 rounded-2xl border border-white/10 space-y-3">
      <p className="text-sm text-white font-semibold">
        Continue with Google ({role})
      </p>

      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}   // ✅ disable OneTap (dev-safe)
      />

      {status && <p className="text-xs text-green-400">{status}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={() => googleLogout()}
        className="text-xs text-mist/60 hover:text-accent"
      >
        Sign out Google (client only)
      </button>
    </div>
  );
}
