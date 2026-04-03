import { format } from "date-fns";
import type { Bill, PumpSettings } from "../types";
import { cn, formatCurrency } from "../lib/utils";

export default function ReceiptContent({
  bill,
  settings,
  isLivePreview = false,
}: {
  bill: Partial<Bill>;
  settings: PumpSettings;
  isLivePreview?: boolean;
}) {
  const receiptId = bill.id || "BILL-PREVIEW";
  const receiptDate = bill.date ? new Date(bill.date) : new Date();
  const fuelType = bill.fuelType || "Petrol";
  const pricePerLiter = bill.pricePerLiter || 0;
  const quantity = bill.quantity || 0;
  const unit = bill.unit || "Liters";
  const totalAmount = bill.totalAmount || 0;
  const vehicleNumber = bill.vehicleNumber || "---";
  const pumpNumber = bill.pumpNumber || "";
  const nozzleNumber = bill.nozzleNumber || "";
  const customerName = bill.customerName || "";
  const paymentMode = bill.paymentMode || "Cash";
  const status = bill.status || "Draft";
  const customNote = bill.customNote || settings.defaultFooterNote;

  const unitLabel = fuelType === "CNG" ? "Kg" : "L";

  return (
    <div
      className={cn(
        "text-left font-mono text-sm",
        isLivePreview ? "scale-90 origin-top" : "",
        settings.receiptTemplate === "Compact"
          ? "text-xs"
          : settings.receiptTemplate === "Modern"
            ? "bg-white border border-slate-200 rounded-none border-t-4 border-t-blue-600 p-6"
            : "bg-slate-50 p-6 rounded-2xl shadow-inner",
      )}
    >
      <div
        className={cn(
          "text-center border-b border-slate-200 pb-4 mb-4",
          settings.receiptTemplate === "Compact" ? "pb-2 mb-2" : "",
        )}
      >
        {settings.logoUrl && (
          <img
            src={settings.logoUrl}
            alt="Logo"
            className="h-10 w-auto object-contain mx-auto mb-2"
            referrerPolicy="no-referrer"
          />
        )}
        <h4 className="font-bold text-lg uppercase tracking-tight leading-tight">
          {settings.name}
        </h4>
        <p className="text-[10px] text-slate-500 leading-tight">
          {settings.address}
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
          {settings.visibleFields.gstin && settings.gstin && (
            <p className="text-[9px] text-slate-500">GSTIN: {settings.gstin}</p>
          )}
          {settings.visibleFields.licenseNo && settings.licenseNo && (
            <p className="text-[9px] text-slate-500">
              LIC: {settings.licenseNo}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>ID:</span>
          <span className="font-bold">{receiptId}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(receiptDate, "dd/MM/yyyy HH:mm")}</span>
        </div>
        {settings.visibleFields.vehicleNumber && (
          <div className="flex justify-between">
            <span>Vehicle:</span>
            <span className="font-bold">{vehicleNumber}</span>
          </div>
        )}
        {settings.visibleFields.pumpNumber && pumpNumber && (
          <div className="flex justify-between">
            <span>Pump:</span>
            <span className="font-bold">{pumpNumber}</span>
          </div>
        )}
        {settings.visibleFields.nozzleNumber && nozzleNumber && (
          <div className="flex justify-between">
            <span>Nozzle:</span>
            <span className="font-bold">{nozzleNumber}</span>
          </div>
        )}
        {settings.visibleFields.customerName && customerName && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-bold truncate max-w-[120px]">
              {customerName}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Item:</span>
          <span>
            {fuelType} @ ₹{pricePerLiter.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Quantity:</span>
          <span className="font-bold">
            {quantity.toFixed(3)} {unitLabel}
          </span>
        </div>
      </div>

      <div className="h-px border-t border-dashed border-slate-300 my-3" />

      <div className="flex justify-between text-lg font-bold">
        <span>TOTAL:</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>

      <div className="mt-2 space-y-1">
        {settings.visibleFields.paymentMode && (
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Payment:</span>
            <span>{paymentMode}</span>
          </div>
        )}
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Status:</span>
          <span
            className={cn(
              "font-bold",
              status === "Draft" ? "text-amber-500" : "text-emerald-500",
            )}
          >
            {status}
          </span>
        </div>
      </div>

      {settings.visibleFields.footerNote && customNote && (
        <div className="mt-4 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 italic leading-tight">
          {customNote}
        </div>
      )}
    </div>
  );
}
