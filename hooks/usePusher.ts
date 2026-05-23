"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Channel } from "pusher-js";
import { getPusherClient } from "@/lib/pusher-client";

/**
 * React hook to subscribe to a Pusher channel and bind events.
 *
 * @param channelName - The channel to subscribe to (e.g., "private-user-abc123")
 * @param eventName - The event to listen for (e.g., "workflow:assigned")
 * @param callback - Handler called when the event fires
 */
export function usePusher(
  channelName: string | null,
  eventName: string,
  callback: (data: unknown) => void,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!channelName) return;

    const client = getPusherClient();
    if (!client) return;

    const channel: Channel = client.subscribe(channelName);

    const handler = (data: unknown) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
      client.unsubscribe(channelName);
    };
  }, [channelName, eventName]);
}

/**
 * Subscribe to multiple events on the same channel.
 */
export function usePusherMulti(
  channelName: string | null,
  handlers: Record<string, (data: unknown) => void>,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!channelName) return;

    const client = getPusherClient();
    if (!client) return;

    const channel: Channel = client.subscribe(channelName);
    const eventNames = Object.keys(handlersRef.current);

    const boundHandlers: Record<string, (data: unknown) => void> = {};
    for (const event of eventNames) {
      const handler = (data: unknown) => {
        handlersRef.current[event]?.(data);
      };
      channel.bind(event, handler);
      boundHandlers[event] = handler;
    }

    return () => {
      for (const event of Object.keys(boundHandlers)) {
        channel.unbind(event, boundHandlers[event]);
      }
      client.unsubscribe(channelName);
    };
  }, [channelName]);
}
