import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_URL, RECAPTCHA_SITE_KEY } from "@/config";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useRecaptchaEnterprise } from "@/hooks/useReCaptcha";

// Standard Leaflet + bundler workaround: Leaflet guesses icon URLs at runtime,
// which breaks once assets are hashed by Vite/Webpack. Safe to run repeatedly.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const DEFAULT_CENTER: L.LatLngTuple = [28.6139, 77.209];
const DEFAULT_ZOOM = 10;
const SELECTED_ZOOM = 15;

export interface Location {
    lat: number;
    lng: number;
}

export type AddressData = {
    address1: string;
    address2: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    formatted_address: string;
};

export type AddressErrorReason = "recaptcha_not_ready" | "request_failed";

interface MapPickerProps {
    position: Location | null;
    onPositionChange: (position: Location) => void;
    onAddressFetched?: (addressData: AddressData) => void;
    /** Lets the parent show "address lookup unavailable" instead of failing silently. */
    onAddressError?: (reason: AddressErrorReason) => void;
}

export default function MapPicker({
    position,
    onPositionChange,
    onAddressFetched,
    onAddressError,
}: MapPickerProps) {
    const { execute, isReady } = useRecaptchaEnterprise(RECAPTCHA_SITE_KEY);

    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Only used to seed the map on first mount.
    const initialPositionRef = useRef(position);
    // Last position that originated from a map click/drag. Lets the sync effect
    // tell "user picked this" apart from "parent set this externally".
    const lastInternalRef = useRef<Location | null>(null);

    // "Latest value" refs: assigned during render so handlers never read stale
    // values (useEffect would leave a gap between render and effect).
    const onPositionChangeRef = useRef(onPositionChange);
    const onAddressFetchedRef = useRef(onAddressFetched);
    const onAddressErrorRef = useRef(onAddressError);
    const isReadyRef = useRef(isReady);
    const executeRef = useRef(execute);
    onPositionChangeRef.current = onPositionChange;
    onAddressFetchedRef.current = onAddressFetched;
    onAddressErrorRef.current = onAddressError;
    isReadyRef.current = isReady;
    executeRef.current = execute;

    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        if (!onAddressFetchedRef.current) return;

        if (!isReadyRef.current) {
            onAddressErrorRef.current?.("recaptcha_not_ready");
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const token = await executeRef.current("reverse_geocode");
            if (controller.signal.aborted) return;

            const res = await fetch(
                `${API_URL}/users/reverse-geocode?lat=${lat}&lng=${lng}`,
                {
                    headers: {
                        "X-Recaptcha-Token": token,
                    },
                    credentials: "include",
                    signal: controller.signal,
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data.status === "success" && data.data) {
                onAddressFetchedRef.current?.(data.data as AddressData);
            }
        } catch (error) {
            if ((error as Error).name === "AbortError") return;
            console.error("Backend reverse geocode failed:", error);
            onAddressErrorRef.current?.("request_failed");
        }
    }, []);

    // Called when the user picks a spot (map click or marker drag).
    const pick = useCallback(
        (lat: number, lng: number) => {
            lastInternalRef.current = { lat, lng };
            onPositionChangeRef.current({ lat, lng });
            reverseGeocode(lat, lng);
        },
        [reverseGeocode]
    );

    const placeMarker = useCallback(
        (map: L.Map, latlng: L.LatLng) => {
            if (markerRef.current) {
                markerRef.current.setLatLng(latlng);
                return;
            }
            const marker = L.marker(latlng, { draggable: true }).addTo(map);
            marker.on("dragend", () => {
                const { lat, lng } = marker.getLatLng();
                pick(lat, lng);
            });
            markerRef.current = marker;
        },
        [pick]
    );

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const initial = initialPositionRef.current;
        const map = L.map(containerRef.current, {
            center: initial ? [initial.lat, initial.lng] : DEFAULT_CENTER,
            zoom: initial ? SELECTED_ZOOM : DEFAULT_ZOOM,
            zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.on("click", (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            pick(lat, lng);
            placeMarker(map, e.latlng);
        });

        mapRef.current = map;

        return () => {
            abortRef.current?.abort();
            abortRef.current = null;
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, [pick, placeMarker]);

    // Sync position -> map (initial value, "Use Current Location", parent resets).
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !position) return;

        const latlng = L.latLng(position.lat, position.lng);
        placeMarker(map, latlng);

        const last = lastInternalRef.current;
        const cameFromMap =
            last !== null &&
            last.lat === position.lat &&
            last.lng === position.lng;

        if (cameFromMap) {
            // The user just picked this spot: don't yank their zoom level around.
            // Only pan if the point is outside the current view.
            if (!map.getBounds().contains(latlng)) map.panTo(latlng);
            return;
        }

        map.setView(latlng, SELECTED_ZOOM);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position?.lat, position?.lng, placeMarker]);

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label="Location picker map"
            style={{
                width: "100%",
                height: "300px",
                borderRadius: "0.75rem",
                marginTop: "0.5rem",
                position: "relative",
                // Keeps Leaflet's internal z-indexes from overlapping modals/sticky headers.
                isolation: "isolate",
            }}
        />
    );
}
