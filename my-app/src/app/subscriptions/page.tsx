"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { PlanCard } from '@/src/components/subscription/PlanCard';
import { upgradeSubscription } from '@/src/services/subscriptionService';
import { Cloud, Zap, Share2, RefreshCcw, PlayCircle, Globe, Mic2 } from 'lucide-react';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false); 

// Inside src/app/subscriptions/page.tsx

const handleSubscribe = async (planType: "PRO" | "GO+") => {
  try {
    setLoading(true);
    
    // 1. Call the API service to upgrade the plan
    await upgradeSubscription(planType);

    // 2. Show a success message to the user
    alert(`Success! You are now a ${planType} member.`);

    // 3. Redirect to your specific profile page
    // We use window.location.href to force a refresh so the Navbar updates the Star badge
    window.location.href = '/profiles/demo'; 
    
    // If your handle is 'gehad', change it to '/profiles/gehad'
    
  } catch (error) {
    console.error("Subscription failed:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-white text-black py-20 px-6">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-zinc-500 text-lg font-medium mb-4">Select the plan that suits you best</h2>
        <h1 className="text-4xl font-black text-zinc-800 tracking-tight">Unlock artist tools and reach more listeners</h1>
      </div>

      {/* Grid container for the three plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
        
        {/* 1. STARTER PLAN - Basic features */}
        <PlanCard 
          title="Starter"
          price="EGP 0.00"
          yearlyPrice="EGP 0.00"
          description="Basic features to get you started on your music journey."
          colorTheme="#71717a" 
          features={[
            { text: "Stream all public tracks", icon: <PlayCircle size={28}/> },
            { text: "Basic profile customization", icon: <Globe size={28}/> },
            { text: "3 track uploads limit", icon: <Mic2 size={28}/> },
            { text: "Standard audio quality" }
          ]}
          onSubscribe={() => {}}
        />

        {/* 2. ARTIST PLAN - Advanced artist tools */}
        <PlanCard 
          title="Artist"
          price="EGP 29.99"
          yearlyPrice="EGP 359.88"
          description="Tailored access to essential artist tools"
          colorTheme="#7F5AF0" 
          features={[
            { text: "3 hours of uploads", icon: <Cloud size={28}/> },
            { text: "Boost tracks & get 100+listeners", badge: "2X MONTH", icon: <Zap size={28}/> },
            { text: "Distribute & monetize tracks", badge: "2X MONTH", icon: <Share2 size={28}/> },
            { text: "Track Replacement", badge: "3X MONTH", icon: <RefreshCcw size={28}/> }
          ]}
          onSubscribe={() => handleSubscribe("PRO")}
        />

        {/* 3. ARTIST PRO PLAN - Unlimited professional tools */}
        <PlanCard 
          title="Artist Pro"
          price="EGP 74.99"
          yearlyPrice="EGP 899.88"
          isPopular={true}
          description="Unlimited access to all artist tools"
          colorTheme="#D4AF37" 
          features={[
            { text: "Unlimited uploads", icon: <Cloud size={28}/> },
            { text: "Boost tracks and get 100+ listeners", badge: "UNLIMITED", icon: <Zap size={28}/> },
            { text: "Distribute & monetize tracks", badge: "UNLIMITED", icon: <Share2 size={28}/> },
            { text: "Replace tracks without losing stats", badge: "UNLIMITED", icon: <RefreshCcw size={28}/> }
          ]}
          onSubscribe={() => handleSubscribe("GO+")}
        />
      </div>

      {/* ─── FOOTER BUTTON SECTION ─── */}
      <div className="mt-16 flex justify-center">
        <button 
          // 3. router.back() sends the user back to the Discover page (or previous page)
          onClick={() => router.back()} 
          className="group flex items-center gap-3 py-4 px-10 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm"
        >
          <span className="text-sm font-black text-black uppercase tracking-wider">
            Or continue without a paid plan
          </span>
          <span className="text-xl group-hover:translate-x-2 transition-transform duration-300">
            →
          </span>
        </button>
      </div>
    </div>
  );
}