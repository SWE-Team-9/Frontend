"use client";

import { useEffect, useState } from "react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/src/services/notificationsService";
import { NotificationPreferences as NotificationPreferencesType } from "@/src/types/notifications";

const preferenceLabels: Record<keyof NotificationPreferencesType, string> = {
  likes: "Likes",
  comments: "Comments",
  follows: "New followers",
  reposts: "Reposts",
};

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await getNotificationPreferences();
        setPreferences(response);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, []);

  async function handleToggle(key: keyof NotificationPreferencesType) {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(updatedPreferences);
    setIsSaving(true);
    setMessage(null);

    try {
      await updateNotificationPreferences(updatedPreferences);
      setMessage("Notification preferences updated.");
    } catch {
      setPreferences(preferences);
      setMessage("Failed to update preferences.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-neutral-400">Loading notification preferences...</div>;
  }

  if (!preferences) {
    return <div className="text-sm text-red-400">Could not load notification preferences.</div>;
  }

  return (
    <section className="rounded-xl border border-neutral-800 p-5">
        <h2 className="text-lg font-bold text-white">Preferences</h2>
      <div className="mt-5 space-y-4">
        {(Object.keys(preferences) as Array<keyof NotificationPreferencesType>).map((key) => (
          <label
            key={key}
            className="flex items-center justify-between rounded-lg font-bold text-lg px-4 py-3"
          >
            <span className="text-sm text-white">{preferenceLabels[key]}</span>

            <input
              type="checkbox"
              checked={preferences[key]}
              disabled={isSaving}
              onChange={() => handleToggle(key)}
              className="h-4 w-4 accent-white"
            />
          </label>
        ))}
      </div>

      {message && (
        <p className="mt-4 text-sm text-neutral-400">
          {message}
        </p>
      )}
    </section>
  );
}