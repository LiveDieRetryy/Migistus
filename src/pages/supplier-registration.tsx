import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SupplierRegistrationPage() {
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    productCategories: "",
    businessDescription: "",
    website: "",
    yearsInBusiness: "",
    expectedVolume: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/supplier-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess(true);
        setForm({
          companyName: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          productCategories: "",
          businessDescription: "",
          website: "",
          yearsInBusiness: "",
          expectedVolume: ""
        });
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Application Submitted - MIGISTUS</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-zinc-900/50 border border-green-500/20 rounded-xl p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">✓</span>
              </div>
              <h1 className="text-2xl font-bold text-green-400 mb-4">Application Submitted!</h1>
              <p className="text-gray-300 mb-6">
                Thank you for your interest in becoming a MIGISTUS supplier. We&apos;ll review your application and get back to you within 3-5 business days.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/suppliers"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-medium rounded-lg transition-all"
                >
                  Back to Supplier Info
                </Link>
                <Link 
                  href="/"
                  className="block w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all"
                >
                  Go to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Supplier Registration - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent mb-2">
              Become a Supplier
            </h1>
            <p className="text-gray-400">Join the MIGISTUS network and reach engaged customers</p>
          </div>

          {/* Registration Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-8 shadow-lg backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Application Form</h2>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  name="companyName"
                  type="text"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Your Company Ltd."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Person *
                </label>
                <input
                  name="contactPerson"
                  type="text"
                  value={form.contactPerson}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="+1-555-0123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Years in Business *
                </label>
                <select
                  name="yearsInBusiness"
                  value={form.yearsInBusiness}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                >
                  <option value="">Select...</option>
                  <option value="less-than-1">Less than 1 year</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="more-than-10">More than 10 years</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Address *
              </label>
              <input
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="123 Business Street, City, State, Country"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Categories *
              </label>
              <input
                name="productCategories"
                type="text"
                value={form.productCategories}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="Electronics, Home & Garden, Sports, etc."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expected Monthly Volume *
              </label>
              <select
                name="expectedVolume"
                value={form.expectedVolume}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              >
                <option value="">Select expected volume...</option>
                <option value="small">Small (1-100 units)</option>
                <option value="medium">Medium (100-1000 units)</option>
                <option value="large">Large (1000+ units)</option>
                <option value="enterprise">Enterprise (10,000+ units)</option>
              </select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Description *
              </label>
              <textarea
                name="businessDescription"
                value={form.businessDescription}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="Tell us about your business, products, and why you'd like to partner with MIGISTUS..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting Application..." : "Submit Application"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <div className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/supplier-login" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
                Login here
              </Link>
            </div>
            <div className="text-gray-400 text-sm">
              Back to{" "}
              <Link href="/suppliers" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
                supplier information
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
