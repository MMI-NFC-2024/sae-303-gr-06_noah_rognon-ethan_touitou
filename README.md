[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/tzO_JqWG)

- URL site WEB : https://tourismeentrain.netlify.app/
- URL Notebook Observable : insee.fr / defis.data.gouv.fr
- Nom : ROGNON
- Prenom : Noah
- Nom binome : TOUITOU
- Prenom binome : Ethan
- Nom 3 : URBANO VIZEU
- Prenom 3 : Morgan

## Remarques

- Navigation fluide : barre fixe, menu burger accessible et synchronise avec la largeur d ecran ([src/components/NavBar.astro](src/components/NavBar.astro)).
- Storytelling multi-pages : hero immersif, sections CTA et progression narrative en plusieurs chapitres ([src/pages/index.astro](src/pages/index.astro)).
-Le site raconte une vrai histoire 
-chaque graphique esty minutieusement pensé
- Mise en page responsive : layout Tailwind reutilisable pour garantir un rendu coherent du mobile au desktop ([src/layouts/Layout.astro](src/layouts/Layout.astro)).
- Experience Data Lab : cartes Observable Plot rendues cote serveur et partagees entre pages via un module commun ([src/data/plots.ts](src/data/plots.ts)).
- Bouton « Agrandir » sur les graphes : modale plein ecran qui deplace la visualisation sans perdre l interactivite ([src/components/GraphBlock.astro](src/components/GraphBlock.astro)).
- Scripts front dynamiques : filtres, cartes et projections relies aux donnees Open Data et charges cote client (ex. [public/scripts/tourisme.js](public/scripts/tourisme.js)).
- Accessibilite soignee : navigation clavier, echap pour fermer les modales, focus de retour, contrastes et textes alternatifs ([src/styles/global.css](src/styles/global.css)).
