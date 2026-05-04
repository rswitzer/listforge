import { Link } from 'react-router-dom';

const loginLinkClass =
  'text-espresso underline underline-offset-2 hover:text-espresso/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta rounded';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-12 py-4 md:py-6">
        <span className="text-lg font-semibold text-espresso">ListForge</span>
        <Link
          to="/login"
          className={`${loginLinkClass} inline-flex items-center min-h-11 px-2`}
        >
          Log in
        </Link>
      </header>

      <main className="flex-1 px-6 md:px-12 pb-6 md:pb-12 flex items-start justify-center">
        <div className="max-w-xl w-full bg-sand rounded-2xl shadow-sm p-8 md:p-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-espresso">
              Better Etsy listings, from a photo and a few words.
            </h1>
            <p className="text-espresso/70">
              Built for independent makers — sign up in under a minute.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-espresso text-cream min-h-11 px-4 py-2.5 font-medium shadow-sm transition hover:bg-espresso/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Create your account
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </Link>
            <p className="text-sm text-espresso/70">
              Already have an account?{' '}
              <Link to="/login" className={loginLinkClass}>
                Log in
              </Link>
            </p>
          </div>

          <section aria-labelledby="how-it-works" className="space-y-4">
            <h2
              id="how-it-works"
              className="text-xl font-semibold text-espresso"
            >
              How it works
            </h2>
            <ol className="space-y-3 text-espresso/80">
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex-none rounded-full bg-cream text-espresso w-7 h-7 flex items-center justify-center font-semibold"
                >
                  1
                </span>
                <span>Upload photos of your item.</span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex-none rounded-full bg-cream text-espresso w-7 h-7 flex items-center justify-center font-semibold"
                >
                  2
                </span>
                <span>Describe it in a sentence.</span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex-none rounded-full bg-cream text-espresso w-7 h-7 flex items-center justify-center font-semibold"
                >
                  3
                </span>
                <span>Review and publish to Etsy.</span>
              </li>
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}
