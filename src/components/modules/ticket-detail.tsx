"use client";

import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { CommentList } from "@/components/module/comment-list";
import { EntityDetail } from "@/components/module/entity-detail";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/auth/scope";
import { useT } from "@/lib/i18n/provider";
import { useCurrentUser } from "@/lib/settings/provider";
import { useOrderFromTicket } from "@/lib/tickets/to-order";

export function TicketDetail({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const access = useAccess();
  const user = useCurrentUser();
  const orders = useOrderFromTicket();
  const mayWrite = access.canWrite("tickets");

  return (
    <EntityDetail
      collection="tickets"
      id={id}
      headerExtra={(ticket) => {
        const existing = orders.existing(ticket);
        if (!existing && !access.canWrite("orders")) return null;
        return (
          <Button
            size="sm"
            variant={existing ? "outline" : "default"}
            onClick={() => {
              if (existing) {
                router.push(`/orders/${existing.id}`);
                return;
              }
              const order = orders.create(ticket);
              toast.success(t("ticket.orderCreated"));
              router.push(`/orders/${order.id}`);
            }}
            data-testid="ticket-create-order"
          >
            <ClipboardList className="size-4" aria-hidden />
            {existing ? t("ticket.openOrder") : t("ticket.toOrder")}
          </Button>
        );
      }}
      extraTabs={(ticket, update) => [
        {
          value: "comments",
          labelKey: "tab.comments",
          content: (
            <CommentList
              comments={ticket.comments}
              author={user}
              mayWrite={mayWrite}
              onChange={(comments) => update({ comments })}
            />
          ),
        },
      ]}
    />
  );
}
