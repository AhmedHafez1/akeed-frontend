---
title: Connecter votre serveur à Akeed (API serveur)
description: Envoyez automatiquement à Akeed les commandes en paiement à la livraison de votre site web ou de votre système avec une seule requête HTTPS.
order: 6
slug: server-api
---

## Vue d’ensemble

L’API serveur permet à votre système d’envoyer les commandes à Akeed dès leur création, au lieu de les ajouter à la main ou de les importer depuis un fichier. Cette page s’adresse au propriétaire de la boutique. Le développeur chargé de l’intégration a besoin du guide complet, qui est en anglais.

**Votre serveur → une requête à Akeed → message de confirmation WhatsApp → résultat dans le tableau de bord**

[Ouvrir le guide complet pour les développeurs (en anglais)](/en/docs/server-api)

> [!INFO]
> L’API est disponible pour les comptes autonomes. Les boutiques Shopify n’en ont pas besoin, car leurs commandes arrivent automatiquement. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform).

## À qui s’adresse cette API

- Une boutique qui a son propre site web ou son propre système de commandes.
- Une société de livraison ou un système interne qui reçoit des commandes et veut les confirmer avant l’expédition.
- Tout système capable d’envoyer une requête HTTPS depuis un serveur.

Si vous n’avez pas de développeur, utilisez l’[Import de commandes en masse](/docs/bulk-order-import) ou ajoutez les commandes depuis le tableau de bord.

## Étapes de l’intégration

1. **Créez une clé API.** Dans **Paramètres → Clés API**, choisissez **Créer une clé**. La clé n’est affichée qu’une seule fois : copiez-la aussitôt.
2. **Transmettez au développeur la clé et l’adresse d’envoi.** L’adresse figure sur le même écran, sous **Envoyer les commandes à**. Transmettez la clé par un canal sûr, pas dans une conversation publique.
3. **Le développeur réalise l’intégration** en suivant le [guide complet](/en/docs/server-api). La première commande prend quelques minutes.
4. **Suivez le résultat.** Chaque commande apparaît dans la liste **Confirmations** avec vos autres commandes.

> [!WARNING]
> La clé est un secret réservé à votre serveur. Ne la placez pas dans une page web, dans une application mobile ni à aucun endroit visible par un client. Quiconque possède la clé peut envoyer des commandes à votre boutique. Si vous pensez qu’elle a fuité, révoquez-la dans **Paramètres → Clés API** et créez-en une nouvelle.

## Ce qu’il faut savoir

| Question | Réponse |
| --- | --- |
| Le message part-il dès la réception de la commande ? | Akeed enregistre d’abord la commande, puis envoie le message selon vos paramètres, comme les heures de silence et le délai d’envoi. |
| Que deviennent les commandes payées d’avance ? | Elles sont enregistrées et apparaissent dans le tableau de bord, mais aucun message n’est envoyé au client et aucun crédit n’est utilisé. |
| Que se passe-t-il si le système envoie deux fois la même commande ? | Aucune seconde commande n’est créée, aucun second message n’est envoyé et le crédit n’est pas décompté deux fois. |
| Peut-on modifier ou annuler une commande depuis l’API ? | Non. L’API ne fait que créer des commandes. |
| Où voit-on la réponse du client ? | Dans la liste **Confirmations** du tableau de bord. Akeed n’envoie pas de notifications à votre serveur. |
| Existe-t-il un mode test ? | Non. Chaque commande en paiement à la livraison envoie un vrai message et utilise un crédit. Essayez d’abord avec votre propre numéro de téléphone. |
| Qu’est-ce qui interrompt la réception des commandes ? | Un solde épuisé, la désactivation de la confirmation automatique dans les paramètres ou la révocation de la clé. |

## En cas de problème

Chaque réponse d’Akeed contient un numéro de référence appelé `correlationId`. Demandez au développeur de le transmettre à l’[assistance](/support) avec l’heure de la requête et le code d’erreur. Ne communiquez la clé à personne, pas même à l’assistance.

## Guides associés

- [Guide complet pour les développeurs (en anglais)](/en/docs/server-api)
- [Utiliser Akeed sans Shopify](/docs/standalone-platform)
- [Import de commandes en masse](/docs/bulk-order-import)
- [Confirmation des commandes](/docs/order-confirmation)
