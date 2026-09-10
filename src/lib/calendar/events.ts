"use client";

/**
 * Termine des Kalenders.
 *
 * Der Kalender fuehrt keine eigenen Daten: er liest Auftraege und Wartungen
 * und leitet daraus Termine ab. Wiederkehrende Wartungen erzeugen aus dem
 * naechsten Termin und dem Intervall die Folgetermine.
 */
import { useMemo } from "react";

import { cleaningDates } from "@/lib/cleaning/schedule";
import { useCollectionItems } from "@/lib/data/store";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { isContractOpen, reminderDate } from "@/lib/contracts/reminder";
import { CollectionKey, MaintenanceInterval } from "@/lib/types";
import { isDone } from "@/lib/workflow/complete";

export type CalendarEventKind =
  | "appointment"
  | "order"
  | "maintenance"
  | "legionella"
  | "rcd"
  | "inspection"
  | "playground"
  | "fire"
  | "document"
  | "vehicle"
  | "contract"
  | "solar"
  | "cleaning"
  | "ticket";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  /** Datensatz, aus dem der Termin stammt. */
  sourceId: string;
  href: string;
  labelKey: TranslationKey;
  title: string;
  /** Tag als ISO-Datum. */
  date: string;
  /** Uhrzeit als HH:MM; leer, wenn nur der Tag feststeht. */
  time: string;
  customerId: string;
  propertyId: string;
  buildingId: string;
  assetId: string;
  /** Wahr bei einem errechneten Folgetermin einer wiederkehrenden Wartung. */
  recurring: boolean;
  /**
   * Datensatz und Datumsfeld hinter dem Termin.
   *
   * Nur gesetzt, wenn genau ein Feld den Termin bestimmt - dann laesst er sich
   * im Kalender verschieben und loeschen. Errechnete Folgetermine tragen es
   * nicht.
   */
  source?: { collection: CollectionKey; field: string };
}

/** Monate je Intervall. */
const INTERVAL_MONTHS: Record<MaintenanceInterval, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
  biennial: 24,
};

/** Wie weit die Folgetermine im Voraus berechnet werden. */
const HORIZON_MONTHS = 24;

/**
 * Vorausschau der Reinigungsplaene.
 *
 * Taegliche Plaene erzeugen sonst tausende Termine; drei Monate genuegen fuer
 * den Kalender und die Erinnerungen.
 */
const CLEANING_HORIZON_MONTHS = 3;
const CLEANING_MAX_EVENTS = 120;

const addMonths = (date: string, months: number): string => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = parsed.getDate();
  parsed.setDate(1);
  parsed.setMonth(parsed.getMonth() + months);
  /** Kuerzere Monate: der Termin rutscht auf den letzten Tag des Monats. */
  const lastDay = new Date(
    parsed.getFullYear(),
    parsed.getMonth() + 1,
    0,
  ).getDate();
  parsed.setDate(Math.min(day, lastDay));
  return parsed.toISOString().slice(0, 10);
};

const horizon = (): string =>
  addMonths(new Date().toISOString().slice(0, 10), HORIZON_MONTHS);

