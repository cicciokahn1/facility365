"use client";

/** Kommentare eines Tickets: kurze Wortmeldungen mit Person und Zeitpunkt. */
import { useState } from "react";
import { Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n/provider";
import { useSettings } from "@/lib/settings/provider";
import { TicketComment } from "@/lib/types";
import { newId } from "@/lib/utils/id";
import { formatDateTime } from "@/lib/utils/format";

export function CommentList({
  comments,
  author,
  mayWrite,
  onChange,
}: {
  comments: TicketComment[];
  author: string;
  mayWrite: boolean;
  onChange: (comments: TicketComment[]) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [text, setText] = useState("");

  const add = () => {
    const value = text.trim();
    if (!value) return;
    onChange([
      ...comments,
      {
        id: newId("cmt"),
        at: new Date().toISOString(),
        author,
        text: value,
      },
    ]);
    setText("");
  };

  return (
    <section className="flex flex-col gap-3" data-testid="comments">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("comment.empty")}</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {comments.map((comment) => (
            <li key={comment.id} className="flex flex-col gap-1 p-3">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {comment.author}
                </span>
                {formatDateTime(comment.at, settings.language)}
                {mayWrite ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto size-7"
                    aria-label={t("action.delete")}
                    onClick={() =>
                      onChange(
                        comments.filter((entry) => entry.id !== comment.id),
                      )
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                ) : null}
              </span>
              <p className="whitespace-pre-wrap text-sm">{comment.text}</p>
            </li>
          ))}
        </ul>
      )}

      {mayWrite ? (
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("comment.placeholder")}
            rows={2}
            data-testid="comment-input"
          />
          <Button onClick={add} data-testid="comment-add">
            <Send className="size-4" aria-hidden />
            {t("comment.add")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
