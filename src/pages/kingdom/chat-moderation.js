import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

export default function ChatModerationPage() {
  const [profanityList, setProfanityList] = useState([
    'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'piss',
    'scam', 'fake', 'spam', 'bot', 'phishing', 'virus', 'malware',
    'better deal', 'cheaper elsewhere', 'dont buy', "don't buy", 'overpriced', 'ripoff', 'rip off'
  ]);
  
  const [newWord, setNewWord] = useState('');
  const [filterSettings, setFilterSettings] = useState({
    enableProfanityFilter: true,
    enableSpamDetection: true,
    enableCapsFilter: true,
    enableUrlBlocking: true,
    autoModeration: true
  });

  const addProfanityWord = () => {
    if (newWord.trim() && !profanityList.includes(newWord.toLowerCase())) {
      setProfanityList([...profanityList, newWord.toLowerCase()]);
      setNewWord('');
    }
  };

  const removeProfanityWord = (word) => {
    setProfanityList(profanityList.filter(w => w !== word));
  };

  const recentChatActivity = [
    { id: 1, user: "TechGuru92", message: "These are incredible!", time: "2m ago", status: "approved", drop: "Wireless Earbuds" },
    { id: 2, user: "AudioPhile", message: "****", time: "5m ago", status: "filtered", drop: "Wireless Earbuds", original: "damn good" },
    { id: 3, user: "Spammer123", message: "[BLOCKED]", time: "8m ago", status: "blocked", drop: "Gaming Mouse", original: "buy cheaper at amazon.com" },
  ];

  return (
    <DashboardLayout>
      <Head>
        <title>Chat Moderation - The King's Domain</title>
      </Head>

      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">💬 Chat Moderation</h1>
          <p className="text-zinc-400">Monitor and manage community discussions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Filter Settings */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">🛡️ Filter Settings</h2>
            
            <div className="space-y-4">
              {Object.entries(filterSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-zinc-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFilterSettings({
                      ...filterSettings,
                      [key]: e.target.checked
                    })}
                    className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-400"
                  />
                </div>
              ))}
            </div>

            <button className="w-full mt-6 bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition">
              Save Settings
            </button>
          </div>

          {/* Profanity Word List */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">📝 Profanity Filter List</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Add new word..."
                className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white"
                onKeyPress={(e) => e.key === 'Enter' && addProfanityWord()}
              />
              <button
                onClick={addProfanityWord}
                className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
              >
                Add
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {profanityList.map((word, index) => (
                  <span
                    key={index}
                    className="bg-red-900/50 border border-red-600 text-red-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {word}
                    <button
                      onClick={() => removeProfanityWord(word)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Chat Activity */}
        <div className="mt-8 bg-zinc-900 border border-yellow-500 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">📊 Recent Chat Activity</h2>
          
          <div className="space-y-3">
            {recentChatActivity.map((activity) => (
              <div key={activity.id} className="bg-zinc-800 border border-zinc-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{activity.user}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      activity.status === 'approved' ? 'bg-green-900/50 text-green-300' :
                      activity.status === 'filtered' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {activity.status}
                    </span>
                    <span className="text-zinc-400 text-sm">{activity.drop}</span>
                  </div>
                  <span className="text-zinc-500 text-sm">{activity.time}</span>
                </div>
                <div className="mt-2">
                  <p className="text-zinc-300">{activity.message}</p>
                  {activity.original && (
                    <p className="text-zinc-500 text-sm mt-1">Original: "{activity.original}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}