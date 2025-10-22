// public/scripts/partModale.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", () => {
    const el = document.querySelector("#graph-partmodale");
    if (!el) return;

    // Empêche les doublons
    if (el.dataset.initialized === "true") return;
    el.dataset.initialized = "true";

    // --- Données
    const parts = [
        { Année: 2010, Train: 9, Voiture: 83, Avion: 6, Bus: 2 },
        { Année: 2012, Train: 9.5, Voiture: 82, Avion: 6.5, Bus: 2 },
        { Année: 2014, Train: 10, Voiture: 81.5, Avion: 6.5, Bus: 2 },
        { Année: 2016, Train: 10.5, Voiture: 80, Avion: 7, Bus: 2.5 },
        { Année: 2018, Train: 11, Voiture: 79, Avion: 7, Bus: 3 },
        { Année: 2019, Train: 11.2, Voiture: 78.5, Avion: 7.3, Bus: 3 },
        { Année: 2020, Train: 7, Voiture: 85, Avion: 5, Bus: 3 },
        { Année: 2021, Train: 8.5, Voiture: 82, Avion: 6, Bus: 3.5 },
        { Année: 2022, Train: 10, Voiture: 79, Avion: 7, Bus: 4 },
        { Année: 2023, Train: 11, Voiture: 78, Avion: 7, Bus: 4 },
        { Année: 2024, Train: 11.5, Voiture: 77, Avion: 7, Bus: 4.5 },
    ];

    // --- Transformation en format lisible par Plot
    const repartition = parts.flatMap((d) =>
        Object.entries(d)
            .filter(([k]) => k !== "Année")
            .map(([mode, part]) => ({
                Année: d.Année,
                Mode: mode,
                Part: part,
            }))
    );

    // --- Création du select (filtre)
    const select = document.createElement("select");
    select.innerHTML = `
    <option value="Tous">Tous</option>
    <option value="Train">Train</option>
    <option value="Voiture">Voiture</option>
    <option value="Avion">Avion</option>
    <option value="Bus">Bus</option>
  `;
    const label = document.createElement("label");
    label.textContent = "Filtrer par mode de transport : ";
    label.style.marginRight = "0.5rem";

    const controlDiv = document.createElement("div");
    controlDiv.style.marginBottom = "1rem";
    controlDiv.appendChild(label);
    controlDiv.appendChild(select);
    el.appendChild(controlDiv);

    const chartDiv = document.createElement("div");
    el.appendChild(chartDiv);

    // --- Fonction d’affichage du graphique
    function render(selectedMode = "Tous") {
        chartDiv.innerHTML = ""; // supprime le graphique précédent

        const data =
            selectedMode === "Tous"
                ? repartition
                : repartition.filter((d) => d.Mode === selectedMode);

        const plot = Plot.plot({
            title: "Part modale des transports de voyageurs en France (2010–2024)",
            subtitle:
                "Évolution de la répartition des modes de transport (en % de voyageurs-km)",
            width: 900,
            height: 500,
            x: { label: "Année", tickFormat: d3.format("d"), grid: true },
            y: { label: "Part modale (%)", domain: [0, 100], grid: true },
            color: {
                legend: true,
                domain: ["Train", "Voiture", "Avion", "Bus"],
                range: ["#2563eb", "#ef4444", "#f59e0b", "#10b981"],
            },
            marks: [
                Plot.areaY(data, {
                    x: "Année",
                    y: "Part",
                    fill: "Mode",
                    sort: { fill: "descending" },
                    curve: "basis",
                }),
                Plot.ruleY([0]),
            ],
            style: { background: "#fafafa", color: "#111827" },
        });

        chartDiv.appendChild(plot);
    }

    // --- Rendu initial
    render("Tous");

    // --- Écoute du changement
    select.addEventListener("change", (e) => {
        render(e.target.value);
    });
});
