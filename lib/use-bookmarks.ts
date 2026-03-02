"use client";

import { useState, useEffect, useCallback } from "react";

export interface Bookmark {
  id: string;
  title: string;
  type: "paper" | "blog" | "techcrunch" | "rundown";
  url: string;
  savedAt: string;
  thumbnail?: string;
  source?: string;
}

const STORAGE_KEY = "bonsai-bookmarks";

function loadBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistBookmarks(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // quota exceeded – silently ignore
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  const addBookmark = useCallback((b: Omit<Bookmark, "savedAt">) => {
    setBookmarks((prev) => {
      if (prev.some((x) => x.id === b.id)) return prev;
      const next = [{ ...b, savedAt: new Date().toISOString() }, ...prev];
      persistBookmarks(next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      persistBookmarks(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (b: Omit<Bookmark, "savedAt">) => {
      if (bookmarks.some((x) => x.id === b.id)) {
        removeBookmark(b.id);
      } else {
        addBookmark(b);
      }
    },
    [bookmarks, addBookmark, removeBookmark]
  );

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
}
