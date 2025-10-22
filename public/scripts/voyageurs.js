// public/scripts/voyageurs.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#graph-voyageurs");
    if (!el) return;
    if (el.dataset.initialized === "true") return;
    el.dataset.initialized = "true";
    el.innerHTML = "⏳ Chargement des données...";

    try {
        // --- 1️⃣ Chargement du fichier CSV
        const csvUrl = "/data/passagers.csv";
        const passagers = d3.csvParse(await d3.text(csvUrl), d3.autoType);

        console.log("📄 Données chargées :", passagers.length, "lignes");

        // --- 2️⃣ Récupération des types disponibles
        const types = Array.from(new Set(passagers.map((d) => d.Type))).sort();

        // --- 3️⃣ Création du sélecteur de filtre
        const divControl = document.createElement("div");
        divControl.style.marginBottom = "1rem";
        divControl.style.display = "flex";
        divControl.style.alignItems = "center";
        divControl.style.gap = "0.5rem";

        const label = document.createElement("label");
        label.textContent = "Filtrer par type :";
        label.style.fontWeight = "600";

        const select = document.createElement("select");
        select.innerHTML = `
      <option value="Tous">Tous</option>
      ${types.map((t) => `<option value="${t}">${t}</option>`).join("")}
    `;

        divControl.append(label, select);
        el.innerHTML = "";
        el.append(divControl);

        const chartDiv = document.createElement("div");
        el.append(chartDiv);

        // --- 4️⃣ Fonction de rendu du graphique
        function render(filtreType = "Tous") {
            chartDiv.innerHTML = "";

            const filtered = passagers.filter(
                (d) => filtreType === "Tous" || d.Type === filtreType
            );

            const plot = Plot.plot({
                title: "Évolution du nombre de voyageurs ferroviaires (2010–2024)",
                subtitle: "Analyse selon le type de train ou de service.",
                width: 900,
                height: 500,
                marginLeft: 80,
                marginBottom: 50,
                x: {
                    label: "Année",
                    tickFormat: d3.format("d"),
                    grid: true,
                },
                y: {
                    label: "Nombre de passagers (millions)",
                    grid: true,
                },
                marks: [
                    // Ligne principale
                    Plot.line(filtered, {
                        x: "Date",
                        y: "Passagers",
                        stroke: "#1d4ed8",
                        strokeWidth: 3,
                    }),
                    // Points interactifs
                    Plot.dot(filtered, {
                        x: "Date",
                        y: "Passagers",
                        r: 4,
                        fill: "#1d4ed8",
                        tip: true,
                        title: (d) =>
                            `${d.Type} – ${d.Date} : ${d3.format(",")(d.Passagers)} passagers`,
                    }),
                ],
                style: { background: "#fafafa", color: "#111827" },
            });

            chartDiv.append(plot);
        }

        // --- 5️⃣ Rendu initial
        render();

        // --- 6️⃣ Changement dynamique du filtre
        select.addEventListener("change", (e) => render(e.target.value));
    } catch (err) {
        console.error("Erreur graphique voyageurs :", err);
        el.textContent =
            "⚠️ Erreur lors du chargement ou du traitement du fichier passagers.csv.";
    }
});
