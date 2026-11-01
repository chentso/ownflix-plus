"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MediaItem } from "@/types/ownflix";
import AdminDashboardModal from "@/components/AdminDashboardModal";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);

  const fetchMedia = useCallback(async () => {
    const res = await fetch("/api/media");
    if (res.ok) {
      const data = await res.json();
      setMedia(data.media || []);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return (
    <AdminDashboardModal
      standalone
      initialTab="activity"
      media={media}
      onClose={() => router.push("/")}
      onLibraryUpdated={fetchMedia}
    />
  );
}
