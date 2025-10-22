// public/scripts/accessibilite-rayon.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#graph-accessibilite-rayon");
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

        // 2️⃣ Nettoyage
        const gares_clean = gares.filter((d) => d["Position géographique"]);
        const poi_valides = poi.filter(
            (d) => (d.latitude || d.Latitude) && (d.longitude || d.Longitude)
        );

        // 3️⃣ Détection dynamique des colonnes lat/lon
        const latKey =
            Object.keys(poi_valides[0]).find((k) =>
                k.toLowerCase().includes("lat")
            ) ?? "latitude";
        const lonKey =
            Object.keys(poi_valides[0]).find((k) =>
                k.toLowerCase().includes("lon")
            ) ?? "longitude";

        // 4️⃣ Fonction de distance
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

        // 5️⃣ Interface de filtres dynamiques
        const controls = document.createElement("div");
        controls.innerHTML = `
            <label style="display:block;margin-bottom:.5rem;">
                Rayon d’accessibilité :
                <input id="rayon" type="range" min="5" max="30" step="0.5" value="7">
                <span id="rayonLabel">7 km</span>
            </label>

            <label style="display:block;margin-bottom:.5rem;">
                Mode :
                <select id="mode">
                    <option value="Points" selected>Points</option>
                    <option value="Clusters">Clusters (hexbin)</option>
                </select>
            </label>

            <label style="display:block;margin-bottom:.5rem;">
                Catégorie :
                <select id="categorie">
                    <option value="Toutes" selected>Toutes</option>
                    <option value="Hébergement">Hébergement</option>
                    <option value="Restauration">Restauration</option>
                    <option value="Loisir">Loisir</option>
                    <option value="Patrimoine">Patrimoine</option>
                    <option value="Nature">Nature</option>
                </select>
            </label>

            <label style="display:block;margin-bottom:1rem;">
                Affichage :
                <select id="affichage">
                    <option value="les-deux" selected>Gares + Lieux touristiques</option>
                    <option value="gares">Seulement les gares</option>
                    <option value="poi">Seulement les lieux touristiques</option>
                </select>
            </label>
        `;
        el.parentNode.insertBefore(controls, el);

        // 6️⃣ Rendu interactif
        function render() {
            const rayonKm = parseFloat(document.querySelector("#rayon").value);
            const mode = document.querySelector("#mode").value;
            const cat = document.querySelector("#categorie").value;
            const affichage = document.querySelector("#affichage").value;

            document.querySelector("#rayonLabel").textContent = `${rayonKm} km`;
            el.innerHTML = "Calcul en cours…";

            // Filtrage des POI selon catégorie
            const pois_filtrés =
                cat === "Toutes"
                    ? poi_valides
                    : poi_valides.filter((p) =>
                        (p.Categories_de_POI ?? "")
                            .toLowerCase()
                            .includes(cat.toLowerCase())
                    );

            // Création des liens et POI accessibles
            const liens = [];
            const accessibles = [];
            const gares_points = [];

            gares_clean.forEach((g) => {
                const coords = String(g["Position géographique"]).split(",");
                if (coords.length < 2) return;
                const [latG, lonG] = coords.map((c) => parseFloat(c.trim()));
                if (isNaN(latG) || isNaN(lonG)) return;

                gares_points.push({
                    Nom: g["Nom"] ?? "Gare inconnue",
                    Latitude: latG,
                    Longitude: lonG,
                });

                pois_filtrés.forEach((p) => {
                    const latP = parseFloat(p[latKey]);
                    const lonP = parseFloat(p[lonKey]);
                    if (isNaN(latP) || isNaN(lonP)) return;

                    const dist = distanceKm(latG, lonG, latP, lonP);
                    if (dist <= rayonKm) {
                        liens.push({
                            x1: lonG,
                            y1: latG,
                            x2: lonP,
                            y2: latP,
                        });
                        accessibles.push({
                            nom: p.Nom_du_POI ?? p.nom ?? "POI",
                            categorie: p.Categories_de_POI ?? "—",
                            lat: latP,
                            lon: lonP,
                            gare: g["Nom"],
                            distKm: dist,
                        });
                    }
                });
            });

            // Rendu Plot
            let plot;

            // Construction dynamique des couches (marks)
            const marks = [Plot.geo(departements, { fill: "#f7f7f7", stroke: "#ccc" })];

            if (affichage !== "gares") {
                // Liens et POI touristiques
                if (mode === "Points") {
                    marks.push(
                        Plot.link(liens, {
                            x1: "x1",
                            y1: "y1",
                            x2: "x2",
                            y2: "y2",
                            strokeOpacity: 0.2,
                            stroke: "#aaa",
                        }),
                        Plot.dot(accessibles, {
                            x: "lon",
                            y: "lat",
                            r: 2,
                            fill: "#1f77b4",
                            title: (d) =>
                                `${d.nom}\nCatégorie : ${d.categorie}\nGare : ${d.gare}\nDistance : ${d.distKm.toFixed(
                                    2
                                )} km`,
                        })
                    );
                } else {
                    marks.push(
                        Plot.hexbin(accessibles, {
                            x: "lon",
                            y: "lat",
                            r: 10,
                            fill: (d) => d.length,
                            stroke: "white",
                            title: (bin) => `${bin.length} POI accessibles`,
                        })
                    );
                }
            }

            if (affichage !== "poi") {
                // Gares
                marks.push(
                    Plot.dot(gares_points, {
                        x: "Longitude",
                        y: "Latitude",
                        r: 3,
                        fill: "#d62728",
                        stroke: "#fff",
                        title: (d) => `Gare : ${d.Nom}`,
                    })
                );
            }

            // Création du graphique final
            plot = Plot.plot({
                title:
                    affichage === "gares"
                        ? "Carte des gares ferroviaires"
                        : affichage === "poi"
                            ? "Carte des points d’intérêt touristiques"
                            : `Accessibilité des lieux touristiques (rayon ${rayonKm} km)`,
                projection: { type: "mercator", domain: departements },
                width: 950,
                height: 700,
                color: { type: "linear", scheme: "blues", label: "Densité POI" },
                marks,
                style: { background: "#fafafa", color: "#111827" },
            });

            el.innerHTML = "";
            el.appendChild(plot);
        }

        // 7️⃣ Événements
        ["rayon", "mode", "categorie", "affichage"].forEach((id) =>
            document.querySelector(`#${id}`).addEventListener("input", render)
        );
        document.querySelector("#mode").addEventListener("change", render);

        // Premier rendu
        render();
    } catch (err) {
        console.error("Erreur :", err);
        el.textContent =
            "Erreur lors du chargement des données. Vérifie les fichiers CSV et GeoJSON.";
    }
});
