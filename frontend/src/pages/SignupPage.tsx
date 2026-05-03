import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setTokens } from '@/lib/auth';
import { registerUser } from '@/lib/api/registerUser';

type FieldId = 'email' | 'password' | 'confirm';
type FieldErrors = Partial<Record<FieldId, string>>;

const FIELD_ORDER: FieldId[] = ['email', 'password', 'confirm'];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validateClientSide(
  email: string,
  password: string,
  confirm: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) {
    errors.email = 'Please enter your email.';
  } else if (!EMAIL_PATTERN.test(trimmed)) {
    errors.email = "That doesn't look like a valid email.";
  }
  if (!password) {
    errors.password = 'Please choose a password.';
  } else if (password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  }
  if (confirm !== password) {
    errors.confirm = "Passwords don't match.";
  }
  return errors;
}

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  function focusFirstInvalid(invalid: FieldErrors) {
    const first = FIELD_ORDER.find((f) => invalid[f]);
    if (!first) return;
    if (first === 'email') emailRef.current?.focus();
    else if (first === 'password') passwordRef.current?.focus();
    else confirmRef.current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validateClientSide(email, password, confirm);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstInvalid(clientErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const result = await registerUser({ email: email.trim(), password });
    setSubmitting(false);

    if (result.ok) {
      setTokens(result.tokens);
      navigate('/onboarding/welcome');
      return;
    }

    if (result.reason === 'duplicate') {
      const next = { email: 'That email is already registered. Try signing in instead.' };
      setErrors(next);
      focusFirstInvalid(next);
      return;
    }

    if (result.reason === 'invalid') {
      const message =
        result.messages.length > 0
          ? result.messages.join(' ')
          : 'Please check your details and try again.';
      setFormError(message);
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
          <h1 className="text-3xl font-semibold text-espresso">Create your account</h1>
          <p className="text-espresso/70">
            Plain emails and a password. Nothing else, for now.
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError && (
            <p
              ref={formErrorRef}
              role="alert"
              tabIndex={-1}
              className="rounded-xl bg-cream px-4 py-3 text-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              {formError}
            </p>
          )}

          <div className="space-y-1">
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-espresso"
            >
              Email
            </label>
            <input
              id="signup-email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              className="block w-full min-h-11 rounded-xl border border-espresso/20 bg-cream px-3 py-2 text-espresso placeholder:text-espresso/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
            {errors.email && (
              <p id="signup-email-error" className="text-sm text-terracotta">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-espresso"
            >
              Password
            </label>
            <input
              id="signup-password"
              ref={passwordRef}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={
                errors.password ? 'signup-password-error' : 'signup-password-helper'
              }
              className="block w-full min-h-11 rounded-xl border border-espresso/20 bg-cream px-3 py-2 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
            {errors.password ? (
              <p id="signup-password-error" className="text-sm text-terracotta">
                {errors.password}
              </p>
            ) : (
              <p id="signup-password-helper" className="text-sm text-espresso/70">
                At least 8 characters.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="signup-confirm"
              className="block text-sm font-medium text-espresso"
            >
              Confirm password
            </label>
            <input
              id="signup-confirm"
              ref={confirmRef}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={errors.confirm ? 'true' : 'false'}
              aria-describedby={errors.confirm ? 'signup-confirm-error' : undefined}
              className="block w-full min-h-11 rounded-xl border border-espresso/20 bg-cream px-3 py-2 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
            {errors.confirm && (
              <p id="signup-confirm-error" className="text-sm text-terracotta">
                {errors.confirm}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full rounded-xl bg-espresso text-cream min-h-11 px-4 py-2.5 font-medium shadow-sm transition hover:bg-espresso/90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-espresso/70 text-center">
          Already have an account? Sign in is coming soon.
        </p>
      </div>
    </main>
  );
}
