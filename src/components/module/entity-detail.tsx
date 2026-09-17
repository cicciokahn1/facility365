"use client";

/**
 * Detailansicht eines Datensatzes.
 *
 * Gleicher Aufbau in jedem Modul: Kopf mit Nummer, Titel und Status, danach
 * Stammdaten, modul-eigene Bereiche, Dokumente, Fotos und Historie.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FavoriteButton } from "@/components/common/favorite-button";
import { StatusBadge } from "@/components/common/status-badge";
import { DocumentList } from "@/components/module/document-list";
import { EntityForm } from "@/components/module/entity-form";
import { DoneButton } from "@/components/module/done-button";
import { HistoryTimeline } from "@/components/module/history-timeline";
import {
  LinkedDocuments,
  documentLinkOf,
} from "@/components/module/linked-documents";
import {
  FollowUpActions,
  LinkedRecordsPanel,
} from "@/components/module/linked-records";
import { ObjectDossier } from "@/components/module/object-dossier";
import { PhotoGallery } from "@/components/module/photo-gallery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccess } from "@/lib/auth/scope";
import { indexOf, useCollection, useCollectionItems } from "@/lib/data/store";
import { useMarks } from "@/lib/favorites/use-marks";
import { fieldValue, stringField, valuesOf } from "@/lib/entity-values";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { useT } from "@/lib/i18n/provider";
import { configOf, titleOfEntity } from "@/lib/module-config";
import { moduleByCollection } from "@/lib/modules";
import { FieldDef, FormValues, asString } from "@/lib/schema";
import { useSettings } from "@/lib/settings/provider";
import {
  BaseEntity,
  CollectionKey,
  DocumentFile,
  EntityOf,
  Photo,
} from "@/lib/types";
import { FOLLOW_UP_SOURCES } from "@/lib/links/follow-up";
import { DossierLevel } from "@/lib/links/dossier";
import { isCompletable } from "@/lib/workflow/complete";
import { formatDate, formatMonth, formatMoney } from "@/lib/utils/format";

export interface ExtraTab {
  value: string;
  labelKey: TranslationKey;
  content: React.ReactNode;
}

export interface EntityDetailProps<K extends CollectionKey> {
  collection: K;
  id: string;
  /** Zusaetzliche Bereiche des Moduls, z. B. Ansprechpartner oder Plaene. */
  extraTabs?: (
    entity: EntityOf<K>,
    update: (values: Partial<EntityOf<K>>, action?: string) => void,
  ) => ExtraTab[];
  headerExtra?: (
    entity: EntityOf<K>,
    update: (values: Partial<EntityOf<K>>, action?: string) => void,
  ) => React.ReactNode;
  /** Zuerst gezeigter Bereich; ohne Angabe die Stammdaten. */
  defaultTab?: string;
  /** Loeschen sperren, z. B. bei Benutzern mit vorhandenen Daten. */
  deleteBlocked?: boolean;
  deleteBlockedKey?: TranslationKey;
}

