"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 w-full border-b z-50 transition-all duration-300 ${
        isScrolled 
          ? "border-white/5 bg-black/90 backdrop-blur-md" 
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold tracking-wide text-lg">
              SYNAPSE STUDIO
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-1">
          <Link
            href="#features"
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5"
          >
            Pricing
          </Link>
          <Link
            href="#community"
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5"
          >
            Community
          </Link>
          <div className="relative group">
            <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5 flex items-center">
              Resources
              <ChevronDown className="ml-1 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>
            <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-black/95 backdrop-blur-md border border-white/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left">
              <div className="py-1 rounded-md">
                <Link href="/about" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                  About
                </Link>
                <Link href="#" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                  Documentation
                </Link>
                <Link href="#" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                  Tutorials
                </Link>
                <Link href="#" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                  Blog
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/app" className="hidden md:block">
            <Button 
              className="btn-artistic text-white px-6 py-2"
            >
              Get Started
            </Button>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div 
        className={`md:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-md transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-4">
          <nav className="flex flex-col space-y-2 mt-8">
            <Link
              href="#features"
              className="px-4 py-3 text-lg text-gray-200 hover:text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="px-4 py-3 text-lg text-gray-200 hover:text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#community"
              className="px-4 py-3 text-lg text-gray-200 hover:text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              href="/about"
              className="px-4 py-3 text-lg text-gray-200 hover:text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#"
              className="px-4 py-3 text-lg text-gray-200 hover:text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </Link>
          </nav>
          
          <div className="mt-auto mb-8">
            <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full btn-artistic text-white py-6 text-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
