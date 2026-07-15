import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import {
  listNotifications,
  unreadNotifications,
  markAllNotificationsRead,
  type Notification,
} from "../api/endpoints";
import { getSocket } from "../lib/socket";

// Notification bell (FR-22): shows unread count, live-updates over Socket.io.
export default function NotificationsBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    unreadNotifications().then(setUnread).catch(() => {});
    listNotifications().then(setItems).catch(() => {});
  };

  useEffect(() => {
    refresh();
    const socket = getSocket();
    const onNew = () => refresh();
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, []);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await markAllNotificationsRead();
      setUnread(0);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative hover:text-forest-300 transition" aria-label={t("notif.title")}>
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 bg-clay text-cream text-[10px] font-mono rounded-full w-4 h-4 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white border border-forest-300 rounded-md shadow-lg z-50 text-forest-950">
          {items.length === 0 ? (
            <p className="text-sm text-forest-500 p-4 text-center">{t("notif.empty")}</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setOpen(false);
                  if (n.link) navigate(n.link);
                }}
                className="block w-full text-left px-4 py-3 border-b border-forest-300/50 hover:bg-forest-300/10"
              >
                <p className="text-sm">{n.message}</p>
                <p className="text-[11px] text-forest-500">{new Date(n.createdAt).toLocaleString("fr-FR")}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
