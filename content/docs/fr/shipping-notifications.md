---
title: Notifications d’expédition
description: Envoyez un message WhatsApp quand une commande Shopify est expédiée, puis agissez selon la réponse du client.
order: 8
slug: shipping-notifications
---

## Vue d’ensemble

Quand vous expédiez une commande en paiement à la livraison, Akeed peut envoyer un message WhatsApp au client. Le message indique que la commande est en route, inclut le numéro ou le lien de suivi si vous l’ajoutez, et propose trois boutons, **Je serai chez moi**, **Reprogrammer** et **Changer d’adresse**.

Les notifications d’expédition sont disponibles pour les boutiques Shopify.

## L’activer

1. Ouvrez **Paramètres › Expédition**.
2. Cochez **Envoyer un message quand une commande est expédiée**.
3. Dans **Quand l’envoyer**, choisissez ce qui marque une commande comme expédiée.
4. Cliquez sur **Enregistrer**.

## Quand le message est envoyé

- **Quand je traite la commande**. Akeed envoie le message quand vous traitez la commande dans Shopify.
- **Quand j’ajoute une balise**. Ajoutez jusqu’à 10 balises que vous utilisez déjà, comme `Shipped`. Akeed envoie le message quand l’une d’elles est ajoutée à la commande.

Chaque commande reçoit un seul message d’expédition, la première fois que l’un des deux arrive. Les balises d’Akeed, comme `Akeed: Verified`, ne comptent jamais.

Le message part pour les commandes en paiement à la livraison reçues par Akeed. Les commandes de test, les commandes annulées et celles de plus de 30 jours sont ignorées.

## La colonne Expédition

La liste de vos commandes affiche un mot par commande dans la colonne **Expédition**.

| Ce que vous voyez | Ce que cela veut dire |
| --- | --- |
| **Envoyé** | Le message est parti. |
| **Non distribué sur WhatsApp** | Le client n’a pas de numéro de téléphone, ou le numéro n’est pas sur WhatsApp. |
| **Échec de l’envoi** | Quelque chose a bloqué le message. Survolez le mot pour voir pourquoi. |
| **Non envoyé** | La commande a plus de 30 jours ou a été annulée. |

Ouvrez une commande pour voir pourquoi le message est parti, son suivi et la réponse du client.

## Pourquoi un message n’est pas parti

| Raison | Que faire |
| --- | --- |
| Aucun numéro de téléphone | Contactez le client autrement. |
| Le numéro n’est pas sur WhatsApp | Appelez le client. |
| Plus aucun message dans votre forfait | Choisissez un forfait plus grand, ou attendez la période suivante. |
| WhatsApp n’a pas pu le distribuer | Contactez le client directement. |
| Pas encore disponible dans cette langue | Le message dans cette langue attend l’approbation de WhatsApp. |
| Commande de plus de 30 jours | Rien à faire. |
| Commande annulée | Rien à faire. |

## Réponses du client

Quand le client appuie sur **Reprogrammer** ou **Changer d’adresse**, la commande passe dans **À traiter par vous**. Contactez le client, organisez la livraison avec votre transporteur, puis cliquez sur **Marquer comme traité**.

**Je serai chez moi** ne demande rien de votre part. Si les messages de remerciement sont activés, Akeed remercie le client pour sa réponse.

Une commande dont le message n’a pas atteint le client apparaît aussi dans **À traiter par vous**, comme **Non distribué sur WhatsApp**. Appelez le client, puis cliquez sur **Marquer comme traité**.

## Facturation

Chaque message d’expédition utilise 1 message de votre forfait, comme une confirmation. Si vous envoyez depuis votre propre numéro WhatsApp, les messages de votre numéro sont utilisés en premier. Quand votre forfait n’a plus de messages, le message d’expédition n’est pas envoyé.
