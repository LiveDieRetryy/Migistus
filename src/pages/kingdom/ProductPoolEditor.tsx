import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

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
};

type ProductFormData = {
  name: string;
  image: string;
  description: string;
  goal: number;
  link: string;
  timeframe: string;
  category: string;
};

export default function ProductPoolEditor() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Gilded Vanguard Headset",
      image: "https://placehold.co/400x400?text=Headset",
      description: "Premium gaming headset with surround sound",
      goal: 100,
      link: "https://example.com/headset",
      timeframe: "30 days",
      category: "Electronics",
      votes: 73,
      featured: true,
    },
    {
      id: 2,
      name: "Wireless Mouse Pro",
      image: "https://placehold.co/400x400?text=Mouse",
      description: "High-precision wireless gaming mouse",
      goal: 75,
      link: "https://example.com/mouse",
      timeframe: "45 days",
      category: "Electronics",
      votes: 42,
      featured: false,
    },
    {
      id: 3,
      name: "Mechanical Keyboard",
      image: "https://placehold.co/400x400?text=Keyboard",
      description: "RGB backlit mechanical keyboard",
      goal: 120,
      link: "https://example.com/keyboard",
      timeframe: "60 days",
      category: "Electronics",
      votes: 89,
      featured: true,
    },
    {
      id: 4,
      name: "Gaming Monitor",
      image: "https://placehold.co/400x400?text=Monitor",
      description: "4K 144Hz gaming monitor",
      goal: 200,
      link: "https://example.com/monitor",
      timeframe: "90 days",
      category: "Electronics",
      votes: 156,
      featured: false,
    },
    {
      id: 5,
      name: "Webcam HD",
      image: "https://placehold.co/400x400?text=Webcam",
      description: "1080p HD webcam for streaming",
      goal: 60,
      link: "https://example.com/webcam",
      timeframe: "30 days",
      category: "Electronics",
      votes: 31,
      featured: false,
    },
    {
      id: 6,
      name: "Smart Speaker",
      image: "https://placehold.co/400x400?text=Speaker",
      description: "Voice-controlled smart speaker",
      goal: 85,
      link: "https://example.com/speaker",
      timeframe: "45 days",
      category: "Smart Home",
      votes: 67,
      featured: true,
    },
    {
      id: 7,
      name: "Fitness Tracker",
      image: "https://placehold.co/400x400?text=Tracker",
      description: "Advanced fitness and health tracker",
      goal: 95,
      link: "https://example.com/tracker",
      timeframe: "60 days",
      category: "Electronics",
      votes: 123,
      featured: false,
    },
    {
      id: 8,
      name: "Bluetooth Earbuds",
      image: "https://placehold.co/400x400?text=Earbuds",
      description: "Wireless noise-canceling earbuds",
      goal: 110,
      link: "https://example.com/earbuds",
      timeframe: "30 days",
      category: "Electronics",
      votes: 201,
      featured: true,
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    image: "",
    description: "",
    goal: 50,
    link: "",
    timeframe: "30 days",
    category: "Electronics"
  });
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    
    // Only fetch if we want to replace the sample data with real API data
    // Comment out this condition to keep the sample products
    // if (products.length === 8) {
    //   fetchProducts();
    // }
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
      // Create a data URL for the dropped image
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        
        // Open modal with the dropped image
        setEditingProduct(null);
        setFormData({
          name: "",
          image: imageUrl,
          description: "",
          goal: 50,
          link: "",
          timeframe: "30 days",
          category: "Electronics"
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

  const deleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
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
      category: "Electronics"
    });
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
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = () => {
    const newProduct = {
      ...formData,
      id: editingProduct ? editingProduct.id : Date.now(),
      votes: editingProduct?.votes ?? 0,
      featured: editingProduct?.featured ?? false
    };

    if (editingProduct) {
      setProducts(prev =>
        prev.map(p => p.id === editingProduct.id ? newProduct : p)
      );
      closeModal();
    } else {
      setProducts(prev => [...prev, newProduct]);
      closeModal();
    }
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

      <div className="max-w-6xl mx-auto px-6 py-6">
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

        <div 
          className="flex justify-center"
          style={{ marginTop: '40px' }}
        >
          <div 
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10"
            style={{ gap: '28px' }}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-zinc-800/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg shadow-lg hover:shadow-xl hover:border-yellow-400/40 transition-all duration-300 hover:scale-105 cursor-pointer relative group"
                onClick={() => openEditModal(product)}
                style={{ padding: '24px', width: '220px' }}
              >
                {product.votes !== undefined && (
                  <div 
                    className="absolute bg-yellow-400/90 text-black text-[14px] font-bold rounded-full shadow-md z-10"
                    style={{ 
                      top: '16px', 
                      left: '16px', 
                      padding: '8px 12px' 
                    }}
                  >
                    {product.votes}
                  </div>
                )}
                <div 
                  className="relative"
                  style={{ marginBottom: '20px' }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFeatured(product.id);
                    }}
                    title="Toggle Staff Pick"
                    className="absolute bg-black/60 hover:bg-yellow-400/90 text-white hover:text-black text-[14px] rounded z-10 transition-colors"
                    style={{ 
                      top: '16px', 
                      right: '16px', 
                      padding: '8px 12px' 
                    }}
                  >
                    {product.featured ? '⭐' : '✩'}
                  </button>
                  {product.image ? (
                    <div className="relative w-full rounded border border-zinc-600 bg-zinc-700" style={{ height: "170px" }}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded"
                     />
                   </div>

                  ) : (
                    <div 
                      className="w-full bg-zinc-700 border border-zinc-600 rounded flex items-center justify-center"
                      style={{ height: '170px' }}
                    >
                      <span className="text-zinc-400 text-[14px]">No Image</span>
                    </div>
                  )}
                </div>
                <div 
                  className="text-white text-center text-[15px] font-medium truncate px-1" 
                  title={product.name}
                  style={{ marginBottom: '10px' }}
                >
                  {product.name}
                </div>
                <div 
                  className="text-yellow-400 text-center text-[14px]"
                  style={{ marginBottom: '8px' }}
                >
                  Goal: {product.goal}
                </div>
                <div 
                  className="text-zinc-400 text-center text-[13px]"
                  style={{ marginBottom: '16px' }}
                >
                  {product.timeframe}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(product);
                  }}
                  className="w-full bg-yellow-400/80 hover:bg-yellow-400 text-black border border-yellow-400/50 text-[13px] px-1 py-0 leading-none opacity-0 group-hover:opacity-100 transition-opacity rounded font-medium"
                  style={{ height: '32px' }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

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