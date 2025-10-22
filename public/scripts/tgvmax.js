// public/scripts/tgvmax.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
    const el = document.querySelector("#graph-tgvmax");
    if (!el) return;
    el.innerHTML = "";

    // 1) Charger le CSV (séparateur ; )
    const rows = d3.dsvFormat(";").parse(await d3.text("/data/tgvmax.csv"), d3.autoType);
    if (!rows.length) {
        el.textContent = "Fichier tgvmax.csv vide.";
        return;
    }

    // 2) Détecter les noms de colonnes réels
    const keys = Object.keys(rows[0]).map((k) => k.trim());
    const findCol = (tester) => keys.find(tester);

    // Colonne de l’axe (ex: "Axe" ou "axe")
    const COL_AXE =
        findCol((k) => k.toLowerCase() === "axe") ??
        findCol((k) => k.toLowerCase().includes("axe"));
    // Colonne de disponibilité (ex: "Disponibilité de places MAX JEUNE et MAX SENIOR" ou "places_MAX")
    const COL_DISPO =
        findCol((k) => k.toLowerCase().startsWith("disponibilité")) ??
        findCol((k) => k.toLowerCase().includes("places_max"));

    if (!COL_AXE || !COL_DISPO) {
        el.textContent =
            "Impossible d’identifier les colonnes Axe / Disponibilité dans tgvmax.csv.";
        console.warn("Colonnes trouvées:", keys);
        return;
    }

    // 3) Normaliser les valeurs et grouper par axe
    const byAxe = d3.group(rows, (r) => String(r[COL_AXE]).trim());

    // 4) Calculer taux moyen "OUI" par axe
    const tgvmax_avg = Array.from(byAxe, ([axe, list]) => {
        const total = list.length;
        const oui = list.reduce((acc, r) => {
            const v = String(r[COL_DISPO] ?? "").trim().toUpperCase();
            return acc + (v === "OUI" ? 1 : 0);
        }, 0);
        return { axe, taux_moyen: (oui / (total || 1)) * 100, total, oui };
    }).sort((a, b) => d3.descending(a.taux_moyen, b.taux_moyen));

    // 5) (Optionnel) lissage « smoothed » si tu veux l’afficher plus tard
    const smoothed = tgvmax_avg.map((d, i, arr) => ({
        ...d,
        taux_moyen_smooth:
            i > 0 && i < arr.length - 1
                ? (arr[i - 1].taux_moyen + d.taux_moyen + arr[i + 1].taux_moyen) / 3
                : d.taux_moyen,
    }));

    // 6) Graphique Plot (fidèle à ta section)
    const plot = Plot.plot({
        title: "Disponibilité moyenne des offres TGVMax par axe (2024)",
        subtitle:
            "Pourcentage moyen de trains disposant de places MAX selon les axes principaux.",
        width: 900,
        height: 480,
        y: { label: "Taux moyen de disponibilité (%)", grid: true, domain: [0, 100] },
        x: { label: "Axe ferroviaire" },
        color: { legend: false },
        marks: [
            Plot.barY(
                tgvmax_avg, // tri déjà fait
                {
                    x: "axe",
                    y: "taux_moyen",
                    fill: (d) => (d.taux_moyen >= 25 ? "#2563eb" : "#93c5fd"),
                    title: (d) => `${d.axe} — ${d.taux_moyen.toFixed(1)} % (${d.oui}/${d.total})`,
                }
            ),
            Plot.text(tgvmax_avg, {
                x: "axe",
                y: "taux_moyen",
                dy: -10,
                text: (d) => `${d.taux_moyen.toFixed(1)} %`,
                fontWeight: "bold",
                textAnchor: "middle",
            }),
        ],
        style: { background: "#fafafa", color: "#111827" },
    });

    el.appendChild(plot);
});
