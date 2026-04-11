"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeChannel, REALTIME_LISTEN_TYPES, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/types/database.types";

type TableName = keyof Database["public"]["Tables"];
type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

type PostgresChangesPayload = RealtimePostgresChangesPayload<{ [key: string]: unknown }>;

export interface UseSupabaseRealtimeConfig<T extends TableName> {
  channelName: string;
  schema: "public";
  table: T;
  event: RealtimeEvent;
  filter?: string;
}

export interface UseSupabaseRealtimeResult<T extends TableName> {
  data: TableRow<T> | null;
  payload: PostgresChangesPayload | null;
  status: "connecting" | "connected" | "disconnected" | "error";
  error: string | null;
}

export function UseSupabaseRealtime<T extends TableName>({
  channelName,
  schema,
  table,
  event,
  filter,
}: UseSupabaseRealtimeConfig<T>): UseSupabaseRealtimeResult<T> {
  const [data, setData] = useState<TableRow<T> | null>(null);
  const [payload, setPayload] = useState<PostgresChangesPayload | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const handleRealtimeEvent = useCallback((eventPayload: PostgresChangesPayload) => {
    setPayload(eventPayload);

    if (eventPayload.new) {
      setData(eventPayload.new as TableRow<T>);
    } else if (eventPayload.old) {
      setData(eventPayload.old as TableRow<T>);
    }
    
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const setupSubscription = async () => {
      try {
        setStatus("connecting");
        setError(null);

        // Clean up existing channel
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }

        // Create new channel
        const channel = supabase.channel(channelName);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (channel as any).on(
          REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
          { event: event as string, schema: schema as string, table: table as string, ...(filter && { filter }) },
          handleRealtimeEvent
        );

        channel.subscribe((subscriptionStatus) => {
          if (!mounted) return;
          
          if (subscriptionStatus === "SUBSCRIBED") {
            setStatus("connected");
          } else if (subscriptionStatus === "CHANNEL_ERROR") {
            setStatus("error");
            setError("Failed to subscribe to channel");
          } else if (subscriptionStatus === "TIMED_OUT") {
            setStatus("error");
            setError("Subscription timed out");
          } else if (subscriptionStatus === "CLOSED") {
            setStatus("disconnected");
          }
        });

        channelRef.current = channel;
        
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    };

    setupSubscription();

    // Cleanup function
    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setStatus("disconnected");
    };
  }, [channelName, schema, table, event, filter, handleRealtimeEvent, supabase]);

  return {
    data,
    payload,
    status,
    error,
  };
}