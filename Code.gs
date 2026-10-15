/**
 * Sondage de disponibilités — backend Google Apps Script.
 * À coller dans Extensions → Apps Script de la feuille Google, puis déployer
 * en « Application Web » (voir README.md).
 */

// Doit rester identique à la constante CRENEAUX de index.html.
const JOURS = ["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"];
const HEURES = ["10h", "13h", "16h", "19h"];
const PLAGES = JOURS.flatMap(function (j) { return HEURES.map(function (h) { return j + "_" + h; }); });

const NOM_ONGLET = "Réponses";
const ENTETE = ["Horodatage", "Nom", "Plages"];
const NOM_MAX = 60;

/** Enregistre (ou remplace) la réponse d'une personne. */
function doPost(e) {
  let donnees;
  try {
    donnees = JSON.parse(e && e.postData ? e.postData.contents : "");
  } catch (err) {
    return repondre({ ok: false, erreur: "Données invalides (JSON attendu)." });
  }

  // Validation du nom : espaces superflus retirés, tronqué à 60 caractères.
  const nom = String((donnees && donnees.nom) || "").replace(/\s+/g, " ").trim().slice(0, NOM_MAX).trim();
  if (!nom) return repondre({ ok: false, erreur: "Le nom est obligatoire." });

  // Validation des plages : liste non vide, uniquement des identifiants autorisés.
  const recues = donnees.plages;
  if (!Array.isArray(recues) || recues.length === 0) {
    return repondre({ ok: false, erreur: "Sélectionnez au moins une plage." });
  }
  if (recues.some(function (p) { return PLAGES.indexOf(p) === -1; })) {
    return repondre({ ok: false, erreur: "Plage inconnue dans la demande." });
  }
  // Dédoublonnage et tri dans l'ordre chronologique.
  const plages = PLAGES.filter(function (p) { return recues.indexOf(p) !== -1; });

  // Verrou : évite que deux envois simultanés s'écrasent.
  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(10000)) {
    return repondre({ ok: false, erreur: "Serveur occupé, veuillez réessayer." });
  }
  try {
    const feuille = obtenirFeuille();
    const ligne = [new Date(), protegerTexte(nom), plages.join(", ")];

    // Recherche d'une réponse existante pour la même personne.
    const cle = normaliser(nom);
    const valeurs = feuille.getDataRange().getValues();
    let numLigne = -1;
    for (let i = 1; i < valeurs.length; i++) {
      if (normaliser(valeurs[i][1]) === cle) { numLigne = i + 1; break; }
    }

    if (numLigne > 0) {
      feuille.getRange(numLigne, 1, 1, ligne.length).setValues([ligne]);
    } else {
      feuille.appendRow(ligne);
    }
    return repondre({ ok: true });
  } catch (err) {
    return repondre({ ok: false, erreur: "Erreur lors de l'enregistrement." });
  } finally {
    verrou.releaseLock();
  }
}

/** Renvoie, pour chaque plage, le nombre de personnes disponibles et leurs noms. */
function doGet() {
  try {
    const resultat = {};
    PLAGES.forEach(function (p) { resultat[p] = { nombre: 0, noms: [] }; });

    const valeurs = obtenirFeuille().getDataRange().getValues().slice(1);
    let total = 0;
    valeurs.forEach(function (ligne) {
      const nom = String(ligne[1] || "").trim();
      if (!nom) return;
      total++;
      String(ligne[2] || "").split(",").forEach(function (brut) {
        const p = brut.trim();
        if (resultat[p]) {
          resultat[p].nombre++;
          resultat[p].noms.push(nom);
        }
      });
    });
    return repondre({ ok: true, total: total, plages: resultat });
  } catch (err) {
    return repondre({ ok: false, erreur: "Impossible de lire les réponses." });
  }
}

/** Retourne l'onglet « Réponses », en le créant avec son en-tête si besoin. */
function obtenirFeuille() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  let feuille = classeur.getSheetByName(NOM_ONGLET);
  if (!feuille) feuille = classeur.insertSheet(NOM_ONGLET);
  if (feuille.getLastRow() === 0) {
    feuille.appendRow(ENTETE);
    feuille.setFrozenRows(1);
    feuille.getRange(1, 1, 1, ENTETE.length).setFontWeight("bold");
  }
  return feuille;
}

/** Clé de comparaison des noms : sans casse ni espaces. */
function normaliser(nom) {
  return String(nom || "").toLowerCase().replace(/\s+/g, "");
}

/** Empêche qu'un nom commençant par =, +, - ou @ soit interprété comme une formule. */
function protegerTexte(texte) {
  return /^[=+\-@]/.test(texte) ? "'" + texte : texte;
}

/** Réponse JSON. */
function repondre(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}
