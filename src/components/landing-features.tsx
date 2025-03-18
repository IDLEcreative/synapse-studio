"use client";

import {
  Scissors,
  Wand2,
  Share2,
  Code,
  Sparkles,
  Clock,
  Palette,
  Layers,
  Zap,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Editing",
    description:
      "Smart scene detection, auto color correction, and content-aware editing that adapts to your style.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Scissors,
    title: "Precision Timeline",
    description:
      "Frame-perfect cutting with intuitive controls for professional results in less time.",
    color: "from-purple-500 to-pink-400",
  },
  {
    icon: Sparkles,
    title: "One-Click Enhancements",
    description:
      "Instantly improve lighting, color, and audio with AI-powered enhancement tools.",
    color: "from-amber-500 to-orange-400",
  },
  {
    icon: Clock,
    title: "Real-Time Rendering",
    description:
      "See changes instantly with our optimized rendering engine—no more waiting for previews.",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: Share2,
    title: "Multi-Platform Export",
    description:
      "Optimize for any platform with presets for YouTube, TikTok, Instagram, and more.",
    color: "from-rose-500 to-red-400",
  },
  {
    icon: Code,
    title: "Open-Source Foundation",
    description:
      "Built on transparent, community-driven technology you can trust and extend.",
    color: "from-indigo-500 to-blue-400",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-24 border-t border-white/10 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-40 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm mb-6 backdrop-blur-sm">
            <span className="text-cyan-400">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Powerful tools for modern creators
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Everything you need to create professional-quality videos in
            minutes, not hours. Our AI-powered tools make professional editing
            accessible to everyone.
          </p>
        </div>

        {/* Main feature highlight */}
        <div className="mb-24 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1 shadow-xl">
          <div className="relative rounded-xl overflow-hidden bg-black/40 backdrop-blur-sm p-8 md:p-12">
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-10">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-400 rounded-full blur-3xl"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <div className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-sm text-blue-400 mb-6">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Featured
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  AI Scene Detection & Enhancement
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Our advanced AI automatically identifies scenes, suggests
                  optimal cuts, and enhances visual quality—reducing hours of
                  manual work to just minutes. Perfect for creators who want
                  professional results without the learning curve.
                </p>
                <ul className="space-y-3">
                  {[
                    "Smart scene boundary detection",
                    "Automatic color grading based on content",
                    "Audio enhancement and normalization",
                    "Content-aware transitions",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <div className="mr-3 h-6 w-6 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-lg overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/screenshot.webp?height=600&width=800"
                  width={800}
                  height={600}
                  alt="AI Scene Detection in action"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <div className="flex items-center text-sm">
                    <Layers className="h-4 w-4 text-cyan-400 mr-2" />
                    <span className="text-white font-medium">
                      AI detected 8 scenes in this clip
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-white/20 transition-all duration-300 hover:translate-y-[-5px] group"
            >
              <div
                className={`h-12 w-12 rounded-lg mb-5 flex items-center justify-center bg-gradient-to-r ${feature.color} group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
