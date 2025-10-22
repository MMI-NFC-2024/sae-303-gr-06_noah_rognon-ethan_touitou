import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Données brutes
const transport = [
    { Critère: "Écologie / Impact carbone", Train: 95, Voiture: 20 },
    { Critère: "Coût total du trajet", Train: 70, Voiture: 40 },
    { Critère: "Confort et détente", Train: 80, Voiture: 50 },
    { Critère: "Rapidité sur longue distance", Train: 85, Voiture: 60 },
    { Critère: "Stress / Fatigue", Train: 90, Voiture: 30 },
    { Critère: "Accessibilité / Réseau", Train: 60, Voiture: 75 },
];

// Conversion en format “long” avec polarité (barres divergentes)
const data = [
    ...transport.map((d) => ({
        Critère: d.Critère,
        Type: "Avantage Train",
        Valeur: d.Train,
    })),
    ...transport.map((d) => ({
        Critère: d.Critère,
        Type: "Inconvénient Voiture",
        Valeur: -d.Voiture,
    })),
];

// Fonction de rendu
function renderPlot(filtre = "Tous") {
    const container = document.querySelector("#graph-avantages");
    if (!container) return;
    container.innerHTML = "";

    const dataFiltree =
        filtre === "Tous" ? data : data.filter((d) => d.Type === filtre);

    const plot = Plot.plot({
        title: "Avantages du train vs inconvénients de la voiture",
        subtitle:
            "Comparaison des critères de mobilité selon leur perception (valeurs indicatives sur 100).",
        width: 900,
        height: 500,
        marginLeft: 180,
        x: {
            label: "Score perçu (sur 100)",
            tickFormat: (d) => Math.abs(d),
            grid: true,
        },
        y: { label: null },
        color: {
            domain: ["Avantage Train", "Inconvénient Voiture"],
            range: ["#2563eb", "#ef4444"],
            legend: true,
        },
        marks: [
            Plot.barX(dataFiltree, {
                x: "Valeur",
                y: "Critère",
                fill: "Type",
                title: (d) =>
                    `${d.Type}\n${d.Critère}\nScore : ${Math.abs(d.Valeur)}/100`,
            }),
            Plot.ruleX([0]),
        ],
        style: { background: "#fafafa", color: "#111827" },
    });

    container.appendChild(plot);
}

// Gestion du sélecteur
document.addEventListener("DOMContentLoaded", () => {
    const select = document.querySelector("#filtreAvantages");
    renderPlot("Tous");
    select.addEventListener("change", (e) => renderPlot(e.target.value));
});
