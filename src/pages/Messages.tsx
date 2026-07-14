import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listConversations,
  listMessages,
  sendMessage,
  type Conversation,
  type Message,
} from "../api/endpoints";
import { getSocket } from "../lib/socket";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const rfqId = params.get("rfq") ?? undefined;
  const productId = params.get("product") ?? undefined;

  const loadConversations = () => listConversations().then(setConversations).catch(() => {});

  // Open a thread from ?with=&name= (e.g. from a product's "Contacter" button).
  useEffect(() => {
    if (!isAuthenticated) return;
    loadConversations();
    const withId = params.get("with");
    const name = params.get("name");
    if (withId) setSelected({ id: withId, name: name ?? "Vendeur" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Load history when a conversation is opened.
  useEffect(() => {
    if (!selected) return;
    listMessages({ withUserId: selected.id }).then(setMessages).catch(() => setMessages([]));
  }, [selected]);

  // Real-time: append incoming messages for the open thread; refresh list.
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onNew = (m: Message) => {
      if (selected && (m.senderId === selected.id || m.receiverId === selected.id)) {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
      loadConversations();
    };
    socket.on("message:new", onNew);
    return () => {
      socket.off("message:new", onNew);
    };
  }, [isAuthenticated, selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">Connectez-vous pour accéder à la messagerie.</p>
        <Link to="/login" className="text-forest-800 underline">Se connecter</Link>
      </section>
    );
  }

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !text.trim()) return;
    const content = text.trim();
    setText("");
    try {
      const msg = await sendMessage({ receiverId: selected.id, content, rfqId, productId });
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      setText(content);
    }
  };

  // Thread view
  if (selected) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: "80vh" }}>
        <button
          onClick={() => {
            setSelected(null);
            setParams({});
          }}
          className="inline-flex items-center gap-1 text-sm text-forest-800 hover:text-forest-950 mb-3"
        >
          <ArrowLeft size={16} /> Conversations
        </button>
        <h1 className="font-display text-lg text-forest-950 mb-3">{selected.name}</h1>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 border border-forest-300 rounded-md p-3 bg-white">
          {messages.length === 0 ? (
            <p className="text-forest-500 text-sm text-center my-auto">
              Démarrez la conversation.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={`max-w-[75%] ${mine ? "self-end" : "self-start"}`}>
                  <div className={`px-3 py-2 rounded-lg text-sm ${
                    mine ? "bg-forest-800 text-cream" : "bg-forest-300/30 text-forest-950"
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 mt-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Votre message…"
            className="flex-1 px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
          />
          <button type="submit" className="bg-forest-800 text-cream px-4 rounded-md hover:bg-forest-950 transition">
            <Send size={18} />
          </button>
        </form>
      </section>
    );
  }

  // Conversation list
  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-6 flex items-center gap-2">
        <MessageCircle size={22} /> Messages
      </h1>
      {conversations.length === 0 ? (
        <p className="text-forest-800/70 font-body py-8 text-center">Aucune conversation.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <button
              key={c.otherId}
              onClick={() => setSelected({ id: c.otherId, name: c.otherName })}
              className="receipt-stub bg-white border border-forest-300 p-4 text-left flex items-center justify-between hover:shadow-md transition"
            >
              <div className="min-w-0">
                <p className="font-body font-semibold text-forest-950">{c.otherName}</p>
                <p className="text-xs text-forest-500 truncate">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="bg-clay text-cream text-xs font-mono rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
