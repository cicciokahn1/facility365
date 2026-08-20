'use client';

/** Rapportdaten fuer das PDF sammeln, herunterladen, drucken und versenden. */
import { useCallback } from 'react';

import { logoOf } from '@/lib/branding/logo';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import type {
  ReportPdfBranding,
  ReportPdfData,
  ReportPdfLabels,
} from '@/lib/reports/report-pdf';
import { formatWorkTime, hasWorkTime } from '@/lib/reports/work-time';
import { useSettings } from '@/lib/settings/provider';
import { Report } from '@/lib/types';
import { formatDate, formatDateTime, formatMoney } from '@/lib/utils/format';

export interface ReportPdfApi {
  data: (report: Report) => ReportPdfData;
  download: (report: Report) => Promise<void>;
  print: (report: Report) => Promise<void>;
  /** Empfaengeradresse des Kunden; leer, wenn keine erfasst ist. */
  recipient: (report: Report) => string;
  mailtoUrl: (report: Report) => string;
  fileName: (report: Report) => Promise<string>;
}

/** Die PDF-Erzeugung wird erst beim Klick geladen, nicht beim Oeffnen der Seite. */
const pdfModule = () => import('@/lib/reports/report-pdf');

export function useReportPdf(): ReportPdfApi {
  const t = useT();
  const { settings } = useSettings();
  const customers = useCollectionItems('customers');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const orders = useCollectionItems('orders');

  const customerOf = useCallback(
    (report: Report) => customers.find((entry) => entry.id === report.customerId),
    [customers],
  );

  const data = useCallback(
    (report: Report): ReportPdfData => {
      const customer = customerOf(report);
      const property = properties.find((entry) => entry.id === report.propertyId);
      const building = buildings.find((entry) => entry.id === report.buildingId);
      const room = rooms.find((entry) => entry.id === report.roomId);
      const asset = assets.find((entry) => entry.id === report.assetId);
      const order = orders.find((entry) => entry.id === report.orderId);
      const time = {
        start: report.workStart,
        end: report.workEnd,
        breakMinutes: report.breakMinutes,
      };
      const materialTotal = report.materials.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );
      const address = customer?.address;

      return {
        number: report.number,
        title: report.title,
        date: formatDate(report.date, settings.language),
        author: report.author,
        customerName: customer
          ? [customer.firstName, customer.name].filter(Boolean).join(' ')
          : '',
        customerAddress: address
          ? [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
              .filter(Boolean)
              .join(', ')
          : '',
        customerEmail: customer?.email ?? '',
        propertyName: property?.name ?? '',
        buildingName: building?.name ?? '',
        roomName: room?.name ?? '',
        assetName: asset ? `${asset.name} · ${asset.number}` : '',
        orderLabel: order ? `${order.number} · ${order.title}` : '',
        workDescription: report.workDescription,
        summary: report.summary,
        notes: report.notes,
        workStart: report.workStart,
        workEnd: report.workEnd,
        breakMinutes: report.breakMinutes,
        workTotal: hasWorkTime(time) ? `${formatWorkTime(time)} h` : '–',
        materials: report.materials.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: formatMoney(item.quantity * item.price, settings.currency),
        })),
        materialTotal: formatMoney(materialTotal, settings.currency),
        photos: report.photos.map((photo) => ({
          url: photo.url,
          caption: photo.caption ?? photo.name,
        })),
        signature: report.signature,
        signedBy: report.signedBy,
        signedAt: report.signedAt ? formatDateTime(report.signedAt, settings.language) : '',
      };
    },
    [assets, buildings, customerOf, orders, properties, rooms, settings.currency, settings.language],
  );

  const labels = useCallback(
    (): ReportPdfLabels => ({
      report: t('module.reports.singular'),
      number: t('common.number'),
      date: t('common.date'),
      author: t('common.author'),
      customer: t('module.customers.singular'),
      property: t('module.properties.singular'),
      building: t('module.buildings.singular'),
      room: t('module.rooms.singular'),
      asset: t('module.assets.singular'),
      order: t('module.orders.singular'),
      work: t('report.work'),
      summary: t('common.summary'),
      notes: t('common.notes'),
      workTime: t('work.total'),
      start: t('work.start'),
      end: t('work.end'),
      breakLabel: t('work.break'),
      total: t('common.total'),
      material: t('tab.material'),
      quantity: t('common.quantity'),
      price: t('common.price'),
      photos: t('tab.photos'),
      signature: t('report.signature'),
      signedBy: t('report.signedBy'),
      signedAt: t('report.signedAt'),
      notSigned: t('report.notSigned'),
    }),
    [t],
  );

  const branding = useCallback((): ReportPdfBranding => {
    const address = settings.companyAddress;
    return {
      companyName: settings.companyName || 'Facility365',
      companyAddress: [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', '),
      companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
      logo: logoOf(settings.companyLogo),
    };
  }, [settings]);

  const recipient = useCallback(
    (report: Report) => customerOf(report)?.email ?? '',
    [customerOf],
  );

  const mailtoUrl = useCallback(
    (report: Report) => {
      const subject = `${t('report.mailSubject')} ${report.number}`;
      const body = t('report.mailBody');
      return `mailto:${encodeURIComponent(recipient(report))}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
    },
    [recipient, t],
  );

  return {
    data,
    download: async (report) => {
      const { downloadReportPdf } = await pdfModule();
      downloadReportPdf(data(report), labels(), branding());
    },
    print: async (report) => {
      const { printReportPdf } = await pdfModule();
      printReportPdf(data(report), labels(), branding());
    },
    recipient,
    mailtoUrl,
    fileName: async (report) => {
      const { reportPdfFileName } = await pdfModule();
      return reportPdfFileName(data(report));
    },
  };
}
