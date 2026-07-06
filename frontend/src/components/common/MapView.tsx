import { useEffect, useRef, useState } from "react";
import { loadAMap } from "../../utils/amapLoader";

interface MarkerData {
  position: [number, number];
  label?: string;
  onClick?: () => void;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  markers?: MarkerData[];
  className?: string;
}

export default function MapView({
  center = [113.324, 23.12],
  zoom = 14,
  markers = [],
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mapInstance: any = null;
    let destroyed = false;

    loadAMap()
      .then((AMap: any) => {
        if (destroyed || !containerRef.current) return;

        mapInstance = new AMap.Map(containerRef.current, {
          center,
          zoom,
          viewMode: "2D",
          mapStyle: "amap://styles/whitesmoke",
          layers: [new AMap.TileLayer()],
        });

        mapRef.current = mapInstance;
        setMapStatus("ready");
      })
      .catch((err: any) => {
        if (destroyed) return;
        setMapStatus("error");
        setErrorMsg(err.message || "加载高德地图失败");
      });

    return () => {
      destroyed = true;
      if (mapInstance) {
        mapInstance.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter(center);
    map.setZoom(zoom);
  }, [center?.[0], center?.[1], zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m: any) => {
      map.remove(m);
    });
    markersRef.current = [];

    markers.forEach((data) => {
      const marker = new (window as any).AMap.Marker({
        position: data.position,
        title: data.label || "",
        label: data.label
          ? { content: data.label, direction: "top", offset: { x: 0, y: -8 } }
          : undefined,
      });

      if (data.onClick) {
        marker.on("click", data.onClick);
      }

      map.add(marker);
      markersRef.current.push(marker);
    });

    if (markers.length > 0 && markersRef.current.length > 0) {
      map.setFitView(markersRef.current, false, [50, 50, 50, 50]);
    }
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={"relative bg-warm-100 rounded-xl overflow-hidden " + className}
    >
      {mapStatus === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-warm-100 z-10">
          <svg className="w-10 h-10 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">地图加载中…</span>
        </div>
      )}

      {mapStatus === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-warm-50 z-10 p-6 text-center">
          <svg className="w-10 h-10 mb-2 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {mapStatus === "ready" && markers.length > 0 && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow-sm z-10">
          {markers.length} 位艺术主理人 nearby
        </div>
      )}
    </div>
  );
}