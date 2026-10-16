type AuthFailure = { code?: string; status?: number };
type SignUpData = { user: unknown | null; session: unknown | null };

export const pendingConfirmationMessage =
  'If this email can be registered, check your inbox for a confirmation link. You can also sign in if you already have an account.';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const duplicateCodes = new Set(['email_exists', 'user_already_exists']);
const rateLimitCodes = new Set(['over_email_send_rate_limit', 'over_request_rate_limit']);

export function validateRegistration(fullNameInput: string, emailInput: string, password: string) {
  const fullName = fullNameInput.trim();
  const email = emailInput.trim();

  if (!fullName || fullName.length > 100) {
    return { ok: false as const, message: 'Enter a full name of up to 100 characters.' };
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return { ok: false as const, message: 'Enter a valid email address.' };
  }
  if (password.length < 8) {
    return { ok: false as const, message: 'Use a password with at least 8 characters.' };
  }
  return { ok: true as const, fullName, email };
}

export function registrationOutcome(data: SignUpData, error: AuthFailure | null) {
  if (error) {
    if (error.code && duplicateCodes.has(error.code)) {
      return { kind: 'pending' as const, message: pendingConfirmationMessage };
    }
    return { kind: 'error' as const, message: registrationErrorMessage(error) };
  }
  if (data.session) {
    return { kind: 'authenticated' as const, message: 'Account ready. You are signed in.' };
  }
  if (data.user) {
    return { kind: 'pending' as const, message: pendingConfirmationMessage };
  }
  return { kind: 'error' as const, message: 'Registration is unavailable. Please try again.' };
}

function registrationErrorMessage(error: AuthFailure) {
  if (error.status === 429 || (error.code && rateLimitCodes.has(error.code))) {
    return 'Too many attempts. Wait a while and try again.';
  }
  if (error.code === 'weak_password') {
    return 'Password does not meet the project requirements. Try a stronger password.';
  }
  if (error.code === 'email_address_invalid' || error.code === 'validation_failed') {
    return 'Check your email address and password, then try again.';
  }
  return 'Registration is unavailable. Please try again.';
}

export function signInErrorMessage(error: AuthFailure) {
  if (error.status === 429 || (error.code && rateLimitCodes.has(error.code))) {
    return 'Too many attempts. Wait a while and try again.';
  }
  if (error.code === 'email_not_confirmed') {
    return 'Unable to sign in. Confirm your email if you recently registered.';
  }
  if (error.status && error.status >= 500) {
    return 'Authentication is temporarily unavailable. Please try again later.';
  }
  return 'Unable to sign in. Check your credentials and try again.';
}
