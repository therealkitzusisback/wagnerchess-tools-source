import "server-only";
import { cookies } from "next/headers";
import { germanEnabled } from "@/lib/languages";

export type Lang = "de" | "en";

// Working language is ENGLISH. German is only available while the admin has switched it on (/admin/languages);
// even then English stays the default and German is the visitor's choice (cookie "lang").
export async function getLang(): Promise<Lang> {
  if (!(await germanEnabled())) return "en";
  const value = (await cookies()).get("lang")?.value;
  return value === "de" ? "de" : "en";
}

export const authText = {
  de: {
    brand: "WagnerChess",
    login: {
      title: "Anmelden",
      email: "E-Mail",
      password: "Passwort",
      submit: "Anmelden",
      forgot: "Passwort vergessen?",
      noAccount: "Noch kein Konto?",
      registerLink: "Konto erstellen",
    },
    register: {
      title: "Konto erstellen",
      name: "Name",
      email: "E-Mail",
      password: "Passwort",
      passwordHint: "Mindestens 10 Zeichen",
      confirm: "Passwort wiederholen",
      consentBefore: "Ich akzeptiere die",
      terms: "Nutzungsbedingungen",
      and: "und die",
      privacy: "Datenschutzerklärung",
      submit: "Konto erstellen",
      haveAccount: "Schon registriert?",
      loginLink: "Anmelden",
    },
    checkEmail: {
      title: "Bestätigen Sie Ihre E-Mail",
      body: "Wir haben Ihnen einen Link geschickt. Öffnen Sie ihn, um Ihr Konto zu aktivieren. Schauen Sie auch im Spam-Ordner nach.",
      back: "Zur Anmeldung",
    },
    forgot: {
      title: "Passwort zurücksetzen",
      intro: "Geben Sie Ihre E-Mail-Adresse ein. Wir schicken Ihnen einen Link zum Zurücksetzen.",
      submit: "Link senden",
      sent: "Falls ein Konto mit dieser Adresse existiert, ist ein Link unterwegs.",
      back: "Zurück zur Anmeldung",
    },
    reset: {
      title: "Neues Passwort festlegen",
      password: "Neues Passwort",
      confirm: "Passwort wiederholen",
      submit: "Passwort speichern",
    },
    account: {
      title: "Ihr Konto",
      signedInAs: "Angemeldet als",
      logout: "Abmelden",
    },
    errors: {
      invalid: "E-Mail oder Passwort stimmt nicht.",
      unconfirmed: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.",
      emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      nameRequired: "Bitte geben Sie Ihren Namen ein.",
      pwShort: "Das Passwort braucht mindestens 10 Zeichen.",
      pwMismatch: "Die Passwörter stimmen nicht überein.",
      consent: "Bitte stimmen Sie den Bedingungen zu.",
      linkInvalid: "Der Link ist abgelaufen oder ungültig. Fordern Sie einen neuen an.",
      rateLimit: "Zu viele Versuche. Warten Sie ein paar Minuten und versuchen Sie es erneut.",
      generic: "Etwas ist schiefgelaufen. Versuchen Sie es in ein paar Minuten erneut.",
    },
  },
  en: {
    brand: "WagnerChess",
    login: {
      title: "Log in",
      email: "Email",
      password: "Password",
      submit: "Log in",
      forgot: "Forgot your password?",
      noAccount: "No account yet?",
      registerLink: "Create an account",
    },
    register: {
      title: "Create an account",
      name: "Name",
      email: "Email",
      password: "Password",
      passwordHint: "At least 10 characters",
      confirm: "Repeat password",
      consentBefore: "I accept the",
      terms: "Terms of Service",
      and: "and the",
      privacy: "Privacy Policy",
      submit: "Create account",
      haveAccount: "Already registered?",
      loginLink: "Log in",
    },
    checkEmail: {
      title: "Confirm your email",
      body: "We sent you a link. Open it to activate your account. Check your spam folder too.",
      back: "Back to log in",
    },
    forgot: {
      title: "Reset your password",
      intro: "Enter your email address. We will send you a link to reset it.",
      submit: "Send link",
      sent: "If an account exists for this address, a link is on its way.",
      back: "Back to log in",
    },
    reset: {
      title: "Set a new password",
      password: "New password",
      confirm: "Repeat password",
      submit: "Save password",
    },
    account: {
      title: "Your account",
      signedInAs: "Signed in as",
      logout: "Log out",
    },
    errors: {
      invalid: "Email or password is incorrect.",
      unconfirmed: "Please confirm your email address first.",
      emailInvalid: "Please enter a valid email address.",
      nameRequired: "Please enter your name.",
      pwShort: "Your password needs at least 10 characters.",
      pwMismatch: "The passwords do not match.",
      consent: "Please accept the terms to continue.",
      linkInvalid: "The link has expired or is invalid. Request a new one.",
      rateLimit: "Too many attempts. Wait a few minutes and try again.",
      generic: "Something went wrong. Try again in a few minutes.",
    },
  },
} as const;
