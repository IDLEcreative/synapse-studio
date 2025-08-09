"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Star, Zap, Wand2 } from "lucide-react";
import { LaptopMockup } from "@/components/ui/landing-laptop-mockup";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-32 pb-16 @container relative overflow-hidden @md:pt-40 @md:pb-24">
      {/* Simplified background elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          {/* More minimal "New Release" pill */}
          <div className="inline-flex items-center rounded-full border border-white/5 bg-white/3 px-4 py-1.5 text-sm mb-12 backdrop-blur-sm">
            <span className="text-blue-400 flex items-center font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              New Release
            </span>
            <span className="mx-3 h-4 w-px bg-white/10" />
            <a
              href="#features"
              className="flex items-center text-white/90 hover:text-white transition-colors"
            >
              See What's New <ArrowRight className="ml-1.5 h-4 w-4" />
            </a>
          </div>

          {/* Simplified heading with less gradient */}
          <h1 className="text-5xl @md:text-7xl font-bold tracking-tight mb-8 text-white">
            Synapse Studio
            <span className="block mt-3 text-4xl @md:text-6xl text-white/90">
              AI-Powered Video Editing
            </span>
          </h1>

          <p className="text-white/90 text-lg @md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Transform your creative vision into stunning videos with our
            advanced AI tools. Effortlessly create professional-quality content
            in minutes, not hours.
          </p>

          {/* More minimal social proof */}
          <div className="flex items-center justify-center mb-16 text-sm text-gray-200 py-3 px-6 rounded-full inline-flex">
            <div className="flex -space-x-2 mr-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold border border-white/10"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span>
              Trusted by{" "}
              <span className="text-white font-semibold">2,000+</span> creators
              worldwide
            </span>
          </div>

          {/* More minimal buttons */}
          <div className="flex flex-col @md:flex-row items-center justify-center gap-5 mb-24">
            <Link href="/app">
              <Button
                size="lg"
                className="min-w-[220px] btn-accent py-5 px-8 rounded-xl"
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Creating Now
              </Button>
            </Link>
            <Link href="#features">
              <Button
                size="lg"
                className="min-w-[220px] btn-minimal py-5 px-8 rounded-xl"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* App Screenshot with more minimal floating elements */}
        <div className="relative max-w-6xl mx-auto">
          {/* Floating UI elements with more minimal styling */}
          <div className="absolute -top-10 -right-10 float-card p-4 z-20 hidden @md:block hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Star className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-sm font-medium">
                AI-powered scene detection
              </span>
            </div>
          </div>

          <div className="absolute -bottom-10 -left-10 float-card p-4 z-20 hidden @md:block hover-scale">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Wand2 className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-sm font-medium">
                One-click enhancements
              </span>
            </div>
          </div>

          <div className="transform shadow-2xl rounded-xl overflow-hidden">
            <LaptopMockup>
              <Image
                src="/screenshot.webp?height=800&width=1200"
                width={1200}
                height={800}
                alt="Synapse Studio interface"
                className="w-full h-auto"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </LaptopMockup>
          </div>
        </div>
      </div>
    </section>
  );
}
