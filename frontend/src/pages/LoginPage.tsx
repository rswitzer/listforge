import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setTokens } from '@/lib/auth';
import { loginUser } from '@/lib/api/loginUser';

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6zm0 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type FieldId = 'email' | 'password';
type FieldErrors = Partial<Record<FieldId, string>>;

const FIELD_ORDER: FieldId[] = ['email', 'password'];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validateClientSide(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) {
    errors.email = 'Please enter your email.';
  } else if (!EMAIL_PATTERN.test(trimmed)) {
    errors.email = "That doesn't look like a valid email.";
  }
  if (!password) {
    errors.password = 'Please enter your password.';
  }
  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  function focusFirstInvalid(invalid: FieldErrors) {
    const first = FIELD_ORDER.find((f) => invalid[f]);
    if (!first) return;
    if (first === 'email') emailRef.current?.focus();
    else passwordRef.current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validateClientSide(email, password);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstInvalid(clientErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const result = await loginUser({ email: email.trim(), password });
    setSubmitting(false);

    if (result.ok) {
      setTokens(result.tokens);
      navigate('/onboarding/welcome');
      return;
    }

    if (result.reason === 'invalid') {
      setFormError("That email or password didn't match. Try again.");
      requestAnimationFrame(() => formErrorRef.current?.focus());
      return;
    }

    setFormError("We couldn't reach the server. Check your connection and try again.");
    requestAnimationFrame(() => formErrorRef.current?.focus());
  }

  return (
    <main className="min-h-screen p-6 md:p-12 flex items-start justify-center">
      <div className="max-w-md w-full bg-sand rounded-2xl shadow-sm p-8 md:p-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-espresso">Welcome back</h1>
          <p className="text-espresso/70">
            Sign in to keep working on your listings.
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError && (
            <p
              ref={formErrorRef}
              role="alert"
              tabIndex={-1}
              className="flex items-start gap-2 rounded-xl bg-cream px-4 py-3 text-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              <ErrorIcon className="h-5 w-5 flex-none mt-0.5" />
              <span>{formError}</span>
            </p>
          )}

          <div className="space-y-1">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-espresso"
            >
              Email
            </label>
            <input
              id="login-email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className="block w-full min-h-11 rounded-xl border border-espresso/20 bg-cream px-3 py-2 text-espresso placeholder:text-espresso/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
            {errors.email && (
              <p
                id="login-email-error"
                className="flex items-start gap-1.5 text-sm text-terracotta"
              >
                <ErrorIcon className="h-4 w-4 flex-none mt-0.5" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-espresso"
            >
              Password
            </label>
            <input
              id="login-password"
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className="block w-full min-h-11 rounded-xl border border-espresso/20 bg-cream px-3 py-2 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
            {errors.password && (
              <p
                id="login-password-error"
                className="flex items-start gap-1.5 text-sm text-terracotta"
              >
                <ErrorIcon className="h-4 w-4 flex-none mt-0.5" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full rounded-xl bg-espresso text-cream min-h-11 px-4 py-2.5 font-medium shadow-sm transition hover:bg-espresso/90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-espresso/70 text-center">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-espresso underline hover:text-espresso/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
