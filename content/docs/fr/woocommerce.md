---
title: Connecter WooCommerce
description: Connectez votre boutique WooCommerce pour qu’Akeed confirme sur WhatsApp les nouvelles commandes en paiement à la livraison et enregistre la réponse du client sur la commande.
order: 3
slug: woocommerce
---

## Vue d’ensemble

Connectez votre boutique WooCommerce une seule fois, et Akeed reçoit tout seul chaque nouvelle commande en paiement à la livraison (COD). Il confirme la commande auprès du client sur WhatsApp et enregistre la réponse sur la commande dans votre boutique.

Vous n’installez aucune extension WordPress et vous ne copiez aucune clé. Vous approuvez la connexion dans votre propre boutique.

> [!INFO]
> Akeed ne confirme que les commandes COD. Les commandes payées en ligne sont reçues, puis ignorées.

## Avant de commencer

Votre boutique doit réunir toutes les conditions suivantes :

- Une adresse qui commence par `https://` et s’ouvre sur l’Internet public.
- Des permaliens réglés sur une option autre que **Plain** (WordPress > Settings > Permalinks).
- Le mode de paiement standard **Cash on delivery** de WooCommerce.
- Un utilisateur WordPress administrateur ou gestionnaire de boutique, pour approuver la connexion.

Vous devez aussi être propriétaire ou administrateur de votre compte Akeed. Un compte Akeed reçoit ses commandes d’une seule source : le compte ne doit donc pas en avoir déjà une autre. Les menus et libellés de WordPress sont cités ici en anglais ; ils apparaissent traduits si votre WordPress est en français.

> [!WARNING]
> Akeed ne peut pas garantir son fonctionnement avec toutes les configurations d’hébergement et toutes les extensions. Un mode de paiement sur mesure, un statut de commande sur mesure ou une extension qui modifie l’envoi des commandes peut faire ignorer des commandes.

## Connecter votre boutique

1. **Choisissez WooCommerce à l’inscription.** Vous arrivez sur l’écran de connexion après avoir validé votre adresse e-mail.
2. **Saisissez l’adresse de votre boutique.** Utilisez l’adresse que consultent vos clients, par exemple `https://example.com`. Akeed vérifie qu’il peut joindre la boutique.
3. **Approuvez dans votre boutique.** Votre boutique s’ouvre dans le même onglet. Connectez-vous en tant qu’administrateur ou gestionnaire de boutique, puis choisissez **Approve**. Votre boutique vous demande d’accorder à Akeed un accès en lecture et en écriture.
4. **Attendez la fin de la connexion.** Vous revenez dans Akeed, et la page se met à jour toute seule.
5. **Envoyez le message de test gratuit.** Akeed envoie une confirmation de test à votre propre numéro WhatsApp pour que vous voyiez ce que voient les clients. Votre boutique est alors configurée.

Akeed ne se sert de cet accès que pour :

- recevoir vos nouvelles commandes,
- créer dans votre boutique les deux notifications de commande dont il a besoin,
- enregistrer la réponse de votre client sur la commande.

Les messages parviennent à vos clients depuis le numéro WhatsApp d’Akeed. Vous n’avez pas besoin de votre propre numéro WhatsApp.

## Ce qu’Akeed écrit dans votre boutique

| Ce qui se passe | Dans votre commande WooCommerce |
| --- | --- |
| Le client confirme | Akeed ajoute une note de commande privée. Le statut de la commande ne change pas. |
| Le client annule | Le statut de la commande passe à **Cancelled**. |
| Vous annulez depuis Akeed une commande sans réponse | Le statut de la commande passe à **Cancelled**. |
| Le client ne répond pas | Rien. La commande est marquée **Sans réponse** dans Akeed uniquement. |

Akeed n’annule jamais de lui-même une commande dans WooCommerce. Quand un client ne répond pas, c’est vous qui décidez de la suite.

Quand une commande est annulée, WooCommerce fait ce qu’il fait toujours pour une commande annulée, par exemple remettre le stock à disposition et envoyer son e-mail d’annulation.

Akeed n’écrit que sur une commande encore au statut **Processing** ou **On hold**. Si vous avez déjà terminé, remboursé ou modifié la commande, Akeed n’y touche pas.

## Garder la connexion en bon état

Ouvrez **Paramètres**, puis votre source de commandes, pour voir la connexion :

