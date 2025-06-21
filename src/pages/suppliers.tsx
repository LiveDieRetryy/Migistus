import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Shield, 
  Globe, 
  Star,
  Package,
  DollarSign,
  BarChart3,
  Award,
  Heart,
  PlayCircle
} from 'lucide-react';

export default function SuppliersLandingPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    category: '',
    description: '',
    experience: '',
    motivation: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/suppliers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setShowSuccessMessage(true);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        category: '',
        description: '',
        experience: '',
        motivation: ''
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8 text-yellow-400" />,
      title: "Reach New Markets",
      description: "Connect with thousands of potential customers through our community-driven platform"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Community Validation",
      description: "Get real feedback from our engaged community before mass production"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-400" />,
      title: "Verified Platform", 
      description: "Join a trusted marketplace with verified suppliers and quality assurance"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-purple-400" />,
      title: "Flexible Pricing",
      description: "Competitive commission rates and transparent fee structure"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-400" />,
      title: "Analytics & Insights",
      description: "Comprehensive analytics to track performance and optimize your offerings"
    },
    {
      icon: <Award className="w-8 h-8 text-red-400" />,
      title: "Marketing Support",
      description: "Featured placement opportunities and marketing support for top performers"
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "$2M+", label: "Total Pledges" },
    { number: "500+", label: "Products Launched" },
    { number: "95%", label: "Supplier Satisfaction" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      company: "TechGear Innovations",
      quote: "MIGISTUS helped us validate our product idea and connect with early adopters. We secured 300 pre-orders in our first month!",
      avatar: "/Icons/SupplierPlaceHolder.png"
    },
    {
      name: "Marcus Rodriguez",
      company: "EcoHome Solutions",
      quote: "The community feedback was invaluable. We refined our product based on user suggestions and it's now our best seller.",
      avatar: "/Icons/SupplierPlaceHolder.png"
    },
    {
      name: "Lisa Thompson",
      company: "FitLife Products",
      quote: "Transparent analytics and real-time tracking helped us optimize our campaigns. Revenue increased by 200% in 6 months.",
      avatar: "/Icons/SupplierPlaceHolder.png"
    }
  ];

  if (showSuccessMessage) {
    return (
      <>
        <Head>
          <title>Application Submitted - MIGISTUS Suppliers</title>
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Application Submitted!</h2>
            <p className="text-zinc-400 mb-6">
              Thank you for your interest in becoming a MIGISTUS supplier. We'll review your application and get back to you within 2-3 business days.
            </p>
            <div className="space-y-3">
              <Link 
                href="/suppliers" 
                className="block w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-medium py-2 px-4 rounded-lg transition-all"
              >
                Back to Suppliers
              </Link>
              <Link 
                href="/supplier-login" 
                className="block w-full border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 font-medium py-2 px-4 rounded-lg transition-all"
              >
                Existing Supplier? Login
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Become a Supplier - MIGISTUS</title>
        <meta name="description" content="Join MIGISTUS as a supplier and reach thousands of potential customers through our community-driven platform" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Header */}        <div className="bg-zinc-900/50 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-24">              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-4">
                  <img src="/images/migistus_logo.png" alt="MIGISTUS" className="h-24 w-auto" />
                  <span className="text-4xl font-bold text-yellow-400">MIGISTUS</span>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <Link 
                  href="/suppliers-tracking" 
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Supplier Analytics
                </Link>
                <Link 
                  href="/supplier-login" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Supplier Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-white mb-6">
                Partner with 
                <span className="text-yellow-400"> MIGISTUS</span>
              </h1>
              <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
                Join our revolutionary community-driven marketplace where innovation meets opportunity. 
                Connect with engaged customers, validate your products, and grow your business with transparent analytics.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">{stat.number}</div>
                    <div className="text-sm text-zinc-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#apply" 
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-medium px-8 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  Apply Now <ArrowRight className="w-5 h-5" />
                </a>
                <button className="border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 font-medium px-8 py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl p-8 border border-yellow-500/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <Package className="w-8 h-8 text-blue-400 mb-2" />
                    <div className="text-2xl font-bold text-white">1,200+</div>
                    <div className="text-sm text-zinc-400">Products</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <Heart className="w-8 h-8 text-red-400 mb-2" />
                    <div className="text-2xl font-bold text-white">45K</div>
                    <div className="text-sm text-zinc-400">Followers</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <Star className="w-8 h-8 text-yellow-400 mb-2" />
                    <div className="text-2xl font-bold text-white">4.8</div>
                    <div className="text-sm text-zinc-400">Avg Rating</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                    <div className="text-2xl font-bold text-white">+127%</div>
                    <div className="text-sm text-zinc-400">Growth</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-zinc-900/30 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Why Choose MIGISTUS?</h2>
              <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
                Discover the advantages of partnering with the most innovative community-driven marketplace
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500/40 transition-all">
                  <div className="mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                  <p className="text-zinc-400">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Success Stories</h2>
              <p className="text-xl text-zinc-400">Hear from our thriving supplier community</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                  <p className="text-zinc-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-zinc-400">{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div id="apply" className="bg-zinc-900/30 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-zinc-400">Fill out the application form below and we'll be in touch within 2-3 business days</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                    placeholder="Your company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Contact Name *</label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Product Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    <option value="electronics">Electronics</option>
                    <option value="home">Home & Garden</option>
                    <option value="sports">Sports & Outdoors</option>
                    <option value="automotive">Automotive</option>
                    <option value="beauty">Beauty & Personal Care</option>
                    <option value="toys">Toys & Games</option>
                    <option value="industrial">Industrial & Scientific</option>
                    <option value="handmade">Handmade</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Company Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                  placeholder="Tell us about your company, products, and what makes you unique..."
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Experience & Background</label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                  placeholder="Your experience in the industry, previous platforms, etc..."
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Why MIGISTUS? *</label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                  placeholder="Why do you want to partner with MIGISTUS specifically?"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Application <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-900/50 border-t border-yellow-500/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">              <div>
                <div className="flex items-center gap-4 mb-4">
                  <img src="/images/migistus_logo.png" alt="MIGISTUS" className="h-20 w-auto" />
                  <span className="text-4xl font-bold text-yellow-400">MIGISTUS</span>
                </div>
                <p className="text-zinc-400">
                  The future of community-driven commerce. Where innovation meets opportunity.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/about" className="block text-zinc-400 hover:text-white transition-colors">About Us</Link>
                  <Link href="/contact" className="block text-zinc-400 hover:text-white transition-colors">Contact</Link>
                  <Link href="/terms" className="block text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="block text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-4">Support</h3>
                <div className="space-y-2">
                  <div className="text-zinc-400">Email: suppliers@migistus.com</div>
                  <div className="text-zinc-400">Phone: 1-800-MIGISTUS</div>
                  <div className="text-zinc-400">Response time: 24 hours</div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-zinc-700 mt-8 pt-8 text-center text-zinc-400">
              <p>&copy; 2025 MIGISTUS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
