import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Message = {
  id: number;
  user: string;
  content: string;
};

const mockMessages: Message[] = [
  { id: 1, user: "shadowfox", content: "how do i vote?" },
  { id: 2, user: "goldhands", content: "this drop is 🔥" },
  { id: 3, user: "n00bkiller99", content: "gimme codes!!!" },
  { id: 4, user: "bot_lord", content: "join discord.gg/spam" },
  { id: 5, user: "eira", content: "i love this site 💖" },
];

export default function ModerationPanel() {
  const [filter, setFilter] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const handleBan = (user: string) => {
    setMessages((prev) => prev.filter((msg) => msg.user !== user));
    alert(`🔨 Banned ${user}`);
  };

  const handleReport = (id: number) => {
    alert(`⚠️ Reported message #${id}`);
  };

  const handleClear = (id: number) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const filtered = messages.filter(
    (m) =>
      m.user.toLowerCase().includes(filter.toLowerCase()) ||
      m.content.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl text-[#FFD700]">💬 Chat Moderation</h2>
      <Input
        placeholder="Search messages or usernames..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="h-80 overflow-y-auto space-y-4 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
        {filtered.map((msg) => (
          <div key={msg.id} className="bg-zinc-900 p-3 rounded-md space-y-1 border border-zinc-700">
            <p className="text-sm text-zinc-400">@{msg.user}</p>
            <p className="text-white">{msg.content}</p>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="destructive" onClick={() => handleBan(msg.user)}>
                Ban
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleReport(msg.id)}>
                Report
              </Button>
              <Button size="sm" onClick={() => handleClear(msg.id)}>
                Clear
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-500 italic">No matching messages.</p>
        )}
      </div>
    </div>
  );
}
