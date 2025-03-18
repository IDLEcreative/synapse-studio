"use client";

import { Button } from "@/components/ui/button";
import { Check, X, Zap, Shield, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, annual: 0 },
      description: "Perfect for hobbyists and beginners",
      features: [
        { included: true, text: "Basic video editing tools" },
        { included: true, text: "720p export quality" },
        { included: true, text: "5 projects" },
        { included: true, text: "Basic AI features" },
        { included: false, text: "Advanced editing tools" },
        { included: false, text: "4K export quality" },
      ],
      cta: "Get Started",
      ctaLink: "/app",
      variant: "outline",
      popular: false,
    },
    {
      name: "Pro",
      price: { monthly: 19, annual: 15 },
      description: "For content creators and professionals",
      features: [
        { included: true, text: "Advanced editing tools" },
        { included: true, text: "4K export quality" },
        { included: true, text: "Unlimited projects" },
        { included: true, text: "Full AI suite" },
        { included: true, text: "Priority support" },
        { included: true, text: "Custom templates" },
      ],
      cta: "Start Free Trial",
      ctaLink: "/app",
      variant: "default",
      popular: true,
      badge: "MOST POPULAR",
    },
    {
      name: "Enterprise",
      price: { monthly: 49, annual: 39 },
      description: "For teams and businesses",
      features: [
        { included: true, text: "Everything in Pro" },
        { included: true, text: "Team collaboration" },
        { included: true, text: "Advanced analytics" },
        { included: true, text: "API access" },
        { included: true, text: "Dedicated support" },
        { included: true, text: "Custom branding" },
      ],
      cta: "Contact Sales",
      ctaLink: "/app",
      variant: "outline",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/20 to-black"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm mb-6 backdrop-blur-sm">
            <span className="text-cyan-400">Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Select the perfect plan for your creative needs. From hobbyists to
            professionals, we have options for everyone.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-black/30 p-1 rounded-full border border-white/10 backdrop-blur-sm mb-12">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !annual
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center ${
                annual
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Annual{" "}
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-5px] ${
                plan.popular
                  ? "bg-gradient-to-b from-blue-600/20 to-cyan-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                  : "bg-black/40 backdrop-blur-sm border border-white/10"
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 text-center">
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-white">
                    ${annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-gray-400 ml-1.5">/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                <Link href={plan.ctaLink}>
                  <Button
                    className={`w-full mb-8 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white border-none shadow-lg shadow-blue-500/20"
                        : ""
                    }`}
                    variant={plan.variant as any}
                  >
                    {plan.cta}
                    {plan.popular && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </Link>

                <div className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      {feature.included ? (
                        <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-800 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          <X className="h-3 w-3 text-gray-500" />
                        </div>
                      )}
                      <span
                        className={`text-sm ${feature.included ? "text-gray-200" : "text-gray-500"}`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                100% Secure
              </h4>
              <p className="text-gray-400 text-sm">
                Your data is always protected and never shared.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-cyan-400" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                14-Day Trial
              </h4>
              <p className="text-gray-400 text-sm">
                Try any paid plan free for 14 days.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                Cancel Anytime
              </h4>
              <p className="text-gray-400 text-sm">
                No long-term contracts or commitments.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            All plans include a 14-day free trial. No credit card required. Need
            a custom solution?{" "}
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Contact us
            </a>{" "}
            for custom pricing.
          </p>
        </div>
      </div>
    </section>
  );
}
