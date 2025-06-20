import Head from "next/head";
import { useState, useEffect } from "react";
import { CheckCircle, Calendar, Users, Trophy, Clock, Star } from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import Image from "next/image";

type CompletedDrop = {
  id: number;
  name: string;
  image: string;
  description: string;
  goal: number;
  finalCount: number;
  completedDate: string;
  category: string;
  participants: number;
  totalSaved: number;
  originalPrice: number;
  finalPrice: number;
  duration: string;
  type: "community" | "staff-pick";
};

export default function RecentlyCompletedPage() {
  const [completedDrops, setCompletedDrops] = useState<CompletedDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "community" | "staff-pick">("all");

  useEffect(() => {
    fetchCompletedDrops();
  }, []);

  const fetchCompletedDrops = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data. In a real app, this would come from an API
      const mockCompletedDrops: CompletedDrop[] = [
        {
          id: 1,
          name: "Gilded Vanguard Headset",
          image: "https://placehold.co/400x400.png?text=Headset",
          description: "Premium gaming headset with surround sound",
          goal: 100,
          finalCount: 127,
          completedDate: "2025-06-15",
          category: "Electronics",
          participants: 89,
          totalSaved: 2540,
          originalPrice: 199.99,
          finalPrice: 149.99,
          duration: "14 days",
          type: "staff-pick"
        },
        {
          id: 2,
          name: "Smart Home Bundle",
          image: "https://placehold.co/400x400.png?text=Smart+Home",
          description: "Complete smart home automation package",
          goal: 50,
          finalCount: 63,
          completedDate: "2025-06-10",
          category: "Smart Home", 
          participants: 47,
          totalSaved: 1890,
          originalPrice: 299.99,
          finalPrice: 239.99,
          duration: "21 days",
          type: "community"
        },
        {
          id: 3,
          name: "Professional Laptop Stand",
          image: "https://placehold.co/400x400.png?text=Laptop+Stand",
          description: "Ergonomic adjustable laptop stand",
          goal: 75,
          finalCount: 89,
          completedDate: "2025-06-08",
          category: "Office",
          participants: 65,
          totalSaved: 890,
          originalPrice: 89.99,
          finalPrice: 69.99,
          duration: "10 days",
          type: "community"
        }
      ];
      
      setCompletedDrops(mockCompletedDrops);
    } catch (error) {
      console.error("Failed to fetch completed drops:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrops = completedDrops.filter(drop => 
    filter === "all" || drop.type === filter
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "staff-pick":
        return (
          <Image
            src="/Icons/subsribers.png"
            alt="Staff Pick"
            width={16}
            height={16}
          />
        );
      case "community":
        return <Users className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "staff-pick":
        return "Staff Pick";
      case "community":
        return "Community Drop";
      default:
        return "Drop";
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "staff-pick":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "community":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading Completed Drops...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Recently Completed - MIGISTUS | Successful Group Buys</title>
        <meta name="description" content="Browse recently completed group buying drops and see the savings achieved by our community." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-8 pb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-transparent to-blue-900/10" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <CheckCircle className="w-16 h-16 text-green-400" />
                  <Trophy className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Recently Completed
                </span>
              </h1>
              <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-8">
                Celebrate successful group buys! See how our community came together to unlock amazing deals and savings.
              </p>

              {/* Filter Buttons */}
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    filter === "all"
                      ? "bg-yellow-500 text-black"
                      : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                  }`}
                >
                  All Drops
                </button>
                <button
                  onClick={() => setFilter("community")}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    filter === "community"
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                  }`}
                >
                  Community Drops
                </button>
                <button
                  onClick={() => setFilter("staff-pick")}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    filter === "staff-pick"
                      ? "bg-yellow-500 text-black"
                      : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                  }`}
                >
                  Staff Picks
                </button>
              </div>
            </div>

            {/* Completed Drops Grid */}
            {filteredDrops.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDrops.map((drop) => (
                  <div key={drop.id} className="bg-zinc-800/30 border border-zinc-700 rounded-xl overflow-hidden hover:border-green-500/50 transition-all duration-300 group">
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={drop.image}
                        alt={drop.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {/* Completed Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                          <CheckCircle className="w-4 h-4" />
                          <span>Completed</span>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className="absolute top-4 right-4">
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold border ${getTypeBadgeColor(drop.type)}`}>
                          {getTypeIcon(drop.type)}
                          <span>{getTypeLabel(drop.type)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2">{drop.name}</h3>
                      <p className="text-zinc-400 mb-4 line-clamp-2">{drop.description}</p>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-zinc-700/30 rounded-lg">
                          <div className="text-green-400 font-bold text-lg">{drop.finalCount}</div>
                          <div className="text-zinc-400 text-sm">Final Count</div>
                          <div className="text-xs text-green-300">Goal: {drop.goal}</div>
                        </div>
                        
                        <div className="text-center p-3 bg-zinc-700/30 rounded-lg">
                          <div className="text-blue-400 font-bold text-lg">{drop.participants}</div>
                          <div className="text-zinc-400 text-sm">Participants</div>
                        </div>
                      </div>

                      {/* Pricing Info */}
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-zinc-400 text-sm">Original Price:</span>
                          <span className="text-zinc-400 line-through">${drop.originalPrice}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-zinc-400 text-sm">Final Price:</span>
                          <span className="text-green-400 font-bold">${drop.finalPrice}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400 text-sm">Total Saved:</span>
                          <span className="text-green-400 font-bold">${drop.totalSaved}</span>
                        </div>
                      </div>

                      {/* Drop Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Completed:</span>
                          <span className="text-white">
                            {new Date(drop.completedDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Duration:</span>
                          <span className="text-white">{drop.duration}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Category:</span>
                          <span className="text-yellow-400">{drop.category}</span>
                        </div>
                      </div>

                      {/* Success Rate */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-zinc-400">Success Rate:</span>
                          <span className="text-green-400 font-bold">
                            {Math.round((drop.finalCount / drop.goal) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((drop.finalCount / drop.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-zinc-400 mb-2">No Completed Drops Yet</h3>
                <p className="text-zinc-500">Check back soon to see successful group buys!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
