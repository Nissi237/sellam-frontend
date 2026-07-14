import { useEffect, useState } from "react";
import { Trash2, Star, Plus } from "lucide-react";
import {
  fetchMomoAccounts,
  addMomoAccount,
  deleteMomoAccount,
  setDefaultMomoAccount,
  type MomoAccount,
} from "../api/endpoints";
import { apiError } from "../api/client";

const PROVIDERS = ["MTN MoMo", "Orange Money"] as const;

/**
 * Manage the current user's linked Mobile Money accounts (MTN / Orange).
 * Available to every role. `onChange` reports the current account list so a
 * parent (e.g. Checkout) can react to it.
 */
export default function MomoAccounts({
  onChange,
  compact = false,
}: {
  onChange?: (accounts: MomoAccount[]) => void;
  compact?: boolean;
}) {
  const [accounts, setAccounts] = useState<MomoAccount[]>([]);
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("MTN MoMo");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetchMomoAccounts()
      .then((a) => {
        setAccounts(a);
        onChange?.(a);
      })
      .catch(() => {});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!number.trim()) {
      setError("Numéro requis");
      return;
    }
    setBusy(true);
    try {
      await addMomoAccount({
        provider,
        momoNumber: number.trim(),
        accountName: name.trim() || undefined,
      });
      setNumber("");
      setName("");
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  return (
    <div>
      {accounts.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 border border-forest-300 rounded-md px-3 py-2 bg-white"
            >
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  a.provider === "MTN MoMo"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {a.provider === "MTN MoMo" ? "MTN" : "Orange"}
              </span>
              <span className="font-mono text-sm text-forest-950 flex-1">
                {a.momoNumber}
                {a.accountName ? ` · ${a.accountName}` : ""}
              </span>
              {a.isDefault ? (
                <span className="text-[11px] text-leaf flex items-center gap-1">
                  <Star size={12} className="fill-leaf text-leaf" /> défaut
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setDefaultMomoAccount(a.id).then(load)}
                  className="text-[11px] text-forest-800 underline"
                >
                  définir par défaut
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteMomoAccount(a.id).then(load)}
                className="text-clay hover:text-clay/70"
                aria-label="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
        <div className="flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={`flex-1 py-2 rounded-md border text-sm transition ${
                provider === p
                  ? "bg-forest-800 text-cream border-forest-800"
                  : "border-forest-300 text-forest-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="tel"
          placeholder="Numéro Mobile Money (+237…)"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className={inputClass}
        />
        {!compact && (
          <input
            type="text"
            placeholder="Nom du titulaire (optionnel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        )}
        {error && <p className="text-clay text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-1 bg-forest-300/40 text-forest-800 py-2 rounded-md text-sm font-medium hover:bg-forest-300/60 transition disabled:opacity-60"
        >
          <Plus size={16} /> Ajouter ce compte
        </button>
      </form>
    </div>
  );
}
