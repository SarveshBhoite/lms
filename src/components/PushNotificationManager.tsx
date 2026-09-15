"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle2, Smartphone, ShieldCheck, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager({ compact = false }: { compact?: boolean }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [showPromptBanner, setShowPromptBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (registration) => {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          } else if (Notification.permission === "default") {
            // Check if dismissed before
            const dismissed = localStorage.getItem("jvm_push_prompt_dismissed");
            if (!dismissed) {
              setShowPromptBanner(true);
            }
          }
        })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) return;
    setIsLoading(true);

    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setIsLoading(false);
        return;
      }

      // 2. Get SW registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to Push Manager
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BAQKLf2LmNPLSN6ooP3v1nTBWY_nD7s7w15CdA8RZfX4mZcjHt58_Rx92oQHzDG2lApwBwfpEIajob1RudSHGT4";

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 4. Send subscription keys to our API
      const subJson = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        setShowPromptBanner(false);
      }
    } catch (err) {
      console.error("Failed to subscribe to mobile push notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!isSupported) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPromptBanner(false);
    localStorage.setItem("jvm_push_prompt_dismissed", "true");
  };

  if (!isSupported) {
    return null;
  }

  // Compact toggle for drawer bottom or settings
  if (compact) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className={`w-3.5 h-3.5 ${isSubscribed ? "text-[#7C248C]" : "text-slate-400"}`} />
          <span className="font-medium text-slate-700">Mobile Push</span>
        </div>
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
        ) : isSubscribed ? (
          <button
            onClick={unsubscribeFromPush}
            title="Disable Mobile Push"
            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-rose-50 hover:text-rose-700 px-2 py-0.5 rounded-full border border-emerald-200 transition"
          >
            Active ✓
          </button>
        ) : (
          <button
            onClick={subscribeToPush}
            className="text-[11px] font-bold text-[#7C248C] bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 transition"
          >
            Enable
          </button>
        )}
      </div>
    );
  }

  // Full interactive slide-up / floating notification banner
  return (
    <>
      {showPromptBanner && !isSubscribed && permission !== "denied" && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-purple-200/80 shadow-[0_12px_40px_-8px_rgba(124,36,140,0.22)] flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C248C] to-[#5a1866] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Enable Mobile Notifications
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Get real-time mobile push notifications for live classes, assignment reviews, quiz results, and certificates!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                Later
              </button>
              <button
                onClick={subscribeToPush}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C248C] to-[#9b34ad] hover:opacity-95 shadow-md shadow-purple-900/15 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    Enable Push
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
