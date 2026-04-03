import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Bluetooth, Fuel, Printer, Trash2 } from 'lucide-react';
import type { PumpSettings } from '../types';
import { cn } from '../lib/utils';
import Card from './ui/Card';
import Button from './ui/Button';
export default function SettingsView({ settings, setSettings }: { settings: PumpSettings, setSettings: any }) {
  const [formData, setFormData] = useState(settings);
  const [isScanning, setIsScanning] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const pairPrinter = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      alert('Bluetooth is not supported in this browser or environment. Please use Chrome/Edge and ensure you are on HTTPS.');
      return;
    }

    setIsScanning(true);
    try {
      // Request any device that might be a printer
      // We use filters to help the browser find printers more easily
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { services: ['00001101-0000-1000-8000-00805f9b34fb'] }, // Serial Port Profile (Common for printers)
          { namePrefix: 'InnerPrinter' },
          { namePrefix: 'RPP' },
          { namePrefix: 'MTP' },
          { namePrefix: 'PT' },
          { namePrefix: 'Bluetooth' }
        ],
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb']
      }).catch(() => {
        // Fallback to all devices if specific filters fail or user cancels
        return nav.bluetooth.requestDevice({ acceptAllDevices: true });
      });

      if (device) {
        setFormData({ ...formData, pairedPrinterName: device.name || 'Unknown Printer' });
        alert(`Successfully discovered and paired with ${device.name || 'Unknown Printer'}`);
      }
    } catch (error) {
      console.error('Bluetooth error:', error);
      if (error instanceof Error && error.name !== 'NotFoundError') {
        alert('Discovery failed: ' + error.message);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const forgetPrinter = () => {
    setFormData({ ...formData, pairedPrinterName: undefined });
  };

  const testPrint = () => {
    if (!formData.pairedPrinterName) {
      alert('Please pair a printer first.');
      return;
    }
    alert(`Sending test print to ${formData.pairedPrinterName}... (In a real environment, this would send ESC/POS commands via Bluetooth)`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pump Settings</h1>
      
      <Card className="p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Fuel className="text-slate-300" size={32} />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl text-xs font-bold">
                Upload Logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            {formData.logoUrl && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, logoUrl: '' })}
                className="text-xs text-red-500 font-bold hover:underline"
              >
                Remove Logo
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Pump Name</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900">Security & Access Control</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Admin PIN (4 Digits)</label>
                <input 
                  type="password"
                  maxLength={4}
                  value={formData.adminPin}
                  onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Operator PIN (4 Digits)</label>
                <input 
                  type="password"
                  maxLength={4}
                  value={formData.operatorPin}
                  onChange={(e) => setFormData({ ...formData, operatorPin: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">Admin PIN has full access. Operator PIN can only access Dashboard and Billing.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Address</label>
            <textarea 
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">GSTIN Number (Optional)</label>
              <input 
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">License Number (Optional)</label>
              <input 
                type="text"
                value={formData.licenseNo || ''}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                placeholder="Explosive License No."
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contact Number</label>
              <input 
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Default Receipt Footer</label>
              <input 
                type="text"
                value={formData.defaultFooterNote || ''}
                onChange={(e) => setFormData({ ...formData, defaultFooterNote: e.target.value })}
                placeholder="e.g. THANK YOU! HAVE A SAFE DRIVE"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Bluetooth Printer Discovery</h3>
              <div className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                formData.pairedPrinterName ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
              )}>
                {formData.pairedPrinterName ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl">
              <div className={cn(
                "p-3 rounded-full transition-all",
                isScanning ? "bg-blue-100 text-blue-600 animate-pulse" : 
                formData.pairedPrinterName ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
              )}>
                <Bluetooth size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">
                  {isScanning ? 'Scanning for nearby printers...' : 
                   formData.pairedPrinterName ? formData.pairedPrinterName : 'No printer paired'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isScanning ? 'Please wait while we search...' : 
                   formData.pairedPrinterName ? 'Ready to print receipts' : 'Scan to discover nearby thermal printers'}
                </p>
              </div>
              <div className="flex gap-2">
                {formData.pairedPrinterName && !isScanning && (
                  <Button variant="outline" onClick={forgetPrinter} className="text-xs py-1 px-3 border-red-200 text-red-500 hover:bg-red-50">
                    Forget
                  </Button>
                )}
                <Button 
                  variant={formData.pairedPrinterName ? "secondary" : "primary"} 
                  onClick={pairPrinter} 
                  disabled={isScanning}
                  className="text-xs py-1 px-3"
                >
                  {isScanning ? 'Scanning...' : formData.pairedPrinterName ? 'Scan Again' : 'Scan & Discover'}
                </Button>
              </div>
            </div>

            {formData.pairedPrinterName && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={testPrint} className="flex-1 text-xs py-2">
                  <Printer size={14} className="mr-2" />
                  Send Test Receipt
                </Button>
              </div>
            )}

            {!(navigator as any).bluetooth && (
              <p className="text-[10px] text-amber-600 font-medium bg-amber-50 p-2 rounded-lg border border-amber-100">
                Note: Web Bluetooth discovery is restricted in this environment. Please ensure you are using a compatible browser (Chrome/Edge) and the app is served over HTTPS.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Thermal Printer Size</label>
            <div className="grid grid-cols-2 gap-3">
              {(['58mm', '80mm'] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFormData({ ...formData, printerSize: size })}
                  className={cn(
                    "py-2 rounded-lg border font-medium transition-all",
                    formData.printerSize === size 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Custom Items & Products</h3>
              <Button 
                variant="outline" 
                className="text-xs py-1 h-8"
                onClick={() => {
                  const name = prompt('Enter item name:');
                  const price = parseFloat(prompt('Enter price per unit:') || '0');
                  const unit = prompt('Enter unit (Liter, Kg, Pcs):') as any;
                  const category = prompt('Enter category (Fuel, Lubricant, Other):') as any;
                  if (name && price && ['Liter', 'Kg', 'Pcs'].includes(unit) && ['Fuel', 'Lubricant', 'Other'].includes(category)) {
                    setFormData({
                      ...formData,
                      customItems: [
                        ...formData.customItems,
                        { id: Date.now().toString(), name, price, unit, category }
                      ]
                    });
                  } else if (name) {
                    alert('Invalid price, unit, or category. Please use valid options.');
                  }
                }}
              >
                + Add Item
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.customItems.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                  No custom items added yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {formData.customItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500">₹{item.price.toFixed(2)} / {item.unit} • {item.category}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          customItems: formData.customItems.filter(i => i.id !== item.id)
                        })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Unit Conversions</h3>
              <Button 
                variant="outline" 
                className="text-xs py-1 h-8"
                onClick={() => {
                  const from = prompt('From unit (Liter, Kg, Pcs):') as any;
                  const to = prompt('To unit (Liter, Kg, Pcs):') as any;
                  const factor = parseFloat(prompt('Conversion factor (e.g. 0.75):') || '0');
                  if (['Liter', 'Kg', 'Pcs'].includes(from) && ['Liter', 'Kg', 'Pcs'].includes(to) && factor > 0) {
                    setFormData({
                      ...formData,
                      unitConversions: [
                        ...formData.unitConversions,
                        { from, to, factor }
                      ]
                    });
                  } else {
                    alert('Invalid units or factor.');
                  }
                }}
              >
                + Add Conversion
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.unitConversions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                  No unit conversions defined.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {formData.unitConversions.map((conv, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-slate-900">1 {conv.from} = {conv.factor} {conv.to}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          unitConversions: formData.unitConversions.filter((_, i) => i !== idx)
                        })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900">Receipt Customization</h3>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Receipt Template</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Standard', 'Compact', 'Modern'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, receiptTemplate: t })}
                    className={cn(
                      "py-2 rounded-lg border font-medium transition-all text-sm",
                      formData.receiptTemplate === t 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Visible Fields</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(formData.visibleFields).map(([field, isVisible]) => (
                  <label key={field} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                    <input 
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setFormData({
                        ...formData,
                        visibleFields: {
                          ...formData.visibleFields,
                          [field]: e.target.checked
                        }
                      })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700 capitalize">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3 items-center">
            <Button type="submit" className="flex-1">
              {saved ? '✓ Saved!' : 'Save Configuration'}
            </Button>
            <Button variant="outline" onClick={() => setFormData(settings)}>Reset</Button>
          </div>
        </form>
      </Card>

      <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200">
        <h4 className="font-bold text-slate-900 mb-2">Data Management</h4>
        <p className="text-sm text-slate-600 mb-4">All your data is stored locally in this browser. You can clear all transactions to start fresh.</p>
        <Button variant="danger" onClick={() => {
          if (confirm('Are you sure you want to delete all billing history? This cannot be undone.')) {
            localStorage.removeItem('fuel_bills');
            window.location.reload();
          }
        }}>
          Clear All History
        </Button>
      </div>
    </div>
  );
}

