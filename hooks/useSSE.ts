"use client";

import { useEffect, useRef, useCallback } from "react";

type SSEHandler = (data: unknown) => void;

/**
 * React hook for Server-Sent Events.
 *
 * Connects to /api/sse/stream and dispatches events to handlers.
 * Auto-reconnects on disconnect with exponential backoff (max 30s).
 *
 * @param handlers - Map of event names to callback functions
 */
export function useSSE(handlers: Record<string, SSEHandler>): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let reconnectDelay = 1000;
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      eventSource = new EventSource("/api/sse/stream");

      eventSource.onopen = () => {
        reconnectDelay = 1000; // Reset backoff on successful connection
      };

      // Listen for all events that handlers care about
      const eventNames = Object.keys(handlersRef.current);
      for (const eventName of eventNames) {
        eventSource.addEventListener(eventName, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current[eventName]?.(data);
          } catch {
            // Ignore parse errors
          }
        });
      }

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (!unmounted) {
          reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connect();
          }, reconnectDelay);
        }
      };
    }

    connect();

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimeout);
      eventSource?.close();
      eventSource = null;
    };
  }, []); // Single connection for the lifetime of the component
}

/**
 * Convenience hook for a single SSE event.
 */
export function useSSEEvent(eventName: string, callback: SSEHandler): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const handlers = useRef({ [eventName]: (data: unknown) => callbackRef.current(data) });

  useSSE(handlers.current);
}
