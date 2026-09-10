import { InvoicePaymentData, InvoiceReferenceType } from "@/lib/types";

const digits = (value: string): string => value.replace(/\D/g, "");

const mod10Recursive = (value: string): number => {
  const table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
  let carry = 0;
  for (const digit of value) carry = table[(carry + Number(digit)) % 10];
  return (10 - carry) % 10;
};

const alphaNumeric = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 25);

const ibanCheckDigits = (reference: string): string => {
  const converted = `${reference}271500`;
  let remainder = 0;
  for (const character of converted) {
    const value = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - 55)
      : character;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return String(98 - remainder).padStart(2, "0");
};

export const normalizeIban = (value: string): string =>
  value.toUpperCase().replace(/\s+/g, "");

export const isQrIban = (value: string): boolean => {
  const iban = normalizeIban(value);
  const iid = Number(iban.slice(4, 9));
  return iban.startsWith("CH") && /^\d{9,}$/.test(iban.slice(4)) && iid >= 30000 && iid <= 31999;
};

export const referenceTypeFor = (
  payment: Pick<InvoicePaymentData, "referenceType" | "qrIban" | "iban">,
): InvoiceReferenceType => (isQrIban(payment.qrIban || payment.iban) ? "QRR" : "SCOR");

export const referenceFor = (
  invoiceNumber: string,
  payment: Pick<InvoicePaymentData, "referenceType" | "qrIban" | "iban">,
): string => {
  const type = referenceTypeFor(payment);
  if (type === "QRR") {
    const base = digits(invoiceNumber).padStart(26, "0").slice(-26);
    return `${base}${mod10Recursive(base)}`;
  }
  const base = alphaNumeric(invoiceNumber) || "FACILITY365";
  return `RF${ibanCheckDigits(base)}${base}`;
};

export const swissQrPayload = (
  payment: InvoicePaymentData,
  debtorLines: string[],
  amount: number,
  currency: string,
  reference: string,
  additionalInformation: string,
): string => {
  const iban = normalizeIban(payment.qrIban || payment.iban);
  const address = payment.address;
  const debtor = debtorLines.filter(Boolean);
  return [
    "SPC",
    "0200",
    "1",
    iban,
    "S",
    payment.recipient,
    address.street,
    "",
    address.zip,
    address.city,
    address.country || "CH",
    "",
    "",
    "",
    "",
    "",
    debtor[0] ?? "",
    debtor[1] ?? "",
    debtor[2] ?? "",
    debtor[3] ?? "",
    debtor[4] ?? "",
    amount > 0 ? amount.toFixed(2) : "",
    currency || "CHF",
    referenceTypeFor(payment),
    reference,
    additionalInformation,
    "EPD",
  ].join("\n");
};
