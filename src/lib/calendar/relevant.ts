"use client";

/**
 * Termine, die die angemeldete Person etwas angehen.
 *
 * Grundlage bleibt der bestehende Kalender; hier faellt nur weg, was ausserhalb
 * der Rolle, der Organisation, der zugewiesenen Standorte oder der eigenen
 * Zustaendigkeit liegt. Damit sehen Kalender, «Heute» und die Mitteilungen
 * dieselbe Auswahl.
 */
import { useMemo } from "react";

import { useAccess } from "@/lib/auth/scope";
import {
  CalendarEvent,
  CalendarEventKind,
  useCalendarEvents,
} from "@/lib/calendar/events";
import { useCollectionItems } from "@/lib/data/store";
import { BaseEntity, CollectionKey } from "@/lib/types";

const COLLECTION_OF: Record<CalendarEventKind, CollectionKey> = {
  appointment: "appointments",
  order: "orders",
  maintenance: "maintenances",
  legionella: "legionella",
  rcd: "rcd",
  inspection: "inspections",
  playground: "playgroundchecks",
  fire: "firechecks",
  vehicle: "vehicles",
  document: "documents",
  assetWarranty: "assets",
  inventoryWarranty: "inventory",
  contract: "contracts",
  solar: "solarplants",
  cleaning: "cleaningtasks",
  ticket: "tickets",
};

export function useRelevantEvents(): CalendarEvent[] {
  const access = useAccess();
  const events = useCalendarEvents();
  const appointments = useCollectionItems("appointments");
  const orders = useCollectionItems("orders");
  const maintenances = useCollectionItems("maintenances");
  const legionella = useCollectionItems("legionella");
  const rcd = useCollectionItems("rcd");
  const inspections = useCollectionItems("inspections");
  const playgroundchecks = useCollectionItems("playgroundchecks");
  const firechecks = useCollectionItems("firechecks");
  const documents = useCollectionItems("documents");
  const assets = useCollectionItems("assets");
  const inventory = useCollectionItems("inventory");
  const vehicles = useCollectionItems("vehicles");
  const contracts = useCollectionItems("contracts");
  const solarplants = useCollectionItems("solarplants");
  const cleaningtasks = useCollectionItems("cleaningtasks");
  const tickets = useCollectionItems("tickets");

  const sources = useMemo(() => {
    const map = new Map<CollectionKey, Map<string, BaseEntity>>();
    const add = (collection: CollectionKey, items: BaseEntity[]) =>
      map.set(collection, new Map(items.map((item) => [item.id, item])));
    add("appointments", appointments);
    add("orders", orders);
    add("maintenances", maintenances);
    add("legionella", legionella);
    add("rcd", rcd);
    add("inspections", inspections);
    add("playgroundchecks", playgroundchecks);
    add("firechecks", firechecks);
    add("vehicles", vehicles);
    add("documents", documents);
    add("assets", assets);
    add("inventory", inventory);
    add("contracts", contracts);
    add("solarplants", solarplants);
    add("cleaningtasks", cleaningtasks);
    add("tickets", tickets);
    return map;
  }, [
    appointments,
    cleaningtasks,
    contracts,
    documents,
    assets,
    inventory,
    firechecks,
    inspections,
    legionella,
    maintenances,
    orders,
    playgroundchecks,
    rcd,
    solarplants,
    tickets,
    vehicles,
  ]);

  return useMemo(
    () =>
      events.filter((event) => {
        const collection = COLLECTION_OF[event.kind];
        if (!access.canRead(collection)) return false;
        const source = sources.get(collection)?.get(event.sourceId);
        /** Termine aus Plaenen ohne eigenen Datensatz: die Modulrechte genuegen. */
        if (!source) return !access.scope.ownOnly;
        return access.visible(collection, source);
      }),
    [access, events, sources],
  );
}
