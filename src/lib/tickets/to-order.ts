"use client";

/**
 * Auftrag aus einem Helpdesk-Ticket.
 *
 * Der Auftrag uebernimmt Titel, Beschreibung, Objektzuordnung, Zustaendigkeit,
 * Frist und Fotos; das Ticket bleibt bestehen und verweist auf den Auftrag.
 */
import { useCallback } from "react";

import { useCollection } from "@/lib/data/store";
import { useCurrentUser } from "@/lib/settings/provider";
import { Order, Ticket } from "@/lib/types";
import { newId } from "@/lib/utils/id";

export const orderValuesFromTicket = (ticket: Ticket): Partial<Order> => ({
  title: ticket.title,
  description: ticket.description,
  status: "new",
  priority: ticket.priority,
  customerId: ticket.customerId,
  propertyId: ticket.propertyId,
  buildingId: ticket.buildingId,
  roomId: ticket.roomId,
  assetId: ticket.assetId,
  assigneeUserId: ticket.assigneeUserId,
  dueDate: ticket.dueDate,
  photos: ticket.photos.map((photo) => ({ ...photo, id: newId("pho") })),
  notes: ticket.notes,
});

export interface OrderFromTicketApi {
  /** Bereits erzeugter Auftrag zum Ticket, falls vorhanden. */
  existing: (ticket: Ticket) => Order | undefined;
  create: (ticket: Ticket) => Order;
}

export function useOrderFromTicket(): OrderFromTicketApi {
  const orders = useCollection("orders");
  const tickets = useCollection("tickets");
  const user = useCurrentUser();

  const existing = useCallback(
    (ticket: Ticket) =>
      ticket.orderId
        ? orders.items.find((order) => order.id === ticket.orderId)
        : undefined,
    [orders],
  );

  const createFromTicket = useCallback(
    (ticket: Ticket) => {
      const order = orders.create(orderValuesFromTicket(ticket), user);
      tickets.update(
        ticket.id,
        {
          orderId: order.id,
          status: ticket.status === "new" ? "inProgress" : ticket.status,
        },
        "history.updated",
        user,
      );
      return order;
    },
    [orders, tickets, user],
  );

  return { existing, create: createFromTicket };
}
