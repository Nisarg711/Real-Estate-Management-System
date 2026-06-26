'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import {
  ArrowLeft, ArrowRight, Home, MapPin, IndianRupee, Sparkles,
  Image as ImageIcon, Check, X, Plus, Building2, Loader2,
  Hash, UserCheck, AlertCircle, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Independent House', 'Plot', 'Commercial'];
const AVAILABLE_FOR_OPTIONS = ['Rent', 'Sell', 'Both'];
const AMENITIES_LIST = [
  'Gym', 'Swimming Pool', 'Private Parking', 'Library', 'Clubhouse',
  'Community Hall', 'Children Play Area', 'CCTV', 'Garden Area', 'Parking',
  'Gas Pipeline', 'Rooftop Access', 'Water Supply', 'Solar Panels',
  'Rainwater Harvesting', 'Power Backup', 'Air Conditioning', 'Garage',
  'Laundary facilites', 'Modular Kitchen',
];

const STEPS = [
  { id: 1, label: 'Property Basics', icon: Home },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Pricing', icon: IndianRupee },
  { id: 4, label: 'Amenities', icon: Sparkles },
  { id: 5, label: 'Photos', icon: ImageIcon },
];

const initialFormState = {
  // Step 1 — basics
  apn: '',
  title: '',
  type: '',
  builtYear: '',
  area: '',
  availableFor: '',
  neighborhoodInfo: '',
  tourUrl: '',
  agentLcNo: '',

  // Step 2 — location
  state: '',
  city: '',
  district: '',
  localAddress: '',
  pincode: '',
  mapUrl: '',
  partOfSociety: false,
  societyRegNo: '',
  societyName: '',

  // Step 3 — pricing
  sellPrice: '',
  monthlyRent: '',
  securityDeposit: '',

  // Step 4 — amenities
  amenities: [],
  sharedAmenities: [],

  // Step 5 — images
  imageUrls: [''],
};

export default function SellPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
const [states, setStates] = useState([]);
const [statesLoading, setStatesLoading] = useState(true);


  // Agent lookup state: 'idle' | 'checking' | 'valid' | 'invalid'
  const [agentCheckStatus, setAgentCheckStatus] = useState('idle');
  const [agentName, setAgentName] = useState('');

  // Society lookup state: 'idle' | 'checking' | 'valid' | 'invalid'
  const [societyCheckStatus, setSocietyCheckStatus] = useState('idle');
  const [societyFoundName, setSocietyFoundName] = useState('');

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

