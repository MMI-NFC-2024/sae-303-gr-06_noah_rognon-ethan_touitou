// public/scripts/trainCO2.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#graph-trainco2");
    if (!el) return;

    if (el.dataset.initialized === "true") return;
    el.dataset.initialized = "true";

    // --- Données sources
    const co22 = [
        { Année: 2010, Train_CO2: 2, Voiture_CO2: 120, Avion_CO2: 255, Bus_CO2: 80 },
        { Année: 2012, Train_CO2: 1.9, Voiture_CO2: 118, Avion_CO2: 250, Bus_CO2: 78 },
        { Année: 2014, Train_CO2: 1.8, Voiture_CO2: 115, Avion_CO2: 245, Bus_CO2: 75 },
        { Année: 2016, Train_CO2: 1.7, Voiture_CO2: 112, Avion_CO2: 240, Bus_CO2: 72 },
        { Année: 2018, Train_CO2: 1.6, Voiture_CO2: 110, Avion_CO2: 235, Bus_CO2: 70 },
        { Année: 2019, Train_CO2: 1.5, Voiture_CO2: 108, Avion_CO2: 230, Bus_CO2: 68 },
        { Année: 2020, Train_CO2: 1.4, Voiture_CO2: 100, Avion_CO2: 150, Bus_CO2: 65 },
        { Année: 2021, Train_CO2: 1.4, Voiture_CO2: 105, Avion_CO2: 210, Bus_CO2: 67 },
        { Année: 2022, Train_CO2: 1.3, Voiture_CO2: 102, Avion_CO2: 220, Bus_CO2: 65 },
        { Année: 2023, Train_CO2: 1.3, Voiture_CO2: 100, Avion_CO2: 210, Bus_CO2: 64 },
        { Année: 2024, Train_CO2: 1.2, Voiture_CO2: 98, Avion_CO2: 205, Bus_CO2: 63 }
    ];

    // --- Conversion des données en format long pour Plot
    const dataco2 = co22.flatMap((d) =>
        Object.entries(d)
            .filter(([k]) => k !== "Année")
            .map(([mode, val]) => ({
                Année: d.Année,
                Mode: mode.replace("_CO2", ""), // ex: "Train_CO2" → "Train"
                CO2: +val
            }))
    );

    // --- Interface du filtre
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

    // --- Fonction de rendu
    function render(selected = "Tous") {
        chartDiv.innerHTML = "";

        const dataCO2Filtree =
            selected === "Tous" ? dataco2 : dataco2.filter((d) => d.Mode === selected);

        // Base du graphique
        const marks = [];

        // --- Aire entre Train et Voiture (si visible)
        if (
            selected === "Tous" ||
            selected === "Train" ||
            selected === "Voiture"
        ) {
            marks.push(
                Plot.areaY(co22, {
                    x: "Année",
                    y1: "Train_CO2",
                    y2: "Voiture_CO2",
                    fill: "#bbf7d0",
                    fillOpacity: 0.6
                })
            );
        }

        // --- Lignes principales
        marks.push(
            Plot.line(dataCO2Filtree, {
                x: "Année",
                y: "CO2",
                stroke: "Mode",
                strokeWidth: 3
            })
        );

        // --- Points interactifs
        marks.push(
            Plot.dot(dataCO2Filtree, {
                x: "Année",
                y: "CO2",
                fill: "Mode",
                r: 4,
                title: (d) => `${d.Mode} (${d.Année}) : ${d.CO2.toFixed(1)} gCO₂/pkm`
            })
        );

        // --- Étiquettes finales si tout est affiché
        if (selected === "Tous") {
            marks.push(
                Plot.text(
                    [
                        { x: 2024.2, y: 1.2, text: "🚆 Train" },
                        { x: 2024.2, y: 63, text: "🚌 Bus" },
                        { x: 2024.2, y: 98, text: "🚗 Voiture" },
                        { x: 2024.2, y: 205, text: "✈️ Avion" }
                    ],
                    {
                        x: "x",
                        y: "y",
                        text: "text",
                        textAnchor: "start",
                        fontWeight: "bold"
                    }
                )
            );
        }

        const plot = Plot.plot({
            title: "Le train : champion du climat",
            subtitle:
                "Comparaison des émissions de CO₂ par passager-kilomètre entre 2010 et 2024. En moyenne, le train émet 100× moins de CO₂ qu’un vol intérieur et 50× moins qu’un trajet en voiture.",
            width: 950,
            height: 550,
            marginLeft: 80,
            marginBottom: 60,
            x: {
                label: "Année",
                tickFormat: d3.format("d"),
                grid: true
            },
            y: {
                label: "Émissions (gCO₂ / passager-km)",
                grid: true
            },
            color: {
                legend: true,
                domain: ["Train", "Voiture", "Avion", "Bus"],
                range: ["#16a34a", "#ef4444", "#f59e0b", "#3b82f6"]
            },
            marks,
            style: {
                background: "#f9fafb",
                color: "#111827",
                fontSize: 13
            }
        });

        chartDiv.appendChild(plot);
    }

    // Rendu initial
    render("Tous");

    // Événement de filtre
    select.addEventListener("change", (e) => render(e.target.value));
});
