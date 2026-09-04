# Intégrations & architecture « Built to Integrate Anywhere »

Objectif (comme Arini) : l'agent s'intègre aux outils du cabinet — calendrier, logiciel
de gestion (PMS/Doctolib), messagerie SMS — pour que réservations, dossiers patients et
disponibilités restent synchronisés.

## Architecture en adaptateurs
Tout part d'un point unique : le tool booking (business_tools.book_appointment).
Il écrit dans le store local puis délègue à des adaptateurs optionnels :

    book_appointment -> BusinessStore (toujours, local)
                     -> calendar_service (Google Agenda, si configuré)  ✅ implémenté
                     -> PMS / Doctolib (adaptateur futur)               roadmap
                     -> SMS de confirmation (adaptateur futur)          roadmap

Chaque adaptateur est optionnel : s'il n'est pas configuré ou échoue, le rendez-vous
reste valide localement (never fail the booking).

## Déjà branché
- **Google Agenda** (compte de service) : créé l'événement au nom du patient, avec la
  référence. Statut visible dans Réglages → « Agenda connecté ». Doc : docs/calendar-setup.md.
- **Documents / knowledge** : indexation sémantique (Mistral embeddings) → l'agent répond
  depuis les documents du cabinet.
- **Prise de rendez-vous en ligne** : page publique /schedule (intégrable en iframe sur le
  site du cabinet), écrit dans le même flux que les appels.

## Roadmap (priorisée)
1. **SMS** (Twilio/Telnyx) : confirmations de rendez-vous + séquences de rappel/réactivation
   (Campagnes). Le moteur de séquences est déjà décrit dans l'UI Campagnes.
2. **PMS / Doctolib / agenda de pratique** : synchroniser disponibilités et créer le
   rendez-vous côté logiciel du cabinet (via API ou RPA). Adaptateur par éditeur.
3. **Multilingue dynamique** : STT Deepgram Flux détecte la langue (flux-multi) ; l'agent
   bascule. Le prompt gère déjà la consigne de continuité ; le basculement automatique
   TTS/STT en cours d'appel est à câbler (pipecat STTUpdateSettingsFrame + TTS language).
4. **Téléphonie** : Twilio ou Telnyx pour les appels réels (docs/twilio-setup.md, deploy/).

## Conformité
Voir docs/rgpd-product.md (sous-traitance art. 28, HDS pour l'hébergement de données de
santé en production, registre art. 30).
