import Header from "@/components/landing-header";
import Footer from "@/components/landing-footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
            About Synapse Studio
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                Our Mission
              </h2>
              <p className="text-gray-300 leading-relaxed">
                At Synapse Studio, we're on a mission to democratize video
                creation by harnessing the power of AI. We believe that everyone
                should have access to professional-grade video editing tools,
                regardless of their technical expertise or budget. Our platform
                bridges the gap between complex professional software and simple
                consumer apps, providing an intuitive yet powerful experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                Our Story
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Synapse Studio was born from a simple observation: creating
                high-quality video content was too complex and time-consuming
                for most people. Our founders, a team of AI researchers and
                video production professionals, set out to build a solution that
                would make video editing accessible to everyone.
              </p>
              <p className="text-gray-300 leading-relaxed">
                After years of research and development, we launched Synapse
                Studio with a vision to transform how people create videos. By
                combining cutting-edge AI technology with an intuitive
                interface, we've created a platform that simplifies the video
                creation process without sacrificing quality or creative
                control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                Our Technology
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Synapse Studio leverages state-of-the-art AI models to automate
                tedious aspects of video editing while giving you complete
                creative control. Our platform includes advanced features like
                AI-generated assets, intelligent scene detection, automated
                color grading, and much more. Built on open-source technologies,
                we're committed to transparency and continuous improvement
                through community collaboration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                Join Our Community
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We believe in the power of community and collaboration. Join our
                growing community of creators, from hobbyists to professionals,
                who are using Synapse Studio to bring their creative visions to
                life. Share your projects, learn from others, and help shape the
                future of video creation.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
