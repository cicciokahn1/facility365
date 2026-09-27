"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/lib/auth/scope";
import { useCollectionItems } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const steps: {
  href: string;
  module: "organizations" | "customers" | "properties" | "users" | "orders";
  labelKey: TranslationKey;
}[] = [
  { href: "/organizations?new=1", module: "organizations", labelKey: "module.organizations.singular" },
  { href: "/customers?new=1", module: "customers", labelKey: "module.customers.singular" },
  { href: "/properties?new=1", module: "properties", labelKey: "module.properties.singular" },
  { href: "/users?new=1", module: "users", labelKey: "module.users.singular" },
  { href: "/orders?new=1", module: "orders", labelKey: "module.orders.singular" },
];

export function OnboardingChecklist() {
  const t = useT();
  const access = useAccess();
  const collections = {
    organizations: useCollectionItems("organizations"),
    customers: useCollectionItems("customers"),
    properties: useCollectionItems("properties"),
    users: useCollectionItems("users"),
    orders: useCollectionItems("orders"),
  };

  const visibleSteps = steps.filter((step) => access.canRead(step.module));
  const completed = visibleSteps.filter(
    (step) => collections[step.module].filter((item) => access.visible(step.module, item)).length > 0,
  );
  if (visibleSteps.length === 0 || completed.length === visibleSteps.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("onboarding.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("onboarding.hint")}</p>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSteps.map((step) => {
          const done =
            collections[step.module].filter((item) => access.visible(step.module, item)).length > 0;
          return (
            <Link
              key={step.module}
              href={step.href}
              className="flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              {done ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0 flex-1 text-sm font-medium">{t(step.labelKey)}</span>
              {!done ? <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
