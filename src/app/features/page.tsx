import Header from "@/components/landing-header";
import Footer from "@/components/landing-footer";
import {
  Scissors,
  Wand2,
  Share2,
  Code,
  Zap,
  Users,
  Layers,
  Sparkles,
  Palette,
  Video,
  Music,
  Cpu,
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
            Synapse Studio Features
          </h1>

          <p className="text-gray-300 text-lg text-center mb-16">
            Discover the powerful tools and capabilities that make Synapse
            Studio the ultimate AI-powered video editing platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Scissors className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Precise Editing</h2>
              <p className="text-gray-300">
                Our frame-perfect cutting and editing tools give you complete
                control over your video timeline. Trim, split, merge, and
                rearrange clips with pixel-perfect precision. Advanced
                keyframing allows for smooth transitions and effects.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Wand2 className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                AI-Generated Assets
              </h2>
              <p className="text-gray-300">
                Leverage cutting-edge AI to generate custom music, images, video
                clips, and more for your projects. Simply describe what you
                need, and our AI will create assets that match your vision. Save
                hours of searching for the perfect stock media.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Share2 className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Export Anywhere</h2>
              <p className="text-gray-300">
                Export your videos in any format and resolution, from
                mobile-friendly vertical videos to cinema-quality widescreen.
                Share directly to social platforms with optimized settings for
                each platform. Schedule posts and track performance all from
                within Synapse Studio.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Code className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Open-Source</h2>
              <p className="text-gray-300">
                Built on open-source technologies and available to everyone. Our
                commitment to transparency means you can inspect, modify, and
                contribute to the codebase. Join our community of developers and
                help shape the future of video editing.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Zap className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Lightning Fast</h2>
              <p className="text-gray-300">
                Optimized for performance, Synapse Studio delivers real-time
                previews and fast rendering times. Our cloud-based processing
                handles the heavy lifting, so you can edit smoothly even on less
                powerful devices. Export videos in a fraction of the time
                compared to traditional editors.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Users className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Collaboration</h2>
              <p className="text-gray-300">
                Work together with team members in real-time. Share projects,
                leave comments, and make edits collaboratively. Version history
                ensures you never lose work, and permission controls let you
                decide who can view or edit your projects. Perfect for teams and
                agencies.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Layers className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Multi-track Timeline
              </h2>
              <p className="text-gray-300">
                Our sophisticated multi-track timeline supports unlimited video,
                audio, and effect layers. Create complex compositions with
                overlays, picture-in-picture, and advanced masking. Easily
                manage and organize your timeline with color coding and
                grouping.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Sparkles className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Effects Library</h2>
              <p className="text-gray-300">
                Access hundreds of built-in transitions, filters, and effects to
                enhance your videos. From subtle color grading to dramatic
                visual effects, our library has everything you need. Create and
                save custom presets to maintain consistent styling across
                projects.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Palette className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Color Grading</h2>
              <p className="text-gray-300">
                Professional-grade color correction and grading tools give you
                complete control over your video's look. Adjust exposure,
                contrast, saturation, and more with precision controls. Apply
                LUTs or create your own custom color profiles for a cinematic
                feel.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Video className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Motion Graphics</h2>
              <p className="text-gray-300">
                Create stunning animated titles, lower thirds, and graphics
                without leaving the app. Our intuitive keyframe animation system
                makes it easy to bring your ideas to life. Import and animate
                vector graphics for smooth, scalable motion elements.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Music className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Audio Editing</h2>
              <p className="text-gray-300">
                Comprehensive audio tools for mixing, equalizing, and enhancing
                your soundtrack. Remove background noise, adjust levels, and
                apply effects to create the perfect audio mix. Synchronize music
                to your video with automatic beat detection and tempo matching.
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <Cpu className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                AI-Powered Automation
              </h2>
              <p className="text-gray-300">
                Let AI handle tedious tasks like scene detection, content-aware
                cropping, and automatic subtitling. Smart editing suggestions
                help you create better videos faster. AI can even analyze your
                footage and recommend the best cuts and transitions.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