| Ce que vous voyez | Ce que cela signifie | Que faire |
| --- | --- | --- |
| Les notifications de commande sont à l’état **Active** | Votre boutique envoie les nouvelles commandes à Akeed. | Rien. |
| **Désactivée par votre boutique** | WooCommerce désactive une notification après plusieurs échecs d’envoi consécutifs. Les nouvelles commandes n’arrivent pas dans Akeed. | Choisissez **Réactiver les notifications de commande**. |
| **En pause dans votre boutique** | Quelqu’un a mis la notification en pause dans WooCommerce. | Activez-la dans WordPress, sous WooCommerce > Settings > Advanced > Webhooks. |
| **Supprimée de votre boutique** | La notification a été supprimée dans WooCommerce. | Déconnectez, puis reconnectez la même boutique. |
| Votre boutique n’accepte plus l’accès d’Akeed | La clé API a été révoquée, ou l’utilisateur WordPress ne peut plus gérer WooCommerce. | Déconnectez, puis reconnectez la même boutique. |

**Vérifier la connexion** demande à votre boutique si tout fonctionne encore et liste ce qui demande votre attention.

> [!WARNING]
> Les commandes passées pendant qu’une notification était désactivée, ou pendant que la boutique était déconnectée, ne sont pas envoyées à Akeed par la suite. Confirmez-les vous-même.

## Déconnecter et reconnecter

Choisissez **Déconnecter WooCommerce** dans les paramètres. Akeed ne reçoit plus les commandes de la boutique, n’envoie plus de messages pour elles et ne les met plus à jour. Vos commandes précédentes, vos résultats et votre historique d’utilisation sont conservés.

Akeed demande à votre boutique de supprimer ses deux notifications de commande. Il vous reste une chose à faire, car Akeed ne peut pas révoquer lui-même sa clé dans votre boutique :

1. Dans WordPress, ouvrez WooCommerce > Settings > Advanced > REST API.
2. Repérez la clé nommée **Akeed** et choisissez **Revoke**.
3. Si Akeed vous indique que les notifications n’ont pas été supprimées, ouvrez WooCommerce > Settings > Advanced > Webhooks et supprimez tout webhook dont le nom commence par **Akeed**.

Vous pouvez reconnecter la même boutique à tout moment en approuvant de nouveau. Une autre boutique, ou la même boutique à une autre adresse, ne peut pas être connectée au même compte. Contactez l’assistance Akeed si vous en avez besoin.

## Erreurs fréquentes

| Erreur | Meilleure approche |
| --- | --- |
| Saisir une adresse qui redirige | Saisissez l’adresse finale, avec ou sans `www`, exactement telle qu’elle apparaît dans le navigateur. |
| Approuver avec un utilisateur qui ne peut pas gérer WooCommerce | Connectez-vous en tant qu’administrateur ou gestionnaire de boutique. |
| Modifier les webhooks Akeed dans WooCommerce | Laissez-les tels quels. Si l’un d’eux a été modifié, déconnectez puis reconnectez. |
| S’attendre à ce que les commandes manquées arrivent après une correction | Elles ne sont pas importées. Confirmez-les à la main. |

## Dépannage

### Akeed n’a pas trouvé l’API REST de WooCommerce

Dans WordPress, ouvrez Settings > Permalinks, choisissez n’importe quelle option autre que **Plain**, puis vérifiez que WooCommerce est actif et à jour.

### Ma boutique n’a pas accepté la clé API

Certains hébergements suppriment l’en-tête `Authorization` avant qu’il n’atteigne WordPress. Demandez à votre hébergeur de l’autoriser. Supprimez ensuite la clé inutilisée sous WooCommerce > Settings > Advanced > REST API, puis reconnectez.

### Ma boutique indique une adresse différente

Saisissez l’adresse exactement telle qu’elle est définie dans WordPress. Si votre boutique a changé d’adresse après la connexion, contactez l’assistance Akeed.

### Les commandes n’arrivent plus

Ouvrez les paramètres et regardez les notifications de commande. Si l’une d’elles est désactivée, réactivez-la. Si la vérification détecte un problème lié à votre hébergement, à votre certificat ou à votre domaine, votre hébergeur peut le corriger.

### Une commande n’a pas été confirmée

Vérifiez que son mode de paiement est le paiement à la livraison, qu’il s’agit d’une nouvelle commande passée après la connexion, et que le numéro de téléphone du client est valide.

## FAQ

### Faut-il une extension WordPress ?

Non. Akeed se connecte par l’écran d’approbation de WooCommerce lui-même.

### Faut-il son propre numéro WhatsApp Business ?

Non. Les messages partent du numéro WhatsApp d’Akeed.

### Akeed importe-t-il les anciennes commandes ?

Non. Akeed confirme les commandes passées après la connexion de la boutique.

### Comment paie-t-on ?

Avec des crédits, comme tout compte qui n’utilise pas Shopify. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform#fonctionnement-des-crédits).

### Peut-on connecter deux boutiques à un seul compte ?

Non. Un compte a une seule source de commandes.

## Guides associés

- [Premiers pas](/docs/getting-started)
- [Confirmation des commandes](/docs/order-confirmation)
- [Règles d’automatisation](/docs/automation-rules)
- [Dépannage](/docs/troubleshooting)
