# RGPD & conformité — Guide produit (cabinet dentaire, France/UE)

Ce produit manipule des **données de santé** (transcriptions d'appels peuvent contenir
des informations médicales, art. 9 RGPD) et **enregistre les conversations**.
La conformité est une exigence produit, pas un accessoire.

## Ce qui est déjà intégré (code)
1. **Consentement à l'enregistrement** : l'agent annonce en début d'appel
   « cet appel est susceptible d'être enregistré » (FR/EN) — l'appelant qui poursuit
   consent. S'il refuse, l'agent le note (meta.json → badge « Enregistrement refusé »
   dans le tableau de bord) ; l'audio reste supprimable immédiatement.
2. **Registre local** : chaque appel = dossier horodaté (transcription, résumé, meta,
   audio) sous agent/calls/<cabinet>/<date>. Accès réservé à l'équipe du cabinet.
3. **Droit à l'effacement** : suppression par appel (Appels → corbeille), suppression
   définitive du dossier (audio compris).
4. **Portabilité** : export JSON complet du cabinet (tenant + activité + appels) dans
   Réglages → Données & conformité.
5. **Conservation** : par défaut, données conservées localement — le cabinet définit
   sa durée de rétention (recommandé 12 mois) et purge.
6. **Information** : encart RGPD dans les Réglages du tableau de bord.

## Ce qu'un cabinet doit mettre en place (avec nous)
- **Registre des traitements (art. 30)** : finalité (gestion des rendez-vous, qualité),
  catégories (coordonnées, données de santé issues des appels), durée de conservation,
  mesures de sécurité. Modèle fourni sur demande.
- **Base légale** : intérêt légitime du cabinet (art. 6.1.f) + consentement explicite
  pour l'enregistrement (annonce en début d'appel). Pour la messagerie SMS future :
  consentement dédié.
- **Sécurité** : accès par mot de passe au tableau de bord, chiffrement disque,
  sauvegardes chiffrées, journalisation des accès (feuille de route).
- **Sous-traitance** : nos fournisseurs (Mistral, Deepgram, Cartesia) traitent les
  données audio/texte — contrats de sous-traitance + clauses art. 28 à prévoir ;
  privilégier les régions UE pour l'hébergement.
- **HDS** : si l'hébergement en production contient des données de santé traitées pour
  le compte d'un cabinet, le statut **Hébergeur de Données de Santé (HDS)** est requis
  en France (certification obligatoire). À anticiper avant la mise en production.
- **DPO / information** : afficher la politique de confidentialité du cabinet, tenir un
  registre des appels enregistrés, répondre aux demandes d'accès (export) sous 30 jours.

## Décisions produit à prendre
- Durée de rétention par défaut (12 mois ?) + purge automatique planifiée.
- Faut-il une option « ne jamais enregistrer » (mode sans audio) ? (recommandé pour
  certains cabinets)
- Affichage de l'avis de confidentialité sur le site du cabinet (mention des appels
  enregistrés).

## Notes de démonstration
En mode démo, les données sont générées côté navigateur et ne quittent pas la machine —
aucune donnée réelle n'est fabriquée.
