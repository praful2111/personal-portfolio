import { useEffect, useState } from "react";
import { WP_BASE_URL } from "../wp-config";

export interface WPPageData {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  acf: Record<string, unknown>;
}

export function useWPPage(pageId: number) {
  const [data, setData] = useState<WPPageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId) return;
    setLoading(true);
    setError(null);
    fetch(`${WP_BASE_URL}/wp-json/wp/v2/pages/${pageId}?acf_format=standard`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch page ${pageId}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [pageId]);

  return { data, loading, error };
}

/** Get a string ACF field with fallback */
export function acf(
  data: WPPageData | null,
  key: string,
  fallback: string,
): string {
  if (!data?.acf) return fallback;
  const val = data.acf[key];
  return typeof val === "string" && val.trim() ? val : fallback;
}

/** Get an array ACF repeater field with fallback */
export function acfArray<T>(
  data: WPPageData | null,
  key: string,
  fallback: T[],
): T[] {
  if (!data?.acf) return fallback;
  const val = data.acf[key];
  return Array.isArray(val) && val.length > 0 ? (val as T[]) : fallback;
}
