---
title: Confirmation des commandes
description: Découvrez comment Akeed confirme les commandes COD sur WhatsApp et comment agir sur chaque statut dans votre routine d’expédition quotidienne.
order: 7
slug: order-confirmation
---

## Vue d’ensemble

Akeed vous aide à confirmer les commandes en paiement à la livraison (COD) avant de les expédier.

Lorsqu’une nouvelle commande COD éligible est créée, Akeed envoie au client un message de confirmation WhatsApp, attend sa réponse, puis met à jour le statut de la commande dans votre tableau de bord.

Votre équipe dispose ainsi d’un signal clair : « expédier » ou « retenir ».

Les commandes peuvent venir de Shopify, d’une commande ajoutée à la main ou d’un fichier importé. Après le premier message, elles suivent toutes le même parcours. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform) et [Import de commandes en masse](/docs/bulk-order-import).

## Pourquoi c’est important

Les activités COD perdent généralement de l’argent à deux endroits :

- Les commandes expédiées avant que l’intention du client soit vérifiée.
- Les commandes dont la livraison échoue parce que le client ne répond pas.

La confirmation des commandes aide à réduire les deux.

## Comment se déroule le parcours

1. Akeed vérifie si la commande est éligible à la confirmation COD.
2. Akeed envoie un message de confirmation WhatsApp.
3. Le client confirme, annule ou ne répond pas.
4. Akeed met à jour le statut et le reflète dans les vues du tableau de bord.
5. Les règles de relance et d’escalade s’appliquent selon vos paramètres.
6. Sur une boutique connectée, Akeed enregistre la réponse sur la commande : une balise sur Shopify, un statut sur EasyOrders, une note ou un statut annulé sur WooCommerce.

> [!INFO]
> Le parcours de confirmation principal d’Akeed concerne les commandes COD.

## Les statuts et ce qu’il faut faire

| Statut | Signification | Action recommandée |
| --- | --- | --- |
| En attente de démarrage | Importée depuis un fichier et mise en attente. Aucun message n’a encore été envoyé. | Démarrez la confirmation depuis l’écran d’import, ou envoyez de nouveau le fichier si le délai de 24 heures est dépassé. |
| En attente | La vérification existe, mais le premier message n’a pas encore été envoyé. | Patientez un peu, puis vérifiez les réglages de délai si elle reste en attente trop longtemps. |
| Envoyé | Le message a bien été envoyé. | Attendez la réponse du client. |
| Remis | WhatsApp signale la remise du message. | Continuez à surveiller la réponse. |
| Lu | Le client a ouvert le message. | Continuez à surveiller, ou comptez sur la relance automatique. |
| Confirmée | Le client a confirmé la commande. | Traitez-la en priorité. |
| Annulée | Le client a annulé (ou le marchand a annulé faute de réponse). | N’expédiez pas. |
| Sans réponse | Pas de réponse dans le délai d’escalade configuré. | Examinez-la rapidement et appliquez votre politique d’annulation. |
| Échec | L’envoi a échoué ou a été bloqué. | Vérifiez la qualité du numéro, l’utilisation du forfait ou le solde de crédits, et les paramètres. |

## Routine pratique pour le marchand

### 1) Expédier d’abord les commandes confirmées

Faites du statut « Confirmée » votre file d’expédition la plus sûre.

### 2) Examiner chaque jour les commandes sans réponse

Ne laissez pas les commandes sans réponse s’accumuler. Décidez de relancer ou d’annuler selon vos procédures.

### 3) Suivre les envois échoués

Un envoi échoué est un signal opérationnel, pas un simple chiffre du tableau de bord.

## Erreurs fréquentes

| Erreur | Meilleure approche |
| --- | --- |
| Expédier toutes les commandes COD sans attendre le statut | Faites de « confirmées d’abord » votre règle par défaut. |
| Ignorer les commandes sans réponse pendant plusieurs jours | Instaurez un examen quotidien des commandes sans réponse. |
| Désactiver l’automatisation sans solution de repli | Désignez un responsable du suivi manuel avant de désactiver l’automatisation. |
| Prendre « Remis » pour « Confirmée » | Seul le statut « Confirmée » doit décider de l’expédition. |

## Dépannage

### Trop de commandes sans réponse

- Réduisez le délai du premier envoi.
- Activez les rappels de relance.
- Vérifiez que l’heure d’envoi des messages correspond aux heures d’activité de vos clients.

### Les commandes restent en attente trop longtemps

- Vérifiez la configuration du délai d’envoi.
- Assurez-vous que la vérification automatique est activée.
- Assurez-vous que les commandes sont bien éligibles au COD.

### Les confirmations échouées augmentent

- Vérifiez la qualité des numéros de téléphone et le format de l’indicatif du pays.
- Vérifiez l’utilisation actuelle du forfait ou le solde de crédits.
- Envoyez une confirmation de test à un numéro que vous savez valide.

## FAQ

### Akeed annule-t-il automatiquement toutes les commandes non confirmées ?

Non. Ce sont vos paramètres et vos procédures qui déterminent le traitement des commandes sans réponse.

### Les clients peuvent-ils encore répondre après le statut « Sans réponse » ?

Ils peuvent répondre plus tard, selon le moment et selon que la commande a déjà été clôturée ou non par une action du marchand.

### Le statut « Remis » suffit-il pour expédier ?

Non. « Remis » signifie seulement que le message est parvenu au client. Fiez-vous à **Confirmée** pour expédier en confiance.

### Où régler les délais et la relance ?

Dans la section d’automatisation de vos paramètres.

Voir aussi : [Règles d’automatisation](/docs/automation-rules)
