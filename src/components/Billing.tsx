import { useEffect, useState } from "react";
import { AlertTriangle, Bluetooth, ReceiptIndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import type {
  Bill,
  FuelPrice,
  FuelType,
  ItemUnit,
  PumpSettings,
} from "../types";
import { cn, convertUnit, formatCurrency } from "../lib/utils";
import {
  isNativeBluetoothSupported,
  printBillToBluetooth,
} from "../lib/bluetoothPrinter";
import Card from "./ui/Card";
import Button from "./ui/Button";
import ReceiptContent from "./ReceiptContent";

export default function Billing({
  prices,
  onAddBill,
  settings,
}: {
  prices: FuelPrice[];
  onAddBill: (bill: any) => void;
  settings: PumpSettings;
}) {
  const [selectedFuel, setSelectedFuel] = useState<FuelType>("Petrol");
  const [mode, setMode] = useState<"amount" | "liters">("amount");
  const [inputValue, setInputValue] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [pumpNumber, setPumpNumber] = useState("");
  const [nozzleNumber, setNozzleNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Card" | "UPI">(
    "Cash",
  );
  const [showReceipt, setShowReceipt] = useState<Bill | null>(null);
  const [outputUnit, setOutputUnit] = useState<ItemUnit>("Liter");

  const currentItem = [
    ...prices.map((p) => ({
      name: p.type,
      price: p.pricePerLiter,
      unit: "Liter" as ItemUnit,
    })),
    ...settings.customItems.map((i) => ({
      name: i.name,
      price: i.price,
      unit: i.unit,
    })),
  ].find((i) => i.name === selectedFuel);
  const currentPrice = currentItem?.price || 0;
  const currentUnit = currentItem?.unit || "Liter";

  // Sync output unit when item changes
  useEffect(() => {
    if (currentUnit) setOutputUnit(currentUnit);
  }, [currentUnit]);

  const baseQuantity =
    mode === "amount"
      ? (parseFloat(inputValue) || 0) / currentPrice
      : parseFloat(inputValue) || 0;
  const calculatedAmount =
    mode === "liters"
      ? (parseFloat(inputValue) || 0) * currentPrice
      : parseFloat(inputValue) || 0;

  const displayQuantity = convertUnit(
    baseQuantity,
    currentUnit,
    outputUnit,
    settings.unitConversions,
  );

  const handleSubmit = async (status: "Draft" | "Paid", shouldPrint: boolean) => {
    if (!inputValue || parseFloat(inputValue) <= 0) return;

    const billId = `BILL-${Date.now()}`;
    const billDate = new Date().toISOString();

    const billData = {
      id: billId,
      date: billDate,
      fuelType: selectedFuel,
      pricePerLiter: currentPrice,
      quantity: displayQuantity,
      unit: outputUnit,
      totalAmount: calculatedAmount,
      vehicleNumber: vehicleNumber.toUpperCase(),
      pumpNumber: pumpNumber.trim(),
      nozzleNumber: nozzleNumber.trim(),
      customerName,
      paymentMode,
      status,
      customNote: customNote || settings.defaultFooterNote,
    };

    onAddBill(billData);
    setShowReceipt(billData as Bill);

    if (shouldPrint) {
      if (isNativeBluetoothSupported() && settings.pairedPrinterAddress) {
        try {
          await printBillToBluetooth(billData as Bill, settings, settings.pairedPrinterAddress);
          setShowReceipt(null);
        } catch (error) {
          console.error("Native print error:", error);
          alert(`Print failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      } else {
        setTimeout(() => {
          window.print();
          setShowReceipt(null);
        }, 500);
      }
    }

    // Reset form
    setInputValue("");
    setVehicleNumber("");
    setPumpNumber("");
    setNozzleNumber("");
    setCustomerName("");
    setCustomNote("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Billing</h1>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setMode("amount")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === "amount"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600",
            )}
          >
            By Amount
          </button>
          <button
            onClick={() => setMode("liters")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === "liters"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600",
            )}
          >
            By Liter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  Select Item
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {prices.map((p) => (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => {
                        setSelectedFuel(p.type);
                        if (p.type === "CNG") {
                          setOutputUnit("Kg");
                        } else {
                          setOutputUnit("Liter");
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-center",
                        selectedFuel === p.type
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200",
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider">
                        Fuel
                      </p>
                      <p className="text-xs font-bold mt-1">{p.type}</p>
                      <p className="text-sm font-bold mt-1">
                        â‚¹{p.pricePerLiter.toFixed(2)}
                      </p>
                    </button>
                  ))}
                  {settings.customItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedFuel(item.name)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-center",
                        selectedFuel === item.name
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200",
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider">
                        {item.unit}
                      </p>
                      <p className="text-xs font-bold mt-1">{item.name}</p>
                      <p className="text-sm font-bold mt-1">
                        â‚¹{item.price.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {mode === "amount"
                      ? `Enter Amount (â‚¹) per ${selectedFuel === "CNG" ? "Kg" : "Liter"}`
                      : `Enter Quantity (${currentUnit})`}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    inputMode="decimal"
                    required
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={mode === "amount" ? "0.00" : "0.000"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Vehicle Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="DL 01 AB 1234"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xl font-bold uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Pump Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={pumpNumber}
                    onChange={(e) => setPumpNumber(e.target.value)}
                    placeholder="Pump 1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Nozzle Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={nozzleNumber}
                    onChange={(e) => setNozzleNumber(e.target.value)}
                    placeholder="Nozzle 2"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Cash", "Card", "UPI"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMode(m as any)}
                        className={cn(
                          "py-3 rounded-xl border font-medium transition-all",
                          paymentMode === m
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Custom Receipt Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Enter custom note for this bill..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="py-4 text-lg"
                  onClick={() => handleSubmit("Draft", false)}
                >
                  Save as Draft
                </Button>
                <Button
                  className="py-4 text-lg shadow-lg shadow-blue-200"
                  onClick={() => handleSubmit("Paid", true)}
                >
                  Generate & Print
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                Summary
              </h3>
              {(settings.pairedPrinterAddress || settings.pairedPrinterName) && (
                <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                  <Bluetooth size={10} />
                  <span>Printer Ready</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-slate-400">Item Name</span>
                <span className="text-xl font-bold">{selectedFuel}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-400">Price / {currentUnit}</span>
                <span className="text-xl font-bold">
                  â‚¹{currentPrice.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-slate-800 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-slate-400">Total Quantity</span>
                <span className="text-2xl font-bold text-blue-400">
                  {displayQuantity.toFixed(3)}{" "}
                  {outputUnit === "Liter"
                    ? "L"
                    : outputUnit === "Kg"
                      ? "Kg"
                      : "Pcs"}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-400">Total Amount</span>
                <span className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(calculatedAmount)}
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
              Live Receipt Preview
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-4">
              <ReceiptContent
                bill={{
                  fuelType: selectedFuel,
                  pricePerLiter: currentPrice,
                  quantity: displayQuantity,
                  unit: outputUnit,
                  totalAmount: calculatedAmount,
                  vehicleNumber: vehicleNumber.toUpperCase() || "---",
                  pumpNumber: pumpNumber.trim(),
                  nozzleNumber: nozzleNumber.trim(),
                  customerName,
                  paymentMode,
                  status: "Draft",
                  customNote: customNote || settings.defaultFooterNote,
                }}
                settings={settings}
                isLivePreview={true}
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Ensure the vehicle number is correct for GST compliance. Stock
              will be automatically deducted upon bill generation.
            </p>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 space-y-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="h-16 w-auto object-contain mb-2"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full">
                      <ReceiptIndianRupee size={32} />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold">Payment Successful</h2>
                  <p className="text-slate-500">
                    Transaction ID: {showReceipt.id}
                  </p>
                </div>

                <ReceiptContent
                  bill={showReceipt}
                  settings={settings}
                />

                <div className="flex gap-3 no-print">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowReceipt(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if (isNativeBluetoothSupported() && settings.pairedPrinterAddress) {
                        try {
                          await printBillToBluetooth(showReceipt, settings, settings.pairedPrinterAddress);
                          setShowReceipt(null);
                        } catch (error) {
                          console.error("Native print error:", error);
                          alert(`Print failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                        }
                        return;
                      }

                      window.print();
                      setShowReceipt(null);
                    }}
                  >
                    Print Receipt
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Hidden Thermal Receipt for Printing (Billing) */}
            <div
              className={cn(
                "hidden print-only thermal-receipt mx-auto",
                settings.printerSize === "58mm"
                  ? "thermal-58mm"
                  : "thermal-80mm",
                settings.receiptTemplate === "Compact"
                  ? "text-[10px]"
                  : settings.receiptTemplate === "Modern"
                    ? "border-l-4 border-black pl-4"
                    : "",
              )}
            >
              <div className="text-center mb-4">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="h-12 w-auto object-contain mx-auto mb-2"
                    referrerPolicy="no-referrer"
                  />
                )}
                <h2 className="font-bold text-lg uppercase">{settings.name}</h2>
                <p>{settings.address}</p>
                <div className="flex flex-wrap justify-center gap-x-2">
                  {settings.visibleFields.gstin && settings.gstin && (
                    <p>GSTIN: {settings.gstin}</p>
                  )}
                  {settings.visibleFields.licenseNo && settings.licenseNo && (
                    <p>LIC: {settings.licenseNo}</p>
                  )}
                </div>
                <p>Tel: {settings.contact}</p>
              </div>
              <div className="border-t border-b border-black py-2 my-2">
                <p>BILL ID: {showReceipt.id}</p>
                <p>
                  DATE: {format(new Date(showReceipt.date), "dd/MM/yyyy HH:mm")}
                </p>
                {settings.visibleFields.vehicleNumber && (
                  <p>VEHICLE: {showReceipt.vehicleNumber}</p>
                )}
                {settings.visibleFields.pumpNumber &&
                  showReceipt.pumpNumber && (
                    <p>PUMP: {showReceipt.pumpNumber}</p>
                  )}
                {settings.visibleFields.nozzleNumber &&
                  showReceipt.nozzleNumber && (
                    <p>NOZZLE: {showReceipt.nozzleNumber}</p>
                  )}
                {settings.visibleFields.customerName &&
                  showReceipt.customerName && (
                    <p>CUSTOMER: {showReceipt.customerName}</p>
                  )}
              </div>
              <table className="w-full text-left my-2">
                <thead>
                  <tr className="border-b border-black">
                    <th>ITEM</th>
                    <th className="text-right">QTY</th>
                    <th className="text-right">AMT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {showReceipt.fuelType} @{" "}
                      {showReceipt.pricePerLiter.toFixed(2)}
                    </td>
                    <td className="text-right">
                      {showReceipt.quantity.toFixed(2)}{" "}
                      {showReceipt.unit === "Liter"
                        ? "L"
                        : showReceipt.unit === "Kg"
                          ? "Kg"
                          : "Pcs"}
                    </td>
                    <td className="text-right">
                      {showReceipt.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t border-black pt-2 mt-2 text-right">
                <p className="font-bold text-lg">
                  TOTAL: {formatCurrency(showReceipt.totalAmount)}
                </p>
                {settings.visibleFields.paymentMode && (
                  <p className="text-xs">Payment: {showReceipt.paymentMode}</p>
                )}
              </div>
              <div className="text-center mt-6">
                {settings.visibleFields.footerNote &&
                  showReceipt.customNote && (
                    <p className="mb-2">{showReceipt.customNote}</p>
                  )}
                <p>*** THANK YOU ***</p>
                <p>HAVE A SAFE DRIVE</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


