"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

export default function AppError({ reset }: { reset: () => void }) {
  const t = useT();

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{t("app.errorTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("app.errorText")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>{t("common.retry")}</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">{t("nav.overview")}</Link>
        </Button>
      </div>
    </main>
  );
}
