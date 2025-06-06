import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

const DEPARTMENTS = [
  "All",
  "Electronics",
  "Computers",
  "Smart Home",
  "Home, Garden & Tools",
  "Pet Supplies",
  "Food & Grocery",
  "Beauty & Health",
  "Toys, Kids & Baby",
  "Handmade",
  "Sports & Outdoors",
  "Automotive",
  "Industrial & Scientific",
  "Movies, Music & Games"
];

type PricingTier = { min: number; max: number; price: number };
type Product = {
  id: number;
  name: string;
  image: string;
  description: string;
  goal: number;
  link: string;
  timeframe: string;
  category: string;
  votes?: number;
  featured?: boolean;
  pledges: number;
  pricingTiers?: PricingTier[];
  slug?: string;
};

type ProductFormData = {
  name: string;
  image: string;
  description: string;
  goal: number;
  link: string;
  timeframe: string;
  category: string;
  pricingTiers?: PricingTier[];
  slug?: string;
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

export default function ProductPoolEditor() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Gilded Vanguard Headset",
      image: "https://placehold.co/400x400.png?text=Headset",
      description: "Premium gaming headset with surround sound",
      goal: 100,
      link: "https://example.com/headset",
      timeframe: "30 days",
      category: "Electronics",
      votes: 73,
      featured: true,
      pledges: 0,
      slug: "gilded-vanguard-headset",
    },
    {
      id: 2,
      name: "Wireless Mouse Pro",
      image: "https://placehold.co/400x400.png?text=Mouse",
      description: "High-precision wireless gaming mouse",
      goal: 75,
      link: "https://example.com/mouse",
      timeframe: "45 days",
      category: "Electronics",
      votes: 42,
      featured: false,
      pledges: 0,
      slug: "wireless-mouse-pro",
    },
    {
      id: 3,
      name: "Mechanical Keyboard",
      image: "https://placehold.co/400x400.png?text=Keyboard",
      description: "RGB backlit mechanical keyboard",
      goal: 120,
      link: "https://example.com/keyboard",
      timeframe: "60 days",
      category: "Electronics",
      votes: 89,
      featured: true,
      pledges: 0,
      slug: "mechanical-keyboard",
    },
    {
      id: 4,
      name: "Gaming Monitor",
      image: "https://placehold.co/400x400.png?text=Monitor",
      description: "4K 144Hz gaming monitor",
      goal: 200,
      link: "https://example.com/monitor",
      timeframe: "90 days",
      category: "Electronics",
      votes: 156,
      featured: false,
      pledges: 0,
      slug: "gaming-monitor",
    },
    {
      id: 5,
      name: "Webcam HD",
      image: "https://placehold.co/400x400.png?text=Webcam",
      description: "1080p HD webcam for streaming",
      goal: 60,
      link: "https://example.com/webcam",
      timeframe: "30 days",
      category: "Electronics",
      votes: 31,
      featured: false,
      pledges: 0,
      slug: "webcam-hd",
    },
    {
      id: 6,
      name: "Smart Speaker",
      image: "https://placehold.co/400x400.png?text=Speaker",
      description: "Voice-controlled smart speaker",
      goal: 85,
      link: "https://example.com/speaker",
      timeframe: "45 days",
      category: "Smart Home",
      votes: 67,
      featured: true,
      pledges: 0,
      slug: "smart-speaker",
    },
    {
      id: 7,
      name: "Fitness Tracker",
      image: "https://placehold.co/400x400.png?text=Tracker",
      description: "Advanced fitness and health tracker",
      goal: 95,
      link: "https://example.com/tracker",
      timeframe: "60 days",
      category: "Electronics",
      votes: 123,
      featured: false,
      pledges: 0,
      slug: "fitness-tracker",
    },
    {
      id: 8,
      name: "Bluetooth Earbuds",
      image: "https://placehold.co/400x400.png?text=Earbuds",
      description: "Wireless noise-canceling earbuds",
      goal: 110,
      link: "https://example.com/earbuds",
      timeframe: "30 days",
      category: "Electronics",
      votes: 201,
      featured: true,
      pledges: 0,
      slug: "bluetooth-earbuds",
    }
  ]);

  const [isDragOver, setIsDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    image: "",
    description: "",
    goal: 50,
    link: "",
    timeframe: "30 days",
    category: "Electronics",
    pricingTiers: [],
    slug: "",
  });
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        if (Array.isArray(data.products)) {
          setProducts(
            data.products.map((p: any) => ({
              ...p,
              pledges: typeof p.pledges === "number" ? p.pledges : 0,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchProducts();
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        
        setEditingProduct(null);
        setFormData({
          name: "",
          image: imageUrl,
          description: "",
          goal: 50,
          link: "",
          timeframe: "30 days",
          category: "Electronics",
          pricingTiers: [],
          slug: "",
        });
        setIsModalOpen(true);
      };
      reader.readAsDataURL(imageFile);
    }
  };

  const filteredProducts = products.filter((p) =>
    (selectedCategory === "All" || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateFormData = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleFeatured = (productId: number) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, featured: !p.featured }
          : p
      )
    );
  };

  const deleteProduct = async (productId: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Delete failed");

      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "", 
      image: "",
      description: "",
      goal: 50,
      link: "",
      timeframe: "30 days",
      category: "Electronics",
      pricingTiers: [],
      slug: "",
    });
    setSlugError(null);
    setCopiedSlug(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      image: product.image,
      description: product.description,
      goal: product.goal,
      link: product.link,
      timeframe: product.timeframe,
      category: product.category,
      pricingTiers: product.pricingTiers || [],
      slug: product.slug || slugify(product.name),
    });
    setSlugError(null);
    setCopiedSlug(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      image: "",
      description: "",
      goal: 50,
      link: "",
      timeframe: "30 days",
      category: "Electronics",
      pricingTiers: [],
      slug: "",
    });
  };

  const regenerateSlug = () => {
    setFormData(prev => ({
      ...prev,
      slug: slugify(prev.name)
    }));
    setSlugError(null);
  };

  const copySlug = () => {
    if (formData.slug) {
      navigator.clipboard.writeText(formData.slug);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 1200);
    }
  };

  const isSlugUnique = (slug: string, ignoreId?: number) => {
    return !products.some(
      p => (p.slug ? p.slug : slugify(p.name)) === slug && p.id !== ignoreId
    );
  };

  const handleSave = async () => {
    const slug = formData.slug?.trim() || slugify(formData.name);
    if (!isSlugUnique(slug, editingProduct?.id)) {
      setSlugError("Slug must be unique. Please edit or regenerate.");
      return;
    }
    setSlugError(null);

    const newProduct = {
      ...formData,
      id: editingProduct ? editingProduct.id : Date.now(),
      votes: editingProduct?.votes ?? 0,
      featured: editingProduct?.featured ?? false,
      pledges: editingProduct?.pledges ?? 0,
      pricingTiers: formData.pricingTiers ?? [],
      slug,
    };

    setProducts(prev =>
      editingProduct
        ? prev.map(p => (p.id === editingProduct.id ? newProduct : p))
        : [...prev, newProduct]
    );

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (!res.ok) throw new Error("Failed to save product");
    } catch (err) {
      console.error("Save failed:", err);
    }
    closeModal();
  };

  const handlePricingTierChange = (index: number, field: keyof PricingTier, value: number) => {
    setFormData(prev => {
      const tiers = prev.pricingTiers ? [...prev.pricingTiers] : [];
      tiers[index] = { ...tiers[index], [field]: value };
      return { ...prev, pricingTiers: tiers };
    });
  };

  const addPricingTier = () => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: [...(prev.pricingTiers || []), { min: 1, max: 10, price: 0 }]
    }));
  };

  const removePricingTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: (prev.pricingTiers || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div 
          className="fixed inset-0 z-40 bg-yellow-400/20 backdrop-blur-sm flex items-center justify-center"
          style={{
            background: 'rgba(250, 204, 21, 0.2)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="bg-zinc-800/90 border-2 border-dashed border-yellow-400 rounded-xl p-12 text-center"
            style={{
              borderColor: '#fbbf24',
              backgroundColor: 'rgba(39, 39, 42, 0.9)'
            }}
          >
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2">Drop Your Image Here</h3>
            <p className="text-gray-300 text-lg">Release to create a new product with this image</p>
          </div>
        </div>
      )}

      {/* Single Header Section */}
      <div className="w-full bg-zinc-900/50 border-b border-yellow-400/20 py-6 mb-8">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-yellow-400 text-center drop-shadow-lg">
            📦 Edit Product Pool
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex gap-3 items-center justify-center flex-wrap">
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800 text-white border border-zinc-600 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400/50 w-48"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-800 text-white border border-zinc-600 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400/50 w-40"
            >
              {DEPARTMENTS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button 
              onClick={openAddModal} 
              className="bg-yellow-400 text-black hover:bg-yellow-300 hover:shadow-lg font-semibold px-4 py-2 rounded-md transition-all duration-200"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Drag and Drop Hint */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">
            💡 <span className="text-yellow-400">Pro tip:</span> Drag and drop an image anywhere on this page to quickly start creating a product!
          </p>
        </div>

        {/* Product Grid - Fixed consistent sizing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-800/50 backdrop-blur-sm border border-yellow-400/20 rounded-2xl shadow-lg hover:shadow-xl hover:border-yellow-400/40 transition-all duration-300 hover:scale-105 cursor-pointer relative group flex flex-col p-5"
              onClick={() => openEditModal(product)}
              style={{
                background: 'linear-gradient(135deg, #23272f 0%, #18181b 100%)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25), 0 1.5px 6px 0 rgba(250,204,21,0.07)',
                height: '480px' // Fixed height for all cards
              }}
            >
              {/* Votes badge */}
              {product.votes !== undefined && (
                <div className="absolute top-4 left-4 bg-yellow-400/90 text-black text-sm font-bold rounded-full px-3 py-1 shadow-md z-10">
                  {product.votes}
                </div>
              )}
              
              {/* Featured star */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatured(product.id);
                }}
                title="Toggle Staff Pick"
                className="absolute top-4 right-4 bg-black/60 hover:bg-yellow-400/90 text-white hover:text-black text-sm rounded px-3 py-1 z-10 transition-colors"
              >
                {product.featured ? '⭐' : '✩'}
              </button>

              {/* Product Image */}
              <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-zinc-700">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-zinc-400 text-sm">No Image</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-white text-lg font-semibold mb-1 truncate">
                  {product.name}
                </h3>
                
                <div className="text-xs text-yellow-300 mb-2">
                  <span className="bg-zinc-900/70 px-2 py-0.5 rounded">
                    /{product.slug || slugify(product.name)}
                  </span>
                </div>

                <div className="text-yellow-400 text-sm mb-1">
                  Goal: {product.goal}
                </div>

                <div className="text-zinc-400 text-sm mb-2">
                  {product.timeframe}
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                  {product.description}
                </p>

                {/* Stacked buttons */}
                <div className="space-y-2 w-full opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(product);
                    }}
                    className="w-full bg-yellow-400/80 hover:bg-yellow-400 text-black border border-yellow-400/50 text-sm py-2 rounded font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <Link
                    href={`/products/${product.slug || slugify(product.name)}`}
                    target="_blank"
                    className="block w-full bg-zinc-900 border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black text-sm py-2 rounded font-medium text-center transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal - keeping the same */}
        {isModalOpen && (
          <div 
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div 
              className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-yellow-400/40 rounded-2xl shadow-2xl"
              style={{
                backgroundColor: '#1f2937',
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                border: '2px solid rgba(250, 204, 21, 0.4)',
                borderRadius: '16px',
                padding: '40px',
                width: '95%',
                maxWidth: '600px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(250, 204, 21, 0.1)',
                position: 'relative'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '-1px',
                  right: '-1px',
                  bottom: '-1px',
                  background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.3), rgba(250, 204, 21, 0.1), rgba(250, 204, 21, 0.3))',
                  borderRadius: '16px',
                  zIndex: -1
                }}
              />
              <div className="flex items-center justify-between mb-8">
                <h3 
                  className="text-3xl font-bold text-yellow-400"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors text-3xl"
                  style={{ fontSize: '28px', lineHeight: '1' }}
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-200 text-base font-semibold mb-3">Product Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="bg-zinc-900/50 text-white border border-yellow-400/30 rounded-lg px-4 py-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                    style={{
                      backgroundColor: 'rgba(24, 24, 27, 0.5)',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      borderRadius: '8px',
                      height: '48px'
                    }}
                  />
                </div>
                
                {/* Slug field with copy and regenerate */}
                <div>
                  <label className="block text-gray-200 text-base font-semibold mb-3 flex items-center gap-2">
                    Slug
                    <button
                      type="button"
                      onClick={copySlug}
                      className="ml-2 px-2 py-1 text-xs bg-zinc-700 text-yellow-300 rounded hover:bg-yellow-400 hover:text-black transition"
                      title="Copy slug"
                    >
                      {copiedSlug ? "Copied!" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={regenerateSlug}
                      className="ml-2 px-2 py-1 text-xs bg-zinc-700 text-yellow-300 rounded hover:bg-yellow-400 hover:text-black transition"
                      title="Regenerate slug from name"
                    >
                      Regenerate
                    </button>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.slug ?? ""}
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="bg-zinc-900/50 text-yellow-300 border border-yellow-400/30 rounded-lg px-4 py-3 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                      style={{
                        backgroundColor: 'rgba(24, 24, 27, 0.5)',
                        border: '1px solid rgba(250, 204, 21, 0.3)',
                        borderRadius: '8px',
                        height: '40px'
                      }}
                    />
                    <a
                      href={`/products/${formData.slug ?? slugify(formData.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 px-2 py-1 text-xs bg-yellow-400 text-black rounded hover:bg-yellow-300 transition"
                      title="Preview live product page"
                    >
                      Preview
                    </a>
                  </div>
                  {slugError && (
                    <div className="text-red-400 text-xs mt-1">{slugError}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-200 text-base font-semibold mb-3">Image URL</label>
                  <Input
                    value={formData.image}
                    onChange={(e) => updateFormData("image", e.target.value)}
                    className="bg-zinc-900/50 text-white border border-yellow-400/30 rounded-lg px-4 py-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                    style={{
                      backgroundColor: 'rgba(24, 24, 27, 0.5)',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      borderRadius: '8px',
                      height: '48px'
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-200 text-base font-semibold mb-3">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    className="w-full h-28 px-4 py-4 bg-zinc-900/50 text-white border border-yellow-400/30 rounded-lg resize-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                    style={{
                      backgroundColor: 'rgba(24, 24, 27, 0.5)',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 text-base font-semibold mb-3">Goal</label>
                    <Input
                      type="number"
                      value={formData.goal}
                      onChange={(e) => updateFormData("goal", parseInt(e.target.value) || 0)}
                      className="bg-zinc-900/50 text-white border border-yellow-400/30 rounded-lg px-4 py-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                      style={{
                        backgroundColor: 'rgba(24, 24, 27, 0.5)',
                        border: '1px solid rgba(250, 204, 21, 0.3)',
                        borderRadius: '8px',
                        height: '48px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 text-base font-semibold mb-3">Timeframe</label>
                    <select
                      value={formData.timeframe}
                      onChange={(e) => updateFormData("timeframe", e.target.value)}
                      className="w-full px-4 py-4 bg-zinc-900/50 text-white border border-yellow-400/30 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                      style={{
                        backgroundColor: 'rgba(24, 24, 27, 0.5)',
                        border: '1px solid rgba(250, 204, 21, 0.3)',
                        borderRadius: '8px',
                        height: '48px'
                      }}
                    >
                      <option value="7 days">7 days</option>
                      <option value="14 days">14 days</option>
                      <option value="21 days">21 days</option>
                      <option value="30 days">30 days</option>
                      <option value="45 days">45 days</option>
                      <option value="60 days">60 days</option>
                      <option value="90 days">90 days</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-200 text-base font-semibold mb-3">Product Link</label>
                  <Input
                    value={formData.link}
                    onChange={(e) => updateFormData("link", e.target.value)}
                    className="bg-zinc-900/50 text-white border border-yellow-400/30 rounded-lg px-4 py-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                    style={{
                      backgroundColor: 'rgba(24, 24, 27, 0.5)',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      borderRadius: '8px',
                      height: '48px'
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-200 text-base font-semibold mb-3">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData("category", e.target.value)}
                    className="w-full px-4 py-4 bg-zinc-900/50 text-white border border-yellow-400/30 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-base"
                    style={{
                      backgroundColor: 'rgba(24, 24, 27, 0.5)',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      borderRadius: '8px',
                      height: '48px'
                    }}
                  >
                    {DEPARTMENTS.filter(d => d !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Pricing Tiers Editor */}
                <div>
                  <label className="block text-gray-200 text-base font-semibold mb-3">Pricing Tiers</label>
                  {(formData.pricingTiers || []).map((tier, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2">
                      <Input
                        type="number"
                        value={tier.min}
                        onChange={e => handlePricingTierChange(idx, "min", parseInt(e.target.value) || 0)}
                        placeholder="Min"
                        className="w-20"
                      />
                      <span className="text-gray-400">to</span>
                      <Input
                        type="number"
                        value={tier.max}
                        onChange={e => handlePricingTierChange(idx, "max", parseInt(e.target.value) || 0)}
                        placeholder="Max"
                        className="w-20"
                      />
                      <span className="text-gray-400">= $</span>
                      <Input
                        type="number"
                        value={tier.price}
                        onChange={e => handlePricingTierChange(idx, "price", parseFloat(e.target.value) || 0)}
                        placeholder="Price"
                        className="w-24"
                      />
                      <button
                        type="button"
                        onClick={() => removePricingTier(idx)}
                        className="text-red-400 hover:text-red-600 ml-2"
                        title="Remove tier"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPricingTier}
                    className="mt-2 px-3 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-300 font-semibold"
                  >
                    + Add Tier
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 mt-10">
                <button
                  onClick={closeModal}
                  className="flex-1 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 px-6 py-4 rounded-lg transition-all font-medium text-base"
                  style={{
                    background: 'rgba(75, 85, 99, 0.3)',
                    border: '1px solid rgba(156, 163, 175, 0.5)',
                    height: '52px'
                  }}
                >
                  Cancel
                </button>
                {editingProduct && (
                  <button
                    onClick={() => {
                      deleteProduct(editingProduct.id);
                      closeModal();
                    }}
                    className="flex-1 bg-red-600/80 hover:bg-red-600 text-white px-6 py-4 rounded-lg transition-all font-medium text-base"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                      height: '52px'
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-4 rounded-lg transition-all font-bold text-base"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                    color: '#000',
                    height: '52px'
                  }}
                >
                  {editingProduct ? '💾 Update' : '➕ Add'} Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}