import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// ===========================
// CONFIG GÉNÉRALE
// ===========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(process.cwd(), "public/data");

// ===========================
// SECTION 1 — Réseau ferroviaire et culture
// ===========================
export const departements = JSON.parse(
  readFileSync(path.join(dataDir, "departements.geojson"), "utf-8")
);

const lignes1 = d3
  .dsvFormat(";")
  .parse(
    readFileSync(
      path.join(dataDir, "lignes-par-region-administrative.csv"),
      "utf-8"
    ),
    d3.autoType
  );

export const lignes_valides = lignes1
  .filter((d) => d.X_D_WGS84 && d.Y_D_WGS84 && d.X_F_WGS84 && d.Y_F_WGS84)
  .map((d) => ({
    ...d,
    X_D_WGS84: parseFloat(String(d.X_D_WGS84).replace(",", ".")),
    Y_D_WGS84: parseFloat(String(d.Y_D_WGS84).replace(",", ".")),
    X_F_WGS84: parseFloat(String(d.X_F_WGS84).replace(",", ".")),
    Y_F_WGS84: parseFloat(String(d.Y_F_WGS84).replace(",", ".")),
  }));

const gares = d3
  .dsvFormat(";")
  .parse(
    readFileSync(path.join(dataDir, "gares-de-voyageurs.csv"), "utf-8"),
    d3.autoType
  );

export const gares_clean = gares.filter((d) => d["Position géographique"]);

const equipements = d3
  .dsvFormat(",")
  .parse(
    readFileSync(
      path.join(dataDir, "googleBasilicDataculture20250905Sheet1.csv"),
      "utf-8"
    ),
    d3.autoType
  );

export const equipements_culturels = equipements.filter((d) =>
  ["Archives", "Bibliothèque", "Théâtre", "Cinéma"].some(
    (cat) =>
      (d.Domaine || "").includes(cat) ||
      (d.Type_equipement_ou_lieu || "").includes(cat)
  )
);

export const plotOptions1 = {
  title: "Réseau ferroviaire et accès à la culture en France",
  subtitle:
    "Visualisation des lignes ferroviaires (en noir), des gares SNCF (en rouge) et des équipements culturels (en bleu).",
  width: 950,
  height: 780,
  projection: { type: "mercator", domain: departements },
  marks: [
    Plot.geo(departements, { fill: "#f3f4f6", stroke: "#d1d5db" }),
    Plot.link(lignes_valides, {
      x1: "X_D_WGS84",
      y1: "Y_D_WGS84",
      x2: "X_F_WGS84",
      y2: "Y_F_WGS84",
      stroke: "#000",
      strokeWidth: 1.5,
      opacity: 0.9,
    }),
    Plot.dot(gares_clean, {
      x: "Longitude",
      y: "Latitude",
      r: 2,
      fill: "#ef4444",
      opacity: 0.8,
    }),
    Plot.dot(equipements_culturels, {
      x: "Longitude",
      y: "Latitude",
      r: 3,
      fill: "#3b82f6",
      opacity: 0.6,
    }),
  ],
  style: { background: "#fafafa", color: "#111827" },
};

// ===========================
// SECTION 2 — Émissions CO₂
// ===========================
export const co2 = [
  { mode: "Train", co2: 4 },
  { mode: "Voiture", co2: 40 },
  { mode: "Avion", co2: 70 },
];

export const plotOptions2 = {
  title: "Émissions moyennes de CO₂ par mode de transport (trajet de 500 km)",
  subtitle: "Source : ADEME, SNCF – données moyennes estimées",
  x: { label: "Mode de transport" },
  y: { label: "Émissions de CO₂ (kg)" },
  marks: [
    Plot.barY(co2, {
      x: "mode",
      y: "co2",
      fill: (d) =>
        d.mode === "Train" ? "green" : d.mode === "Voiture" ? "orange" : "red",
    }),
    Plot.text(co2, {
      x: "mode",
      y: (d) => d.co2 + 3,
      text: (d) => `${d.co2} kg`,
      textAnchor: "middle",
      fontWeight: "bold",
    }),
  ],
};

// ===========================
// SECTION 3 — Festivals accessibles en train
// ===========================
const festivals = d3
  .dsvFormat(";")
  .parse(
    readFileSync(
      path.join(dataDir, "festivals-global-festivals-pl.csv"),
      "utf-8"
    ),
    d3.autoType
  );

