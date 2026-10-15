# Sondage de disponibilités — semaine du 25 au 31 octobre 2026

Petite page web (hébergée sur GitHub Pages) qui recueille les disponibilités de chacun et les enregistre dans une feuille Google Sheets grâce à Google Apps Script.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | La page publique : formulaire, récapitulatif et vue « Résultats » (HTML, CSS et JavaScript dans un seul fichier, sans dépendance). |
| `apps-script/Code.gs` | Le code serveur à coller dans l'éditeur Apps Script de la feuille Google. |
| `README.md` | Ce guide. |

## Déploiement pas à pas

1. **Créer la feuille.** Sur [sheets.google.com](https://sheets.google.com), créez une feuille de calcul vierge et donnez-lui un nom (par exemple « Sondage octobre »). Inutile de créer l'onglet « Réponses » : le script s'en charge au premier envoi.

2. **Ajouter le script.** Dans la feuille, ouvrez le menu **Extensions → Apps Script**. Supprimez le contenu du fichier `Code.gs` proposé par défaut, collez-y tout le contenu de `apps-script/Code.gs` de ce dépôt, puis cliquez sur l'icône **Enregistrer** (disquette).

3. **Déployer en application Web.** En haut à droite, cliquez sur **Déployer → Nouveau déploiement**. Cliquez sur la roue dentée à côté de « Sélectionner le type » et choisissez **Application Web**. Réglez :
   - **Exécuter en tant que :** « Moi »
   - **Qui a accès :** « Tout le monde »

   Cliquez sur **Déployer**, puis sur **Autoriser l'accès**. Choisissez votre compte Google. Si un écran « Google n'a pas validé cette application » apparaît, cliquez sur **Paramètres avancés → Accéder à … (non sécurisé)** : c'est votre propre script. Acceptez les permissions demandées (accès à la feuille de calcul).

4. **Copier l'URL.** Copiez l'**URL de l'application Web** affichée (elle se termine par `/exec`). Dans `index.html`, remplacez la valeur de la constante en haut du script :

   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```

5. **Publier sur GitHub Pages.** Créez un dépôt sur GitHub et poussez-y les fichiers (branche `main`). Dans le dépôt, allez dans **Settings → Pages**, section « Build and deployment » : **Source : Deploy from a branch**, **Branch : `main`**, dossier **`/ (root)`**, puis **Save**. Après une ou deux minutes, la page est accessible à l'adresse `https://<votre-compte>.github.io/<nom-du-depot>/`.

6. **Tester.** Ouvrez la page publiée, saisissez un nom, cochez quelques plages et cliquez sur **Envoyer mes disponibilités**. Vérifiez :
   - que le message de confirmation s'affiche ;
   - qu'une ligne apparaît dans l'onglet « Réponses » de la feuille (horodatage, nom, plages) ;
   - que l'onglet **Voir les résultats** affiche les bons nombres (cliquez sur **Actualiser** si besoin).

   Renvoyez avec le même nom (casse ou espaces différents) : la ligne existante doit être remplacée, pas dupliquée.

7. **Important — modifier le script.** Toute modification de `Code.gs` n'est prise en compte qu'après un nouveau déploiement : **Déployer → Gérer les déploiements →** icône crayon (**Modifier**) **→ Version : Nouvelle version → Déployer**. Sinon, l'ancienne version reste active. En procédant ainsi, l'URL `/exec` reste la même et `index.html` n'a pas à être modifié.

## Bon à savoir

- **Changer les dates ou les heures :** modifiez la constante `CRENEAUX` dans `index.html` **et** les constantes `JOURS` / `HEURES` dans `Code.gs` (les deux listes doivent correspondre), puis redéployez le script (étape 7).
- **Avant configuration**, la page s'ouvre normalement et affiche un avertissement : l'envoi et les résultats sont simplement désactivés.
- **Format envoyé :** `POST` avec l'en-tête `Content-Type: text/plain;charset=utf-8` et le corps `{ "nom": "...", "plages": ["2026-10-27_13h", ...] }`. Le type `text/plain` est volontaire : il évite la requête CORS préalable, que les applications Web Apps Script ne gèrent pas.
- **Confidentialité :** la vue « Résultats » est publique et affiche les noms des répondants. N'utilisez pas ce sondage pour des informations sensibles.
- **Réinitialiser le sondage :** supprimez les lignes de l'onglet « Réponses » (en conservant l'en-tête).
