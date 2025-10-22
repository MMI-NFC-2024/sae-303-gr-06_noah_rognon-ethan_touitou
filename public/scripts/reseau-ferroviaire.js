// public/scripts/reseau-ferroviaire.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

document.addEventListener("DOMContentLoaded", async () => {
  const el = document.querySelector("#graph-reseau-ferroviaire");
  const select = document.querySelector("#filtre-carte");
  if (!el) return;
  el.innerHTML = "Chargement de la carte…";

  try {
    // 1️⃣ Chargement des données
    const departements = await d3.json("/data/departements.geojson");
    const garesRaw = d3
      .dsvFormat(";")
      .parse(await d3.text("/data/gares-de-voyageurs.csv"), d3.autoType);
    const lignesRaw = d3
      .dsvFormat(";")
      .parse(await d3.text("/data/lignes-par-region-administrative.csv"), d3.autoType);

    // 2️⃣ Parsing gares
    function parseGares(rows) {
      const inFR = (lat, lon) => lat >= 41 && lat <= 52 && lon >= -6 && lon <= 11;
      return rows
        .map((d) => {
          let s = d["Position géographique"] || Object.values(d).join(" ");
          const m = String(s).match(/-?\d+(?:[.,]\d+)?/g);
          if (!m || m.length < 2) return null;
          let a = +m[0].replace(",", ".");
          let b = +m[1].replace(",", ".");
          let lat = a, lon = b;
          if (!inFR(lat, lon)) {
            lat = b;
            lon = a;
            if (!inFR(lat, lon)) return null;
          }
          return { nom: d.Nom ?? "Gare", lat, lon };
        })
        .filter(Boolean);
    }
    const gares = parseGares(garesRaw);

    // 3️⃣ Parsing lignes
    function parseLignes(rows) {
      const feats = [];
      for (const d of rows) {
        let geom = d["Geo Shape"];
        if (!geom) continue;
        geom = String(geom)
          .replaceAll('""', '"')
          .replace(/^"|"$/g, "")
          .replace(/\n/g, "");
        let g;
        try {
          g = JSON.parse(geom);
        } catch {
          continue;
        }
        if (!g || !g.type || !/^(LineString|MultiLineString)$/i.test(g.type)) continue;
        feats.push({
          type: "Feature",
          properties: { region: d.REGION, libelle: d.LIB_LIGNE },
          geometry: g,
        });
      }
      return { type: "FeatureCollection", features: feats };
    }
    const lignes = parseLignes(lignesRaw);

    // 4️⃣ Gares GeoJSON
    const garesGeo = {
      type: "FeatureCollection",
      features: gares.map((d) => ({
        type: "Feature",
        properties: { nom: d.nom },
        geometry: { type: "Point", coordinates: [d.lon, d.lat] },
      })),
    };

    // 5️⃣ Fonction de rendu
    function renderCarte(mode = "tous") {
      el.innerHTML = "";

      const marks = [
        Plot.geo(departements, {
          fill: "#f5f5f5",
          stroke: "#d4d4d4",
          strokeWidth: 0.8,
        }),
      ];

      if (mode === "tous" || mode === "lignes") {
        marks.push(
          Plot.geo(lignes, {
            stroke: "green",
            strokeOpacity: 0.5,
            strokeWidth: 1.4,
            title: (f) => `${f.properties.libelle} (${f.properties.region})`,
          })
        );
      }

      if (mode === "tous" || mode === "gares") {
        marks.push(
          Plot.geo(garesGeo, {
            r: 2.3,
            fill: "crimson",
            stroke: "white",
            strokeWidth: 0.3,
            fillOpacity: 0.85,
            title: (f) => f.properties.nom,
          })
        );
      }

      const plot = Plot.plot({
        title: "Réseau ferroviaire et accès à la culture en France",
        subtitle:
          "Lignes ferroviaires (vertes) et gares SNCF (rouges). Utilisez le filtre pour ajuster l’affichage.",
        width: 950,
        height: 800,
        projection: { type: "mercator", domain: departements },
        marks,
        style: { background: "#fafafa", color: "#111827" },
      });

      el.appendChild(plot);
    }

    // 6️⃣ Premier rendu
    renderCarte("tous");

    // 7️⃣ Écouteur du filtre
    select.addEventListener("change", (e) => {
      renderCarte(e.target.value);
    });

    console.log("✅ Carte ferroviaire interactive chargée !");
  } catch (err) {
    console.error("Erreur carte :", err);
    el.innerHTML =
      "⚠️ Erreur : impossible de charger les données. Vérifie les fichiers dans /public/data/.";
  }
});
