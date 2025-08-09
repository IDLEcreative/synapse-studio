"use client";

import Link from "next/link";
import {
  Github,
  Twitter,
  DiscIcon as Discord,
  Mail,
  ArrowRight,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 pt-20 pb-10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Newsletter section */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <div className="md:col-span-3">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Stay updated with Synapse
                </h3>
                <p className="text-gray-100 mb-0 md:pr-12">
                  Get the latest news, updates, and tips for creating amazing
                  videos with AI.
                </p>
              </div>
              <div className="md:col-span-2">
                <form className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white border-none">
                    Subscribe
                  </Button>
                </form>
                <p className="text-xs text-gray-300 mt-3">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-16 mb-16">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-bold tracking-wide text-xl">
                SYNAPSE STUDIO
              </span>
            </div>
            <p className="text-gray-200 mb-6 max-w-xs">
              Advanced AI-powered video editing platform for creators. Transform
              your creative vision into stunning videos with our intuitive
              tools.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://github.com/fal-ai-community"
                target="_blank"
                className="text-gray-200 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://discord.gg/fal-ai"
                target="_blank"
                className="text-gray-200 hover:text-white transition-colors"
              >
                <Discord className="h-5 w-5" />
                <span className="sr-only">Discord</span>
              </Link>
              <Link
                href="https://x.com/fal"
                target="_blank"
                className="text-gray-200 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="mailto:info@synapsestudio.ai"
                className="text-gray-200 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-6 text-white">Product</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6 text-white">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Tutorials
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6 text-white">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-200 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Licenses
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-300 mb-4 md:mb-0">
            © {new Date().getFullYear()} Synapse Studio. All rights reserved.
          </p>
          <div className="flex items-center text-sm text-gray-300">
            <span>Made with</span>
            <Heart className="h-4 w-4 mx-1 text-red-500" />
            <span>by the Synapse team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
