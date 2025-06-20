import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function RegisterPage() {  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
    state: "",
    city: "",
    phoneNumber: "",
    referralSource: "",
    agreeToTerms: false,
    agreeToMarketing: false
  });  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const referralOptions = [
    "Search Engine (Google, Bing, etc.)",
    "Social Media (Facebook, Twitter, Instagram)",
    "Friend or Family Recommendation", 
    "Online Advertisement",
    "Blog or News Article",
    "YouTube or Video Platform",
    "Podcast",
    "Other"
  ];

  const countryStateMap: { [key: string]: string[] } = {
    "US": [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
      "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
      "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
      "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
      "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
      "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
      "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ],
    "CA": [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", 
      "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", 
      "Quebec", "Saskatchewan", "Yukon"
    ],
    "UK": [
      "England", "Scotland", "Wales", "Northern Ireland"
    ],
    "AU": [
      "Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", 
      "South Australia", "Tasmania", "Victoria", "Western Australia"
    ],
    "DE": [
      "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", 
      "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", 
      "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"
    ],    "FR": [
      "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", 
      "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", 
      "Pays de la Loire", "Provence-Alpes-Côte d'Azur"
    ],
    "BR": [
      "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", 
      "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", 
      "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", 
      "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
    ],
    "MX": [
      "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", 
      "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México", 
      "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", 
      "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", 
      "Yucatán", "Zacatecas"
    ],
    "IN": [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
      "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
      "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", 
      "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ]
  };  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
      
      // Reset state when country changes
      if (name === 'country') {
        setForm(prev => ({ ...prev, [name]: value, state: '' }));
      }
    }
  };
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!form.username || !form.email || !form.password) return false;
        // Username validation
        if (form.username.length < 3) {
          setError("Username must be at least 3 characters long");
          return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
          setError("Username can only contain letters, numbers, and underscores");
          return false;
        }
        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          setError("Please enter a valid email address");
          return false;
        }
        // Password validation
        if (form.password.length < 8) {
          setError("Password must be at least 8 characters long");
          return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
          setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
          return false;
        }
        return true;      case 2:
        if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.country) return false;
        // State validation - required if country has states/provinces
        if (form.country && countryStateMap[form.country] && !form.state) {
          setError("Please select your state/province");
          return false;
        }
        // Age validation
        const birthDate = new Date(form.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13) {
          setError("You must be at least 13 years old to register");
          return false;
        }
        if (age > 120) {
          setError("Please enter a valid birth date");
          return false;
        }
        return true;
      case 3:
        return form.agreeToTerms;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setError("");
    } else {
      setError("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError("");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateStep(3)) {
      setError("Please agree to the terms and conditions");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });    if (res.ok) {
      const data = await res.json();
      setSuccess(true);
      
      if (typeof window !== "undefined" && data.user && data.user.id) {
        // Set authentication state
        localStorage.setItem("isSignedIn", "true");
        localStorage.removeItem("isAdmin");
        localStorage.setItem("userId", String(data.user.id));
        
        // Store user data in multiple formats for compatibility
        localStorage.setItem("userData", JSON.stringify(data.user));
        
        // Store in user registry format
        const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
        userRegistry[data.user.email] = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email
        };
        localStorage.setItem('migistus_user_registry', JSON.stringify(userRegistry));
        
        // Store user profile in expected format
        const userProfile = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          country: data.user.country,
          state: data.user.state,
          city: data.user.city,
          dateOfBirth: data.user.dateOfBirth,
          phoneNumber: data.user.phoneNumber,
          avatar: data.user.avatar,
          bio: data.user.bio || "",
          tier: data.user.tier,
          joinDate: data.user.joinDate,
          stats: {
            totalPledges: data.user.totalPledges || 0,
            totalVotes: data.user.totalVotes || 0,
            dropsJoined: data.user.dropsJoined || 0,
            followers: data.user.followers || 0,
            following: data.user.following || 0,
            profileViews: data.user.profileViews || 0
          }
        };
        
        // Store in both old and new profile systems for compatibility
        localStorage.setItem(`user_${data.user.id}_profile`, JSON.stringify(userProfile));
        localStorage.setItem(`userProfile_${data.user.id}`, JSON.stringify(userProfile));
        
        // Store user session
        const userSession = {
          user: data.user,
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        localStorage.setItem('userSession', JSON.stringify(userSession));
        
        console.log('✅ Registration successful! User data stored:', {
          userId: data.user.id,
          username: data.user.username,
          email: data.user.email,
          guildTokens: data.user.guildTokens || data.user.guildCoins
        });
      }
      
      // Show success message with welcome bonus info
      setTimeout(() => {
        window.location.href = "/account";
      }, 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
  };
  return (
    <>
      <Head>
        <title>Register - MIGISTUS</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-yellow-400/20 rounded-xl p-8 w-full max-w-2xl shadow-lg"
        >
          <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Join MIGISTUS</h1>
          
          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step ? 'bg-yellow-400 text-black' : 'bg-zinc-700 text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 ${
                      currentStep > step ? 'bg-yellow-400' : 'bg-zinc-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="text-red-400 mb-4 p-3 bg-red-400/10 border border-red-400/30 rounded">{error}</div>}          {success && (
            <div className="text-green-400 mb-4 p-4 bg-green-400/10 border border-green-400/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">🎉</span>
                <span className="font-semibold">Account created successfully!</span>
              </div>
              <p className="text-sm mb-2">Welcome to MIGISTUS! You've received 100 Guild Tokens as a welcome bonus.</p>
              <p className="text-sm">Redirecting to your account page...</p>
            </div>
          )}

          {/* Step 1: Basic Account Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Account Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Username *</label>
                  <input
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="Your unique username"
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Password *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                />
                <p className="text-sm text-gray-400 mt-1">Use a strong password with letters, numbers, and special characters</p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">First Name *</label>
                  <input
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Your first name"
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Last Name *</label>
                  <input
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Your last name"
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Date of Birth *</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Phone Number</label>
                  <input
                    name="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Country *</label>
                  <select
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  >                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="KR">South Korea</option>
                    <option value="SG">Singapore</option>
                    <option value="NL">Netherlands</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                    <option value="IN">India</option>
                    <option value="CN">China</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>                  <label className="block mb-2 text-sm font-medium">
                    {form.country === 'US' ? 'State *' : 
                     form.country === 'CA' ? 'Province *' : 
                     form.country === 'UK' ? 'Region *' :
                     form.country === 'AU' ? 'Territory *' :
                     form.country === 'DE' ? 'State *' :
                     form.country === 'FR' ? 'Region *' :
                     form.country === 'BR' ? 'State *' :
                     form.country === 'MX' ? 'State *' :
                     form.country === 'IN' ? 'State *' :
                     'State/Province *'}
                  </label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required={!!(form.country && countryStateMap[form.country])}
                    disabled={!form.country || !countryStateMap[form.country]}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!form.country ? "Select country first" : 
                       !countryStateMap[form.country] ? "Not applicable" :                       `Select ${form.country === 'US' ? 'state' : 
                                form.country === 'CA' ? 'province' : 
                                form.country === 'UK' ? 'region' :
                                form.country === 'AU' ? 'territory' :
                                form.country === 'BR' ? 'state' :
                                form.country === 'MX' ? 'state' :
                                form.country === 'IN' ? 'state' :
                                'state/province'}`}
                    </option>
                    {form.country && countryStateMap[form.country] && 
                     countryStateMap[form.country].map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">City</label>
                <input
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Your city"
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">How did you hear about us?</label>
                <select
                  name="referralSource"
                  value={form.referralSource}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">Select an option</option>
                  {referralOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-6 rounded transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Terms and Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Terms & Preferences</h2>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 rounded bg-zinc-800 border border-zinc-700">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={form.agreeToTerms}
                    onChange={handleChange}
                    required
                    className="w-5 h-5 text-yellow-400 bg-zinc-700 border-zinc-600 rounded focus:ring-yellow-400 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium">I agree to the Terms of Service and Privacy Policy *</span>
                    <p className="text-xs text-gray-400 mt-1">
                      By checking this box, you agree to our{" "}
                      <Link href="/terms" className="text-yellow-400 underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-yellow-400 underline">Privacy Policy</Link>
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 rounded bg-zinc-800 border border-zinc-700">
                  <input
                    type="checkbox"
                    name="agreeToMarketing"
                    checked={form.agreeToMarketing}
                    onChange={handleChange}
                    className="w-5 h-5 text-yellow-400 bg-zinc-700 border-zinc-600 rounded focus:ring-yellow-400 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium">I'd like to receive marketing communications</span>
                    <p className="text-xs text-gray-400 mt-1">
                      Get updates about new drops, special offers, and community events. You can unsubscribe at any time.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-zinc-800 border border-yellow-400/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Welcome to MIGISTUS! 🌟</h3>
                <p className="text-sm text-gray-300">
                  You're about to join a community of savvy shoppers who get exclusive access to group buying deals, 
                  voting on new products, and special member benefits. Start exploring amazing deals and connect with 
                  fellow members!
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-6 rounded transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-8 rounded transition"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="underline text-yellow-400">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
