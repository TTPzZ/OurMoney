export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Failed to fetch ${url}`);
  }

  return res.json();
}