const festivals_clean = festivals.filter((d) => d["Géocodage xy"]);

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const festivals_accessibles = festivals_clean
  .map((f) => {
    const [latF, lonF] = String(f["Géocodage xy"] || "")
      .split(",")
      .map((c) => parseFloat(c.trim()));
    if (!latF || !lonF) return null;

    let minDistance = Infinity;
    for (const g of gares_clean) {
      const [latG, lonG] = String(g["Position géographique"] || "")
        .split(",")
        .map((c) => parseFloat(c.trim()));
      if (!latG || !lonG) continue;
      const dist = distanceKm(latF, lonF, latG, lonG);
      if (dist < minDistance) minDistance = dist;
    }

    return {
      ...f,
      latitude: latF,
      longitude: lonF,
      distance_gare: minDistance,
    };
  })
  .filter(Boolean);

export const festivals_accessibles_train = festivals_accessibles.filter(
  (f) => (f as { distance_gare: number }).distance_gare <= 10
) as Array<{ distance_gare: number; latitude: number; longitude: number }>;

export const festivals_non_accessibles = festivals_accessibles.filter(
  (f) => (f as { distance_gare: number }).distance_gare > 10
) as Array<{ distance_gare: number; latitude: number; longitude: number }>;

export const plotOptions3 = {
  title: "Festivals accessibles en train (≤ 10 km d’une gare)",
  width: 950,
  height: 700,
  projection: { type: "mercator", domain: departements },
  marks: [
    Plot.geo(departements, { fill: "#f8f8f8", stroke: "#ccc" }),
    Plot.dot(gares_clean, {
      x: (d) => +String(d["Position géographique"]).split(",")[1],
      y: (d) => +String(d["Position géographique"]).split(",")[0],
      r: 1,
      fill: "#999",
      opacity: 0.3,
    }),
    Plot.dot(festivals_accessibles_train, {
      x: (d) => d.longitude,
      y: (d) => d.latitude,
      r: 2.5,
      fill: "#2a9d8f",
      opacity: 0.85,
    }),
    Plot.dot(festivals_non_accessibles, {
      x: (d) => d.longitude,
      y: (d) => d.latitude,
      r: 2.5,
      fill: "#e63946",
      opacity: 0.6,
    }),
  ],
  style: { background: "#fafafa" },
};

// ===========================
// SECTION 4 — Évolution du coût et du CO₂ économisé
// ===========================
export const couts = [
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

export const dataCouts = couts.flatMap((d) =>
  Object.entries(d)
    .filter(([k]) => !["Année", "CO2"].includes(k))
    .map(([mode, cout]) => ({
      Année: +d.Année,
      Mode: mode,
      Coût: +cout,
    }))
);

export const plotOptions4 = {
  title: "Évolution du coût et du CO₂ économisé (2010–2024)",
  subtitle:
    "Comparaison du coût du train et de la voiture, et gains environnementaux associés.",
  width: 950,
  height: 520,
  marginLeft: 80,
  marginRight: 60,
  color: {
    legend: true,
    domain: ["Train", "Voiture", "CO₂ économisé"],
    range: ["#2563eb", "#ef4444", "#16a34a"],
  },
  x: { label: "Année", tickFormat: d3.format("d"), grid: true },
  y: { label: "Coût moyen (€ / 100 km)", grid: true, domain: [7, 13] },
  marks: [
    Plot.line(dataCouts, {
      x: "Année",
      y: "Coût",
      stroke: "Mode",
      strokeWidth: 3,
    }),
    Plot.dot(dataCouts, {
      x: "Année",
      y: "Coût",
      fill: "Mode",
      r: 4,
      title: (d) =>
        `${d.Mode} (${d.Année}) : ${d.Coût.toFixed(2)} € / 100 km`,
    }),
    Plot.line(couts, {
      x: "Année",
      y: (d) => d.CO2,
      stroke: "#16a34a",
      strokeDasharray: "4,2",
      strokeWidth: 2,
      title: (d) =>
        `${d.Année} : ${d.CO2.toFixed(1)} kg de CO₂ économisés / 100 km`,
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
  style: { background: "#fafafa", color: "#111827" },
};
