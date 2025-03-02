"use client";

import { Button } from "@/components/ui/button";
import { Github, Twitter, DiscIcon as Discord, MessageCircle, Heart, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Testimonial data
const testimonials = [
  {
    quote: "Synapse Studio has completely transformed my workflow. What used to take me hours now takes minutes with the AI tools.",
    author: "Alex Morgan",
    role: "Content Creator",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg"
  },
  {
    quote: "The scene detection feature alone is worth the price. It's like having a professional editor working alongside you.",
    author: "James Wilson",
    role: "YouTuber",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg"
  },
  {
    quote: "As someone with no formal video editing experience, Synapse made it possible for me to create professional-looking content.",
    author: "Sarah Chen",
    role: "Marketing Director",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg"
  }
];

export default function Community() {
  return (
    <section id="community" className="py-24 border-t border-white/10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-40 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Testimonials */}
        <div className="mb-24">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm mb-6 backdrop-blur-sm">
              <span className="text-cyan-400">Testimonials</span>
            </div>
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Loved by creators worldwide
            </h2>
            <p className="text-gray-300 text-lg">
              Join thousands of content creators who have transformed their video editing workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 transition-all duration-300 hover:border-white/20 hover:translate-y-[-5px]"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <Image 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    width={40} 
                    height={40} 
                    className="rounded-full mr-3 border border-white/20"
                  />
                  <div>
                    <h4 className="font-medium text-white">{testimonial.author}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Community */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-sm text-blue-400 mb-6">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Community
                </div>
                <h2 className="text-3xl font-bold mb-6">Join our growing community</h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  Synapse Studio is built by creators, for creators. Join our thriving community to share your work, 
                  get feedback, and help shape the future of AI-powered video editing.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="https://github.com/fal-ai-community" target="_blank">
                    <Button variant="outline" className="w-full group hover:bg-white/5 transition-all duration-300">
                      <Github className="mr-2 h-5 w-5 group-hover:text-blue-400 transition-colors" />
                      GitHub
                    </Button>
                  </Link>
                  <Link href="https://discord.gg/fal-ai" target="_blank">
                    <Button variant="outline" className="w-full group hover:bg-white/5 transition-all duration-300">
                      <Discord className="mr-2 h-5 w-5 group-hover:text-blue-400 transition-colors" />
                      Discord
                    </Button>
                  </Link>
                  <Link href="https://x.com/fal" target="_blank">
                    <Button variant="outline" className="w-full group hover:bg-white/5 transition-all duration-300">
                      <Twitter className="mr-2 h-5 w-5 group-hover:text-blue-400 transition-colors" />
                      Twitter
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-400/10 rounded-xl blur-xl opacity-50"></div>
                <div className="relative bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">S</div>
                      <span className="ml-3 font-medium">Synapse Community</span>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Online</span>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-white text-xs mr-3 mt-1">A</div>
                      <div className="bg-white/5 rounded-lg rounded-tl-none p-3 text-sm">
                        Just finished my first project with Synapse! The AI scene detection is incredible.
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-white text-xs mr-3 mt-1">T</div>
                      <div className="bg-white/5 rounded-lg rounded-tl-none p-3 text-sm">
                        Has anyone tried the new voice-to-text feature? It's saving me hours on subtitles!
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center text-white text-xs mr-3 mt-1">M</div>
                      <div className="bg-white/5 rounded-lg rounded-tl-none p-3 text-sm">
                        I'm hosting a workshop on advanced Synapse techniques next week. Join us!
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-[10px] border border-black">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                      <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-400">
                        +2k
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Join 2,000+ members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
