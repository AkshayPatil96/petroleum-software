import { Capacitor } from "@capacitor/core";
import { format } from "date-fns";
import {
  BluetoothSerial,
  type BluetoothDevice,
} from "@e-is/capacitor-bluetooth-serial";
import type { Bill, PumpSettings } from "../types";

export interface NativePrinterDevice {
  name: string;
  address: string;
  deviceClass: number;
}

const PRINTER_CLASS_IDS = new Set([1664, 7936]);
const PRINTER_NAME_REGEX =
  /(printer|thermal|pos|xprinter|xp-|inner|rpp|rp-|pt-|mpt|hprt|gprinter)/i;

const clampText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/₹/g, "Rs ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");

const wrapLine = (value: string, width: number): string[] => {
  const cleaned = clampText(value).trim();
  if (!cleaned) return [""];

  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (current.length + 1 + word.length <= width) {
      current += ` ${word}`;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
};

const padRight = (value: string, width: number) =>
  value.length >= width ? value.slice(0, width) : value.padEnd(width, " ");

const twoColumn = (left: string, right: string, width: number) => {
  const cleanLeft = clampText(left).trim();
  const cleanRight = clampText(right).trim();
  const space = width - cleanLeft.length - cleanRight.length;
  if (space >= 1) return `${cleanLeft}${" ".repeat(space)}${cleanRight}`;
  return `${cleanLeft}\n${cleanRight}`;
};

const toPrinterWidth = (printerSize: PumpSettings["printerSize"]) =>
  printerSize === "80mm" ? 48 : 32;

const toUnitLabel = (unit: Bill["unit"] | undefined) => {
  if (unit === "Kg") return "Kg";
  if (unit === "Pcs") return "Pcs";
  return "L";
};

const likelyPrinter = (device: NativePrinterDevice) =>
  PRINTER_CLASS_IDS.has(device.deviceClass) || PRINTER_NAME_REGEX.test(device.name || "");

const uniqueDevices = (devices: BluetoothDevice[]) => {
  const unique = new Map<string, NativePrinterDevice>();

  for (const d of devices) {
    const address = (d.address || d.id || "").trim();
    if (!address) continue;
    unique.set(address, {
      name: (d.name || "").trim() || "Unknown Printer",
      address,
      deviceClass: d.class ?? 0,
    });
  }

  return [...unique.values()];
};

export const isNativeBluetoothSupported = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export async function ensureBluetoothEnabled() {
  if (!isNativeBluetoothSupported()) {
    throw new Error("Native Bluetooth printing is only available inside Android app.");
  }

  const state = await BluetoothSerial.isEnabled();
  if (state.enabled) return;

  const enabled = await BluetoothSerial.enable();
  if (!enabled.enabled) {
    throw new Error("Bluetooth is disabled. Please enable it and try again.");
  }
}

export async function discoverNativePrinters() {
  await ensureBluetoothEnabled();
  const result = await BluetoothSerial.scan();
  const devices = uniqueDevices(result.devices || []);
  const printers = devices.filter(likelyPrinter);
  return printers.length ? printers : devices;
}

export async function connectNativePrinter(address: string, insecure = true) {
  const target = address.trim();
  if (!target) throw new Error("Printer address is required.");

  await ensureBluetoothEnabled();

  const connection = await BluetoothSerial.isConnected({ address: target }).catch(
    () => ({ connected: false }),
  );

  if (connection.connected) return;

  if (insecure) {
    try {
      await BluetoothSerial.connectInsecure({ address: target });
      return;
    } catch {
      // Fall through to secure connection as fallback.
    }
  }

  await BluetoothSerial.connect({ address: target });
}

export async function printRaw(address: string, payload: string) {
  const target = address.trim();
  if (!target) throw new Error("Printer address is required.");
  await connectNativePrinter(target, true);
  await BluetoothSerial.write({ address: target, value: payload });
}

export function buildReceiptText(
  bill: Partial<Bill>,
  settings: PumpSettings,
  title = "SALES RECEIPT",
) {
  const width = toPrinterWidth(settings.printerSize);
  const separator = "-".repeat(width);
  const receiptId = bill.id || `BILL-${Date.now()}`;
  const receiptDate = format(bill.date ? new Date(bill.date) : new Date(), "dd/MM/yyyy HH:mm");
  const fuelType = bill.fuelType || "Item";
  const price = Number(bill.pricePerLiter || 0);
  const quantity = Number(bill.quantity || 0);
  const amount = Number(bill.totalAmount || 0);
  const paymentMode = bill.paymentMode || "Cash";
  const note = bill.customNote || settings.defaultFooterNote || "";

  const lines: string[] = [];

  lines.push(...wrapLine(settings.name.toUpperCase(), width));
  if (settings.address) lines.push(...wrapLine(settings.address, width));

  const licenseBits: string[] = [];
  if (settings.visibleFields.gstin && settings.gstin) licenseBits.push(`GSTIN: ${settings.gstin}`);
  if (settings.visibleFields.licenseNo && settings.licenseNo) licenseBits.push(`LIC: ${settings.licenseNo}`);
  if (licenseBits.length) lines.push(...wrapLine(licenseBits.join("  "), width));
  if (settings.contact) lines.push(...wrapLine(`Tel: ${settings.contact}`, width));

  lines.push(separator);
  lines.push(...wrapLine(title, width));
  lines.push(...wrapLine(`Bill: ${receiptId}`, width));
  lines.push(...wrapLine(`Date: ${receiptDate}`, width));

  if (settings.visibleFields.vehicleNumber && bill.vehicleNumber) {
    lines.push(...wrapLine(`Vehicle: ${bill.vehicleNumber}`, width));
  }
  if (settings.visibleFields.pumpNumber && bill.pumpNumber) {
    lines.push(...wrapLine(`Pump: ${bill.pumpNumber}`, width));
  }
  if (settings.visibleFields.nozzleNumber && bill.nozzleNumber) {
    lines.push(...wrapLine(`Nozzle: ${bill.nozzleNumber}`, width));
  }
  if (settings.visibleFields.customerName && bill.customerName) {
    lines.push(...wrapLine(`Customer: ${bill.customerName}`, width));
  }

  lines.push(separator);
  lines.push(...wrapLine(`${fuelType} @ Rs ${price.toFixed(2)}`, width));
  lines.push(twoColumn(`Qty: ${quantity.toFixed(3)} ${toUnitLabel(bill.unit)}`, `Amt: ${amount.toFixed(2)}`, width));
  lines.push(separator);
  lines.push(padRight(`TOTAL: Rs ${amount.toFixed(2)}`, width));

  if (settings.visibleFields.paymentMode) {
    lines.push(...wrapLine(`Payment: ${paymentMode}`, width));
  }

  lines.push(...wrapLine("Status: PAID", width));

  if (settings.visibleFields.footerNote && note) {
    lines.push(separator);
    lines.push(...wrapLine(note, width));
  }

  lines.push(...wrapLine("THANK YOU", width));
  lines.push(...wrapLine("HAVE A SAFE DRIVE", width));

  return lines.join("\n");
}

export async function printBillToBluetooth(
  bill: Partial<Bill>,
  settings: PumpSettings,
  printerAddress: string,
) {
  const text = buildReceiptText(bill, settings, "SALES RECEIPT");
  const escPosPayload = `\x1B\x40${text}\n\n\n\x1D\x56\x41\x03`;
  await printRaw(printerAddress, escPosPayload);
}

export async function sendTestPrint(
  settings: PumpSettings,
  printerAddress: string,
  printerName?: string,
) {
  const now = new Date();
  const sample: Partial<Bill> = {
    id: `TEST-${now.getTime()}`,
    date: now.toISOString(),
    fuelType: "Printer Test",
    pricePerLiter: 0,
    quantity: 1,
    unit: "Pcs",
    totalAmount: 0,
    paymentMode: "Cash",
    status: "Paid",
    customNote: `Connected to ${printerName || "printer"}`,
  };

  const text = buildReceiptText(sample, settings, "BLUETOOTH PRINTER TEST");
  const escPosPayload = `\x1B\x40${text}\n\n\n\x1D\x56\x41\x03`;
  await printRaw(printerAddress, escPosPayload);
}
