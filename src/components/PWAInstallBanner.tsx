import React, { useState } from "react";
import { Download, Smartphone, Apple, Check, X, Shield, Sparkles } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already installed or user dismissed it in this session, hide
  if (isInstalled || dismissed) {
    return null;
  }

  // Only show if browser supports native prompt OR is iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-950/60 via-zinc-950 to-zinc-950 border-b border-amber-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs font-mono no-print">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span>App direkt installieren</span>
              <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-extrabold uppercase">
                Offline & Schnellstart
              </span>
            </span>
            <p className="text-[11px] text-zinc-400 hidden md:block">
              Gesetzes-Scanner mit 1 Klick als vollwertige native App auf dem Smartphone-Homescreen oder Desktop speichern.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-gold-glow cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{installing ? "Installiere..." : "Jetzt installieren"}</span>
            </button>
          )}

          {isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Apple className="w-3.5 h-3.5 text-zinc-300" />
              <span>Auf iPhone / iPad</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                <Apple className="w-4 h-4" />
                <span>Installation auf iPhone / iPad</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 font-sans leading-relaxed">
              <p>
                Auf Apple iOS Geräten wird die App direkt über Safari zum Home-Bildschirm hinzugefügt:
              </p>
              <ol className="space-y-2 font-mono text-[11px] bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Tippen Sie unten in der Safari-Menüleiste auf das <strong>Teilen-Symbol (Viereck mit Pfeil nach oben)</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Wischen Sie nach unten und wählen Sie <strong>„Zum Home-Bildschirm“</strong> (Add to Home Screen).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Oben rechts auf <strong>„Hinzufügen“</strong> tippen – fertig!</span>
                </li>
              </ol>
              <p className="text-[11px] text-zinc-400">
                Die App öffnet sich anschließend im Vollbildmodus ohne Browserleiste wie eine reguläre App aus dem App Store.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs transition-all cursor-pointer"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  );
};
