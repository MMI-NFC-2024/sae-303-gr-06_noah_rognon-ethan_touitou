import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

const couts = [
    { Année: 2010, Train: 9.5, Voiture: 8.0, CO2: 8.0 },
    { Année: 2012, Train: 9.8, Voiture: 8.3, CO2: 8.3 },
    { Année: 2014, Train: 10.1, Voiture: 8.6, CO2: 8.7 },
    { Année: 2016, Train: 10.3, Voiture: 8.8, CO2: 8.9 },
    { Année: 2018, Train: 10.6, Voiture: 9.0, CO2: 9.0 },
    { Année: 2019, Train: 10.8, Voiture: 9.1, CO2: 9.2 },
    { Année: 2020, Train: 10.5, Voiture: 8.7, CO2: 8.8 },
    { Année: 2021, Train: 11.0, Voiture: 9.5, CO2: 9.3 },
    { Année: 2022, Train: 11.8, Voiture: 10.2, CO2: 9.6 },
    { Année: 2023, Train: 12.1, Voiture: 10.5, CO2: 9.8 },
    { Année: 2024, Train: 12.3, Voiture: 10.7, CO2: 10.0 },
];

const dataCouts = couts.flatMap((d) =>
    Object.entries(d)
        .filter(([k]) => !["Année", "CO2"].includes(k))
        .map(([mode, cout]) => ({
            Année: +d.Année,
            Mode: mode,
            Coût: +cout,
        }))
);

function renderPlot(filtre = "Tous") {
    const container = document.querySelector("#graph-couts");
    if (!container) return;
    container.innerHTML = "";

    const dataFiltree =
        filtre === "Tous"
            ? dataCouts
            : dataCouts.filter((d) => d.Mode === filtre);

    const plot = Plot.plot({
        title: "Évolution du coût et du CO₂ économisé (2010–2024)",
        subtitle:
            "Comparer le coût du train et de la voiture, et les gains environnementaux associés.",
        width: 950,
        height: 520,
        marginLeft: 80,
        marginRight: 60,
        color: {
            legend: true,
            domain: ["Train", "Voiture", "CO₂ économisé"],
            range: ["#2563eb", "#ef4444", "#16a34a"],
        },
        x: { label: "Année", tickFormat: (d) => d, grid: true },
        y: { label: "Coût moyen (€ / 100 km)", grid: true, domain: [7, 13] },
        marks: [
            Plot.line(dataFiltree, {
                x: "Année",
                y: "Coût",
                stroke: "Mode",
                strokeWidth: 3,
            }),
            Plot.dot(dataFiltree, {
                x: "Année",
                y: "Coût",
                fill: "Mode",
                r: 4,
            }),
            Plot.line(couts, {
                x: "Année",
                y: (d) => d.CO2,
                stroke: "#16a34a",
                strokeDasharray: "4,2",
                strokeWidth: 2,
            }),
            Plot.text([{ x: 2024, y: 10, text: "CO₂ économisé (kg / 100 km)" }], {
                text: "text",
                x: "x",
                y: "y",
                dx: 40,
                dy: -10,
                fill: "#16a34a",
            }),
        ],
    });

    container.appendChild(plot);
}

document.addEventListener("DOMContentLoaded", () => {
    const select = document.querySelector("#filtreMode");
    renderPlot("Tous");
    select.addEventListener("change", (e) => renderPlot(e.target.value));
});
