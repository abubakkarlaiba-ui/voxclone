import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Terms of Service — ${APP_NAME}`,
  description: `Terms and conditions for using ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border-primary bg-bg-secondary/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="font-bold text-text-primary">{APP_NAME}</span>
          </Link>
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">Terms of Service</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose-custom mt-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-text-primary">1. Acceptance of Terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              By accessing or using {APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">2. Voice Ownership and Consent</h2>
            <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
              <p className="text-sm font-medium text-warning">Important: You must own or have permission to use any voice you clone.</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              When you create an AI voice clone using {APP_NAME}, you represent and warrant that:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>The voice belongs to you, OR you have obtained explicit, informed consent from the voice owner to clone their voice.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>You will not use cloned voices to impersonate, deceive, defraud, or harm others.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>You will not use the service to create misleading, fraudulent, or harmful content.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>You will comply with all applicable laws regarding voice cloning and synthetic media in your jurisdiction.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">3. Prohibited Uses</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              You may not use {APP_NAME} to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Impersonate any person without their explicit consent.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Create content designed to deceive, defraud, or manipulate others.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Generate spam, harassment, or abusive content.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Violate any applicable law or regulation.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Attempt to reverse-engineer, exploit, or circumvent service limitations.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">4. Your Data</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              You retain ownership of your voice samples, generated audio, and text inputs. You may delete your data at any time through the application. See our <Link href="/privacy" className="text-accent-primary hover:underline">Privacy Policy</Link> for details on how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">5. Service Availability</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {APP_NAME} is provided as-is. We may modify, suspend, or discontinue the service at any time without notice. We are not liable for any disruption or loss of data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">6. Limitation of Liability</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              To the maximum extent permitted by law, {APP_NAME} and its operators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">7. Changes to Terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
