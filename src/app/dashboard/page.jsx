'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import PropertyCard from '@/components/PropertyCard';
import ArticleCard from '@/components/ArticleCard';
import DemandCard from '@/components/DemandCard';
import UserCard from '@/components/UserCard';
import FeatureCard from '@/components/FeatureCard';
import { useGeolocation } from '@/hooks/useGeolocation';
import ChatWidget from '@/components/chatWidget';


export default function DashboardPage() {
  //useSession doesn't go to the DB. 
  // It calls GET /api/auth/session which NextAuth handles 
  // automatically — it reads the cookie, decrypts it, 
  // runs your session() callback, and returns the result as JSON.
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState({});
  const [news, setNews] = useState([]);
  const { location, error, loading, getLocation } = useGeolocation();
  const [userAddress, setUserAddress] = useState(null);
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [demandmap,setdemandmap]=useState({})
  const [demandData,setdemandData]=useState({});
  const [cities,setcities]=useState([]);
 
  useEffect(()=>{
    const fetchcities=async()=>{
      const res=await fetch('/api/fetch/locations',{
        "method":"GET"
      })
      const data=await res.json();
      console.log("City State Data: ",data);
      setcities(data.locations);
    }
    fetchcities();
  },[])

  useEffect(()=>{
    async function fetchSchema(){
       const res=await fetch('/api/fetch/schema',{
        "method":"GET"
       })
       console.log(res);
    }
   
  },[])
    useEffect(()=>{
    async function fetchSchema(){
       const res=await fetch('/api/fetch/schema',{
        "method":"GET"
       })
       const data=await res.json();
       console.log(data);
    }
  fetchSchema()
  },[])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
   
  }, [status, router])

  useEffect(()=>{
  console.log("Location: ", location)
  async function fetchAddress(location)
  {
    if(location)
  {
    const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`,{
      method:'GET',
      headers: {
          "User-Agent": "MyNextApp/1.0",
          Accept: "application/json",
        }
    })
    const data=await res.json();
    console.log("Address: ", data.address)
    if(data?.address)
    {
      setUserAddress(data.address);
    }
  }
 }
  fetchAddress(location);
  
},[location])

 // later when backend ready:
  useEffect(() => {
    if (userAddress==null) {
      return
    }
    async function fetchnearbyproperties(userAddress)
    {
      try{
        console.log("Fetching nearby properties for location: ", userAddress)
        const res=await fetch('/api/fetch/properties',{
          method:'POST',
          headers: {
              "Content-Type": "application/json",
            },
          body: JSON.stringify(userAddress)
        })
        const data=await res.json();
        console.log("Response from properties API: ")
        if(data?.count > 0) {
          console.log("Nearby properties setting ", data.properties)
          setNearbyProperties(data.properties);
        }
      }
      catch(error)
      {
        console.error("Error fetching nearby properties: ", error);
      }
    }
      fetchnearbyproperties(userAddress);
  }, [userAddress]);

useEffect(() => {
    console.log("Nearby properties: ", nearbyProperties);
   const citymap = nearbyProperties.reduce((acc, property) => {
  const { type, city, district } = property;

  acc[type] ??= {};
  acc[type][city] ??= {};

  acc[type][city][district] =
    (acc[type][city][district] ?? 0) + 1;

  return acc;
}, {});
    setdemandmap(citymap);
}, [nearbyProperties]);
useEffect(()=>{
  if(demandmap!={})
  {
const data={}
for (const [type, cities] of Object.entries(demandmap)) {
  data[type] = Object.entries(cities)
    .flatMap(([city, districts]) =>
      Object.entries(districts).map(([district, count]) => ({
        location: `${district}, ${city}`,
        count,
      }))
    )
    .sort((a, b) => b.count - a.count)
    .map(item => item.location);
}
setdemandData(data)
  }
},[demandmap])


useEffect(()=>{
  console.log("Demand Data: Indep ",demandData["Independent House"])
},[demandData])
useEffect(()=>{
  console.log("Selected: ",selectedLocation)
  if(selectedLocation !=null)
  setUserAddress(selectedLocation)
},[selectedLocation])

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        if (response.ok) {
          const data = await response.json();
          // Extract results array from the Tavily response
          const newsResults = data.response?.results || [];
          setNews(newsResults);
        } else {
          console.error('Failed to fetch news');
          setNews([]);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      }
    };

    fetchNews();
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <p className="text-dark-text-secondary text-lg">Loading...</p>
      </div>
    );
  }

  if (!session) return null;


  // Display only top 3 articles from fetched news
  const topArticles = Array.isArray(news) ? news.slice(0, 3) : [];
  const topnearbyProperties = Array.isArray(nearbyProperties) ? nearbyProperties.slice(0, 3) : [];


  const userData = [
    { id: 1, title: 'Buyers', description: 'Find your perfect property with our extensive listings and personalized recommendations.', buttonText: 'Buy Now' },
    { id: 2, title: 'Tenants', description: 'Browse rental properties and find a home that fits your lifestyle and budget.', buttonText: 'Try Now' },
    { id: 3, title: 'Sellers', description: 'List your property and connect with qualified buyers in your area.', buttonText: 'Sell Now' },
  ];

  const features = [
    { id: 1, title: 'Supports Multiple Users', description: 'Manage accounts for buyers, tenants, sellers, agents, and firms all on one platform.' },
    { id: 2, title: 'AI-Powered Platform', description: 'Not just an ordinary real estate site. Integrated with AI for our users' },
    { id: 3, title: 'Secure & Transparent', description: 'Efficient transaction tracking with privacy' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar
        locations={cities}
        onLocationChange={(location) => setSelectedLocation(location)}
      />

      {/* Hero Section */}
      <div
        className="relative h-64 flex items-center justify-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(./cover.png)' }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Find Your Perfect Home
          </h1>
          <p className="text-lg text-white/80">
            Welcome back, {session.user.name}
          </p>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="px-6 pb-12">
        <SearchBar onLocationRequest={getLocation} location={location}
        locationLoading={loading}
        userAddress={userAddress} />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-dark-text mb-2">Recommended for You</h2>
          <p className="text-dark-text-secondary mb-8">Properties based on your entered location</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* {propertyRecommendations.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))} */}

            {topnearbyProperties.length > 0 && topnearbyProperties.map((property) => (
              <PropertyCard key={property.apn} property={
                {
                  "apn": property.apn,
                  "title": property.title,
                  "location": `${property.localAddress}, ${property.city}, ${property.state}`,
                  "price": "₹" + (property.rent?.monthlyRent || property.sell?.price || 'Price on request'),
                  "bedrooms": 'N/A',
                  "bathrooms": 'N/A',
                  "area": `${property.area} sq.ft`,
                  "availableFor": property.availableFor,
                }
              } />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark-text mb-6">Top Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topArticles.length > 0 ? (
              topArticles.map((article, index) => (
                <ArticleCard key={article.url || index} article={article} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-dark-text-secondary">
                <p>Loading latest articles...</p>
              </div>
            )}
          </div>
        </section>
        {
           (Object.keys(demandmap).length > 0)? <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark-text mb-6">Demand in {selectedLocation.city}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DemandCard category={{ title: 'Apartments', subtitle: 'Most searched localities for Apartments' }} locations={demandData["Apartment"]} />
            <DemandCard category={{ title: 'Villas', subtitle: 'Most searched societies for Plots' }} locations={demandData["villa"]} />
            <DemandCard category={{ title: 'Independent House', subtitle: 'Most searched localities for Houses' }} locations={demandData["Independent House"]} />
          </div>
        </section>:<></>
        }
       

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark-text mb-6">Our Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userData.map((user) => (
              <UserCard key={user.id} userType={user} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-dark-text mb-6">Why Homemakers?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>
      </main>
      <ChatWidget/>
    </div>
  );
}
