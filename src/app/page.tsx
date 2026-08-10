import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

const features = [
  {
    title: "Voice Cloning",
    description: "Create a precise AI replica of your voice from a short recording. Our technology captures your unique vocal characteristics.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: "Text to Speech",
    description: "Convert any text into natural-sounding speech using your cloned voice. Supports multiple languages and speaking styles.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    ),
  },
  {
    title: "Instant Preview",
    description: "Listen to generated speech instantly before downloading. Fine-tune and regenerate until you get the perfect result.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Multiple Formats",
    description: "Export your generated audio in MP3, WAV, or OGG formats. Choose the quality and format that fits your needs.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    title: "Secure & Private",
    description: "Your voice data is encrypted and stored securely. You have full control over your recordings and can delete them anytime.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Voice Management",
    description: "Organize your voice profiles in one place. Create multiple voices for different use cases and switch between them instantly.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Record Your Voice",
    description: "Use your microphone to record a high-quality voice sample. Just 30 seconds is enough to create your AI voice.",
  },
  {
    number: "02",
    title: "AI Learns Your Voice",
    description: "Our AI analyzes your unique vocal characteristics — tone, pitch, rhythm, and speaking patterns.",
  },
  {
    number: "03",
    title: "Generate Speech",
    description: "Type any text and generate natural-sounding speech in your AI voice. Preview, adjust, and download.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary page-enter">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-accent-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent-secondary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-primary bg-bg-card px-4 py-1.5 text-xs font-medium text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              AI-Powered Voice Generation
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Your Voice,{" "}
              <span className="gradient-text">Powered by AI</span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-text-secondary sm:text-xl">
              Record your voice once, then generate unlimited speech in your own
              voice. Create personalized voiceovers, narrations, and more with
              cutting-edge AI technology.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={ROUTES.STUDIO}>
                <Button variant="primary" size="xl">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Record Your Voice
                </Button>
              </Link>
              <Link href={ROUTES.TEXT_TO_SPEECH}>
                <Button variant="glass" size="xl">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Text to Speech
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No credit card required
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                30-second setup
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border-primary bg-bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">
              Everything you need
            </h2>
            <p className="mx-auto max-w-2xl text-text-secondary">
              A complete voice generation platform with professional-grade features
              designed for creators, developers, and businesses.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border-primary bg-bg-card p-6 transition-all duration-300 hover:border-border-secondary hover:bg-bg-card-hover"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary transition-colors group-hover:bg-accent-primary/15">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto max-w-2xl text-text-secondary">
              Get started in three simple steps. No technical knowledge required.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary text-lg font-bold text-white shadow-lg shadow-accent-primary/20">
                  {step.number}
                </div>
                {step.number !== "03" && (
                  <div className="absolute left-2/3 top-7 hidden h-px w-full bg-gradient-to-r from-border-primary to-transparent md:block" />
                )}
                <h3 className="mb-2 text-lg font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mx-auto max-w-xs text-sm text-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="border-t border-border-primary bg-bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
              <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">
              Your voice is safe with us
            </h2>
            <p className="mb-8 text-text-secondary">
              We take privacy seriously. Your voice recordings are encrypted at rest
              and in transit. We never share your data with third parties, and you
              can delete your voice profiles at any time.
            </p>
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                End-to-end encryption
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No data sharing
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Delete anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border-primary bg-gradient-to-br from-bg-tertiary to-bg-secondary p-12 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-accent-primary/10 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-accent-secondary/10 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-text-secondary">
                Join thousands of creators using AI voice technology. Start
                recording your voice today and see the magic.
              </p>
              <Link href={ROUTES.STUDIO}>
                <Button variant="primary" size="xl">
                  Start Recording Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
