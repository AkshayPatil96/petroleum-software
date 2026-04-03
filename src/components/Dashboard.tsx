import {
  AlertTriangle,
  Droplets,
  ReceiptIndianRupee,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import type { Bill, FuelPrice, Inventory } from "../types";
import { cn, formatCurrency } from "../lib/utils";
import Card from "./ui/Card";
export default function Dashboard({
  prices,
  inventory,
  bills,
}: {
  prices: FuelPrice[];
  inventory: Inventory[];
  bills: Bill[];
}) {
  const todayBills = bills.filter(
    (b) =>
      format(new Date(b.date), "yyyy-MM-dd") ===
      format(new Date(), "yyyy-MM-dd"),
  );
  const todaySales = todayBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const todayQuantity = todayBills.reduce((acc, b) => acc + b.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
          {format(new Date(), "EEEE, do MMMM yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Today's Sales
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {formatCurrency(todaySales)}
              </h3>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Quantity Sold
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {todayQuantity.toFixed(2)} Units
              </h3>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <Droplets size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Bills</p>
              <h3 className="text-2xl font-bold mt-1">{todayBills.length}</h3>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
              <ReceiptIndianRupee size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Low Stock Alerts
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {
                  inventory.filter((i) => i.currentStock / i.capacity < 0.3)
                    .length
                }
              </h3>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold">Current Fuel Prices</h3>
            <span className="text-xs text-slate-400">Updated daily</span>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {prices.map((p) => (
              <div
                key={p.type}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {p.type}
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ₹{p.pricePerLiter.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold">Stock Levels</h3>
          </div>
          <div className="p-5 space-y-4">
            {inventory.map((item) => {
              const percentage = (item.currentStock / item.capacity) * 100;
              return (
                <div
                  key={item.type}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-slate-500">
                      {item.currentStock.toLocaleString()} /{" "}
                      {item.capacity.toLocaleString()}{" "}
                      {item.unit === "Liter" ? "L" : item.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        percentage < 20
                          ? "bg-red-500"
                          : percentage < 40
                            ? "bg-amber-500"
                            : "bg-blue-500",
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
