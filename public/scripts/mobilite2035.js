// public/scripts/mobilite2035.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", () => {
    const el = document.querySelector("#graph-mobilite2035");
    if (!el) return;

    if (el.dataset.initialized === "true") return;
    el.dataset.initialized = "true";

    // --- Données de projection
    const mobilite = [
        { Année: 2010, Voyageurs_train: 1500, Part_train: 9, Part_voiture: 83, CO2_total: 130 },
        { Année: 2015, Voyageurs_train: 1600, Part_train: 10, Part_voiture: 80, CO2_total: 125 },
        { Année: 2020, Voyageurs_train: 1200, Part_train: 7, Part_voiture: 85, CO2_total: 120 },
        { Année: 2025, Voyageurs_train: 1550, Part_train: 11, Part_voiture: 78, CO2_total: 115 },
        { Année: 2030, Voyageurs_train: 1750, Part_train: 13, Part_voiture: 75, CO2_total: 110 },
        { Année: 2035, Voyageurs_train: 2000, Part_train: 16, Part_voiture: 72, CO2_total: 100 }
    ];

    // --- Création du graphique
    const plot = Plot.plot({
        title: "🚆 Mobilité 2035 : le futur du transport durable",
        subtitle:
            "Projection de la fréquentation ferroviaire et des émissions de CO₂ du secteur des transports, selon un scénario où 10 % des trajets voiture passent au train.",
        width: 950,
        height: 550,
        marginLeft: 80,
        marginRight: 60,
        x: {
            label: "Année",
            tickFormat: d3.format("d"),
            grid: true
        },
        y: {
            label: "Voyageurs ferroviaires (millions)",
            grid: true
        },
        color: {
            legend: true,
            domain: ["Train (voyageurs)", "CO₂ total (Mt)", "Part modale du train (%)"],
            range: ["#16a34a", "#ef4444", "#2563eb"]
        },
        marks: [
            // --- Aire verte : hausse de la fréquentation
            Plot.areaY(mobilite, {
                x: "Année",
                y: "Voyageurs_train",
                fill: "#bbf7d0",
                fillOpacity: 0.6,
                curve: "basis"
            }),
            // --- Ligne verte : voyageurs train
            Plot.line(mobilite, {
                x: "Année",
                y: "Voyageurs_train",
                stroke: "#16a34a",
                strokeWidth: 3
            }),
            // --- Ligne rouge : émissions CO₂ (échelle visuelle ×10)
            Plot.line(mobilite, {
                x: "Année",
                y: (d) => d.CO2_total * 10,
                stroke: "#ef4444",
                strokeDasharray: "4,2",
                strokeWidth: 2
            }),
            // --- Ligne bleue : part modale du train (% ×100 pour accentuer)
            Plot.line(mobilite, {
                x: "Année",
                y: (d) => d.Part_train * 100,
                stroke: "#2563eb",
                strokeWidth: 2
            }),
            // --- Points interactifs
            Plot.dot(mobilite, {
                x: "Année",
                y: "Voyageurs_train",
                r: 4,
                fill: "#16a34a",
                title: (d) =>
                    `${d.Année}\nVoyageurs : ${d.Voyageurs_train.toLocaleString()} M\nPart train : ${d.Part_train}%\nCO₂ total : ${d.CO2_total} Mt`
            }),
            // --- Lignes guides
            Plot.ruleY([0])
        ],
        style: { background: "#fafafa", color: "#111827", fontSize: 13 }
    });

    el.appendChild(plot);
});
