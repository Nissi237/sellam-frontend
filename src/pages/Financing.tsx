import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Landmark, TrendingUp, ShieldCheck, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAdvanceEligibility,
  listMyAdvances,
  requestAdvance,
  getAdvanceLedger,
  type Eligibility,
  type Advance,
  type LedgerEntry,
} from "../api/endpoints";
import { apiError } from "../api/client";
import { formatPrice } from "../utils/format";

export default function Financing() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [elig, setElig] = useState<Eligibility | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("10");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const active = advances.find((a) => a.status === "active");

  const load = async () => {
    const [e, advs] = await Promise.all([getAdvanceEligibility(), listMyAdvances()]);
    setElig(e);
    setAdvances(advs);
    const act = advs.find((a) => a.status === "active");
    if (act) setLedger(await getAdvanceLedger(act.id));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "seller") load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated || user?.role !== "seller") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">{t("fin.sellersOnly")}</p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError(t("fin.amountRequired"));
      return;
    }
    setSaving(true);
    try {
      await requestAdvance(Number(amount), Number(rate));
      setAmount("");
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  const repaid = active ? active.amount - active.outstandingBalance : 0;
  const pct = active && active.amount > 0 ? Math.round((repaid / active.amount) * 100) : 0;

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-1 flex items-center gap-2">
        <Landmark size={22} /> {t("fin.title")}
      </h1>
      <p className="text-xs text-forest-500 mb-6">
        {t("fin.subtitle")}
      </p>

      {active ? (
        <>
          <div className="receipt-stub bg-white border border-forest-300 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-forest-500">{t("fin.activeAdvance")}</p>
                <p className="font-mono text-2xl text-forest-950">{formatPrice(active.amount)}</p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-forest-300/30 text-forest-800">
                {t("fin.perSale", { rate: active.repaymentRate })}
              </span>
            </div>
            <div className="h-2 bg-forest-300/40 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-leaf" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-forest-500">
              {t("fin.repaidLine", { repaid: formatPrice(repaid) })}
              <span className="font-semibold text-forest-800">{formatPrice(active.outstandingBalance)}</span>
            </p>
            <p className="text-[11px] text-forest-400 mt-2">{t("fin.partnerRef", { ref: active.partnerMfiRef })}</p>
          </div>

          <h2 className="font-body font-semibold text-forest-800 mb-2">{t("fin.ledger")}</h2>
          <div className="flex flex-col gap-2">
            {ledger.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm border border-forest-300 rounded-md px-3 py-2 bg-white">
                <span className="flex items-center gap-2">
                  {l.entryType === "disbursement" ? (
                    <ArrowDownCircle size={16} className="text-clay" />
                  ) : (
                    <ArrowUpCircle size={16} className="text-leaf" />
                  )}
                  {l.entryType === "disbursement" ? t("fin.disbursement") : t("fin.repayment")}
                </span>
                <span className="font-mono text-forest-950">
                  {l.entryType === "disbursement" ? "+" : "−"}
                  {formatPrice(l.amount)}
                  <span className="text-xs text-forest-500 ml-2">{t("fin.balance", { amount: formatPrice(l.balanceAfter) })}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><ShieldCheck size={13} /> {t("fin.trust")}</p>
              <p className="font-mono text-lg text-forest-950">{elig?.trustScore ?? 0}/5</p>
            </div>
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><TrendingUp size={13} /> {t("fin.sales")}</p>
              <p className="font-mono text-lg text-forest-950">{formatPrice(elig?.salesTotal ?? 0)}</p>
            </div>
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="text-xs text-forest-500 mb-1">{t("fin.cap")}</p>
              <p className="font-mono text-lg text-forest-950">{formatPrice(elig?.maxAmount ?? 0)}</p>
            </div>
          </div>

          {elig?.eligible ? (
            <form onSubmit={submit} className="receipt-stub bg-white border border-forest-300 p-5">
              <p className="font-body font-semibold text-forest-800 mb-3">{t("fin.requestAdvance")}</p>
              <label className="text-xs text-forest-500">{t("fin.amountMax", { max: formatPrice(elig.maxAmount) })}</label>
              <input type="number" min={1} max={elig.maxAmount} placeholder={t("fin.amountPlaceholder")} value={amount}
                onChange={(e) => setAmount(e.target.value)} className={`${inputClass} mb-3 mt-1`} />
              <label className="text-xs text-forest-500">{t("fin.ratePerSale")}</label>
              <input type="number" min={1} max={50} value={rate}
                onChange={(e) => setRate(e.target.value)} className={`${inputClass} mb-3 mt-1`} />
              {error && <p className="text-clay text-sm mb-2">{error}</p>}
              <button type="submit" disabled={saving}
                className="bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition disabled:opacity-60">
                {t("fin.request", { amount: amount ? formatPrice(Number(amount)) : "" })}
              </button>
            </form>
          ) : (
            <div className="receipt-stub bg-white border border-forest-300 p-5 text-center">
              <p className="text-forest-800/80 font-body">{elig?.reason ?? t("fin.notEligible")}</p>
              <p className="text-xs text-forest-500 mt-2">
                {t("fin.eligibilityHint")}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
