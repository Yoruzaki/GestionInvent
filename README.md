# HNSF — Inventaire & Actifs

**Higher National School of Forests** — Application web en **français** pour la gestion des équipements et du stock.

## Fonctionnalités

- **Tableau de bord** : total actifs, produits, équipements endommagés, alertes stock bas, derniers mouvements
- **Actifs / Équipements** : liste, ajout, modification, lieu, assignation, statut (actif / endommagé / réformé)
- **Stock** : produits, entrées (achats), sorties, stock actuel, seuil d’alerte
- **Mouvements** : historique des actifs, entrées et sorties de stock
- **Rapports** : stock actuel, équipements par lieu, par personne, consommation par mois — export CSV
- **Paramètres** : lieux (bureaux), employés / responsables

## Démarrage

```bash
# Dépendances (déjà installées si vous avez lancé npm install)
npm install

# Base de données (création des tables + données de démo)
npx prisma generate
npx prisma db push
npm run db:seed

# Lancer l’application
npm run dev
```

Ouvrir **http://localhost:3000**. En cas d'erreur 503 (Fournisseurs, Catégories, etc.) : arrêtez le serveur, exécutez `npx prisma generate`, puis relancez `npm run dev`.

## Compte de démo

- **Email :** admin@etablissement.local  
- **Mot de passe :** admin123  

*(La connexion n’est pas encore implémentée ; l’application est utilisable sans authentification.)*

## Technologies

- **Next.js 14** (App Router), **React**, **TypeScript**
- **Prisma** + **SQLite** (fichier `prisma/dev.db`)
- **Tailwind CSS**, **lucide-react**

## Structure des dossiers

- `src/app/` — pages et routes API
- `src/components/` — composants (ex. navigation)
- `src/lib/` — client Prisma
- `prisma/` — schéma et seed

## Scripts utiles

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — lancer la version build
- `npm run db:seed` — réexécuter le seed
