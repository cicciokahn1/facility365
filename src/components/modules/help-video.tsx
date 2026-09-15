'use client';

/**
 * Hilfevideos im Hilfe-Center.
 *
 * Ein Video läuft als Abfolge echter Bildschirme mit Untertitel automatisch
 * ab. Bedienung bewusst minimal: «Video starten», Pause, Zurück/Weiter.
 * Ist eine echte Videodatei hinterlegt (Einführungsvideo), wird sie mit
 * Start/Pause und Vollbild abgespielt.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Maximize2, Pause, Play, PlayCircle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { HELP_INTRO_VIDEO, HELP_SHORT_VIDEOS, type HelpVideo } from '@/lib/help/videos';
import { useT } from '@/lib/i18n/provider';

const TICK_MS = 100;

function totalSeconds(video: HelpVideo) {
  return video.durationSeconds ?? video.scenes.reduce((sum, scene) => sum + scene.seconds, 0);
}

function useDurationLabel() {
  const t = useT();
  return (video: HelpVideo) => {
    const seconds = totalSeconds(video);
    return seconds >= 60
      ? t('help.video.duration', { minutes: Math.round(seconds / 60) })
      : t('help.video.durationSeconds', { seconds });
  };
}

export function HelpVideos() {
  const t = useT();
  const duration = useDurationLabel();
  const [active, setActive] = useState<HelpVideo | null>(null);

  return (
    <>
      <Card data-testid="help-video-section">
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="size-5" aria-hidden />
            {t('help.video.section')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('help.video.sectionHint')}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setActive(HELP_INTRO_VIDEO)}
            className="group relative overflow-hidden rounded-xl border bg-muted text-left"
            data-testid="help-video-intro"
            aria-label={`${t('help.video.start')}: ${HELP_INTRO_VIDEO.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HELP_INTRO_VIDEO.poster ?? HELP_INTRO_VIDEO.scenes[0].image}
              alt=""
              className="aspect-video w-full object-cover object-top opacity-90 transition-opacity group-hover:opacity-100"
              loading="lazy"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 text-white">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary shadow-lg sm:size-20">
                <Play className="size-8 fill-current sm:size-10" aria-hidden />
              </span>
              <span className="text-lg font-semibold sm:text-xl">{t('help.video.start')}</span>
              <span className="text-xs opacity-90 sm:text-sm">
                {HELP_INTRO_VIDEO.summary} · {duration(HELP_INTRO_VIDEO)}
              </span>
            </span>
          </button>

          <div>
            <p className="mb-2 text-sm font-semibold">{t('help.video.shorts')}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {HELP_SHORT_VIDEOS.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setActive(video)}
                  className="flex min-h-16 items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left hover:border-primary/50"
                  data-testid={`help-video-${video.id}`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Play className="size-5 fill-current" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{video.title}</span>
                    <span className="block text-xs text-muted-foreground">{duration(video)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={active !== null} onOpenChange={(open) => (open ? null : setActive(null))}>
        <DialogContent className="max-w-4xl gap-3 p-4 sm:p-6">
          {active ? <HelpVideoPlayer video={active} onClose={() => setActive(null)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function HelpVideoPlayer({ video, onClose }: { video: HelpVideo; onClose: () => void }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);

  const scene = video.scenes[Math.min(index, video.scenes.length - 1)];
  const total = useMemo(() => totalSeconds(video), [video]);
  const before = useMemo(
    () => video.scenes.slice(0, index).reduce((sum, item) => sum + item.seconds, 0),
    [index, video],
  );
  const progress = Math.min(100, ((before + elapsed) / total) * 100);

  useEffect(() => {
    if (video.src || !playing || finished) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => {
        const next = value + TICK_MS / 1000;
        if (next < scene.seconds) return next;
        if (index + 1 >= video.scenes.length) {
          setFinished(true);
          setPlaying(false);
          return scene.seconds;
        }
        setIndex(index + 1);
        return 0;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [finished, index, playing, scene.seconds, video]);

  const go = (target: number) => {
    setIndex(Math.max(0, Math.min(video.scenes.length - 1, target)));
    setElapsed(0);
    setFinished(false);
    setPlaying(true);
  };

  if (video.src) {
    return <HelpVideoFile video={video} src={video.src} onClose={onClose} />;
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{video.title}</DialogTitle>
        <DialogDescription>{video.summary}</DialogDescription>
      </DialogHeader>

      <div className="relative overflow-hidden rounded-lg border bg-muted" data-testid="help-video-player">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={scene.image + index}
          src={scene.image}
          alt=""
          className="aspect-video w-full object-cover object-top animate-in fade-in duration-500"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-4 pb-4 pt-10 text-white sm:px-6">
          <p className="text-base font-medium leading-snug sm:text-lg" aria-live="polite">
            {finished ? t('help.video.finished') : scene.caption}
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t('help.video.previous')}>
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
          {finished ? (
            <Button size="lg" onClick={() => go(0)} data-testid="help-video-restart">
              <RotateCcw className="size-5" aria-hidden />
              {t('help.video.restart')}
            </Button>
          ) : (
            <Button size="lg" onClick={() => setPlaying((value) => !value)} data-testid="help-video-toggle">
              {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
              {playing ? t('help.video.pause') : t('help.video.resume')}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={() => go(index + 1)}
            disabled={index >= video.scenes.length - 1}
            aria-label={t('help.video.next')}
          >
            <ChevronRight className="size-5" aria-hidden />
          </Button>
          <span className="text-sm text-muted-foreground">
            {index + 1}/{video.scenes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {scene.path ? (
            <Button asChild variant="outline" size="lg" onClick={onClose}>
              <Link href={scene.path}>
                {t('help.video.tryIt')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="lg" onClick={onClose}>
            {t('help.video.close')}
          </Button>
        </div>
      </div>
    </>
  );
}

/** Echte Videodatei: grosse Start/Pause-Taste, Fortschritt, Vollbild. */
function HelpVideoFile({ video, src, onClose }: { video: HelpVideo; src: string; onClose: () => void }) {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    void ref.current?.play().catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const element = ref.current;
    if (!element) return;
    if (element.paused) void element.play();
    else element.pause();
  };

  const restart = () => {
    const element = ref.current;
    if (!element) return;
    element.currentTime = 0;
    void element.play();
  };

  const fullscreen = () => {
    const element = ref.current;
    if (!element) return;
    if (element.requestFullscreen) void element.requestFullscreen();
    else if ('webkitEnterFullscreen' in element) {
      (element as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{video.title}</DialogTitle>
        <DialogDescription>{video.summary}</DialogDescription>
      </DialogHeader>

      <div className="relative overflow-hidden rounded-lg border bg-black" data-testid="help-video-player">
        <video
          ref={ref}
          src={src}
          poster={video.poster}
          playsInline
          preload="metadata"
          className="aspect-video w-full"
          onClick={toggle}
          onPlay={() => {
            setPlaying(true);
            setFinished(false);
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setFinished(true)}
          onTimeUpdate={(event) => {
            const element = event.currentTarget;
            if (element.duration > 0) setProgress((element.currentTime / element.duration) * 100);
          }}
        />
        {!playing ? (
          <button
            type="button"
            onClick={finished ? restart : toggle}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 text-white"
            aria-label={finished ? t('help.video.restart') : t('help.video.start')}
          >
            <span className="flex size-20 items-center justify-center rounded-full bg-primary shadow-lg">
              {finished ? (
                <RotateCcw className="size-10" aria-hidden />
              ) : (
                <Play className="size-10 fill-current" aria-hidden />
              )}
            </span>
            <span className="text-lg font-semibold">
              {finished ? t('help.video.finished') : t('help.video.start')}
            </span>
          </button>
        ) : null}
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {finished ? (
            <Button size="lg" onClick={restart} data-testid="help-video-restart">
              <RotateCcw className="size-5" aria-hidden />
              {t('help.video.restart')}
            </Button>
          ) : (
            <Button size="lg" onClick={toggle} data-testid="help-video-toggle">
              {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
              {playing ? t('help.video.pause') : t('help.video.start')}
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={fullscreen} data-testid="help-video-fullscreen">
            <Maximize2 className="size-5" aria-hidden />
            {t('help.video.fullscreen')}
          </Button>
        </div>
        <Button variant="ghost" size="lg" onClick={onClose}>
          {t('help.video.close')}
        </Button>
      </div>
    </>
  );
}
