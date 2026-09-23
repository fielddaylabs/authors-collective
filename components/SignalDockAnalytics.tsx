"use client";

import { createSignalDock } from "@fielddaylabs/signaldock-sdk";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

const baseUrl = process.env.NEXT_PUBLIC_SIGNALDOCK_BASE_URL;
const appKey = process.env.NEXT_PUBLIC_SIGNALDOCK_APP_KEY;

export default function SignalDockAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = useMemo(
    () => (appKey ? createSignalDock({ baseUrl, appKey }) : null),
    [],
  );

  const search = searchParams.toString();

  useEffect(() => {
    if (!client) return;

    const path = `${pathname}${search ? `?${search}` : ""}`;
    void client.pageView({ path }).catch(() => undefined);
  }, [client, pathname, search]);

  return null;
}
