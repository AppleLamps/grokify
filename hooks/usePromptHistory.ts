'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PromptHistoryItem {
  id: string;
  username: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

const STORAGE_KEY = 'xpic-prompt-history';
const MAX_HISTORY_ITEMS = 10; // Keep small - image URLs can be large
const SAVE_DEBOUNCE_MS = 500;
const MAX_IMAGE_URL_LENGTH = 500; // If URL is longer than this, it's likely base64

// Helper to check if URL is a data URL (base64)
function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

// Helper to truncate/skip large image URLs to save space
function sanitizeForStorage(items: PromptHistoryItem[]): PromptHistoryItem[] {
  return items.map(item => ({
    ...item,
    // Don't store base64 images - they're too large
    imageUrl: isDataUrl(item.imageUrl) ? '' : item.imageUrl
  }));
}

// Helper to estimate storage size
function estimateStorageSize(items: PromptHistoryItem[]): number {
  return JSON.stringify(items).length;
}

export function usePromptHistory() {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialLoadRef = useRef(true);

  // Load history from localStorage on mount (only once)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load prompt history:', error);
      setHistory([]);
    } finally {
      // Mark initial load as complete
      isInitialLoadRef.current = false;
    }
  }, []); // Empty dependency - only run once on mount

  // Debounced save to localStorage whenever history changes
  useEffect(() => {
    // Skip save on initial load to avoid redundant write
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce writes by 500ms to reduce CPU usage
    saveTimeoutRef.current = setTimeout(() => {
      const saveWithRetry = (items: PromptHistoryItem[], attempt: number = 0): void => {
        // Sanitize items to remove large data URLs
        const sanitized = sanitizeForStorage(items);

        try {
          const data = JSON.stringify(sanitized);
          localStorage.setItem(STORAGE_KEY, data);
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, reducing history...');

            // Handle quota exceeded - progressively reduce history
            if (attempt < 3 && items.length > 1) {
              // Remove oldest items first
              const reduced = items.slice(0, Math.max(1, Math.floor(items.length / 2)));
              console.log(`Reducing history from ${items.length} to ${reduced.length} items`);
              saveWithRetry(reduced, attempt + 1);
              // Update state to match what we actually saved
              setHistory(reduced);
            } else {
              // Last resort: clear everything
              console.log('Clearing history due to persistent quota issues');
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                // Ignore removal errors
              }
              setHistory([]);
            }
          } else {
            console.error('Failed to save prompt history:', error);
          }
        }
      };
      saveWithRetry(history);
    }, SAVE_DEBOUNCE_MS);

    // Cleanup timeout on unmount or before next effect
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [history]);

  const addToHistory = useCallback((item: Omit<PromptHistoryItem, 'id' | 'createdAt'>) => {
    const newItem: PromptHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev];
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const deleteFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryItem = useCallback(
    (id: string) => {
      return history.find((item) => item.id === id);
    },
    [history]
  );

  return {
    history,
    addToHistory,
    deleteFromHistory,
    clearHistory,
    getHistoryItem,
  };
}
