import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, Lock } from "lucide-react";
import { adminLogin } from "../api/endpoints";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Separate admin entry point — talks to the backend's admin auth module
// (/admin/auth/login), distinct from the client login.
export default function AdminLogin() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email et mot de passe requis.");
      return;
    }
    setLoading(true);
    try {
      const result = await adminLogin(email.trim(), password);
      setAuth(result.token, result.user);
      navigate("/admin");
    } catch (err) {
      setError(apiError(err, "Identifiants administrateur invalides."));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  return (
    <section className="max-w-md mx-auto px-4 py-12">
      <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6">
        <h1 className="font-display text-2xl text-forest-950 mb-1 flex items-center gap-2">
          <ShieldAlert size={22} /> Portail administrateur
        </h1>
        <p className="text-xs text-forest-500 mb-5 flex items-center gap-1">
          <Lock size={12} /> Accès réservé — connexion séparée des clients.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email administrateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />

          {error && <p className="text-clay text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-forest-800 text-cream py-2.5 rounded-md font-medium hover:bg-forest-950 transition disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <Link to="/login" className="block text-center text-sm text-forest-800 underline mt-4">
          Vous êtes un client ? Connexion client
        </Link>
      </div>
    </section>
  );
}
