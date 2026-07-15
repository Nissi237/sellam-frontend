import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Receipt, RefreshCw, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listInvoices,
  payInvoice,
  listContracts,
  runContract,
  getCorporateAnalytics,
  type Invoice,
  type Contract,
  type CorporateAnalytics,
} from "../api/endpoints";
import { formatPrice } from "../utils/format";

const categoryKeys: Record<string, string> = {
  "Fruits & légumes": "produce",
  "Provisions": "groceries",
  "Textiles": "textiles",
};

export default function Invoices() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const isSeller = user?.role === "seller";
  const asParam = isSeller ? "seller" : undefined;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [analytics, setAnalytics] = useState<CorporateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([listInvoices(asParam), listContracts(asParam)])
      .then(([inv, con]) => {
        setInvoices(inv);
        setContracts(con);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isAuthenticated) load();
    else setLoading(false);
    if (isAuthenticated && user?.role === "corporate_buyer") {
      getCorporateAnalytics().then(setAnalytics).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("invoice.loginRequired")}</p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }

  const pay = async (id: string) => {
    await payInvoice(id);
    load();
  };
  const runCycle = async (id: string) => {
    await runContract(id);
    load();
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-6 flex items-center gap-2">
        <Receipt size={22} /> {t("invoice.title")}
      </h1>

      {/* Corporate spend analytics (FR-25) */}
      {analytics && (
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><TrendingUp size={13} /> {t("invoice.spendTotal")}</p>
              <p className="font-mono text-lg text-forest-950">{formatPrice(analytics.spendTotal)}</p>
            </div>
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="text-xs text-forest-500 mb-1">{t("invoice.thisMonth")}</p>
              <p className="font-mono text-lg text-forest-950">{formatPrice(analytics.spendThisMonth)}</p>
            </div>
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="text-xs text-forest-500 mb-1">{t("invoice.orders")}</p>
              <p className="font-mono text-lg text-forest-950">{analytics.orderCount}</p>
            </div>
          </div>
          {analytics.suppliers.length > 0 && (
            <div className="receipt-stub bg-white border border-forest-300 p-4">
              <p className="text-xs text-forest-500 mb-2">{t("invoice.supplierReliability")}</p>
              {analytics.suppliers.map((s) => (
                <div key={s.sellerName} className="flex justify-between text-sm py-0.5">
                  <span className="text-forest-800">{t("invoice.supplierLine", { name: s.sellerName, orders: s.orders })}</span>
                  <span className="font-mono text-forest-950">{t("invoice.reliabilityLine", { reliability: s.reliability, spend: formatPrice(s.spend) })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-forest-800/70 font-body py-8 text-center">{t("common.loading")}</p>
      ) : (
        <>
          {contracts.length > 0 && (
            <>
              <h2 className="font-body font-semibold text-forest-800 mb-3">{t("invoice.recurringContracts")}</h2>
              <div className="flex flex-col gap-3 mb-8">
                {contracts.map((c) => (
                  <div key={c.id} className="receipt-stub bg-white border border-forest-300 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-body font-semibold text-forest-950">
                        {c.quantity} {t(`unit.${c.unit}`, c.unit)} · {t(`category.${categoryKeys[c.productCategory] ?? ""}`, c.productCategory)}
                      </p>
                      <p className="text-xs text-forest-500">
                        {t("invoice.contractMeta", {
                          freq: t(`freq.${c.frequency}`, c.frequency),
                          price: formatPrice(c.unitPrice),
                          unit: t(`unit.${c.unit}`, c.unit),
                          party: isSeller ? c.buyerName : c.sellerName,
                          date: c.nextInvoiceDate?.slice(0, 10),
                        })}
                      </p>
                    </div>
                    {c.status === "active" && (
                      <button onClick={() => runCycle(c.id)}
                        className="flex items-center gap-1 text-sm border border-forest-300 text-forest-800 px-3 py-1.5 rounded-md hover:bg-forest-300/20 transition">
                        <RefreshCw size={14} /> {t("invoice.generateCycle")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 className="font-body font-semibold text-forest-800 mb-3">{t("invoice.invoicesTitle")}</h2>
          {invoices.length === 0 ? (
            <p className="text-forest-800/70 font-body py-4">{t("invoice.noInvoices")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="receipt-stub bg-white border border-forest-300 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-forest-950">{formatPrice(inv.amount)}</p>
                    <p className="text-xs text-forest-500">
                      {t("invoice.invoiceMeta", { period: inv.periodLabel, party: isSeller ? inv.buyerName : inv.sellerName })}
                      {inv.dueDate ? t("invoice.dueDate", { date: inv.dueDate.slice(0, 10) }) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      inv.status === "paid" ? "bg-leaf/20 text-leaf" : "bg-clay/20 text-clay"
                    }`}>
                      {t(`invoice.status.${inv.status}`, inv.status)}
                    </span>
                    {!isSeller && inv.status === "issued" && (
                      <button onClick={() => pay(inv.id)}
                        className="text-sm bg-forest-800 text-cream px-3 py-1.5 rounded-md hover:bg-forest-950 transition">
                        {t("invoice.pay")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
