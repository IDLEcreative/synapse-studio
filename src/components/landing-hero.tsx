"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Star, Zap, Wand2 } from "lucide-react";
import { LaptopMockup } from "@/components/ui/landing-laptop-mockup";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
      {/* Enhanced animated background elements - monochromatic */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '12s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '20s' }} />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-white/5 bg-white/3 px-4 py-1.5 text-sm mb-10 backdrop-blur-sm hover:border-white/10 transition-all shadow-lg hover:shadow-xl hover:bg-white/5 hover-scale">
            <span className="text-primary flex items-center font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              New Release
            </span>
            <span className="mx-3 h-4 w-px bg-white/20" />
            <a
              href="#features"
              className="flex items-center text-white hover:text-cyan-300 transition-colors"
            >
              See What's New <ArrowRight className="ml-1.5 h-4 w-4" />
            </a>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-gradient text-shadow-lg">
            Synapse Studio
            <span className="block mt-3 text-4xl md:text-6xl">AI-Powered Video Editing</span>
          </h1>

          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform your creative vision into stunning videos with our
            advanced AI tools. Effortlessly create professional-quality content
            in minutes, not hours.
          </p>
          
          {/* Enhanced social proof */}
          <div className="flex items-center justify-center mb-12 text-sm text-gray-300 bg-white/3 backdrop-blur-md py-3 px-6 rounded-full border border-white/5 shadow-lg inline-flex">
            <div className="flex -space-x-2 mr-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-[10px] font-bold border border-black/80 shadow-md">
                  {i + 1}
                </div>
              ))}
            </div>
            <span>Trusted by <span className="text-white font-semibold">2,000+</span> creators worldwide</span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-5 mb-20">
            <Link href="/app">
              <Button
                size="lg"
                className="min-w-[220px] btn-artistic py-6 px-8 text-white"
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Creating Now
              </Button>
            </Link>
            <Link href="#features">
              <Button 
                size="lg" 
                variant="outline" 
                className="min-w-[220px] glass-button py-6 px-8"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced App Screenshot with interactive elements */}
        <div className="relative group max-w-6xl mx-auto perspective">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
          
          {/* Enhanced Floating UI elements */}
          <div className="absolute -top-10 -right-10 glass-panel p-4 rounded-xl shadow-xl transform -rotate-3 z-20 hidden md:block hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/20 rounded-full">
                <Star className="h-5 w-5 text-secondary" />
              </div>
              <span className="text-sm font-medium">AI-powered scene detection</span>
            </div>
          </div>
          
          <div className="absolute -bottom-10 -left-10 glass-panel p-4 rounded-xl shadow-xl transform rotate-3 z-20 hidden md:block hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">One-click enhancements</span>
            </div>
          </div>
          
          <div className="transform group-hover:translate-y-[-8px] transition-all duration-700 shadow-2xl rounded-xl">
            <LaptopMockup>
              <Image
                src="/screenshot.webp?height=800&width=1200"
                width={1200}
                height={800}
                alt="Synapse Studio interface"
                className="w-full h-auto rounded-md"
                priority
              />
            </LaptopMockup>
          </div>

          {/* Enhanced Floating gradient elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse-glow" style={{ animationDuration: '15s' }} />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl opacity-20 animate-pulse-glow" style={{ animationDuration: '10s' }} />
        </div>
      </div>
    </section>
  );
}
