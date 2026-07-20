import { useState, type  FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, ShieldCheck } from "lucide-react";
import type { UserRole, AuthMethod, AuthMode } from "../types/auth";
import { requestOtp, registerUser, loginUser } from "../api/endpoints";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [role, setRole] = useState<UserRole | "delivery_agent">("individual_buyer");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketName, setMarketName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessRegNumber, setBusinessRegNumber] = useState("");

  const [referralCode, setReferralCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError(t("auth.phone") + " ?");
      return;
    }
    setError("");
    try {
      await requestOtp(phone.trim());
      setOtpSent(true);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (method === "phone" && (!phone.trim() || (otpSent && !otpCode.trim()))) {
      setError(t("auth.otpCode") + " ?");
      return;
    }
    if (method === "email" && (!email.trim() || !password.trim())) {
      setError(t("auth.email") + " / " + t("auth.password") + " ?");
      return;
    }
    if (mode === "register" && !fullName.trim()) {
      setError(t("auth.fullName") + " ?");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        const payload: Record<string, unknown> = { role, fullName: fullName.trim() };
        if (method === "phone") {
          payload.phone = phone.trim();
          payload.otpCode = otpCode.trim();
        } else {
          payload.email = email.trim();
          payload.password = password;
        }
        if (role === "seller") payload.marketName = marketName.trim();
        if (role === "corporate_buyer") {
          payload.businessName = businessName.trim();
          payload.businessRegNumber = businessRegNumber.trim();
        }
        if (referralCode.trim()) payload.referralCode = referralCode.trim();
        result = await registerUser(payload);
      } else {
        const payload: Record<string, unknown> =
          method === "phone"
            ? { phone: phone.trim(), otpCode: otpCode.trim() }
            : { email: email.trim(), password };
        result = await loginUser(payload);
      }

      setAuth(result.token, result.user);
      setSuccess(mode === "register" ? t("auth.successRegister") : t("auth.successLogin"));
      // Buyers land on their dashboard; other roles keep the marketplace home.
      const isBuyer =
        result.user.role === "individual_buyer" || result.user.role === "corporate_buyer";
      setTimeout(() => navigate(isBuyer ? "/dashboard" : "/"), 800);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  return (
    <section className="max-w-md mx-auto px-4 py-12">
      <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6">
        <h1 className="font-display text-2xl text-forest-950 mb-1">
          {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
        </h1>

        {/* Login / Register toggle */}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setSuccess("");
          }}
          className="text-sm text-forest-800 underline mb-5"
        >
          {mode === "login" ? t("auth.switchToRegister") : t("auth.switchToLogin")}
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Role selector — register only, per FR-1 */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-forest-800 mb-1">
                {t("auth.role")}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole | "delivery_agent")}
                className={inputClass}
              >
                <option value="individual_buyer">{t("auth.roleIndividualBuyer")}</option>
                <option value="seller">{t("auth.roleSeller")}</option>
                <option value="corporate_buyer">{t("auth.roleCorporateBuyer")}</option>
                <option value="delivery_agent">{t("auth.roleDeliveryAgent")}</option>
              </select>
            </div>
          )}

          {mode === "register" && (
            <input
              type="text"
              placeholder={t("auth.fullName")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          )}

          {mode === "register" && (
            <input
              type="text"
              placeholder={t("auth.referralCode")}
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className={inputClass}
            />
          )}

          {/* Role-specific fields, per FR-1 */}
          {mode === "register" && role === "seller" && (
            <input
              type="text"
              placeholder={t("auth.marketName")}
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              className={inputClass}
            />
          )}
          {mode === "register" && role === "corporate_buyer" && (
            <>
              <input
                type="text"
                placeholder={t("auth.businessName")}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder={t("auth.businessRegNumber")}
                value={businessRegNumber}
                onChange={(e) => setBusinessRegNumber(e.target.value)}
                className={inputClass}
              />
            </>
          )}

          {/* Auth method toggle, per FR-3: phone+OTP primary, email fallback */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition ${
                method === "phone"
                  ? "bg-forest-800 text-cream"
                  : "bg-forest-300/30 text-forest-800"
              }`}
            >
              <Phone size={16} /> {t("auth.methodPhone")}
            </button>
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition ${
                method === "email"
                  ? "bg-forest-800 text-cream"
                  : "bg-forest-300/30 text-forest-800"
              }`}
            >
              <Mail size={16} /> {t("auth.methodEmail")}
            </button>
          </div>

          {method === "phone" ? (
            <>
              <input
                type="tel"
                placeholder={t("auth.phone") + " (+237...)"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="bg-forest-300/40 text-forest-800 py-2 rounded-md text-sm font-medium hover:bg-forest-300/60 transition"
                >
                  {t("auth.sendCode")}
                </button>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder={t("auth.otpCode")}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-xs text-forest-500 mt-1 flex items-center gap-1">
                    <ShieldCheck size={12} /> {t("auth.codeSentNote")}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </>
          )}

          {error && <p className="text-clay text-sm">{error}</p>}
          {success && <p className="text-forest-800 text-sm font-medium">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-forest-800 text-cream py-2.5 rounded-md font-medium hover:bg-forest-950 transition disabled:opacity-60"
          >
            {loading
              ? t("auth.loading")
              : mode === "login"
              ? t("auth.submitLogin")
              : t("auth.submitRegister")}
          </button>
        </form>
      </div>
    </section>
  );
}