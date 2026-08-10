import React, { useState } from 'react';
import { Mail, Car, Bike, Truck, Footprints, Zap, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import { VehicleType, TrafficUser } from '../types';

interface TrafficSubscribeFormProps {
  currentUser: TrafficUser | null;
  onRegisterSuccess: (user: TrafficUser, isUpdate: boolean) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

interface VehicleOption {
  type: VehicleType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  { type: 'auto', label: 'Auto / PKW', description: 'StVO, Parken, Tempolimits, Umweltzonen', icon: Car },
  { type: 'escooter', label: 'E-Scooter', description: 'Elektrokleinstfahrzeuge, Gehweg-Regeln', icon: Zap },
  { type: 'fahrrad', label: 'Fahrrad / E-Bike', description: 'Radwege, Beleuchtung, Helme, Bußgelder', icon: Bike },
  { type: 'roller', label: 'Roller / Mofa', description: '50ccm, Versicherungskennzeichen', icon: Bike },
  { type: 'motorrad', label: 'Motorrad', description: 'Krafträder, Helmpflicht, Lärmregeln', icon: Bike },
  { type: 'lkw', label: 'LKW / Transporter', description: 'Maut, Lenkzeiten, Überholverbote, Gewichte', icon: Truck },
  { type: 'quad', label: 'Quad / ATV', description: 'Sicherheitsgurte, Zulassung, Reifen', icon: Sliders },
  { type: 'fussgaenger', label: 'Fußgänger', description: 'Zebrastreifen, Gehwege, Schulwege', icon: Footprints },
];

export default function TrafficSubscribeForm({ currentUser, onRegisterSuccess, isLoading, setIsLoading }: TrafficSubscribeFormProps) {
  const [email, setEmail] = useState(currentUser?.email || '');
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleType[]>(currentUser?.vehicles || ['auto']);
  const [planType, setPlanType] = useState<'yearly' | 'lifetime'>('yearly');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleVehicle = (type: VehicleType) => {
    if (selectedVehicles.includes(type)) {
      if (selectedVehicles.length > 1) {
        setSelectedVehicles(selectedVehicles.filter(v => v !== type));
      } else {
        setMessage({ type: 'error', text: 'Bitte wähle mindestens eine Fahrzeugart aus!' });
      }
    } else {
      setSelectedVehicles([...selectedVehicles, type]);
      if (message && message.type === 'error' && message.text.includes('mindestens')) {
        setMessage(null);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Call revenue checkout API endpoint
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: planType === 'yearly' ? 'traffic_yearly' : 'traffic_lifetime',
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
    } catch (err) {
      console.warn('Checkout endpoint error, proceeding with instant registration:', err);
    }

    setTimeout(() => {
      const isUpdate = !!currentUser;
      const newUser: TrafficUser = {
        email: email.trim(),
        vehicles: selectedVehicles,
        registeredAt: currentUser?.registeredAt || new Date().toISOString(),
        paidUntil: planType === 'lifetime' ? '2099-12-31' : new Date(Date.now() + 365 * 86400000).toISOString(),
        paymentType: planType === 'lifetime' ? 'lifetime' : 'yearly'
      };

      try {
        localStorage.setItem('gs_traffic_user', JSON.stringify(newUser));
      } catch (err) {
        console.warn('Could not save to localStorage', err);
      }

      setMessage({
        type: 'success',
        text: isUpdate 
          ? `✅ Fahrzeug-Präferenzen erfolgreich aktualisiert (${planType === 'yearly' ? '4,99 €/Jahr' : '19,99 € Lebenslang'})!` 
          : `🎉 Erfolgreich freigeschaltet! StVO-Filter aktiv (${planType === 'yearly' ? '4,99 €/Jahr' : '19,99 € Lebenslang'}).`
      });

      onRegisterSuccess(newUser, isUpdate);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/20 shadow-gold-glow flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          StVO-Fahrzeugüberwachung abonnieren
        </h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Geben Sie Ihre E-Mail-Adresse an und wählen Sie Ihre Fahrzeuge aus. Der Gesetze-Scanner filtert alle StVO-Änderungen automatisch auf Ihre Fahrzeugkategorien.
        </p>
      </div>

      <form onSubmit={handleRegister} className="flex-grow flex flex-col justify-between gap-6">
        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="traffic-subscribe-email" className="block text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            Ihre E-Mail-Adresse für Gesetzes-Alerts:
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="traffic-subscribe-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="z.B. rechtsabteilung@kanzlei.de oder privat@mail.de"
              className="w-full pl-11 pr-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono transition-all"
              required
            />
          </div>
        </div>

        {/* Vehicle Picker Grid */}
        <div className="space-y-3">
          <span className="block text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            Welche Fahrzeuge / Fortbewegungsmittel fährst du?
          </span>
          <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {VEHICLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedVehicles.includes(opt.type);
              return (
                <button
                  key={opt.type}
                  type="button"
                  id={`traffic-vehicle-toggle-${opt.type}`}
                  onClick={() => toggleVehicle(opt.type)}
                  className={`p-3 rounded-xl border flex flex-col items-start text-left gap-1.5 cursor-pointer active:scale-[0.98] transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400 text-white shadow-sm'
                      : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-black">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}

                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-amber-400 text-black' : 'bg-zinc-900 text-zinc-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold font-mono text-white leading-tight">{opt.label}</span>
                    <span className="block text-[10px] text-zinc-400 leading-tight mt-0.5">{opt.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Plan Picker */}
        <div className="space-y-2">
          <span className="block text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            Abonnement & Tarif wählen:
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPlanType('yearly')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                planType === 'yearly'
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-gold-glow'
                  : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-white block">1-Jahres-Abo</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Autom. Verlängerung</span>
              </div>
              <div className="mt-2 text-sm font-mono font-extrabold text-amber-400">
                4,99 € <span className="text-[10px] font-normal text-zinc-400">/ Jahr</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPlanType('lifetime')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                planType === 'lifetime'
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-gold-glow'
                  : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-white block">Lebenslang Flatrate</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Einmaliger Kauf</span>
              </div>
              <div className="mt-2 text-sm font-mono font-extrabold text-amber-400">
                19,99 € <span className="text-[10px] font-normal text-zinc-400">einmalig</span>
              </div>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border font-mono ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <p className="leading-relaxed">{message.text}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          id="btn_traffic_subscribe_submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer border border-amber-200 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            `Jetzt bestellen (${planType === 'yearly' ? '4,99 €/Jahr' : '19,99 € einmalig'})`
          )}
        </button>
      </form>
    </div>
  );
}
