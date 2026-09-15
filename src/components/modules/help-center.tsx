'use client';

/**
 * Hilfe-Center.
 *
 * Kategorien links, Artikel rechts, Suche ueber alles. Die Inhalte stehen in
 * `@/lib/help/content` und beschreiben nur bestehende Funktionen.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, LifeBuoy, Search } from 'lucide-react';

import { HelpVideos } from '@/components/modules/help-video';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HELP_CATEGORIES, searchHelp } from '@/lib/help/content';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

const ALL = 'all';

export function HelpCenter() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [open, setOpen] = useState<string | null>(null);

  const articles = useMemo(() => {
    const found = searchHelp(query);
    return category === ALL ? found : found.filter((item) => item.categoryId === category);
  }, [category, query]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="size-5" aria-hidden />
            {t('help.title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('help.intro')}</p>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('help.searchPlaceholder')}
              className="pl-9"
              data-testid="help-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === ALL ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(ALL)}
            >
              {t('common.all')}
            </Button>
            {HELP_CATEGORIES.map((item) => (
              <Button
                key={item.id}
                variant={category === item.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(item.id)}
                data-testid={`help-category-${item.id}`}
              >
                {item.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {query.trim() === '' && category === ALL ? <HelpVideos /> : null}

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('help.empty')}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {articles.map((article) => {
          const expanded = open === `${article.categoryId}-${article.id}`;
          return (
            <Card key={`${article.categoryId}-${article.id}`}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : `${article.categoryId}-${article.id}`)}
                aria-expanded={expanded}
                data-testid={`help-article-${article.id}`}
                className="flex w-full items-start gap-3 px-6 py-4 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {article.categoryTitle}
                  </span>
                  <span className="block text-base font-semibold">{article.title}</span>
                  <span className="block text-sm text-muted-foreground">{article.summary}</span>
                </span>
                <ChevronDown
                  className={cn('mt-1 size-4 shrink-0 transition-transform', expanded && 'rotate-180')}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <CardContent className="flex flex-col gap-4 border-t pt-4">
                  {article.paragraphs.map((text) => (
                    <p key={text} className="text-sm leading-relaxed">
                      {text}
                    </p>
                  ))}

                  {article.steps ? (
                    <div className="rounded-lg border bg-muted/40 p-4">
                      <p className="mb-3 text-sm font-semibold">{t('help.steps')}</p>
                      <ol className="flex flex-col gap-3">
                        {article.steps.map((step) => (
                          <li key={step.title} className="text-sm">
                            <span className="font-medium">{step.title}</span>
                            <span className="block text-muted-foreground">{step.text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {article.path ? (
                    <div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={article.path}>
                          {t('help.openModule')}
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
