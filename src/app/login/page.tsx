"use client";

/**
 * Anmeldung und Registrierung.
 *
 * Dieselbe Adresse gilt fuer alle Hauswarte; getrennt werden die Daten ueber
 * das Konto, nicht ueber das Geraet.
 */
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/provider";
import { passwordProblem } from "@/lib/auth/errors";
import { BRAND_LOGO_SRC } from "@/lib/branding/logo";
import { useT } from "@/lib/i18n/provider";
import { useTrial } from "@/lib/trial/provider";
import Link from "next/link";

type Mode = "signIn" | "signUp" | "reset";

function LoginForm() {
  const t = useT();
  const auth = useAuth();
  const router = useRouter();
  const trial = useTrial();
  const params = useSearchParams();
  const target = params.get("next") || "/dashboard";

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (auth.user) router.replace(target);
  }, [auth.user, router, target]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setHint("");
    const weak = mode === "signUp" ? passwordProblem(password) : null;
    const message =
      weak ??
      (mode === "signIn"
        ? await auth.signIn(email.trim(), password)
        : mode === "signUp"
          ? await auth.signUp(email.trim(), password)
          : await auth.requestReset(email.trim()));
    setBusy(false);
    if (message) {
      setError(t(message));
      return;
    }
    if (mode === "signUp") setHint(t("auth.checkMail"));
    if (mode === "reset") setHint(t("auth.resetSent"));
  };

  if (!auth.enabled) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.signIn")}</CardTitle>
          <CardDescription data-testid="auth-disabled">
            {t("auth.notConfigured")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="h-11 w-full"
            data-testid="trial-start"
            onClick={() => {
              trial.start();
              router.replace("/dashboard");
            }}
          >
            {t("trial.start")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("trial.noCard")} {t("trial.separate")}
          </p>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => router.replace("/dashboard")}
          >
            {t("auth.continueLocal")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm" data-testid="login-card">
      <CardHeader>
        <CardTitle>
          {mode === "signIn"
            ? t("auth.signIn")
            : mode === "signUp"
              ? t("auth.signUp")
              : t("auth.resetTitle")}
        </CardTitle>
        <CardDescription>
          {mode === "reset" ? t("auth.resetIntro") : t("auth.intro")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center text-sm">
          <Link className="text-primary underline-offset-4 hover:underline" href="/pricing">
            Preise und Angebot ansehen
          </Link>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="auth-email">{t("auth.email")}</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              className="h-11"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              data-testid="auth-email"
            />
          </div>
          {mode === "reset" ? null : (
            <div className="space-y-2">
              <Label htmlFor="auth-password">{t("auth.password")}</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={
                  mode === "signIn" ? "current-password" : "new-password"
                }
                required
                minLength={10}
                className="h-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                data-testid="auth-password"
              />
              {mode === "signUp" ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("auth.passwordRule")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("trial.start")} – {t("trial.noCard")}
                  </p>
                </>
              ) : null}
            </div>
          )}

          {error ? (
            <p className="text-sm text-destructive" data-testid="auth-error">
              {error}
            </p>
          ) : null}
          {hint ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="auth-hint"
            >
              {hint}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={busy}
            data-testid="auth-submit"
          >
            {mode === "signIn"
              ? t("auth.signIn")
              : mode === "signUp"
                ? t("auth.signUp")
                : t("auth.resetTitle")}
          </Button>
        </form>

        <Button
          variant="link"
          className="mt-2 w-full"
          onClick={() => {
            setMode(mode === "signUp" ? "signIn" : "signUp");
            setError("");
            setHint("");
          }}
          data-testid="auth-switch"
        >
          {mode === "signUp" ? t("auth.toSignIn") : t("auth.toSignUp")}
        </Button>

        <Button
          variant="link"
          className="w-full"
          onClick={() => {
            setMode(mode === "reset" ? "signIn" : "reset");
            setError("");
            setHint("");
          }}
          data-testid="auth-forgot"
        >
          {mode === "reset" ? t("auth.toSignIn") : t("auth.forgot")}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- statische Marke ohne Groessenwechsel */}
      <img
        src={BRAND_LOGO_SRC}
        alt="Facility365"
        data-testid="login-logo"
        className="h-20 w-auto max-w-[240px] rounded object-contain dark:bg-white/95 dark:p-2"
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
