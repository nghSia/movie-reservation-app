# 🎬 Movie Reservation App (Angular 20)

Application de **réservation de séances de cinéma** construite avec **Angular 20** (composants **standalone**, **Signals**) et **Tailwind CSS**.  
Persistance **hybride** : **mock + localStorage** pour les entités métier (utilisateurs, réservations, salles, séances) et **données films en live** via **TMDB API** (interceptor HTTP).

> Conforme aux exigences pédagogiques : **DDD**, **lazy loading**, **guards**, **Reactive Forms** (avec **validator custom**), **Signals** (writable/computed/effect), **interceptor HTTP**, **UI responsive** et **accessibilité**.

---

## 🧭 Sommaire

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration TMDB](#-configuration-tmdb)
- [Démarrage](#-démarrage)
- [Scripts NPM](#-scripts-npm)
- [Tests & Qualité](#-tests--qualité)
- [Structure (extrait)](#-structure-extrait)
- [Concepts Angular](#-concepts-angular)
- [Parcours de démo (≤ 20 min)](#-parcours-de-démo--20-min)
- [Comptes démo (optionnel)](#-comptes-démo-optionnel)
- [FAQ rapide](#-faq-rapide)
- [Licence](#-licence)

---

## 🖼 Aperçu

- **Accueil** : films **“À l’affiche”** (TMDB) + **“Mieux notés”**, cache en mémoire (`shareReplay(1)`), **MovieCard** réutilisable.
- **Détails film** : informations TMDB + **séances mockées** (VO/VOSTFR/VF).
- **Réservation** : brouillon **PENDING** automatique, **Reactive Forms** avec **validator custom** (quantité ≤ places restantes), **Signals** (prix, sièges), **autosave** (effects → localStorage), statuts **CONFIRMED/CANCELLED**.
- **Mes réservations** : regroupement **PENDING/CONFIRMED/CANCELLED**, **réserver à nouveau**.
- **Admin** : gestion **users** (rôle/suppression), **stats** par film (% confirmed/pending/cancelled) **réactives**.

---

## ✨ Fonctionnalités

- Auth & rôles : register/login mock, **User** & **Admin**, **AuthGuard** + **AdminGuard**, persistance **localStorage**.
- HTTP & Interceptor : **Bearer TMDB** + `language=fr-FR` injectés automatiquement.
- UI/UX : **Tailwind**, navigation **dynamique** selon rôle, **accessibilité** (focus-visible, aria).
- Qualité : **TypeScript strict**, **ESLint**, tests **unitaires** et **d’intégration**.

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
