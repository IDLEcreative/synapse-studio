import { Suspense } from "react";
import Header from "@/components/landing-header";
import Hero from "@/components/landing-hero";
import Features from "@/components/landing-features";
import Pricing from "@/components/landing-pricing";
import Community from "@/components/landing-community";
import Footer from "@/components/landing-footer";

// Skeleton loaders for dynamic content
function FeaturesSkeleton() {
  return (
    <div className="py-24 space-y-8">
      <div className="w-48 h-8 bg-white/5 rounded-lg mx-auto mb-12"></div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl bg-white/5 h-64 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="py-24 space-y-8">
      <div className="w-48 h-8 bg-white/5 rounded-lg mx-auto mb-12"></div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl bg-white/5 h-96 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

function CommunitySkeleton() {
  return (
    <div className="py-24 space-y-8">
      <div className="w-48 h-8 bg-white/5 rounded-lg mx-auto mb-12"></div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl bg-white/5 h-64 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Static content that renders immediately */}
      <Header />
      <main className="lg:pt-48">
        <Hero />
        
        {/* Dynamic content that loads with Suspense */}
        <Suspense fallback={<FeaturesSkeleton />}>
          <Features />
        </Suspense>
        
        <Suspense fallback={<PricingSkeleton />}>
          <Pricing />
        </Suspense>
        
        <Suspense fallback={<CommunitySkeleton />}>
          <Community />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
