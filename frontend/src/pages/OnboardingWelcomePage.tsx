export function OnboardingWelcomePage() {
  return (
    <main className="min-h-screen p-6 md:p-12 flex items-start justify-center">
      <div className="max-w-xl w-full bg-sand rounded-2xl shadow-sm p-8 md:p-10 space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-espresso">
            You're in. Let's connect your Etsy shop.
          </h1>
          <p className="text-espresso/70">
            ListForge needs your Etsy connection before it can build listings for
            you. We'll walk you through it next.
          </p>
        </header>

        <div className="flex flex-col items-stretch gap-2">
          <button
            type="button"
            disabled
            aria-describedby="onboarding-welcome-helper"
            className="rounded-xl bg-espresso text-cream min-h-11 px-4 py-2.5 font-medium shadow-sm disabled:opacity-60"
          >
            Connect Etsy
          </button>
          <p
            id="onboarding-welcome-helper"
            className="text-sm text-espresso/70 text-center"
          >
            Coming soon — this lands with the Etsy connection feature.
          </p>
        </div>
      </div>
    </main>
  );
}
