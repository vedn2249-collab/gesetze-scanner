/**
 * Web Push & Audio Notification Service for Law Radar Real-time Alerts
 * Complies with modern browser Notification API and Web Audio API.
 */

import { LawAlert } from "../types";

// Audio synthesized warning chime using Web Audio API
export function playCriticalWarningChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Dual-tone harmonic siren alert (880Hz -> 1174Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.45);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.45);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn("Audio chime could not be played:", err);
  }
}

/**
 * Checks current browser notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Requests browser permission for Web Push Notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    console.warn("Notification request permission failed:", e);
    return false;
  }
}

/**
 * Sends a real-time Web Push notification for a critical law alert
 */
export function sendLawRadarPushAlert(alert: LawAlert, options: { playSound?: boolean } = { playSound: true }) {
  if (options.playSound) {
    playCriticalWarningChime();
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    try {
      const isCritical = alert.severity === "CRITICAL";
      const title = isCritical
        ? `🚨 KRITISCHE GESETZESWARNUNG (${alert.lawCode})`
        : `⚖️ Gesetzes-Radar Update: ${alert.lawCode}`;

      const notif = new Notification(title, {
        body: `${alert.title}\n${alert.summary.slice(0, 140)}...\nEmpfehlung: ${alert.recommendedAction.slice(0, 80)}`,
        icon: "/icon.png",
        tag: alert.id,
        requireInteraction: isCritical,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn("Push notification creation error:", err);
    }
  }
}
