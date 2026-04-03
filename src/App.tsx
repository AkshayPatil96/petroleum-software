import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Fuel,
  ReceiptIndianRupee,
  History,
  Settings as SettingsIcon,
  Menu,
  X,
  Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Bill, FuelPrice, Inventory, ItemUnit, PumpSettings, UserRole } from './types';
import { cn, convertUnit, safeLocalStorageGet, safeLocalStorageSet } from './lib/utils';
import Billing from './components/Billing';
import Dashboard from './components/Dashboard';
import InventoryView from './components/InventoryView';
import Reports from './components/Reports';
import SettingsView from './components/SettingsView';

// ─── Data Versioning ──────────────────────────────────────────────────────────
// HOW TO USE: When you change any default value in DEFAULT_PRICES or
// DEFAULT_INVENTORY, do two things:
//   1. Bump DATA_VERSION by 1.
//   2. Add a new entry in `migrations` for that version that patches the old
//      saved data to match the new default.
// The migration runs once per device and is then stored as the new version.
// ──────────────────────────────────────────────────────────────────────────────
const DATA_VERSION = 2;

const DEFAULT_PRICES: FuelPrice[] = [
  { type: 'Petrol', pricePerLiter: 104.50, lastUpdated: new Date().toISOString() },
  { type: 'Diesel', pricePerLiter: 92.30, lastUpdated: new Date().toISOString() },
  { type: 'CNG', pricePerLiter: 82.00, lastUpdated: new Date().toISOString() },
  { type: 'Power', pricePerLiter: 108.20, lastUpdated: new Date().toISOString() },
];

const DEFAULT_INVENTORY: Inventory[] = [
  { type: 'Petrol', currentStock: 4500, capacity: 10000, unit: 'Liter' },
  { type: 'Diesel', currentStock: 2800, capacity: 10000, unit: 'Liter' },
  { type: 'CNG', currentStock: 1200, capacity: 5000, unit: 'Kg' },
  { type: 'Power', currentStock: 1500, capacity: 5000, unit: 'Liter' },
];

type MigrateData = { prices: FuelPrice[]; inventory: Inventory[] };
type MigrationFn = (data: MigrateData) => MigrateData;

const migrations: Record<number, MigrationFn> = {
  // v2: CNG unit corrected from 'Liter' to 'Kg'
  2: (data) => ({
    ...data,
    inventory: data.inventory.map((item) =>
      item.type === 'CNG' && item.unit === 'Liter'
        ? { ...item, unit: 'Kg' as ItemUnit }
        : item
    ),
  }),
};

let _initCache: MigrateData | null = null;

