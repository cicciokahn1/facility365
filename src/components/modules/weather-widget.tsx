'use client';

/**
 * Kompaktes Wetter im Dashboard.
 *
 * Zuerst wird der zuletzt gewaehlte Ort verwendet, sonst der Geraetestandort;
 * fehlt die Berechtigung, kann der Ort manuell gesucht werden. Das Widget
 * bleibt einzeilig und laedt nur eine kleine Abfrage.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Sun,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import {
  WeatherNow,
  WeatherPlace,
  currentWeather,
  devicePlace,
  placeName,
  readPlace,
  searchPlaces,
  weatherTextKey,
  writePlace,
} from '@/lib/weather/service';

function WeatherIcon({ code }: { code: number | null }) {
  const className = 'size-5 shrink-0 text-primary';
  if (code === null) return <Cloud className={className} aria-hidden />;
  if (code === 0) return <Sun className={className} aria-hidden />;
  if (code <= 2) return <CloudSun className={className} aria-hidden />;
  if (code === 3) return <Cloud className={className} aria-hidden />;
  if (code <= 48) return <CloudFog className={className} aria-hidden />;
  if (code <= 57) return <CloudDrizzle className={className} aria-hidden />;
  if (code <= 67) return <CloudRain className={className} aria-hidden />;
  if (code <= 77) return <CloudSnow className={className} aria-hidden />;
  if (code <= 82) return <CloudRain className={className} aria-hidden />;
  if (code <= 86) return <CloudSnow className={className} aria-hidden />;
  return <CloudLightning className={className} aria-hidden />;
}

export function WeatherWidget() {
  const t = useT();
  const { settings } = useSettings();
  const language = settings.language || 'de';
  const [place, setPlace] = useState<WeatherPlace | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [failed, setFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [hits, setHits] = useState<WeatherPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const started = useRef(false);

  const load = useCallback(async (target: WeatherPlace) => {
    try {
      const now = await currentWeather(target.latitude, target.longitude);
      setWeather(now);
      setFailed(false);
    } catch {
      setWeather(null);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = () => {
      void (async () => {
        const saved = readPlace();
        if (saved) {
          const permission =
            typeof navigator !== 'undefined' && navigator.permissions
              ? await navigator.permissions.query({ name: 'geolocation' })
              : null;
          if (permission?.state !== 'granted') {
            setPlace(saved);
            await load(saved);
            return;
          }
        }
        const position = await devicePlace();
        if (!position) {
          if (saved) {
            setPlace(saved);
            await load(saved);
            return;
          }
          setFailed(true);
          return;
        }
        const name = await placeName(position.latitude, position.longitude, language);
        const target: WeatherPlace = { ...position, name };
        setPlace(target);
        writePlace(target);
        await load(target);
      })();
    };
    const idle = window.requestIdleCallback;
    if (idle) {
      const idleId = idle(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = window.setTimeout(start, 800);
    return () => window.clearTimeout(timer);
  }, [language, load]);

  const search = async () => {
    const value = term.trim();
    if (value.length < 2) return;
    setSearching(true);
    try {
      setHits(await searchPlaces(value, language));
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  };

  const choose = (target: WeatherPlace) => {
    setPlace(target);
    writePlace(target);
    setPickerOpen(false);
    setTerm('');
    setHits([]);
    void load(target);
  };

  return (
    <>
      <div
        className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm"
        data-testid="weather-widget"
      >
        <WeatherIcon code={weather ? weather.code : null} />
        {weather ? (
          <>
            <span className="font-semibold tabular-nums">{Math.round(weather.temperature)}°C</span>
            <span className="hidden text-muted-foreground sm:inline">
              {t(weatherTextKey(weather.code))}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            {failed ? t('weather.unavailable') : t('weather.loading')}
          </span>
        )}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          data-testid="weather-place"
          className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="max-w-[9rem] truncate">{place?.name || t('weather.choosePlace')}</span>
        </button>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('weather.choosePlace')}</DialogTitle>
            <DialogDescription>{t('weather.searchHint')}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void search();
                }
              }}
              placeholder={t('weather.searchPlaceholder')}
              data-testid="weather-search"
            />
            <Button onClick={() => void search()} disabled={searching}>
              {t('action.search')}
            </Button>
          </div>
          <ul className="max-h-60 divide-y overflow-y-auto">
            {hits.map((hit) => (
              <li key={`${hit.latitude}-${hit.longitude}`}>
                <button
                  type="button"
                  onClick={() => choose(hit)}
                  data-testid="weather-hit"
                  className="w-full py-2 text-left text-sm hover:text-primary"
                >
                  {hit.name}
                </button>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            onClick={() => {
              void (async () => {
                const position = await devicePlace();
                if (!position) {
                  setFailed(true);
                  return;
                }
                const name = await placeName(position.latitude, position.longitude, language);
                choose({ ...position, name });
              })();
            }}
            data-testid="weather-device"
          >
            <MapPin className="size-4" aria-hidden />
            {t('weather.useDevice')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
