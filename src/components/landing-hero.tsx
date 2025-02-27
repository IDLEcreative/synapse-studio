import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { LaptopMockup } from "@/components/ui/landing-laptop-mockup";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm mb-8">
            <span className="text-gray-400">New Release</span>
            <span className="ml-3 h-4 w-px bg-white/20" />
            <a
              href="#features"
              className="ml-3 flex items-center text-white hover:text-gray-300"
            >
              See What's New <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            Synapse Studio
            <br />
            AI-Powered Editing
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Transform your creative vision into stunning videos with our
            advanced AI tools. Effortlessly create professional-quality content
            with intuitive editing features designed for creators of all skill
            levels.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/app">
              <Button
                size="lg"
                variant="glass"
                className="min-w-[200px] bg-primary/20 backdrop-blur-md border border-primary/30"
              >
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* App Screenshot */}
        <div className="relative group max-w-6xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-400/30 blur-3xl opacity-20" />
          <LaptopMockup>
            <Image
              src="/screenshot.webp?height=800&width=1200"
              width={1200}
              height={800}
              alt="Synapse Studio interface"
              className="w-full h-auto"
              priority
            />
          </LaptopMockup>

          {/* Floating gradient elements */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-cyan-400/30 rounded-full blur-3xl opacity-20" />
        </div>
      </div>
    </section>
  );
}
