---
title: Règles d’automatisation
description: Configurez le moment des envois, les relances, l’escalade et les heures de silence en fonction de votre activité COD.
order: 8
slug: automation-rules
---

## Vue d’ensemble

Les règles d’automatisation déterminent **quand** Akeed envoie les messages de confirmation et **comment** il traite les clients qui ne répondent pas.

Ces paramètres vous permettent d’équilibrer rapidité, expérience client et risque d’expédition.

## Pourquoi ces règles comptent

Un bon timing améliore la qualité des réponses.

- Un envoi trop tôt ou trop tard → un taux de réponse plus faible.
- Pas de relance → davantage de commandes sans réponse.
- Une escalade trop rapide → vous risquez d’annuler des commandes qui auraient été confirmées.

L’objectif est simple : envoyer au bon moment, relancer une fois, escalader selon des règles claires.

## Règle 1 : délai du premier envoi

Ce réglage détermine combien de temps Akeed attend avant d’envoyer la première confirmation WhatsApp.

### Valeur recommandée

- Commencez par **0 à 15 minutes** pour la plupart des boutiques.

### Quand allonger le délai

- Vous avez besoin d’une courte marge pour les modifications de commande.
- Vous voulez éviter les envois immédiats pendant les pics de commandes.

> [!INFO]
> Un délai de premier envoi très long réduit généralement les performances de confirmation, car l’intention du client s’émousse avec le temps.

## Règle 2 : rappel de relance

Si cette option est activée, Akeed envoie un rappel de relance aux clients qui n’ont pas répondu.

### Valeur recommandée

- Laissez la relance **activée**.
- Commencez par **6 heures** après le premier envoi. C’est la valeur par défaut.

### Pourquoi c’est utile

- Les clients manquent souvent le premier message.
- Une seule relance récupère une part significative des confirmations.

## Règle 3 : escalade faute de réponse

L’escalade marque la commande comme **Sans réponse** lorsque le client n’a toujours pas répondu au terme du délai configuré.

### Valeur recommandée

- Commencez par **24 heures** après la relance. C’est la valeur par défaut.
- Placez l’escalade après la relance.

### Usage opérationnel

Servez-vous du statut « Sans réponse » comme d’une file d’examen pour vos équipes.

- Relancez manuellement les commandes de forte valeur.
- Annulez les commandes peu fiables selon votre politique.

> [!WARNING]
> Si l’escalade est trop agressive, vous risquez de bloquer des commandes valides dont le client aurait répondu plus tard.

### Annuler automatiquement les commandes sans réponse

Vous pouvez laisser Akeed annuler une commande dans votre boutique quand elle passe **Sans réponse**. L’option reste désactivée tant que vous ne l’activez pas dans **Délais et relance**, dans les réglages, et elle demande l’alerte des commandes sans réponse. L’annulation a lieu dès que la commande passe **Sans réponse**, votre délai d’escalade sert donc aussi de délai d’annulation.

Akeed n’annule une commande que si tout ceci est vrai :

- La confirmation, et le rappel s’il était prévu, ont été distribués.
- Le client n’a ni confirmé ni annulé. Akeed ignore un message qu’il ne peut lire ni comme une confirmation ni comme une annulation.
- Vous n’avez pas exclu la commande avec **Ne pas annuler automatiquement**.
- La boutique indique toujours la commande comme non payée et non expédiée.

Si Akeed n’a pas pu envoyer ou distribuer un message, par exemple parce que votre forfait ou vos crédits sont épuisés, l’annulation est suspendue. Akeed n’annule jamais une commande à cause de ses propres limites d’envoi.

Sur Shopify, vous choisissez si les articles sont remis en stock et si Shopify prévient le client. WooCommerce et EasyOrders suivent les réglages de votre boutique. Une commande annulée affiche **Aucune réponse après les tentatives de confirmation**. Si le client confirme ensuite, la commande affiche **Confirmée après annulation** et passe dans **À traiter par vous** pour que vous le contactiez. La commande reste annulée. Tout autre message après l’annulation est ignoré.

Désactiver l’option arrête toutes les annulations qui n’ont pas encore atteint votre boutique.

## Règle 4 : heures de silence

Les heures de silence empêchent les envois à certaines heures locales (la nuit, par exemple).

### Usage recommandé

- Elles sont désactivées par défaut. Une fois activées, la plage va de 22:00 à 09:00 dans votre fuseau horaire, tant que vous ne la changez pas. Activez-les si vos clients n’attendent pas de messages la nuit.
- Fixez le début et la fin selon les habitudes de votre marché.

### Important

Les messages sont retardés jusqu’à la fin de la plage de silence.

Si votre équipe constate le matin de nombreux cas en attente ou sans réponse, vérifiez si les heures de silence ne repoussent pas les envois plus tard que prévu.

## Règle 5 : fuseau horaire

Le fuseau horaire détermine comment s’appliquent les heures de silence.

Choisissez le fuseau horaire de votre équipe opérationnelle principale et de votre clientèle.

## Modèles de configuration pratiques

| Profil de boutique | Délai initial | Relance | Escalade | Heures de silence |
| --- | ---: | ---: | ---: | --- |
| Boutique à traitement rapide | 0–10 min | 60 min | 240 min | Facultatives |
| Configuration équilibrée par défaut | 0 min | 360 min | 1440 min après la relance | Désactivées, ou 22:00–09:00 |

Prenez-les comme points de départ, puis ajustez chaque semaine d’après vos taux de réponse et de confirmation.

## Erreurs fréquentes

| Erreur | Meilleure approche |
| --- | --- |
| Relance désactivée dès le premier jour | Gardez une relance active et mesurez d’abord son effet. |
| Escalade trop proche du premier envoi | Laissez un temps de réponse suffisant entre le premier envoi, la relance et l’escalade. |
| Heures de silence activées avec le mauvais fuseau horaire | Revérifiez le fuseau horaire après tout changement de configuration. |
| Règles modifiées sans cesse, chaque jour | Procédez par cycles hebdomadaires maîtrisés et comparez les résultats. |

## Dépannage

### Le taux de réponse a baissé après un changement de règles

- Revenez au dernier réglage stable.
- Vérifiez si les heures de silence ne bloquent pas désormais les plages de forte réponse.
- Ne modifiez qu’un réglage de délai à la fois.

### Trop de commandes en « Sans réponse »

- Allongez le délai d’escalade.
- Assurez-vous que la relance est activée.
- Réduisez le délai du premier envoi si les messages partent trop tard.

### Les clients se plaignent de l’heure des messages

- Activez les heures de silence.
- Déplacez les plages d’envoi vers la journée, dans le fuseau horaire local.

## FAQ

### Toutes les boutiques doivent-elles utiliser les mêmes règles d’automatisation ?

Non. Ajustez les règles selon le comportement de vos commandes, les habitudes de votre clientèle et la capacité de votre assistance.

### Une seule relance suffit-elle ?

Pour la plupart des boutiques, oui. Une relance capte généralement l’essentiel des réponses récupérables sans devenir envahissante.

### Quel est le meilleur délai d’escalade ?

Il n’existe pas de valeur universelle. Commencez par 24 heures après la relance, puis ajustez selon les réponses réellement observées.

### Où vérifier que les règles fonctionnent ?

Surveillez le taux de réponse, le taux de confirmation, le volume de commandes sans réponse et les envois échoués dans votre tableau de bord.

Voir aussi : [Confirmation des commandes](/docs/order-confirmation)
