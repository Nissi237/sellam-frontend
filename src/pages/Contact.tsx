import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const details = [
    { Icon: Mail, label: t("contact.emailLabel"), value: t("contact.emailValue"), href: `mailto:${t("contact.emailValue")}` },
    { Icon: Phone, label: t("contact.phoneLabel"), value: t("contact.phoneValue") },
    { Icon: MapPin, label: t("contact.addressLabel"), value: t("contact.addressValue") },
    { Icon: Clock, label: t("contact.hoursLabel"), value: t("contact.hoursValue") },
  ];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t("contact.required"));
      return;
    }
    setError("");
    // No backend mailbox: compose a message in the user's own email client.
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${t("contact.emailValue")}?subject=${encodeURIComponent(subject || "Sellam")}&body=${encodeURIComponent(body)}`;
  };

  const inputClass =
    "w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-forest-950 mb-1">{t("contact.title")}</h1>
      <p className="text-sm text-forest-500 mb-8">{t("contact.subtitle")}</p>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Details */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {details.map(({ Icon, label, value, href }) => (
            <div key={label} className="receipt-stub bg-white border border-forest-300 p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-forest-300/40 flex items-center justify-center text-forest-800 shrink-0">
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-forest-500">{label}</p>
                {href ? (
                  <a href={href} className="font-body text-forest-950 hover:text-forest-800 break-all">{value}</a>
                ) : (
                  <p className="font-body text-forest-950">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="md:col-span-3 receipt-stub bg-white border border-forest-300 p-6">
          <h2 className="font-display text-lg text-forest-950 mb-4">{t("contact.formTitle")}</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("contact.nameField")} className={inputClass} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("contact.emailField")} className={inputClass} />
          </div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("contact.subjectField")} className={`${inputClass} mb-3`} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("contact.messageField")} rows={5} className={`${inputClass} mb-3`} />
          {error && <p className="text-clay text-sm mb-2">{error}</p>}
          <button type="submit" className="inline-flex items-center gap-2 bg-forest-800 text-cream px-5 py-2.5 rounded-md font-medium hover:bg-forest-950 transition">
            <Send size={16} /> {t("contact.send")}
          </button>
          <p className="text-[11px] text-forest-500 mt-2">{t("contact.note")}</p>
        </form>
      </div>
    </div>
  );
}
