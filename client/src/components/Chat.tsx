import { useEffect, useRef, useState } from "react";
import { Send, Link2 } from "lucide-react";
import { io, Socket } from "socket.io-client";
import type { Message, User, Task } from "../lib/types";
import { api } from "../lib/api";
import { Avatar } from "./Avatar";
import { formatTime } from "../lib/utils";

interface ChatProps {
  projectId: string;
  currentUser: User;
  tasks: Task[];
}

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: "/socket.io" });
  }
  return socket;
}

export function Chat({ projectId, currentUser, tasks }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [linkedTask, setLinkedTask] = useState<string>("");
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.getMessages(projectId).then(setMessages);

    const sock = getSocket();
    sock.emit("join_project", projectId);
    sock.on("new_message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      sock.emit("leave_project", projectId);
      sock.off("new_message");
    };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const content = input.trim();
    if (!content) return;
    getSocket().emit("send_message", {
      project_id: projectId,
      user_id: currentUser.id,
      content,
      task_id: linkedTask || undefined,
    });
    setInput("");
    setLinkedTask("");
    setShowTaskPicker(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const linkedTaskObj = tasks.find((t) => t.id === linkedTask);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Ingen beskeder endnu. Skriv det første!
          </div>
        )}
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id ||
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;
          const isOwn = msg.user_id === currentUser.id;

          return (
            <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              {showHeader && (
                <div className="flex-shrink-0">
                  <Avatar name={msg.user_name} color={msg.user_avatar_color} platform={msg.user_platform} showPlatform size="sm" />
                </div>
              )}
              {!showHeader && <div className="w-7 flex-shrink-0" />}
              <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                {showHeader && (
                  <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <span className="text-xs font-semibold">{msg.user_name}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                  </div>
                )}
                {msg.task_title && (
                  <div className="text-xs text-muted-foreground bg-secondary rounded px-2 py-0.5 mb-1 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> {msg.task_title}
                  </div>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary text-foreground rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
                {!showHeader && (
                  <span className="text-xs text-muted-foreground mt-0.5">{formatTime(msg.created_at)}</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 bg-white">
        {linkedTaskObj && (
          <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary rounded px-2 py-1 mb-2">
            <Link2 className="w-3 h-3" />
            <span className="flex-1 truncate">{linkedTaskObj.title}</span>
            <button onClick={() => setLinkedTask("")} className="hover:text-foreground">×</button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTaskPicker(!showTaskPicker)}
              title="Link til opgave"
              className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary"
            >
              <Link2 className="w-4 h-4" />
            </button>
            {showTaskPicker && (
              <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg w-64 max-h-48 overflow-y-auto z-10">
                <div className="p-2 space-y-1">
                  <button onClick={() => { setLinkedTask(""); setShowTaskPicker(false); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-secondary text-muted-foreground">Ingen opgave</button>
                  {tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setLinkedTask(t.id); setShowTaskPicker(false); }}
                      className="w-full text-left text-xs px-2 py-1 rounded hover:bg-secondary truncate"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Skriv en besked... (Enter for at sende)"
            rows={1}
            className="flex-1 text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            style={{ maxHeight: 120, overflowY: "auto" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
