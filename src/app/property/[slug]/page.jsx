'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Heart, MapPin, Bed, Bath, Maximize2, Phone, Mail, Home, TrendingUp, Calendar, Share2, ArrowLeft, MapPinIcon, Building2, Users, Award } from 'lucide-react';
import Link from 'next/link';

export default function PropertyDetailPage() {
  const params = useParams();
  const { slug: apn } = params;
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showContactForm, setShowContactForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactData, setContactData] = useState({ name: '', phone: '', email: '', message: '' });
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);

  // Fetch property data on mount
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/fetch/properties?apn=${apn}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch property');
        }
        
        const data = await res.json();
        console.log("Fetched property data: ", data.property);

        const property = {
          apn: data.property.apn,
          title: data.property.title,
          price: data.property.sell?.price ? `₹${data.property.sell.price.toLocaleString()}` : 'Price on request',
          monthlyRent: data.property.rent?.monthlyRent ? `₹${data.property.rent.monthlyRent.toLocaleString()}` : null,
          availableFor: data.property.availableFor,
          status: data.property.status,
          area: data.property.area,
          builtYear: data.property.builtYear,
          type: data.property.type,
          state: data.property.state,
          city: data.property.city,
          district: data.property.district,
          locality: data.property.localAddress,
          pincode: data.property.pincode,
          neighborhood: data.property.neighborhoodInfo,
          images: data.property.images.length > 0 ? data.property.images.map(img => img.url) : ['https://via.placeholder.com/800x600?text=No+Image'],
          amenities: data.property.amenities.length > 0 ? data.property.amenities : ['No amenities listed'],
          owner: {
            name: data.property.owner?.name || 'N/A',
            contact: data.property.owner?.contact || 'N/A',
            email: data.property.owner?.email || 'N/A',
            role: 'Property Owner',
            verified: true,
          },
          agent: data.property.agent ? {
            name: data.property.agent.name || 'N/A',
            contact: data.property.agent.contact || 'N/A',
            email: data.property.agent.email || 'N/A',
            role: 'Real Estate Agent',
            verified: true,
            licenseNo: data.property.agent.licenseNo || 'N/A',
          } : null,
          description: `Located in ${data.property.city}, ${data.property.state}, this ${data.property.type.toLowerCase()} offers ${data.property.area} sq.ft of space. ${data.property.neighborhoodInfo}`,
          highlights: [
            `Built in ${data.property.builtYear}`,
            `Located in ${data.property.district}`,
            `${data.property.area} sq.ft`,
            `Status: ${data.property.status}`,
            `Available for: ${data.property.availableFor}`
          ]
        };
        
        setProperty(property);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching property:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (apn) {
      fetchProperty();
    }
  }, [apn]);
  // Handle contact form
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactData);
    alert('Thank you! We will contact you soon.');
    setShowContactForm(false);
    setContactData({ name: '', phone: '', email: '', message: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-dark-text-secondary text-lg">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-accent-light hover:text-accent-primary font-medium mb-6 transition">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <div className="bg-dark-bg-secondary rounded-lg border border-dark-border p-8 text-center">
            <p className="text-dark-text-secondary text-lg">{error || 'Property not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
     <div className="min-h-screen bg-dark-bg">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link href="/dashboard" className="flex items-center gap-2 text-accent-light hover:text-accent-primary font-medium mb-6 transition">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        {/* Header with Price and Actions */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-dark-text mb-2">{property.title}</h1>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-accent-primary">{property.price}</span>
              <span className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-sm font-medium border border-accent-primary/30">
                {property.status}
              </span>
              {property.monthlyRent && (
                <span className="text-dark-text-secondary">Rent: {property.monthlyRent}/month</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-3 bg-dark-bg-secondary rounded-full border border-dark-border hover:border-accent-primary/50 hover:bg-dark-bg-hover transition"
            >
              <Heart
                size={15}
                className={isFavorite ? 'text-red-400 fill-red-400' : 'text-dark-text-muted'}
              />
            </button>
            <button className="p-3 bg-dark-bg-secondary rounded-full border border-dark-border hover:border-accent-primary/50 hover:bg-dark-bg-hover transition">
              <Share2 size={15} className="text-dark-text-muted" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-dark-bg-secondary rounded-lg overflow-hidden border border-dark-border shadow-dark-lg">
              <div className="relative h-96 bg-gradient-to-br from-dark-bg-tertiary via-dark-bg-secondary to-accent-primary/10">
                <img
                  src={property.images[selectedImageIndex]}
                  alt={`Property view ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image Thumbnails */}
              <div className="flex gap-2 p-4 bg-dark-bg-secondary border-t border-dark-border overflow-x-auto">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition ${
                      selectedImageIndex === idx ? 'border-accent-primary' : 'border-dark-border hover:border-accent-primary/50'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-dark-bg-secondary rounded-lg border border-dark-border overflow-hidden">
              <div className="flex border-b border-dark-border">
                {['overview', 'amenities', 'location', 'Point of Contact'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 font-medium text-center transition ${
                      activeTab === tab
                        ? 'bg-accent-primary text-white'
                        : 'text-dark-text-secondary hover:text-dark-text'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center gap-3 mb-2">
                          <Bed size={20} className="text-accent-primary" />
                          <span className="text-dark-text-secondary text-sm">Bedrooms</span>
                        </div>
                        <p className="text-2xl font-bold text-dark-text">{property.bedrooms}</p>
                      </div>
                      <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center gap-3 mb-2">
                          <Bath size={20} className="text-accent-primary" />
                          <span className="text-dark-text-secondary text-sm">Bathrooms</span>
                        </div>
                        <p className="text-2xl font-bold text-dark-text">{property.bathrooms}</p>
                      </div>
                      <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center gap-3 mb-2">
                          <Maximize2 size={20} className="text-accent-primary" />
                          <span className="text-dark-text-secondary text-sm">Area</span>
                        </div>
                        <p className="text-2xl font-bold text-dark-text">{property.area.toLocaleString()} sq.ft</p>
                      </div>
                      <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 size={20} className="text-accent-primary" />
                          <span className="text-dark-text-secondary text-sm">Built Year</span>
                        </div>
                        <p className="text-2xl font-bold text-dark-text">{property.builtYear}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-bold text-dark-text mb-3">About This Property</h3>
                      <p className="text-dark-text-secondary leading-relaxed">{property.description}</p>
                    </div>

                    {/* Highlights */}
                    <div>
                      <h3 className="text-lg font-bold text-dark-text mb-3">Property Highlights</h3>
                      <ul className="space-y-2">
                        {property.highlights?.map((highlight, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-dark-text-secondary">
                            <span className="text-accent-primary text-xl leading-none">✓</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div>
                    <h3 className="text-lg font-bold text-dark-text mb-4">Amenities & Features</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {property.amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-dark-bg-primary rounded-lg border border-dark-border">
                          <div className="w-2 h-2 bg-accent-primary rounded-full" />
                          <span className="text-dark-text">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'location' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-dark-text mb-4">Location Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-dark-bg-primary rounded-lg border border-dark-border">
                        <MapPin size={20} className="text-accent-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-dark-text-secondary">Address</p>
                          <p className="text-dark-text">{property.locality}, {property.city}, {property.state}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-dark-bg-primary rounded-lg border border-dark-border">
                        <MapPinIcon size={20} className="text-accent-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-dark-text-secondary">Postal Code</p>
                          <p className="text-dark-text">{property.pincode}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-dark-bg-primary rounded-lg border border-dark-border">
                        <Home size={20} className="text-accent-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-dark-text-secondary">Neighborhood</p>
                          <p className="text-dark-text">{property.neighborhood}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Point of Contact' && (
                  <div className="space-y-6">
                    {/* Agent Card */}
                    <div className="p-4 bg-dark-bg-primary rounded-lg border border-dark-border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center">
                            <Users size={32} className="text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold text-dark-text">{property.agent.name}</h4>
                              {property.agent.verified && (
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30 flex items-center gap-1">
                                  <Award size={12} /> Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-dark-text-secondary">{property.agent.role}</p>
                            <p className="text-xs text-dark-text-secondary mt-1">Lic. No: {property.agent.licenseNo}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-dark-border">
                        <div className="flex items-center gap-3 text-dark-text-secondary hover:text-accent-primary transition cursor-pointer">
                          <Phone size={18} />
                          <span>{property.agent.contact}</span>
                        </div>
                        <div className="flex items-center gap-3 text-dark-text-secondary hover:text-accent-primary transition cursor-pointer">
                          <Mail size={18} />
                          <span>{property.agent.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Owner Card */}
                    <div className="p-4 bg-dark-bg-primary rounded-lg border border-dark-border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-accent-secondary to-accent-primary rounded-lg flex items-center justify-center">
                            <Home size={32} className="text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold text-dark-text">{property.owner.name}</h4>
                              {property.owner.verified && (
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30 flex items-center gap-1">
                                  <Award size={12} /> Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-dark-text-secondary">{property.owner.role}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-dark-border">
                        <div className="flex items-center gap-3 text-dark-text-secondary hover:text-accent-primary transition cursor-pointer">
                          <Phone size={18} />
                          <span>{property.owner.contact}</span>
                        </div>
                        <div className="flex items-center gap-3 text-dark-text-secondary hover:text-accent-primary transition cursor-pointer">
                          <Mail size={18} />
                          <span>{property.owner.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="bg-dark-bg-secondary rounded-lg border border-dark-border p-6 shadow-dark-lg">
              <h3 className="text-lg font-bold text-dark-text mb-4">Property Type</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-dark-border">
                  <span className="text-dark-text-secondary">Type</span>
                  <span className="text-dark-text font-medium">{property.type}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-dark-border">
                  <span className="text-dark-text-secondary">Available For</span>
                  <span className="text-dark-text font-medium">{property.availableFor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-text-secondary">Status</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-sm rounded font-medium">{property.status}</span>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-dark-bg-secondary rounded-lg border border-dark-border p-6 shadow-dark-lg">
              <h3 className="text-lg font-bold text-dark-text mb-4">Get In Touch</h3>
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="w-full bg-accent-primary hover:bg-accent-dark text-white font-semibold py-3 px-4 rounded-lg transition shadow-dark-md mb-3"
              >
                Contact Now
              </button>
              <button className="w-full bg-dark-bg-tertiary hover:bg-dark-bg-hover text-dark-text font-semibold py-3 px-4 rounded-lg transition border border-dark-border flex items-center justify-center gap-2">
                <Calendar size={18} />
                Schedule Tour
              </button>

              {showContactForm && (
                <form onSubmit={handleContactSubmit} className="mt-4 space-y-3 pt-4 border-t border-dark-border">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={contactData.name}
                    onChange={handleContactChange}
                    required
                    className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:border-accent-primary"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={contactData.email}
                    onChange={handleContactChange}
                    required
                    className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:border-accent-primary"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Your Phone"
                    value={contactData.phone}
                    onChange={handleContactChange}
                    required
                    className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:border-accent-primary"
                  />
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    value={contactData.message}
                    onChange={handleContactChange}
                    rows="3"
                    className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:border-accent-primary resize-none"
                  />
                  <button type="submit" className="w-full bg-accent-primary hover:bg-accent-dark text-white font-semibold py-2 rounded-lg transition">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
