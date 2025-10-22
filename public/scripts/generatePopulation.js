import { readFileSync, writeFileSync } from "node:fs";

const geojsonPath = new URL("../src/assets/departements.geojson.json", import.meta.url);
const outputPath = new URL("../src/assets/populationMain.json", import.meta.url);

const departements = JSON.parse(readFileSync(geojsonPath, "utf8"));

const years = [2019, 2020, 2021, 2022];
const sexes = ["Total", "Femmes", "Hommes"];
const ages = ["Total", "0-19", "20-64", "65+"];

const data = [];

for (const feature of departements.features ?? []) {
  const name = feature.properties?.nom ?? feature.properties?.NAME_1 ?? feature.properties?.name;
  if (!name) continue;

  for (const year of years) {
    const base = 400_000 + Math.random() * 600_000;

    const ageTotals = {
      "0-19": base * 0.24,
      "20-64": base * 0.55,
      "65+": base * 0.21,
      Total: base,
    };

    const sexTotals = {
      Femmes: base * 0.51,
      Hommes: base * 0.49,
      Total: base,
    };

    for (const sex of sexes) {
      const sexFactor = sex === "Total" ? 1 : sexTotals[sex] / base;
      for (const age of ages) {
        const value =
          age === "Total" ? base * sexFactor : ageTotals[age] * sexFactor;

        data.push({
          "Géographie": name,
          "Période": year,
          "Sexe": sex,
          "Âge": age,
          "Valeur": Math.round(value),
        });
      }
    }
  }
}

writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
