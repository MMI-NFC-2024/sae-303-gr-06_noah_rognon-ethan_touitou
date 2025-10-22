// public/scripts/tourismeCarte.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#graph-tourisme");
    if (!el) return;
    if (el.dataset.initialized === "true") return;
    el.dataset.initialized = "true";

    el.innerHTML = "⏳ Chargement des données...";

    // --- Fonctions utilitaires
    const toFloat = (v) => parseFloat(String(v).replace(",", "."));

    try {
        // --- Chargement des données
        const departements = await d3.json("/data/departements.geojson");

        const garesRaw = await d3.dsv(";", "/data/gares-de-voyageurs.csv", d3.autoType);
        const tourismeRaw = await d3.dsv(";", "/data/datatourisme-france.csv", d3.autoType);
        const festivalsRaw = await d3.dsv(";", "/data/festivals-global-festivals-pl.csv", d3.autoType);

        // --- Nettoyage
        const gares_clean = garesRaw.filter((d) => d["Position géographique"]);
        const festivals_clean = festivalsRaw.filter((d) => d["Géocodage xy"]);
        const tourisme_clean = tourismeRaw.filter(
            (d) => d.latitude || d.Latitude || d["coordonnees_geo"]
        );

        // --- Détection dynamique des catégories disponibles
        const categoriesTourisme = [
            "Toutes les catégories",
            ...Array.from(new Set(tourisme_clean.map((d) => d.categorie || d.Categorie || "Autre"))),
        ];

        const disciplinesFestivals = [
            "Toutes les disciplines",
            ...Array.from(new Set(festivals_clean.map((d) => d.discipline || d.Discipline || "Autre"))),
        ];

        // --- Création des filtres
        const divFiltres = document.createElement("div");
        divFiltres.style.display = "flex";
        divFiltres.style.gap = "1rem";
        divFiltres.style.marginBottom = "1rem";
        divFiltres.style.flexWrap = "wrap";

        const selectCategorie = document.createElement("select");
        const selectDiscipline = document.createElement("select");

        selectCategorie.innerHTML = categoriesTourisme
            .map((c) => `<option value="${c}">${c}</option>`)
            .join("");
        selectDiscipline.innerHTML = disciplinesFestivals
            .map((d) => `<option value="${d}">${d}</option>`)
            .join("");

        const labelCat = document.createElement("label");
        labelCat.textContent = "Catégorie touristique : ";
        labelCat.style.fontWeight = "600";
        const labelDisc = document.createElement("label");
        labelDisc.textContent = "Discipline du festival : ";
        labelDisc.style.fontWeight = "600";

        const blocCat = document.createElement("div");
        blocCat.append(labelCat, selectCategorie);
        const blocDisc = document.createElement("div");
        blocDisc.append(labelDisc, selectDiscipline);

        divFiltres.append(blocCat, blocDisc);
        el.innerHTML = "";
        el.append(divFiltres);

        const chartDiv = document.createElement("div");
        el.append(chartDiv);

        // --- Fonction principale d'affichage
        function render() {
            chartDiv.innerHTML = "";

            const filtreCategorie = selectCategorie.value;
            const filtreDiscipline = selectDiscipline.value;

            const filteredTourisme = tourisme_clean.filter(
                (d) =>
                    filtreCategorie === "Toutes les catégories" ||
                    d.categorie === filtreCategorie ||
                    d.Categorie === filtreCategorie
            );

            const filteredFestivals = festivals_clean.filter(
                (d) =>
                    filtreDiscipline === "Toutes les disciplines" ||
                    d.discipline === filtreDiscipline ||
                    d.Discipline === filtreDiscipline
            );

            // --- Formattage des coordonnées
            const gares_final = gares_clean.map((d) => {
                const coords = String(d["Position géographique"]).split(",");
                const lat = toFloat(coords[0]);
                const lon = toFloat(coords[1]);
                return { ...d, lat, lon };
            });

            const tourisme_final = filteredTourisme
                .map((d) => {
                    const lat =
                        toFloat(d.lat || d.Latitude || d.Y || d["coordonnees_geo"]?.split(",")[0]) || null;
                    const lon =
                        toFloat(d.lon || d.Longitude || d.X || d["coordonnees_geo"]?.split(",")[1]) || null;
                    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;
                    return { ...d, lat, lon };
                })
                .filter(Boolean);

            const festivals_final = filteredFestivals
                .map((d) => {
                    const lat =
                        toFloat(d.lat || d.Latitude || d.Y || d["Géocodage xy"]?.split(",")[0]) || null;
                    const lon =
                        toFloat(d.lon || d.Longitude || d.X || d["Géocodage xy"]?.split(",")[1]) || null;
                    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;
                    return { ...d, lat, lon };
                })
                .filter(Boolean);

            // --- Création du Plot
            const plot = Plot.plot({
                title: "Les destinations durables du tourisme en train",
                subtitle:
                    "Synthèse des gares, sites touristiques et festivals accessibles par le rail",
                width: 950,
                height: 820,
                projection: { type: "mercator", domain: departements },
                style: { background: "#f9fafb", color: "#111827" },
                marks: [
                    Plot.geo(departements, { fill: "#f3f4f6", stroke: "#d1d5db" }),

                    // 🚉 Gares SNCF
                    Plot.dot(gares_final, {
                        x: "lon",
                        y: "lat",
                        r: 1.2,
                        fill: "#9ca3af",
                        opacity: 0.7,
                        title: (d) => `🚉 Gare : ${d.nom || d.Nom}`
                    }),

                    // 🏛️ Points touristiques filtrés
                    Plot.dot(tourisme_final, {
                        x: "lon",
                        y: "lat",
                        r: 2.2,
                        fill: "#f9b23c",
                        opacity: 0.75,
                        title: (d) => `🏛️ ${d.nom || d.Nom}\nCatégorie : ${d.categorie}`
                    }),

                    // 🎭 Festivals filtrés
                    Plot.dot(festivals_final, {
                        x: "lon",
                        y: "lat",
                        r: 3.2,
                        fill: "#9333ea",
                        opacity: 0.7,
                        title: (d) => `🎭 ${d.nom || d.Nom}`
                    })
                ]
            });

            chartDiv.append(plot);
        }

        // --- Rendu initial
        render();

        // --- Rafraîchissement sur changement de filtre
        selectCategorie.addEventListener("change", render);
        selectDiscipline.addEventListener("change", render);
    } catch (err) {
        console.error("Erreur carte tourisme :", err);
        el.textContent =
            "⚠️ Erreur lors du chargement des données. Vérifie les fichiers CSV/GeoJSON dans /public/data.";
    }
});
