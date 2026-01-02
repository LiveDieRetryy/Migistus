import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Info, MapPin, Upload, X } from "lucide-react";
import { authAPI } from "@/lib/authAPI";
import { useAuth } from "@/context/AuthContext";
import { calculatePasswordStrength, validatePasswordMatch } from "@/utils/passwordStrength";
import { useUsernameAvailability } from "@/hooks/useUsernameAvailability";
import { useEmailAvailability } from "@/hooks/useEmailAvailability";
import { useCityZipAutocomplete, getCityStateFromZip } from "@/hooks/useCityZipAutocomplete";

export default function RegisterPage() {  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
    state: "",
    city: "",
    zipCode: "",
    phoneNumber: "",
    referralSource: "",
    preferredLanguage: "en",
    timezone: "",
    gender: "",
    accountPurpose: "",
    emailFrequency: "weekly",
    notificationPreferences: [] as string[],
    agreeToTerms: false,
    agreeToMarketing: false
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuth();
  
  // Password strength checking
  const passwordStrength = calculatePasswordStrength(form.password);
  const passwordMatchError = validatePasswordMatch(form.password, form.password); // We'll add confirmPassword field
  
  // Username availability checking
  const { available: usernameAvailable, checking: checkingUsername, message: usernameMessage } = 
    useUsernameAvailability(form.username);

  // Email availability checking
  const { available: emailAvailable, checking: checkingEmail, message: emailMessage } = 
    useEmailAvailability(form.email);

  // City autocomplete
  const { suggestions: citySuggestions, loading: citySuggestionsLoading } = 
    useCityZipAutocomplete(form.city, form.country, 'city');

  // Handle zip code auto-fill
  useEffect(() => {
    if (form.zipCode && form.zipCode.length === 5 && form.country === 'US') {
      getCityStateFromZip(form.zipCode, form.country).then(result => {
        if (result) {
          setForm(prev => ({
            ...prev,
            city: result.city,
            state: result.state
          }));
        }
      });
    }
  }, [form.zipCode, form.country]);

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
      
      // Handle notification preferences as array
      if (name === 'notificationPreferences') {
        const notifValue = (e.target as HTMLInputElement).value;
        const current = form.notificationPreferences;
        const updated = checked 
          ? [...current, notifValue]
          : current.filter(v => v !== notifValue);
        setForm({ ...form, notificationPreferences: updated });
      } else {
        setForm({ ...form, [name]: checked });
      }
    } else {
      setForm({ ...form, [name]: value });
      
      // Reset state when country changes
      if (name === 'country') {
        setForm(prev => ({ ...prev, [name]: value, state: '' }));
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Avatar image must be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!form.agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    // Final validation checks
    if (usernameAvailable === false) {
      setError("Username is already taken");
      return;
    }

    if (emailAvailable === false) {
      setError("Email is already registered");
      return;
    }

    if (passwordStrength.score < 2) {
      setError("Please choose a stronger password");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Register user via authAPI
      const response = await authAPI.register({
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        country: form.country,
        state: form.state,
        city: form.city,
        zipCode: form.zipCode,
        phoneNumber: form.phoneNumber,
        referralSource: form.referralSource,
        agreeToTerms: form.agreeToTerms,
        agreeToMarketing: form.agreeToMarketing,
        preferredLanguage: form.preferredLanguage,
        timezone: form.timezone,
        gender: form.gender,
        accountPurpose: form.accountPurpose,
        avatarFile: avatarFile || undefined,
      });

      setSuccess(true);

      // Store session data
      if (typeof window !== 'undefined') {
        localStorage.setItem("isSignedIn", "true");
        localStorage.setItem("userId", String(response.user.id));
        localStorage.removeItem("isAdmin");
        localStorage.setItem("userSession", JSON.stringify({
          user: {
            id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            sessionId: response.session?.sessionId || '',
            tier: response.user.tier
          },
          sessionId: response.session?.sessionId || '',
        }));
      }

      // Update auth context
      setUser({
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        sessionId: response.session?.sessionId || '',
        tier: response.user.tier
      });
      setIsAuthenticated(true);

      // Check if email verification is required
      if ((response as any).requiresVerification) {
        // Redirect to verification page
        router.push(`/verify-email-reminder?email=${encodeURIComponent(response.user.email)}&username=${encodeURIComponent(response.user.username)}`);
      } else {
        // Show success message briefly, then redirect to account
        setTimeout(() => {
          router.push('/account');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Head>
        <title>Register - MIGISTUS</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-yellow-400/20 rounded-xl p-8 w-full max-w-4xl shadow-lg"
        >
          <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center">Join MIGISTUS</h1>
          <p className="text-gray-400 text-center mb-8">Create your account and start your journey</p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-400">Registration Error</h4>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500 rounded-lg p-4">
              <div className="flex items-start mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-400">Account Created Successfully!</h4>
                  <p className="text-sm text-green-300 mt-1">Welcome to MIGISTUS! Redirecting you to your dashboard...</p>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/50 rounded p-3 flex items-start mt-3">
                <Info className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300">
                  We've sent a verification email to your inbox. Please verify your email address to unlock all features.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Account Information Section */}
            <div className="border-b border-zinc-700 pb-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Account Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Username *</label>
                  <div className="relative">
                    <input
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                      required
                      placeholder="Your unique username"
                      className="w-full px-3 py-2 pr-10 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                    />
                    {form.username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingUsername ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : usernameAvailable === true ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : usernameAvailable === false ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {form.username.length >= 3 && usernameMessage && (
                    <div className="mt-1">
                      <p className={`text-xs flex items-center ${
                        usernameAvailable === true ? 'text-green-400' :
                        usernameAvailable === false ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {usernameMessage}
                      </p>
                      {usernameAvailable === false && usernameAvailable !== null && !usernameMessage.includes('inappropriate') && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Try these instead:</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              `${form.username}${Math.floor(Math.random() * 999)}`,
                              `${form.username}_${new Date().getFullYear()}`,
                              `${form.username}_official`,
                              `the_${form.username}`
                            ].map((suggestion, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, username: suggestion }))}
                                className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-yellow-400 hover:text-yellow-300 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {form.username.length > 0 && form.username.length < 3 && (
                    <p className="text-xs text-gray-400 mt-1">Username must be at least 3 characters</p>
                  )}
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Email *</label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2 pr-10 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                    />
                    {form.email.includes('@') && form.email.includes('.') && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingEmail ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : emailAvailable === true ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : emailAvailable === false ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {form.email.includes('@') && emailMessage && (
                    <div className="mt-1">
                      <p className={`text-xs flex items-center ${
                        emailAvailable === true ? 'text-green-400' :
                        emailAvailable === false ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {emailMessage}
                      </p>
                      {emailAvailable === false && (
                        <div className="mt-2">
                          <Link 
                            href="/login"
                            className="inline-flex items-center text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            Already have an account? Log in here →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Password *</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 pr-10 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400">Password Strength:</span>
                      <span className="text-xs font-bold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength.percentage}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-gray-400 space-y-1">
                        {passwordStrength.feedback.map((tip, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Confirm Password *</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Passwords do not match
                  </p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="text-xs text-green-400 mt-1 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Passwords match
                  </p>
                )}
              </div>

            </div>

            {/* Personal Information Section */}
            <div className="border-b border-zinc-700 pb-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block mb-2 text-sm font-medium">City</label>
                  <div className="relative">
                    <input
                      name="city"
                      type="text"
                      value={form.city}
                      onChange={handleChange}
                      onFocus={() => setShowCitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                      placeholder="Start typing your city"
                      className="w-full px-3 py-2 pr-10 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                    />
                    {form.city && (
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  {/* City Suggestions Dropdown */}
                  {showCitySuggestions && citySuggestions.length > 0 && form.city.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {citySuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setForm(prev => ({
                              ...prev,
                              city: suggestion.city,
                              state: suggestion.state,
                              zipCode: suggestion.zipCode
                            }));
                            setShowCitySuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-zinc-700 transition-colors"
                        >
                          <div className="text-sm text-white">{suggestion.city}</div>
                          <div className="text-xs text-gray-400">{suggestion.state} • {suggestion.zipCode}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">
                    {form.country === 'US' ? 'ZIP Code' : 
                     form.country === 'CA' ? 'Postal Code' :
                     form.country === 'UK' ? 'Postcode' :
                     'Postal Code'}
                  </label>
                  <input
                    name="zipCode"
                    type="text"
                    value={form.zipCode}
                    onChange={handleChange}
                    placeholder={form.country === 'US' ? '12345' : form.country === 'CA' ? 'A1A 1A1' : 'Enter code'}
                    maxLength={form.country === 'US' ? 5 : form.country === 'CA' ? 7 : 10}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  />
                  {form.zipCode && form.zipCode.length === 5 && form.country === 'US' && (
                    <p className="text-xs text-green-400 mt-1 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Auto-filled city and state
                    </p>
                  )}
                </div>
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

              {/* Avatar Upload */}
              <div>
                <label className="block mb-2 text-sm font-medium">Profile Picture (Optional)</label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <div className="relative">
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
                      />
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar"
                      className="inline-block cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg border border-zinc-700 transition-colors"
                    >
                      {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Gender/Pronouns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Gender (Optional)</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Account Purpose</label>
                  <select
                    name="accountPurpose"
                    value={form.accountPurpose}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="">Select purpose</option>
                    <option value="personal">Personal Shopping</option>
                    <option value="business">Business/Reseller</option>
                    <option value="browsing">Just Browsing</option>
                  </select>
                </div>
              </div>

              {/* Language and Timezone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Preferred Language</label>
                  <select
                    name="preferredLanguage"
                    value={form.preferredLanguage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Timezone</label>
                  <select
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="">Auto-detect</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Central Europe (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Terms & Preferences Section */}
            <div>
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Terms & Preferences</h2>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 rounded bg-zinc-800 border border-zinc-700">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    value="true"
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
                    value="true"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </div>

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
