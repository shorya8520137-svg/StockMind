"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function TrackingMap({ awb, setAwb, journey }) {

    // ✅ FILTER INVALID COORDINATES (CRITICAL)
    const safeJourney = Array.isArray(journey)
        ? journey.filter(
            p =>
                typeof p.lat === "number" &&
                typeof p.lng === "number" &&
                !isNaN(p.lat) &&
                !isNaN(p.lng)
        )
        : [];

    // ✅ MAP CENTER (SAFE)
    const center =
        safeJourney.length > 0
            ? [safeJourney[safeJourney.length - 1].lat, safeJourney[safeJourney.length - 1].lng]
            : [20.5937, 78.9629];

    // ✅ POLYLINE PATH
    const path = safeJourney.map(p => [p.lat, p.lng]);

    return (
        <div className="map-wrapper">

            {/* SEARCH BAR */}
            <div className="map-search">
                <input
                    type="text"
                    placeholder="Search AWB"
                    value={awb}
                    onChange={(e) => setAwb(e.target.value)}
                />
            </div>

            <MapContainer
                center={center}
                zoom={5}
                scrollWheelZoom
                className="leaflet-map"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution="© OpenStreetMap contributors © CARTO"
                />

                {/* ✅ DRAW PATH ONLY IF VALID */}
                {path.length >= 2 && <Polyline positions={path} />}

                {/* ✅ SAFE MARKERS */}
                {safeJourney.map((point, i) => (
                    <Marker key={i} position={[point.lat, point.lng]}>
                        <Popup>
                            <strong>{point.status}</strong>
                            <br />
                            {point.location}
                            <br />
                            {new Date(point.scan_time).toLocaleString()}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
