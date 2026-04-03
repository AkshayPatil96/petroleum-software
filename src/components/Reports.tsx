import { useState } from "react";
import { Printer, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import type { Bill, PumpSettings } from "../types";
import { cn, formatCurrency } from "../lib/utils";
import Card from "./ui/Card";
import Button from "./ui/Button";
import ReceiptContent from "./ReceiptContent";
export default function Reports({
  bills,
  settings,
}: {
  bills: Bill[];
  settings: PumpSettings;
}) {
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const filteredBills = bills.filter((b) => {
    const date = new Date(b.date);
    const now = new Date();

    // Time filter
    let timeMatch = true;
    if (filter === "today")
      timeMatch = format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
    else if (filter === "week")
      timeMatch = now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
    else if (filter === "month")
      timeMatch =
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    // Search filter
    const searchMatch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vehicleNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (b.pumpNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.nozzleNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.customerName || "").toLowerCase().includes(searchTerm.toLowerCase());

    return timeMatch && searchMatch;
  });

  const totalAmount = filteredBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalQuantity = filteredBills.reduce((acc, b) => acc + b.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search Bill ID, Vehicle, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200">
            {(["today", "week", "month"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all",
                  filter === f
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 bg-blue-600 text-white">
          <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
          <h3 className="text-3xl font-bold mt-1">
            {formatCurrency(totalAmount)}
          </h3>
        </Card>
        <Card className="p-6 bg-slate-900 text-white">
          <p className="text-slate-400 text-sm font-medium">
            Total Volume Sold
          </p>
          <h3 className="text-3xl font-bold mt-1">
            {totalQuantity.toFixed(2)} Units
          </h3>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Bill ID
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Vehicle
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Pump / Nozzle
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Item
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  Quantity
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedBill(bill)}
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 cursor-pointer">
                      {bill.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(bill.date), "dd MMM, HH:mm")}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {bill.vehicleNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {bill.pumpNumber || "N/A"} / {bill.nozzleNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">
                        {bill.fuelType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">
                      {bill.quantity.toFixed(2)}{" "}
                      {bill.unit === "Liter"
                        ? "L"
                        : bill.unit === "Kg"
                          ? "Kg"
                          : "Pcs"}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-right">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBill(bill)}
                        className="text-xs h-8 px-3"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bill Details Modal */}
      <AnimatePresence>
        {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Bill Details</h2>
                  <button
                    onClick={() => setSelectedBill(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <ReceiptContent
                  bill={selectedBill}
                  settings={settings}
                />

                <div className="flex gap-3 no-print">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedBill(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 flex items-center justify-center"
                    onClick={() => {
                      window.print();
                    }}
                  >
                    <Printer
                      size={18}
                      className="mr-2"
                    />
                    Print Bill
                  </Button>
                </div>
              </div>
            </motion.div>


            {/* Hidden Thermal Receipt for Printing (Reports) */}
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
                <p>BILL ID: {selectedBill.id}</p>
                <p>
                  DATE:{" "}
                  {format(new Date(selectedBill.date), "dd/MM/yyyy HH:mm")}
                </p>
                {settings.visibleFields.vehicleNumber && (
                  <p>VEHICLE: {selectedBill.vehicleNumber}</p>
                )}
                {settings.visibleFields.pumpNumber &&
                  selectedBill.pumpNumber && (
                    <p>PUMP: {selectedBill.pumpNumber}</p>
                  )}
                {settings.visibleFields.nozzleNumber &&
                  selectedBill.nozzleNumber && (
                    <p>NOZZLE: {selectedBill.nozzleNumber}</p>
                  )}
                {settings.visibleFields.customerName &&
                  selectedBill.customerName && (
                    <p>CUSTOMER: {selectedBill.customerName}</p>
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
                      {selectedBill.fuelType} @{" "}
                      {selectedBill.pricePerLiter.toFixed(2)}
                    </td>
                    <td className="text-right">
                      {selectedBill.quantity.toFixed(2)}{" "}
                      {selectedBill.unit === "Liter"
                        ? "L"
                        : selectedBill.unit === "Kg"
                          ? "Kg"
                          : "Pcs"}
                    </td>
                    <td className="text-right">
                      {selectedBill.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t border-black pt-2 mt-2 text-right">
                <p className="font-bold text-lg">
                  TOTAL: {formatCurrency(selectedBill.totalAmount)}
                </p>
                {settings.visibleFields.paymentMode && (
                  <p className="text-xs">Payment: {selectedBill.paymentMode}</p>
                )}
              </div>
              <div className="text-center mt-6">
                {settings.visibleFields.footerNote &&
                  selectedBill.customNote && (
                    <p className="mb-2">{selectedBill.customNote}</p>
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
