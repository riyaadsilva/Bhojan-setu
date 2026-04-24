import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser, UserRole } from "../contexts/UserContext";
import "./Login.css";

const roleLabels: Record<string, string> = {
  individual: "Individual",
  restaurant: "Restaurant / Caterer",
  ngo: "NGO",
};

const registerFields: Record<string, { label: string; key: string; placeholder: string; type?: string }[]> = {
  individual: [
    { label: "Full Name", key: "name", placeholder: "Your full name" },
    { label: "Birth Date", key: "birthDate", placeholder: "", type: "date" },
    { label: "Phone Number", key: "phone", placeholder: "+91 XXXXX XXXXX", type: "tel" },
    { label: "Email", key: "email", placeholder: "you@example.com", type: "email" },
    { label: "Location / City", key: "location", placeholder: "e.g. Mumbai" },
    { label: "Password", key: "password", placeholder: "Create a password", type: "password" },
  ],
  restaurant: [
    { label: "Business Name", key: "businessName", placeholder: "e.g. Spice Kitchen" },
    { label: "Owner Name", key: "ownerName", placeholder: "Full name of owner" },
    { label: "Establishment Date", key: "establishedDate", placeholder: "", type: "date" },
    { label: "FSSAI License No.", key: "fssai", placeholder: "14-digit license number" },
    { label: "Phone Number", key: "phone", placeholder: "+91 XXXXX XXXXX", type: "tel" },
    { label: "Business Email", key: "email", placeholder: "business@example.com", type: "email" },
    { label: "Address", key: "address", placeholder: "Full business address" },
    { label: "Cuisine Type", key: "cuisine", placeholder: "e.g. North Indian, Multi-cuisine" },
    { label: "Password", key: "password", placeholder: "Create a password", type: "password" },
  ],
  ngo: [
    { label: "NGO Name", key: "ngoName", placeholder: "Organization name" },
    { label: "Registration Number", key: "regNumber", placeholder: "NGO registration number" },
    { label: "Website", key: "website", placeholder: "https://your-ngo.org", type: "url" },
    { label: "Phone Number", key: "phone", placeholder: "+91 XXXXX XXXXX", type: "tel" },
    { label: "Email", key: "email", placeholder: "contact@ngo.org", type: "email" },
    { label: "Operating Area", key: "area", placeholder: "e.g. Delhi NCR, Pan-India" },
    { label: "Cause / Focus", key: "cause", placeholder: "e.g. Hunger relief, Child nutrition" },
    { label: "Password", key: "password", placeholder: "Create a password", type: "password" },
  ],
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role");
  const role = (requestedRole === "restaurant" || requestedRole === "ngo" || requestedRole === "individual" ? requestedRole : "individual") as UserRole;
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();

  const [tab, setTab] = useState<"login" | "register">("register");
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fields = registerFields[role] || registerFields.individual;

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await login(role, form, tab);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/login" ? from : "/dashboard", { replace: true });
    } catch (err: any) {
      const message = err.message || "Could not sign in. Please check your details.";
      setError(message === "Failed to fetch" ? "Cannot reach the backend server. Start the backend and refresh this page." : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-blob" />

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className="login-role-badge">{roleLabels[role]}</span>
        <h1 className="login-title">
          {tab === "login" ? "Welcome Back" : "Create Your Account"}
        </h1>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`login-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {tab === "login" ? (
            <>
              <div className="login-field">
                <label className="login-label">Email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="you@example.com"
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
              <div className="login-field">
                <label className="login-label">Password</label>
                <input
                  className="login-input"
                  type="password"
                  placeholder="••••••••"
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            fields.map((f) => (
              <div className="login-field" key={f.key}>
                <label className="login-label">{f.label}</label>
                <input
                  className="login-input"
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  required
                />
              </div>
            ))
          )}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Please wait..." : tab === "login" ? "Login →" : "Create Account →"}
          </button>
        </form>

        <div className="login-back">
          <button type="button" onClick={() => navigate("/select-role")}>Choose a different role</button>
        </div>
      </motion.div>
    </div>
  );
}