/** Termine, sortiert nach Tag und Uhrzeit. */
export function useCalendarEvents(): CalendarEvent[] {
  const appointments = useCollectionItems("appointments");
  const orders = useCollectionItems("orders");
  const maintenances = useCollectionItems("maintenances");
  const legionella = useCollectionItems("legionella");
  const rcd = useCollectionItems("rcd");
  const inspections = useCollectionItems("inspections");
  const playgroundChecks = useCollectionItems("playgroundchecks");
  const fireChecks = useCollectionItems("firechecks");
  const documents = useCollectionItems("documents");
  const vehicles = useCollectionItems("vehicles");
  const solarPlants = useCollectionItems("solarplants");
  const contracts = useCollectionItems("contracts");
  const cleaningTasks = useCollectionItems("cleaningtasks");
  const cleaningPlans = useCollectionItems("cleaningplans");
  const cleaningAreas = useCollectionItems("cleaningareas");
  const tickets = useCollectionItems("tickets");

  return useMemo(() => {
    const events: CalendarEvent[] = [];
    const until = horizon();

    /** Eigene Termine des Kalenders. */
    appointments
      .filter(
        (appointment) => appointment.status !== "cancelled" && appointment.date,
      )
      .forEach((appointment) => {
        events.push({
          id: `appointment-${appointment.id}`,
          kind: "appointment",
          sourceId: appointment.id,
          href: `/appointments/${appointment.id}`,
          labelKey: "module.appointments.singular",
          title: appointment.title || appointment.number,
          date: appointment.date,
          time: appointment.timeStart,
          customerId: appointment.customerId,
          propertyId: appointment.propertyId,
          buildingId: appointment.buildingId,
          assetId: appointment.assetId,
          recurring: false,
          source: { collection: "appointments", field: "date" },
        });
      });

    orders
      .filter((order) => !isDone("orders", order.status))
      .forEach((order) => {
        const date = order.dueDate || order.workDate;
        if (!date) return;
        events.push({
          id: `order-${order.id}`,
          kind: "order",
          sourceId: order.id,
          href: `/orders/${order.id}`,
          labelKey: "module.orders.singular",
          title: order.title || order.number,
          date,
          time: order.workStart,
          customerId: order.customerId,
          propertyId: order.propertyId,
          buildingId: order.buildingId,
          assetId: order.assetId,
          recurring: false,
          source: {
            collection: "orders",
            field: order.dueDate ? "dueDate" : "workDate",
          },
        });
      });

    maintenances
      .filter(
        (maintenance) =>
          !isDone("maintenances", maintenance.status) && maintenance.nextDate,
      )
      .forEach((maintenance) => {
        const step = INTERVAL_MONTHS[maintenance.interval] ?? 12;
        let date = maintenance.nextDate;
        let index = 0;
        while (date && date <= until) {
          events.push({
            id: `maintenance-${maintenance.id}-${index}`,
            kind: "maintenance",
            sourceId: maintenance.id,
            href: `/maintenances/${maintenance.id}`,
            labelKey: "module.maintenances.singular",
            title: maintenance.title || maintenance.number,
            date,
            time: "",
            customerId: "",
            propertyId: maintenance.propertyId,
            buildingId: maintenance.buildingId,
            assetId: maintenance.assetId,
            recurring: index > 0,
            source:
              index === 0
                ? { collection: "maintenances", field: "nextDate" }
                : undefined,
          });
          index += 1;
          date = addMonths(date, step);
        }
      });

    legionella
      .filter((check) => check.nextDate)
      .forEach((check) => {
        events.push({
          id: `legionella-${check.id}`,
          kind: "legionella",
          sourceId: check.id,
          href: `/legionella/${check.id}`,
          labelKey: "module.legionella.singular",
          title: check.title || check.system || check.number,
          date: check.nextDate,
          time: "",
          customerId: "",
          propertyId: check.propertyId,
          buildingId: check.buildingId,
          assetId: "",
          recurring: false,
          source: { collection: "legionella", field: "nextDate" },
        });
      });

    rcd
      .filter((check) => check.status !== "done" && check.nextDate)
      .forEach((check) => {
        events.push({
          id: `rcd-${check.id}`,
          kind: "rcd",
          sourceId: check.id,
          href: `/rcd/${check.id}`,
          labelKey: "module.rcd.singular",
          title: check.title || check.device || check.number,
          date: check.nextDate,
          time: "",
          customerId: "",
          propertyId: check.propertyId,
          buildingId: check.buildingId,
          assetId: check.assetId,
          recurring: false,
          source: { collection: "rcd", field: "nextDate" },
        });
      });

    inspections
      .filter((check) => check.status !== "done" && check.nextDate)
      .forEach((check) => {
        events.push({
          id: `inspection-${check.id}`,
          kind: "inspection",
          sourceId: check.id,
          href: `/inspections/${check.id}`,
          labelKey: "module.inspections.singular",
          title: check.title || check.customType || check.number,
          date: check.nextDate,
          time: "",
          customerId: "",
          propertyId: check.propertyId,
          buildingId: check.buildingId,
          assetId: check.assetId,
          recurring: false,
          source: { collection: "inspections", field: "nextDate" },
        });
      });

    playgroundChecks
      .filter((check) => check.status !== "done" && check.nextDate)
      .forEach((check) => {
        events.push({
          id: `playground-${check.id}`,
          kind: "playground",
          sourceId: check.id,
          href: `/playgrounds/${check.id}`,
          labelKey: "module.playgroundchecks.singular",
          title: check.title || check.number,
          date: check.nextDate,
          time: "",
          customerId: "",
          propertyId: check.propertyId,
          buildingId: check.buildingId,
          assetId: "",
          recurring: false,
          source: { collection: "playgroundchecks", field: "nextDate" },
        });
      });

    /** Brandschutz: naechste Kontrolle und Frist zur Behebung der Maengel. */
    fireChecks
      .filter((check) => check.status !== "done")
      .forEach((check) => {
        const title = check.title || check.number;
        const shared = {
          kind: "fire" as const,
          sourceId: check.id,
          href: `/firesafety/${check.id}`,
          labelKey: "module.firechecks.singular" as const,
          title,
          time: "",
          customerId: "",
          propertyId: check.propertyId,
          buildingId: check.buildingId,
          assetId: check.assetId,
          recurring: false,
        };
        if (check.nextDate) {
          events.push({
            ...shared,
            id: `fire-${check.id}`,
            date: check.nextDate,
            source: { collection: "firechecks", field: "nextDate" },
          });
        }
        if (check.dueDate) {
          events.push({
            ...shared,
            id: `fire-due-${check.id}`,
            date: check.dueDate,
            source: { collection: "firechecks", field: "dueDate" },
          });
        }
      });

    /** Dokumente: Ablauf der Gueltigkeit. */
    documents
      .filter((document) => Boolean(document.validUntil))
      .forEach((document) => {
        events.push({
          id: `document-${document.id}`,
          kind: "document",
          sourceId: document.id,
          href: `/documents/${document.id}`,
          labelKey: "documents.validUntil",
          title: document.title || document.file?.name || document.number,
          date: document.validUntil,
          time: "",
          customerId: document.customerId,
          propertyId: document.propertyId,
          buildingId: document.buildingId,
          assetId: document.assetId,
          recurring: false,
          source: { collection: "documents", field: "validUntil" },
        });
      });

    /** Fahrzeuge: Service, Reifenwechsel, amtliche Pruefung und Ablauf der Versicherung. */
    vehicles
      .filter((vehicle) => vehicle.status !== "retired")
      .forEach((vehicle) => {
        const title = vehicle.title || vehicle.plate || vehicle.number;
        const dates: [string, TranslationKey][] = [
          [vehicle.nextService, "vehicle.nextService"],
          [vehicle.tireChange, "vehicle.tireChange"],
          [vehicle.nextInspection, "vehicle.nextInspection"],
          [vehicle.insuranceUntil, "vehicle.insuranceUntil"],
        ];
        dates
          .filter(([date]) => Boolean(date))
          .forEach(([date, labelKey]) => {
            events.push({
              id: `vehicle-${vehicle.id}-${labelKey}`,
              kind: "vehicle",
              sourceId: vehicle.id,
              href: `/vehicles/${vehicle.id}`,
              labelKey,
              title,
              date,
              time: "",
              customerId: "",
              propertyId: vehicle.propertyId,
              buildingId: "",
              assetId: "",
              recurring: false,
            });
          });
      });

    /** Vertraege: Erinnerung vor Ablauf der Kuendigungsfrist und das Vertragsende. */
    contracts.filter(isContractOpen).forEach((contract) => {
      const title = contract.title || contract.partner || contract.number;
      const reminder = reminderDate(contract);
      const dates =
        reminder && reminder !== contract.end
          ? [reminder, contract.end]
          : [contract.end];
      dates.forEach((date, index) => {
        events.push({
          id: `contract-${contract.id}-${index}`,
          kind: "contract",
          sourceId: contract.id,
          href: `/contracts/${contract.id}`,
          labelKey: "module.contracts.singular",
          title,
          date,
          time: "",
          customerId: contract.customerId,
          propertyId: contract.propertyId,
          buildingId: contract.buildingId,
          assetId: "",
          recurring: false,
        });
      });
    });

    /** Offene Reinigungsaufgaben mit Termin. */
    cleaningTasks
      .filter((task) => !isDone("cleaningtasks", task.status) && task.date)
      .forEach((task) => {
        events.push({
          id: `cleaning-task-${task.id}`,
          kind: "cleaning",
          sourceId: task.id,
          href: `/cleaning/tasks/${task.id}`,
          labelKey: "module.cleaningtasks.singular",
          title: task.title || task.number,
          date: task.date,
          time: task.workStart,
          customerId: "",
          propertyId: task.propertyId,
          buildingId: task.buildingId,
          assetId: "",
          recurring: false,
          source: { collection: "cleaningtasks", field: "date" },
        });
      });

    /** Wiederkehrende Reinigungen aus den Plaenen. */
    const cleaningUntil = addMonths(
      new Date().toISOString().slice(0, 10),
      CLEANING_HORIZON_MONTHS,
    );
    cleaningPlans
      .filter((plan) => plan.status === "active" && plan.nextDate)
      .forEach((plan) => {
        const area = cleaningAreas.find((entry) => entry.id === plan.areaId);
        cleaningDates(
          plan.nextDate,
          plan,
          cleaningUntil,
          CLEANING_MAX_EVENTS,
        ).forEach((date, index) => {
          events.push({
            id: `cleaning-plan-${plan.id}-${index}`,
            kind: "cleaning",
            sourceId: plan.id,
            href: `/cleaning/plans/${plan.id}`,
            labelKey: "module.cleaningplans.singular",
            title: plan.title || plan.number,
            date,
            time: plan.timeStart,
            customerId: "",
            propertyId: area?.propertyId ?? "",
            buildingId: area?.buildingId ?? "",
            assetId: "",
            recurring: index > 0,
          });
        });
      });

    solarPlants
      .filter(
        (plant) =>
          plant.status !== "inactive" && Boolean(plant.nextMaintenance),
      )
      .forEach((plant) => {
        events.push({
          id: `solar-${plant.id}`,
          kind: "solar",
          sourceId: plant.id,
          href: `/solar/${plant.id}`,
          labelKey: "solar.nextMaintenance",
          title: plant.name || plant.number,
          date: plant.nextMaintenance,
          time: "",
          customerId: "",
          propertyId: plant.propertyId,
          buildingId: plant.buildingId,
          assetId: plant.assetId,
          recurring: false,
          source: { collection: "solarplants", field: "nextMaintenance" },
        });
      });

    /** Helpdesk-Tickets mit Frist; erledigte und geschlossene bleiben aussen vor. */
    tickets
      .filter((ticket) => !isDone("tickets", ticket.status) && ticket.dueDate)
      .forEach((ticket) => {
        events.push({
          id: `ticket-${ticket.id}`,
          kind: "ticket",
          sourceId: ticket.id,
          href: `/tickets/${ticket.id}`,
          labelKey: "module.tickets.singular",
          title: ticket.title || ticket.number,
          date: ticket.dueDate,
          time: "",
          customerId: ticket.customerId,
          propertyId: ticket.propertyId,
          buildingId: ticket.buildingId,
          assetId: ticket.assetId,
          recurring: false,
          source: { collection: "tickets", field: "dueDate" },
        });
      });

    return events.sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    );
  }, [
    appointments,
    cleaningAreas,
    cleaningPlans,
    cleaningTasks,
    contracts,
    inspections,
    legionella,
    maintenances,
    orders,
    documents,
    playgroundChecks,
    fireChecks,
    rcd,
    solarPlants,
    tickets,
    vehicles,
  ]);
}

/** Termine eines Tages. */
export const eventsOn = (
  events: CalendarEvent[],
  date: string,
): CalendarEvent[] => events.filter((event) => event.date === date);
