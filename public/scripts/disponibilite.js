// public/scripts/tgvmax-disponibilite.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#ah");
    if (!el) return;
    el.innerHTML = "Chargement des données…";

    try {
        // 1️⃣ Chargement du fichier CSV (séparateur ;)
        const tgvmax = d3
            .dsvFormat(";")
            .parse(await d3.text("/data/tgvmax.csv"), d3.autoType);

        console.log("📄 Données TGVMax chargées :", tgvmax.length, "lignes");

        // 2️⃣ Calcul du taux de disponibilité par date et par axe
        const tgvmax_counts = d3
            .rollups(
                tgvmax,
                (v) => {
                    const total = v.length;
                    const oui = v.filter(
                        (d) =>
                            (
                                d["Disponibilité de places MAX JEUNE et MAX SENIOR"] ||
                                ""
                            ).trim() === "OUI"
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

        console.log("📊 Données agrégées :", tgvmax_counts.length, "enregistrements");

        // 3️⃣ Tri des axes par ordre alphabétique pour l’affichage
        const axes = Array.from(new Set(tgvmax_counts.map((d) => d.axe))).sort();

        // 4️⃣ Création du graphique Plot
        const plot = Plot.plot({
            title: "Évolution du taux de disponibilité TGVMax par axe et par jour",
            subtitle: "Pourcentage de trains affichant une disponibilité 'OUI' pour les abonnements MAX.",
            width: 950,
            height: 550,
            marginLeft: 150,
            color: {
                label: "Taux de disponibilité (%)",
                type: "linear",
                scheme: "blues",
                domain: [0, 100],
            },
            x: {
                label: "Date",
                tickFormat: d3.timeFormat("%d %b"),
                tickRotate: -45,
            },
            y: {
                label: "Axe SNCF",
                domain: axes,
            },
            marks: [
                // 🟦 Carrés colorés représentant le taux de disponibilité
                Plot.rect(tgvmax_counts, {
                    x: "date",
                    y: "axe",
                    fill: "taux",
                    title: (d) =>
                        `${d.axe}\n${d.date.toLocaleDateString("fr-FR")} — ${d.taux.toFixed(
                            1
                        )}% (${d.oui}/${d.total} OUI)`,
                }),

                // ⭐️ Étoile sur les taux > 50%
                Plot.text(tgvmax_counts, {
                    x: "date",
                    y: "axe",
                    text: (d) => (d.taux > 50 ? "★" : ""),
                    fill: "#000",
                    fontSize: 10,
                    opacity: 0.4,
                }),
            ],
            style: { background: "#fafafa", color: "#111827" },
        });

        // 5️⃣ Affichage dans la page
        el.innerHTML = "";
        el.appendChild(plot);
    } catch (err) {
        console.error("Erreur :", err);
        el.textContent =
            "Erreur lors du chargement ou du traitement du fichier CSV tgvmax.csv.";
    }
});