useEffect(() => {
  const fetchStates = async () => {
    try {
      const res = await fetch('/api/fetch/states');
      const data = await res.json();
      setStates(data.message || []);
      console.log(data)
    } catch (err) {
      console.error('Failed to fetch states:', err);
    } finally {
      setStatesLoading(false);
    }
  };
  fetchStates();
}, []);
  // TODO: build /api/agent/verify — should accept { licenceNo } and return
  // { found: true, name: 'Agent Name' } or { found: false }
  const checkAgentExists = async (licenceNo) => {
    if (!licenceNo.trim()) {
      setAgentCheckStatus('idle');
      setAgentName('');
      return;
    }

    setAgentCheckStatus('checking');
    try {
      const res = await fetch(`/api/agent/verify?licenceNo=${encodeURIComponent(licenceNo)}`);
      const data = await res.json();

      if (res.ok && data.found) {
        setAgentCheckStatus('valid');
        setAgentName(data.name || '');
      } else {
        setAgentCheckStatus('invalid');
        setAgentName('');
      }
    } catch (err) {
      // Endpoint doesn't exist yet — treat as "can't verify" rather than blocking the form
      setAgentCheckStatus('idle');
      setAgentName('');
    }
  };

  // TODO: build /api/society/verify — should accept { societyRegNo } and return
  // { found: true, name: 'Society Name' } or { found: false }
  const checkSocietyExists = async (regNo) => {
    if (!regNo.trim()) {
      setSocietyCheckStatus('idle');
      setSocietyFoundName('');
      return;
    }

    setSocietyCheckStatus('checking');
    try {
      const res = await fetch(`/api/society/verify?societyRegNo=${encodeURIComponent(regNo)}`);
      const data = await res.json();

      if (res.ok && data.found) {
        setSocietyCheckStatus('valid');
        setSocietyFoundName(data.name || '');
        // Auto-fill the society name from the lookup, no need to ask the user
        setFormData((prev) => ({ ...prev, societyName: data.name || prev.societyName }));
      } else {
        setSocietyCheckStatus('invalid');
        setSocietyFoundName('');
      }
    } catch (err) {
      setSocietyCheckStatus('idle');
      setSocietyFoundName('');
    }
  };

  // Debounce agent lookup — wait until the user pauses typing for 500ms
  const agentDebounceRef = useRef(null);
  useEffect(() => {
    clearTimeout(agentDebounceRef.current);
    if (!formData.agentLcNo.trim()) {
      setAgentCheckStatus('idle');
      setAgentName('');
      return;
    }
    agentDebounceRef.current = setTimeout(() => {
      checkAgentExists(formData.agentLcNo);
    }, 500);
    return () => clearTimeout(agentDebounceRef.current);
  }, [formData.agentLcNo]);

  // Debounce society reg no lookup
  const societyDebounceRef = useRef(null);
  useEffect(() => {
    clearTimeout(societyDebounceRef.current);
    if (!formData.societyRegNo.trim()) {
      setSocietyCheckStatus('idle');
      setSocietyFoundName('');
      return;
    }
    societyDebounceRef.current = setTimeout(() => {
      checkSocietyExists(formData.societyRegNo);
    }, 500);
    return () => clearTimeout(societyDebounceRef.current);
  }, [formData.societyRegNo]);

  const toggleAmenity = (amenity, listKey = 'amenities') => {
    setFormData((prev) => {
      const list = prev[listKey];
      const next = list.includes(amenity)
        ? list.filter((a) => a !== amenity)
        : [...list, amenity];
      return { ...prev, [listKey]: next };
    });
  };

  const updateImageUrl = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.imageUrls];
      next[index] = value;
      return { ...prev, imageUrls: next };
    });
  };

  const addImageField = () => {
    setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  };

  const removeImageField = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.apn.trim()) newErrors.apn = 'Property APN is required';
      else if (!/^\d+$/.test(formData.apn.trim())) newErrors.apn = 'APN must be numeric';
      if (!formData.title.trim()) newErrors.title = 'Give your property a name';
      if (!formData.type) newErrors.type = 'Select a property type';
      if (!formData.builtYear) newErrors.builtYear = 'Built year is required';
      else if (formData.builtYear < 1900 || formData.builtYear > new Date().getFullYear()) {
        newErrors.builtYear = 'Enter a valid year';
      }
      if (!formData.area) newErrors.area = 'Area is required';
      else if (Number(formData.area) <= 0) newErrors.area = 'Area must be greater than 0';
      if (!formData.availableFor) newErrors.availableFor = 'Select what this listing is for';
      if (!formData.neighborhoodInfo.trim()) newErrors.neighborhoodInfo = 'Neighborhood information is required';
      if (formData.agentLcNo.trim() && agentCheckStatus === 'invalid') {
        newErrors.agentLcNo = 'This agent licence number was not found. Leave it blank or correct it.';
      }
    }

    if (currentStep === 2) {
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.district.trim()) newErrors.district = 'District is required';
      if (!formData.localAddress.trim()) newErrors.localAddress = 'Local address is required';
      if (!formData.pincode) newErrors.pincode = 'Pincode is required';
      else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode';

      if (formData.partOfSociety) {
        // Society registration number is now required
        if (!formData.societyRegNo.trim()) {
          newErrors.societyRegNo = 'Society registration number is required';
        } else if (!/^SOCI\d{3,}$/.test(formData.societyRegNo.trim())) {
          newErrors.societyRegNo = 'Format should be SOCI followed by digits (e.g., SOCI001)';
        } else if (societyCheckStatus === 'invalid') {
          newErrors.societyName = 'This society was not found in our database. Please enter the society name below to add it.';
        }
      }
    }

    if (currentStep === 3) {
      const needsSell = formData.availableFor === 'Sell' || formData.availableFor === 'Both';
      const needsRent = formData.availableFor === 'Rent' || formData.availableFor === 'Both';

      if (needsSell && !formData.sellPrice) newErrors.sellPrice = 'Sell price is required';
      if (needsRent && !formData.monthlyRent) newErrors.monthlyRent = 'Monthly rent is required';
      if (needsRent && !formData.securityDeposit) newErrors.securityDeposit = 'Security deposit is required';
    }

    if (currentStep === 5) {
      const validUrls = formData.imageUrls.filter((url) => url.trim());
      if (validUrls.length === 0) newErrors.imageUrls = 'Add at least one image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length));
    }
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const fullValid = validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4) && validateStep(5);
    if (!fullValid) {
      setStep(1);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      ...formData,
      imageUrls: formData.imageUrls.filter((url) => url.trim()),
    };

    try {
      const res = await fetch('/api/property/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const backendMessage = data?.error || 'Failed to list property';
        const backendDetail = data?.details ? `: ${JSON.stringify(data.details)}` : '';
        throw new Error(`${backendMessage}${backendDetail}`);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
    setSubmitted(false);
    setSubmitError(null);
    setStep(1);
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 bg-dark-bg-primary border rounded-lg text-black placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition ${
      errors[field] ? 'border-red-500' : 'border-dark-border focus:border-accent-primary'
    }`;

  const labelClass = 'block text-sm font-medium text-dark-text-secondary mb-1.5';

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-dark-text mb-3">Listing submitted</h1>
          <p className="text-dark-text-secondary mb-8">
            Your property has been added to Homemakers. It will appear in search results
            once it's reviewed.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-accent-primary hover:bg-accent-dark text-white font-semibold rounded-lg transition"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-dark-bg-tertiary hover:bg-dark-bg-hover text-dark-text font-semibold rounded-lg transition border border-dark-border"
            >
              List Another Property
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-accent-light hover:text-accent-primary font-medium mb-6 transition"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-text mb-2">List Your Property</h1>
          <p className="text-dark-text-secondary">
            Fill in the details below to put your property in front of buyers and tenants.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                      isComplete
                        ? 'bg-accent-primary border-accent-primary text-white'
                        : isActive
                        ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                        : 'border-dark-border text-dark-text-muted'
                    }`}
                  >
                    {isComplete ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`text-xs font-medium text-center hidden sm:block ${
                      isActive ? 'text-accent-primary' : 'text-dark-text-muted'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition ${
                      isComplete ? 'bg-accent-primary' : 'bg-dark-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-dark-bg-secondary rounded-lg border border-dark-border shadow-dark-lg p-8">
          {/* Step 1 — Property Basics */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-dark-text mb-1">Tell us about the property</h2>
              <p className="text-dark-text-secondary text-sm mb-4">Start with the essentials.</p>

              <div>
                <label className={labelClass}>Property APN</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted" />
                  <input
                    type="text"
                    value={formData.apn}
                    onChange={(e) => updateField('apn', e.target.value)}
                    placeholder="e.g. 5000000029"
                    className={inputClass('apn') + ' pl-9'}
                  />
                </div>
                <p className="text-dark-text-muted text-xs mt-1">
                  A unique identifier for this property (Assessor's Parcel Number).
                </p>
                {errors.apn && <p className="text-red-400 text-xs mt-1">{errors.apn}</p>}
              </div>

              <div>
                <label className={labelClass}>Property Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g. Sunset Villa, Greenview Apartment"
                  className={inputClass('title')}
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Property Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className={inputClass('type')}
                  >
                    <option value="">Select type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.type && <p className="text-red-400 text-xs mt-1">{errors.type}</p>}
                </div>

                <div>
                  <label className={labelClass}>Built Year</label>
                  <input
                    type="number"
                    value={formData.builtYear}
                    onChange={(e) => updateField('builtYear', e.target.value)}
                    placeholder="e.g. 2018"
                    className={inputClass('builtYear')}
                  />
                  {errors.builtYear && <p className="text-red-400 text-xs mt-1">{errors.builtYear}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Area (sq.ft)</label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => updateField('area', e.target.value)}
                    placeholder="e.g. 1500"
                    className={inputClass('area')}
                  />
                  {errors.area && <p className="text-red-400 text-xs mt-1">{errors.area}</p>}
                </div>

                <div>
                  <label className={labelClass}>Available For</label>
                  <select
                    value={formData.availableFor}
                    onChange={(e) => updateField('availableFor', e.target.value)}
                    className={inputClass('availableFor')}
                  >
                    <option value="">Select option</option>
                    {AVAILABLE_FOR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.availableFor && <p className="text-red-400 text-xs mt-1">{errors.availableFor}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Neighborhood Info</label>
                <textarea
                  value={formData.neighborhoodInfo}
                  onChange={(e) => updateField('neighborhoodInfo', e.target.value)}
                  placeholder="Describe nearby schools, markets, transit, etc."
                  rows={3}
                  className={inputClass('neighborhoodInfo') + ' resize-none'}
                />
              </div>

              <div>
                <label className={labelClass}>Virtual Tour URL (optional)</label>
                <input
                  type="url"
                  value={formData.tourUrl}
                  onChange={(e) => updateField('tourUrl', e.target.value)}
                  placeholder="https://..."
                  className={inputClass('tourUrl')}
                />
              </div>

              <div className="pt-2 border-t border-dark-border">
                <label className={labelClass}>Agent Licence Number (optional)</label>
                <div className="relative">
                  <UserCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted" />
                  <input
                    type="text"
                    value={formData.agentLcNo}
                    onChange={(e) => updateField('agentLcNo', e.target.value)}
                    placeholder="If listed through an agent, enter their licence number"
                    className={inputClass('agentLcNo') + ' pl-9 pr-9'}
                  />
                  {agentCheckStatus === 'checking' && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-muted animate-spin" />
                  )}
                  {agentCheckStatus === 'valid' && (
                    <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                  )}
                  {agentCheckStatus === 'invalid' && (
                    <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  )}
                </div>

                {agentCheckStatus === 'valid' && agentName && (
                  <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Agent verified: {agentName}
                  </p>
                )}
                {agentCheckStatus === 'invalid' && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} />
                    This agent is not registered on Homemakers. Leave this field blank to list without an agent.
                  </p>
                )}
                {errors.agentLcNo && <p className="text-red-400 text-xs mt-1">{errors.agentLcNo}</p>}
              </div>
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-dark-text mb-1">Where is it located?</h2>
              <p className="text-dark-text-secondary text-sm mb-4">
                Accurate location helps buyers find your property faster.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>State</label>
                 <select
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
              className={inputClass('state')}
              disabled={statesLoading}
            >
            <option value="">{statesLoading ? 'Loading states...' : 'Select state'}</option>
            {states.map((s) => (
              <option key={s.iso2} value={s.name}>{s.name}</option>
  ))}
</select>
                  {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g. Ahmedabad"
                    className={inputClass('city')}
                  />
                  {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    placeholder="e.g. Ahmedabad"
                    className={inputClass('district')}
                  />
                  {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district}</p>}
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => updateField('pincode', e.target.value)}
                    placeholder="e.g. 380015"
                    maxLength={6}
                    className={inputClass('pincode')}
                  />
                  {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Local Address</label>
                <input
                  type="text"
                  value={formData.localAddress}
                  onChange={(e) => updateField('localAddress', e.target.value)}
                  placeholder="Street, locality"
                  className={inputClass('localAddress')}
                />
                {errors.localAddress && <p className="text-red-400 text-xs mt-1">{errors.localAddress}</p>}
              </div>

              <div>
                <label className={labelClass}>Map URL (optional)</label>
                <input
                  type="url"
                  value={formData.mapUrl}
                  onChange={(e) => updateField('mapUrl', e.target.value)}
                  placeholder="Google Maps link"
                  className={inputClass('mapUrl')}
                />
              </div>

              <div className="pt-2 border-t border-dark-border">
                <label className="flex items-center gap-3 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={formData.partOfSociety}
                    onChange={(e) => updateField('partOfSociety', e.target.checked)}
                    className="w-4 h-4 rounded border-dark-border accent-accent-primary"
                  />
                  <span className="text-dark-text flex items-center gap-2">
                    <Building2 size={16} className="text-dark-text-muted" />
                    This property is part of a housing society
                  </span>
                </label>

                {formData.partOfSociety && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelClass}>Society Registration Number</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted" />
                        <input
                          type="text"
                          value={formData.societyRegNo}
                          onChange={(e) => updateField('societyRegNo', e.target.value)}
                          placeholder="e.g. SOCI001"
                          className={inputClass('societyRegNo') + ' pl-9 pr-9'}
                        />
                        {societyCheckStatus === 'checking' && (
                          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-muted animate-spin" />
                        )}
                        {societyCheckStatus === 'valid' && (
                          <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                        )}
                        {societyCheckStatus === 'invalid' && (
                          <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                        )}
                      </div>
                      <p className="text-dark-text-muted text-xs mt-1">
                        Format: SOCI followed by digits (e.g., SOCI001, SOCI002)
                      </p>
                      {errors.societyRegNo && <p className="text-red-400 text-xs mt-1">{errors.societyRegNo}</p>}

                      {societyCheckStatus === 'valid' && societyFoundName && (
                        <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Society found: {societyFoundName}
                        </p>
                      )}
                      {societyCheckStatus === 'invalid' && formData.societyRegNo.trim() && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} />
                          This society registration number was not found. Please enter the society name below.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Society Name</label>
                      <input
                        type="text"
                        value={formData.societyName}
                        onChange={(e) => updateField('societyName', e.target.value)}
                        placeholder="e.g. Green Valley"
                        className={inputClass('societyName')}
                      />
                      {errors.societyName && <p className="text-red-400 text-xs mt-1">{errors.societyName}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Pricing */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-dark-text mb-1">Set your price</h2>
              <p className="text-dark-text-secondary text-sm mb-4">
                Based on "{formData.availableFor || 'your selection'}", we'll show the relevant fields.
              </p>

              {(formData.availableFor === 'Sell' || formData.availableFor === 'Both') && (
                <div>
                  <label className={labelClass}>Sell Price (₹)</label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => updateField('sellPrice', e.target.value)}
                    placeholder="e.g. 7500000"
                    className={inputClass('sellPrice')}
                  />
                  {errors.sellPrice && <p className="text-red-400 text-xs mt-1">{errors.sellPrice}</p>}
                </div>
              )}

              {(formData.availableFor === 'Rent' || formData.availableFor === 'Both') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Monthly Rent (₹)</label>
                    <input
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => updateField('monthlyRent', e.target.value)}
                      placeholder="e.g. 25000"
                      className={inputClass('monthlyRent')}
                    />
                    {errors.monthlyRent && <p className="text-red-400 text-xs mt-1">{errors.monthlyRent}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Security Deposit (₹)</label>
                    <input
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => updateField('securityDeposit', e.target.value)}
                      placeholder="e.g. 50000"
                      className={inputClass('securityDeposit')}
                    />
                    {errors.securityDeposit && <p className="text-red-400 text-xs mt-1">{errors.securityDeposit}</p>}
                  </div>
                </div>
              )}

              {!formData.availableFor && (
                <p className="text-dark-text-muted text-sm">
                  Go back to Step 1 and select whether this is for rent, sale, or both.
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Amenities */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-dark-text mb-1">Amenities</h2>
                <p className="text-dark-text-secondary text-sm mb-4">
                  Select everything that applies to your property.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES_LIST.map((amenity) => {
                    const selected = formData.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity, 'amenities')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition ${
                          selected
                            ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                            : 'bg-dark-bg-primary border-dark-border text-dark-text-secondary hover:border-accent-primary/50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-accent-primary border-accent-primary' : 'border-dark-border'
                        }`}>
                          {selected && <Check size={12} className="text-white" />}
                        </span>
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.partOfSociety && (
                <div className="pt-4 border-t border-dark-border">
                  <h3 className="text-sm font-semibold text-dark-text mb-2">
                    Shared Society Amenities
                  </h3>
                  <p className="text-dark-text-secondary text-xs mb-3">
                    These will be associated with "{formData.societyName || 'your society'}" and shared across all units.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AMENITIES_LIST.map((amenity) => {
                      const selected = formData.sharedAmenities.includes(amenity);
                      return (
                        <button
                          key={`shared-${amenity}`}
                          type="button"
                          onClick={() => toggleAmenity(amenity, 'sharedAmenities')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition ${
                            selected
                              ? 'bg-accent-secondary/10 border-accent-secondary text-accent-secondary'
                              : 'bg-dark-bg-primary border-dark-border text-dark-text-secondary hover:border-accent-secondary/50'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            selected ? 'bg-accent-secondary border-accent-secondary' : 'border-dark-border'
                          }`}>
                            {selected && <Check size={12} className="text-white" />}
                          </span>
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Photos */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-dark-text mb-1">Add photos</h2>
              <p className="text-dark-text-secondary text-sm mb-4">
                Paste image URLs for now — file upload support is coming soon.
              </p>

              <div className="space-y-3">
                {formData.imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateImageUrl(idx, e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className={inputClass('imageUrls') + ' pl-9'}
                      />
                    </div>
                    {formData.imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(idx)}
                        className="p-2.5 rounded-lg border border-dark-border text-dark-text-muted hover:text-red-400 hover:border-red-500/50 transition"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {errors.imageUrls && <p className="text-red-400 text-xs">{errors.imageUrls}</p>}

                <button
                  type="button"
                  onClick={addImageField}
                  className="flex items-center gap-2 text-sm text-accent-light hover:text-accent-primary font-medium transition"
                >
                  <Plus size={16} />
                  Add another photo
                </button>
              </div>

              {submitError && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-8 mt-2 border-t border-dark-border">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-2.5 bg-dark-bg-tertiary hover:bg-dark-bg-hover text-dark-text font-semibold rounded-lg transition border border-dark-border"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}

            <div className="flex-1" />

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary hover:bg-accent-dark text-white font-semibold rounded-lg transition shadow-dark-md"
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary hover:bg-accent-dark text-white font-semibold rounded-lg transition shadow-dark-md disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Submit Listing
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}