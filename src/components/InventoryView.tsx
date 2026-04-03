import { useState } from 'react';
import { Fuel } from 'lucide-react';
import { format } from 'date-fns';
import type { FuelPrice, FuelType, Inventory } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
export default function InventoryView({ inventory, prices, setPrices, setInventory }: any) {
  const [editingType, setEditingType] = useState<FuelType | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  const handleUpdate = (type: FuelType) => {
    if (newPrice) {
      setPrices((prev: FuelPrice[]) => prev.map(p => 
        p.type === type ? { ...p, pricePerLiter: parseFloat(newPrice), lastUpdated: new Date().toISOString() } : p
      ));
    }
    if (newStock) {
      const stockValue = Math.max(0, parseFloat(newStock));
      setInventory((prev: Inventory[]) => prev.map(i => 
        i.type === type ? { ...i, currentStock: stockValue } : i
      ));
    }
    setEditingType(null);
    setNewPrice('');
    setNewStock('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fuel & Stock Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inventory.map((item: Inventory) => {
          const price = prices.find((p: FuelPrice) => p.type === item.type);
          const isEditing = editingType === item.type;
          
          return (
            <Card key={item.type} className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Fuel size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.type}</h3>
                    <p className="text-xs text-slate-400">Last updated: {format(new Date(price?.lastUpdated || ''), 'dd MMM, HH:mm')}</p>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => {
                    setEditingType(item.type);
                    setNewPrice(price?.pricePerLiter.toString() || '');
                    setNewStock(item.currentStock.toString());
                  }}>
                    Update
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">New Price (₹)</label>
                      <input 
                        type="number" 
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Current Stock (L)</label>
                      <input 
                        type="number" 
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => handleUpdate(item.type)}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Price</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">₹{price?.pricePerLiter.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Level</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{item.currentStock.toLocaleString()} {item.unit === 'Liter' ? 'L' : item.unit === 'Kg' ? 'Kg' : 'Pcs'}</p>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.currentStock / item.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
