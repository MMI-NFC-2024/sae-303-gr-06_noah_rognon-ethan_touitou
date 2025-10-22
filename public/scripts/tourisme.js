// public/scripts/accessibilite-touristique.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#graph-accessibilite");
    if (!el) return;
    el.innerHTML = "Chargement des données…";

    try {
        // 1️⃣ Chargement des fichiers
        const poi = d3
            .dsvFormat(",")
            .parse(await d3.text("/data/datatourisme-france.csv"), d3.autoType);

        const gares = d3
            .dsvFormat(";")
            .parse(await d3.text("/data/gares-de-voyageurs.csv"), d3.autoType);

        const departements = await d3.json("/data/departements.geojson");

        // 2️⃣ Nettoyage des données
        const gares_clean = gares.filter((d) => d["Position géographique"]);
        const poi_valides = poi.filter(
            (d) =>
                (d.latitude || d.Latitude) &&
                (d.longitude || d.Longitude)
        );

        // 3️⃣ Détection dynamique des noms de colonnes latitude/longitude
        const latKey =
            Object.keys(poi_valides[0]).find((k) =>
                k.toLowerCase().includes("lat")
            ) ?? "latitude";
        const lonKey =
            Object.keys(poi_valides[0]).find((k) =>
                k.toLowerCase().includes("lon")
            ) ?? "longitude";

        // 4️⃣ Fonction de calcul de distance (km)
        function distanceKm(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        // 5️⃣ Comptage des POI dans un rayon de 5 km autour de chaque gare
        const densite_poi = gares_clean.map((g) => {
            const coords = String(g["Position géographique"] || "").split(",");
            if (coords.length < 2) return null;
            const [latG, lonG] = coords.map((c) => parseFloat(c.trim()));
            if (isNaN(latG) || isNaN(lonG)) return null;

            const nb_poi = poi_valides.filter((p) => {
                const latP = parseFloat(p[latKey]);
                const lonP = parseFloat(p[lonKey]);
                if (isNaN(latP) || isNaN(lonP)) return false;
                return distanceKm(latG, lonG, latP, lonP) <= 5;
            }).length;

            return {
                Nom: g["Nom"] ?? "Gare inconnue",
                Latitude: latG,
                Longitude: lonG,
                nb_poi,
            };
        }).filter(Boolean);

        console.log("📊 Densité calculée pour", densite_poi.length, "gares");

        // 6️⃣ Carte Plot
        const plot = Plot.plot({
            title: "Densité touristique autour des gares (rayon de 5 km)",
            subtitle:
                "Nombre de points d’intérêt (POI) touristiques dans un rayon de 5 km.",
            projection: { type: "mercator", domain: departements },
            width: 950,
            height: 700,
            color: { type: "linear", scheme: "blues", label: "POI à proximité" },
            marks: [
                Plot.geo(departements, { fill: "#f5f5f5", stroke: "#ccc" }),
                Plot.dot(densite_poi, {
                    x: "Longitude",
                    y: "Latitude",
                    r: (d) => Math.sqrt(d.nb_poi) / 2,
                    fill: (d) => d.nb_poi,
                    title: (d) => `${d.Nom} — ${d.nb_poi} POI à moins de 5 km`,
                }),
            ],
            style: { background: "#fafafa", color: "#111827" },
        });

        el.innerHTML = "";
        el.appendChild(plot);
    } catch (err) {
        console.error("Erreur Section 7 :", err);
        el.textContent =
            "Erreur lors du chargement ou du rendu des données. Vérifie les fichiers CSV/GeoJSON.";
    }
});
