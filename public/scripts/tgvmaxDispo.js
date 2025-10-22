// public/scripts/tgvmaxDispo.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#graph-tgvmax-axe");
    if (!el) return;
    if (el.dataset.initialized === "true") return;
    el.dataset.initialized = "true";

    el.innerHTML = "⏳ Chargement des données...";

    try {
        // --- 1️⃣ Chargement du fichier CSV
        const csvUrl = "/data/tgvmax.csv"; // Assure-toi que ce fichier est bien dans /public/data
        const count = d3.dsvFormat(";").parse(await d3.text(csvUrl), d3.autoType);

        // --- 2️⃣ Agrégation : taux de disponibilité par date et axe
        const tgvmax_counts = d3
            .rollups(
                count,
                (v) => {
                    const total = v.length;
                    const oui = v.filter(
                        (d) =>
                            (d["Disponibilité de places MAX JEUNE et MAX SENIOR"] || "")
                                .trim()
                                .toUpperCase() === "OUI"
                    ).length;
                    return {
                        taux: (oui / total) * 100,
                        total,
                        oui,
                    };
                },
                (d) => d["DATE"],
                (d) => d["Axe"]
            )
            .flatMap(([date, axes]) =>
                axes.map(([axe, stats]) => ({
                    date: new Date(date),
                    axe,
                    taux: stats.taux,
                    total: stats.total,
                    oui: stats.oui,
                }))
            );

        // --- 3️⃣ Liste des axes disponibles
        const axesDisponibles = Array.from(new Set(tgvmax_counts.map((d) => d.axe))).sort();

        // --- 4️⃣ Création du sélecteur de filtre
        const divControl = document.createElement("div");
        divControl.style.marginBottom = "1rem";
        divControl.style.display = "flex";
        divControl.style.alignItems = "center";
        divControl.style.gap = "0.5rem";

        const label = document.createElement("label");
        label.textContent = "Choisir un axe TGV :";
        label.style.fontWeight = "600";

        const select = document.createElement("select");
        select.innerHTML = axesDisponibles
            .map(
                (a) =>
                    `<option value="${a}" ${a === "SUD EST" ? "selected" : ""}>${a}</option>`
            )
            .join("");

        divControl.append(label, select);
        el.innerHTML = "";
        el.append(divControl);

        const chartDiv = document.createElement("div");
        el.append(chartDiv);

        // --- 5️⃣ Fonction de lissage (moyenne glissante)
        function smooth(data) {
            return data.map((d, i, arr) => {
                const window = arr.slice(Math.max(0, i - 1), i + 2);
                const mean = d3.mean(window, (v) => v.taux);
                return { ...d, taux_smooth: mean };
            });
        }

        // --- 6️⃣ Fonction de rendu du graphique
        function render(axeSelect = "SUD EST") {
            chartDiv.innerHTML = "";

            // Filtrage des données selon l'axe choisi
            const data_filtered = tgvmax_counts
                .filter((d) => d.axe === axeSelect)
                .sort((a, b) => a.date - b.date);

            const smoothed = smooth(data_filtered);

            // Calcul moyenne pour annotation
            const moyenne = d3.mean(smoothed, (d) => d.taux).toFixed(1);

            const plot = Plot.plot({
                title: `Taux de disponibilité TGVMax – Axe : ${axeSelect}`,
                subtitle:
                    "Part des trains avec places MAX disponibles (en %), selon la date.",
                width: 950,
                height: 500,
                marginLeft: 60,
                style: { background: "#fafafa", color: "#111827" },
                x: {
                    label: "Date",
                    tickFormat: d3.timeFormat("%d %b"),
                    grid: true,
                },
                y: {
                    label: "Taux de trains avec places MAX disponibles (%)",
                    grid: true,
                    domain: [0, 100],
                },
                marks: [
                    // Ligne lissée
                    Plot.line(smoothed, {
                        x: "date",
                        y: "taux_smooth",
                        stroke: "#2563eb",
                        strokeWidth: 3,
                        curve: "catmull-rom",
                    }),

                    // Points
                    Plot.dot(smoothed, {
                        x: "date",
                        y: "taux",
                        fill: "#2563eb",
                        r: 3,
                        opacity: 0.7,
                        title: (d) =>
                            `${d3.timeFormat("%d %b %Y")(d.date)} — ${d.taux.toFixed(
                                1
                            )}% de trains disponibles`,
                    }),

                    // Texte moyenne
                    Plot.text(
                        [{ label: `Moyenne : ${moyenne}%` }],
                        {
                            x: d3.max(smoothed, (d) => d.date),
                            y: 90,
                            text: "label",
                            dx: -100,
                            dy: -20,
                            fill: "#1d4ed8",
                            fontWeight: "bold",
                        }
                    ),
                ],
            });

            chartDiv.append(plot);
        }

        // --- 7️⃣ Rendu initial
        render();

        // --- 8️⃣ Mise à jour dynamique quand on change de filtre
        select.addEventListener("change", (e) => render(e.target.value));
    } catch (err) {
        console.error("Erreur graphique TGVMax :", err);
        el.textContent = "⚠️ Erreur lors du chargement des données. Vérifie ton CSV.";
    }
});
