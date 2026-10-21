"use client";

import { useEffect, useRef, useState } from "react";

type Point = { id: string; lat: number; lng: number; title: string; subtitle: string; kind: string };

// Leaflet tải từ CDN (phiên bản cố định) – không thêm phụ thuộc build. Nền bản đồ OpenStreetMap.
const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist";
type LeafletNS = {
  map: (el: HTMLElement, opts?: object) => LeafletMap;
  tileLayer: (url: string, opts: object) => { addTo: (m: LeafletMap) => void };
  circleMarker: (latlng: [number, number], opts: object) => { addTo: (m: LeafletMap) => { bindPopup: (el: HTMLElement) => void } };
  latLngBounds: (pts: [number, number][]) => unknown;
};
type LeafletMap = { setView: (c: [number, number], z: number) => LeafletMap; fitBounds: (b: unknown, o?: object) => void; remove: () => void };

function loadLeaflet(): Promise<LeafletNS> {
  const w = window as unknown as { L?: LeafletNS; __leafletLoading?: Promise<LeafletNS> };
  if (w.L) return Promise.resolve(w.L);
  if (w.__leafletLoading) return w.__leafletLoading;
  w.__leafletLoading = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${LEAFLET}/leaflet.css`;
    css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    css.crossOrigin = "";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = `${LEAFLET}/leaflet.js`;
    js.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    js.crossOrigin = "";
    js.onload = () => (w.L ? resolve(w.L) : reject(new Error("Không tải được Leaflet")));
    js.onerror = () => reject(new Error("Không tải được thư viện bản đồ"));
    document.head.appendChild(js);
  });
  return w.__leafletLoading;
}

/** Bản đồ cơ sở sản xuất giống (M3.2.7). Popup dựng bằng textContent – không chèn HTML từ dữ liệu. */
export function FacilityMap({ points }: { points: Point[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        map = L.map(ref.current).setView([19.8, 105.6], 9); // Thanh Hóa
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map);
        for (const p of points) {
          const el = document.createElement("div");
          const t = document.createElement("strong");
          t.textContent = p.title;
          const s = document.createElement("div");
          s.textContent = p.subtitle;
          s.style.fontSize = "12px";
          el.append(t, s);
          L.circleMarker([p.lat, p.lng], { radius: 8, color: p.kind === "Của Viện" ? "#15803d" : "#2563eb", fillOpacity: 0.7 }).addTo(map).bindPopup(el);
        }
        if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [30, 30] });
        else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 12);
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  return (
    <div>
      <div ref={ref} className="h-[420px] w-full rounded-lg border z-0" role="region" aria-label="Bản đồ cơ sở sản xuất giống" />
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-700" />Của Viện</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Liên kết</span>
        {error && <span className="text-rose-600">{error}</span>}
      </div>
    </div>
  );
}
