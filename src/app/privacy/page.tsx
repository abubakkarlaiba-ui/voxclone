import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description: `How ${APP_NAME} handles your voice data and personal information.`,
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-text-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose-custom mt-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-text-primary">1. Introduction</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {APP_NAME} is an AI voice generation tool. This privacy policy explains how we collect, use, and protect your data when you use our service. We are committed to being transparent about our practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">2. Voice Data</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Voice samples you upload or record are used solely to create AI voice clones for your personal use. Your voice data is:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Stored only on our servers and not shared with third parties.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Used exclusively for voice cloning processing on your behalf.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Permanently deleted when you delete your voice profile or account.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Never used to train AI models or shared with AI providers beyond what is necessary for processing your requests.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">3. Generated Audio</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Audio files generated from text-to-speech are stored in your account history. You may delete individual generated audio files or clear your entire generation history at any time. Deleted audio cannot be recovered.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">4. Account Information</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              We collect your email address and name for account identification and communication purposes only. We do not sell or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">5. Data Security</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              We use industry-standard encryption for data in transit and at rest. Authentication credentials are securely hashed. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">6. Data Retention</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Your voice data, generated audio, and account information are retained as long as your account is active. You may delete your data at any time through the application. Upon account deletion, all associated data is permanently removed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">7. Third-Party Services</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              We use third-party AI voice providers (such as ElevenLabs) to process voice cloning requests. Your voice samples are transmitted to these providers solely for the purpose of generating your AI voice. We do not control how these providers handle data after processing is complete.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">8. Your Rights</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              You have the right to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Access and download your data.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Delete your voice profiles and all associated samples.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Delete your generated audio history.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Delete your account and all associated data.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">9. Changes to This Policy</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              We may update this privacy policy from time to time. We will notify you of significant changes by posting the updated policy on this page with a revised date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">10. Contact</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              If you have questions about this privacy policy or how your data is handled, please contact us through the application.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