export function EntityDetail<K extends CollectionKey>({
  collection,
  id,
  extraTabs,
  headerExtra,
  defaultTab = "master",
  deleteBlocked = false,
  deleteBlockedKey,
}: EntityDetailProps<K>) {
  const t = useT();
  const router = useRouter();
  const moduleDef = moduleByCollection(collection);
  const config = configOf(collection);
  const { get, update, remove, create, ready } = useCollection(collection);
  const { settings } = useSettings();
  const access = useAccess();
  const mayWrite = access.canWrite(moduleDef.key);
  const mayDelete = access.canDelete(moduleDef.key) && !deleteBlocked;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const entity = get(id);
  const { visit } = useMarks();

  const initialValues = useMemo<FormValues>(
    () => (entity ? valuesOf(entity) : {}),
    [entity],
  );

  /** Geoeffnete Datensaetze erscheinen unter "Zuletzt verwendet". */
  const seen = Boolean(entity);
  useEffect(() => {
    if (seen) visit(collection, id);
  }, [collection, id, seen, visit]);

  if (!entity) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Button variant="ghost" onClick={() => router.push(moduleDef.path)}>
          <ArrowLeft className="size-4" aria-hidden />
          {t(moduleDef.labelKey)}
        </Button>
        <p className="text-muted-foreground">
          {ready ? t("detail.notFound") : t("common.loading")}
        </p>
      </div>
    );
  }

  const applyUpdate = (
    values: Partial<EntityOf<K>>,
    action = "history.updated",
  ) => update(id, values, action, settings.profileName || settings.companyName);

  /**
   * Kopie eines Datensatzes.
   *
   * Uebernommen werden nur die Stammdaten; Nummer, Verlauf, Dokumente und Fotos
   * beginnen neu. Der Ursprung bleibt unveraendert bestehen.
   */
  const duplicate = () => {
    const copy = create(
      valuesOf(entity) as Partial<EntityOf<K>>,
      settings.profileName || settings.companyName,
    );
    toast.success(t("toast.duplicated"));
    router.push(`${moduleDef.path}/${copy.id}`);
  };

  const tabs = extraTabs?.(entity, applyUpdate) ?? [];

  /** Objekte der Hierarchie zeigen zusaetzlich ihren modeluebergreifenden Verlauf. */
  const dossierLevel: DossierLevel | undefined = (
    ["properties", "buildings", "rooms", "assets"] as CollectionKey[]
  ).includes(collection)
    ? (collection as DossierLevel)
    : undefined;
  if (dossierLevel) {
    tabs.unshift({
      value: "dossier",
      labelKey: "tab.dossier",
      content: <ObjectDossier level={dossierLevel} id={id} />,
    });
  } else if (!tabs.some((tab) => tab.value === "linked")) {
    tabs.push({
      value: "linked",
      labelKey: "tab.linked",
      content: <LinkedRecordsPanel collection={collection} entity={entity} />,
    });
  }

  /**
   * Folgevorgaenge: Module mit eigener Umwandlung (Ticket, Brandschutz,
   * Spielplatz, Offerte) bringen ihre Schaltflaechen selbst mit.
   */
  const showFollowUp =
    FOLLOW_UP_SOURCES.includes(collection) &&
    !headerExtra &&
    collection !== "tickets";
  /** Dokumente des Moduls "Dokumente", die auf diesen Datensatz verweisen. */
  const documentLink = documentLinkOf(collection, entity);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
            <Link href={moduleDef.path}>
              <ArrowLeft className="size-4" aria-hidden />
              {t(moduleDef.labelKey)}
            </Link>
          </Button>
          <p className="font-mono text-xs text-muted-foreground">
            {entity.number}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {titleOfEntity(collection, entity)}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {config.statusField && config.statusOptions ? (
              <StatusBadge
                value={stringField(entity, config.statusField)}
                options={config.statusOptions}
              />
            ) : null}
            {mayWrite && config.statusField && isCompletable(collection) ? (
              <DoneButton
                collection={collection}
                id={id}
                status={stringField(entity, config.statusField)}
              />
            ) : null}
            {showFollowUp ? (
              <FollowUpActions collection={collection} entity={entity} />
            ) : null}
            {headerExtra?.(entity, applyUpdate)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <FavoriteButton collection={collection} id={id} />
            {mayWrite ? (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveTab("photos")}
                data-testid="add-photo"
              >
                <Camera className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t("tab.photos")}</span>
              </Button>
            ) : null}
            {mayWrite ? (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setEditOpen(true)}
                data-testid="edit-entity"
              >
                <Pencil className="size-4" aria-hidden />
                {t("action.edit")}
              </Button>
            ) : (
              <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                {t("access.readOnly")}
              </span>
            )}
            {mayWrite || mayDelete ? (
              <details className="relative">
                <summary className="flex h-11 cursor-pointer list-none items-center rounded-md border bg-background px-4 text-sm font-medium shadow-xs hover:bg-accent [&::-webkit-details-marker]:hidden">
                  {t("nav.more")}
                </summary>
                <div className="absolute right-0 z-10 mt-2 flex min-w-44 flex-col gap-2 rounded-lg border bg-popover p-2 shadow-lg">
                  {mayWrite ? (
                    <Button
                      variant="outline"
                      onClick={duplicate}
                      data-testid="duplicate-entity"
                    >
                      <Copy className="size-4" aria-hidden />
                      {t("action.duplicate")}
                    </Button>
                  ) : null}
                  {mayDelete ? (
                    <Button
                      variant="outline"
                      onClick={() => setDeleteOpen(true)}
                      data-testid="delete-entity"
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                      {t("action.delete")}
                    </Button>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>
          {deleteBlocked && deleteBlockedKey ? (
            <p
              data-testid="delete-blocked"
              className="text-xs text-muted-foreground"
            >
              {t(deleteBlockedKey)}
            </p>
          ) : null}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
          <TabsList>
            <TabsTrigger value="master">{t("tab.master")}</TabsTrigger>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.labelKey)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="documents">{t("tab.documents")}</TabsTrigger>
            <TabsTrigger value="photos">{t("tab.photos")}</TabsTrigger>
            <TabsTrigger value="history">{t("tab.history")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="master" className="mt-4">
          <MasterData entity={entity} fields={config.fields} />
        </TabsContent>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {tab.content}
          </TabsContent>
        ))}

        <TabsContent value="documents" className="mt-4 flex flex-col gap-6">
          {documentLink ? (
            <LinkedDocuments
              field={documentLink.field}
              value={entity.id}
              inherit={documentLink.inherit}
            />
          ) : null}
          <div className="flex flex-col gap-3">
            {documentLink ? (
              <h2 className="text-sm font-semibold">
                {t("documents.ownFiles")}
              </h2>
            ) : null}
            <DocumentList
              documents={entity.documents}
              onChange={(documents: DocumentFile[], action) =>
                applyUpdate({ documents } as Partial<EntityOf<K>>, action)
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <PhotoGallery
            photos={entity.photos}
            onChange={(photos: Photo[], action) =>
              applyUpdate({ photos } as Partial<EntityOf<K>>, action)
            }
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTimeline entries={entity.history} />
        </TabsContent>
      </Tabs>

      <EntityForm
        open={editOpen}
        onOpenChange={setEditOpen}
        title={`${t("action.edit")} · ${t(moduleDef.singularKey)}`}
        fields={config.fields}
        initialValues={initialValues}
        onSubmit={(values) => {
          applyUpdate(values as Partial<EntityOf<K>>);
          toast.success(t("toast.saved"));
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("detail.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.deleteText")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete"
              onClick={() => {
                remove(id);
                toast.success(t("toast.deleted"));
                router.push(moduleDef.path);
              }}
            >
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MasterData({
  entity,
  fields,
}: {
  entity: BaseEntity;
  fields: FieldDef[];
}) {
  const t = useT();
  const { settings } = useSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const simpleFields = fields.filter((field) => !field.advanced);
  const advancedFields = fields.filter((field) => field.advanced);

  return (
    <div className="flex flex-col gap-3">
      <dl
        data-testid="master-data"
        className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border bg-card p-4 sm:grid-cols-2"
      >
      {simpleFields.map((field) => (
        <MasterRow key={field.name} field={field} entity={entity} />
      ))}
      <div className="sm:col-span-2">
        <dt className="text-xs text-muted-foreground">
          {t("common.createdAt")}
        </dt>
        <dd className="text-sm">
          {formatDate(entity.createdAt, settings.language)}
        </dd>
      </div>
      </dl>
      {advancedFields.length > 0 ? (
        <details open={showAdvanced} onToggle={(event) => setShowAdvanced(event.currentTarget.open)}>
          <summary className="cursor-pointer list-none rounded-lg border px-4 py-3 text-sm font-medium text-muted-foreground">
            {t("nav.more")}
          </summary>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
            {advancedFields.map((field) => (
              <MasterRow key={field.name} field={field} entity={entity} />
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  );
}

function MasterRow({ field, entity }: { field: FieldDef; entity: BaseEntity }) {
  const t = useT();
  const { settings } = useSettings();
  const relationItems = useCollectionItems(
    field.kind === "relation" ? field.collection : "customers",
  );
  const raw = fieldValue(entity, field.name);
  const values = valuesOf(entity);
  if (field.visibleWhen && !field.visibleWhen(values)) return null;

  let display = "";
  switch (field.kind) {
    case "relation": {
      const target = indexOf(relationItems).get(asString(raw));
      display = target ? titleOfEntity(field.collection, target) : "";
      break;
    }
    case "select": {
      const option = field.options.find(
        (entry) => entry.value === asString(raw),
      );
      display = option ? t(option.labelKey) : "";
      break;
    }
    case "date":
      display = asString(raw)
        ? formatDate(asString(raw), settings.language)
        : "";
      break;
    case "month":
      display = asString(raw)
        ? formatMonth(asString(raw), settings.language)
        : "";
      break;
    case "money":
      display =
        typeof raw === "number" ? formatMoney(raw, settings.currency) : "";
      break;
    case "switch":
      display = raw === true ? t("common.yes") : t("common.no");
      break;
    case "address": {
      if (raw && typeof raw === "object") {
        const address = raw as {
          street?: string;
          zip?: string;
          city?: string;
          country?: string;
        };
        display = [
          address.street,
          [address.zip, address.city].filter(Boolean).join(" "),
          address.country,
        ]
          .filter(Boolean)
          .join(", ");
      }
      break;
    }
    default:
      display = asString(raw);
  }

  if (!display) return null;
  const labelKey = field.labelKeyOf ? field.labelKeyOf(values) : field.labelKey;

  return (
    <div className={field.span === 2 ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{t(labelKey)}</dt>
      <dd className="whitespace-pre-line text-sm">{display}</dd>
    </div>
  );
}