function initializeData(): MigrateData {
  if (_initCache) return _initCache;

  const storedVersion = safeLocalStorageGet<number>('data_version', 0);

  let data: MigrateData = {
    prices: safeLocalStorageGet<FuelPrice[]>('fuel_prices', DEFAULT_PRICES),
    inventory: safeLocalStorageGet<Inventory[]>('fuel_inventory', DEFAULT_INVENTORY).map(
      (item: any) => ({
        ...item,
        unit: item.unit === 'Liters' ? 'Liter' : (item.unit || 'Liter'),
      })
    ),
  };

  // Apply every pending migration in order
  let version = storedVersion;
  while (version < DATA_VERSION) {
    version += 1;
    if (migrations[version]) {
      data = migrations[version](data);
    }
  }

  // Persist migrated data and bump stored version (runs once per device)
  if (storedVersion < DATA_VERSION) {
    safeLocalStorageSet('fuel_prices', data.prices);
    safeLocalStorageSet('fuel_inventory', data.inventory);
    safeLocalStorageSet('data_version', DATA_VERSION);
  }

  _initCache = data;
  return data;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'billing' | 'inventory' | 'reports' | 'settings'>('billing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // --- State ---
  const [prices, setPrices] = useState<FuelPrice[]>(() => initializeData().prices);

  const [inventory, setInventory] = useState<Inventory[]>(() => initializeData().inventory);

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = safeLocalStorageGet<any[]>('fuel_bills', []);
    return saved.map((bill: any) => ({
      ...bill,
      unit: bill.unit === 'Liters' ? 'Liter' : (bill.unit || 'Liter')
    }));
  });

  const [settings, setSettings] = useState<PumpSettings>(() => {
    const saved = localStorage.getItem('fuel_settings');
    const defaults: PumpSettings = {
      name: 'Shreya Petroleum',
      address: 'a/p nilji Taluka miraj Dist. sangli',
      gstin: '',
      contact: '9372707007',
      adminPin: '2799',
      operatorPin: '2222',
      printerSize: '58mm',
      logoUrl: '',
      licenseNo: '',
      defaultFooterNote: 'THANK YOU! HAVE A SAFE DRIVE',
      receiptTemplate: 'Standard',
      customItems: [],
      unitConversions: [
        { from: 'Liter', to: 'Kg', factor: 0.75 } // Default example
      ],
      visibleFields: {
        customerName: true,
        vehicleNumber: true,
        pumpNumber: true,
        nozzleNumber: true,
        gstin: true,
        licenseNo: true,
        paymentMode: true,
        footerNote: true
      }
    };
    
    if (!saved) return defaults;
    
    const parsed = JSON.parse(saved);
    
    // Migration: If the user is still using the old default name or PINs, update them to the new requested ones
    if (parsed.name === 'City Fuel Station' || parsed.name === 'shreyafuel') parsed.name = defaults.name;
    if (parsed.contact === '+91 98765 43210' || parsed.contact === '9226612900') parsed.contact = defaults.contact;
    if (parsed.address === 'Main Road, Sector 12, New Delhi') parsed.address = defaults.address;
    if (parsed.gstin === '07AAAAA0000A1Z5') parsed.gstin = defaults.gstin;
    if (parsed.adminPin === '1234') parsed.adminPin = defaults.adminPin;
    if (parsed.operatorPin === '0000') parsed.operatorPin = defaults.operatorPin;

    return {
      ...defaults,
      ...parsed,
      adminPin: parsed.adminPin || parsed.pin || defaults.adminPin,
      operatorPin: parsed.operatorPin || defaults.operatorPin,
      visibleFields: {
        ...defaults.visibleFields,
        ...(parsed.visibleFields || {})
      }
    };
  });

  // --- Persistence ---
  useEffect(() => {
    safeLocalStorageSet('fuel_prices', prices);
    safeLocalStorageSet('fuel_inventory', inventory);
    safeLocalStorageSet('fuel_bills', bills);
    safeLocalStorageSet('fuel_settings', settings);
  }, [prices, inventory, bills, settings]);

  // Auto-unlock if no PIN is set
  useEffect(() => {
    if (!settings.adminPin && !settings.operatorPin) {
      setIsLocked(false);
      setUserRole('Admin');
    }
  }, [settings.adminPin, settings.operatorPin]);

  const handleUnlock = () => {
    if (pinInput === settings.adminPin) {
      setIsLocked(false);
      setUserRole('Admin');
      setPinInput('');
      setPinError(false);
    } else if (pinInput === settings.operatorPin) {
      setIsLocked(false);
      setUserRole('Operator');
      setActiveTab('billing');
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setIsLocked(true);
    setUserRole(null);
    setPinInput('');
  };

  const addBill = (bill: Omit<Bill, 'id' | 'date'> & { id?: string; date?: string }) => {
    const newBill: Bill = {
      ...bill,
      id: bill.id || `BILL-${Date.now()}`,
      date: bill.date || new Date().toISOString(),
    };
    setBills(prev => [newBill, ...prev]);
    
    // Update inventory
    setInventory(prev => prev.map(item => {
      if (item.type === bill.fuelType) {
        const quantityInBaseUnit = convertUnit(bill.quantity, bill.unit, item.unit, settings.unitConversions);
        return { ...item, currentStock: Math.max(0, item.currentStock - quantityInBaseUnit) };
      }
      return item;
    }));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Operator'] },
    { id: 'billing', label: 'Billing', icon: ReceiptIndianRupee, roles: ['Admin', 'Operator'] },
    { id: 'inventory', label: 'Fuel & Stock', icon: Fuel, roles: ['Admin'] },
    { id: 'reports', label: 'Reports', icon: History, roles: ['Admin'] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['Admin'] },
  ].filter(item => userRole && item.roles.includes(userRole));

  if (isLocked && (settings.adminPin || settings.operatorPin)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <h1>hello</h1>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6"
        >
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <SettingsIcon size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">App Locked</h2>
            <p className="text-slate-500 mt-1">Enter Admin or Operator PIN</p>
          </div>
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all",
                  pinError ? "bg-red-400 border-red-400" :
                  pinInput.length > i ? "bg-blue-600 border-blue-600" : "border-slate-200"
                )} 
              />
            ))}
          </div>
          {pinError && (
            <p className="text-red-500 text-sm font-medium animate-pulse">Incorrect PIN. Try again.</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((val) => (
              <button
                key={val}
                onClick={() => {
                  if (val === 'C') { setPinInput(''); setPinError(false); }
                  else if (val === 'OK') handleUnlock();
                  else if (pinInput.length < 4) { setPinError(false); setPinInput(prev => prev + val); }
                }}
                className={cn(
                  "h-14 rounded-xl font-bold text-xl transition-all active:scale-90",
                  val === 'OK' ? "bg-blue-600 text-white col-span-1" : 
                  val === 'C' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center gap-2">
          <Droplets className="text-blue-400" />
          <span className="font-bold text-lg">shreyafuel</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Droplets className="text-white" />
          </div>
          <span className="font-bold text-xl text-white">shreyafuel</span>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                activeTab === item.id 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-slate-800">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all mb-2"
            >
              <Droplets size={18} />
              <span className="text-sm font-medium">Install App</span>
            </button>
          )}
          {userRole === 'Admin' && (
            <button 
              onClick={() => {
                setActiveTab('settings');
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all mb-2"
            >
              <SettingsIcon size={18} />
              <span className="text-sm font-medium">Change PIN</span>
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-all mb-4"
          >
            <X size={18} />
            <span className="text-sm font-medium">Logout / Lock</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {settings.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{settings.name}</p>
              <p className="text-xs text-slate-500 truncate">{userRole} Terminal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 no-print">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard prices={prices} inventory={inventory} bills={bills} />
            )}
            {activeTab === 'billing' && (
              <Billing prices={prices} onAddBill={addBill} settings={settings} />
            )}
            {activeTab === 'inventory' && (
              <InventoryView 
                inventory={inventory} 
                prices={prices} 
                setPrices={setPrices} 
                setInventory={setInventory} 
              />
            )}
            {activeTab === 'reports' && (
              <Reports bills={bills} settings={settings} />
            )}
            {activeTab === 'settings' && (
              <SettingsView settings={settings} setSettings={setSettings} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
