export type PasswordValidation = { ok: true } | { ok: false; message: string };

export function validatePasswordStrength(password: string): PasswordValidation {
  if (password.length < 10) {
    return { ok: false, message: 'Password must be at least 10 characters.' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must include at least one letter and one number.' };
  }
  return { ok: true };
}
