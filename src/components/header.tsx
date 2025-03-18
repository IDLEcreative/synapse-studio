"use client";

import { Button } from "@/components/ui/button";
import {
  SettingsIcon,
  HelpCircle,
  User,
  FileIcon,
  Share2,
  Menu,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { useState } from "react";

export default function Header() {
  const setProjectDialogOpen = useVideoProjectStore(
    (s) => s.setProjectDialogOpen,
  );
  const openFluxProStudio = useVideoProjectStore((s) => s.openFluxProStudio);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const projectId = useProjectId();

  return (
    <header className="px-6 py-3 flex justify-between items-center bg-black/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="flex items-center">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition-all duration-300 hover-scale"
        >
          <h1 className="text-xl">
            <span className="text-white font-bold tracking-wide">
              SYNAPSE STUDIO
            </span>
          </h1>
        </Link>
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop navigation */}
      <nav className="hidden md:flex flex-row items-center justify-end gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          asChild
        >
          <Link href="/" prefetch={false}>
            Home
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          asChild
        >
          <a href="/features" rel="noopener noreferrer">
            <HelpCircle className="w-4 h-4 mr-1.5" />
            Help
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          asChild
        >
          <a href="#" rel="noopener noreferrer">
            <User className="w-4 h-4 mr-1.5" />
            Account
          </a>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => setProjectDialogOpen(true)}
          className="btn-minimal text-white rounded-xl"
        >
          <FileIcon className="w-4 h-4 mr-1.5" />
          Projects
        </Button>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => openFluxProStudio(null, "fill")}
            className="btn-accent rounded-xl"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Image Studio
          </Button>
        </div>
      </nav>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg shadow-lg p-4 flex flex-col gap-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-gray-400 hover:text-white"
            asChild
          >
            <Link href="/" prefetch={false}>
              Home
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-gray-400 hover:text-white"
            asChild
          >
            <a href="/features" rel="noopener noreferrer">
              <HelpCircle className="w-4 h-4 mr-1.5" />
              Help
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-gray-400 hover:text-white"
            asChild
          >
            <a href="#" rel="noopener noreferrer">
              <User className="w-4 h-4 mr-1.5" />
              Account
            </a>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setProjectDialogOpen(true);
              setMobileMenuOpen(false);
            }}
            className="justify-start btn-minimal text-white rounded-xl"
          >
            <FileIcon className="w-4 h-4 mr-1.5" />
            Projects
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              openFluxProStudio(null, "fill");
              setMobileMenuOpen(false);
            }}
            className="justify-start btn-accent rounded-xl"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Image Studio
          </Button>
        </div>
      )}
    </header>
  );
}
