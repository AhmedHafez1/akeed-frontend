---
title: Connecter EasyOrders
description: Connectez votre boutique EasyOrders pour qu’Akeed confirme sur WhatsApp les nouvelles commandes en paiement à la livraison et mette à jour le statut de la commande selon la réponse du client.
order: 4
slug: easyorders
---

## Vue d’ensemble

Connectez votre boutique EasyOrders une seule fois, et Akeed reçoit tout seul chaque nouvelle commande en paiement à la livraison (COD). Il confirme la commande auprès du client sur WhatsApp et met à jour son statut dans EasyOrders.

Vous ne copiez aucune clé. Vous approuvez la connexion dans EasyOrders.

> [!INFO]
> Akeed ne confirme que les commandes COD. Les commandes ayant un autre mode de paiement sont reçues, puis ignorées.

## Avant de commencer

- Vous êtes propriétaire ou administrateur de votre compte Akeed.
- Votre boutique EasyOrders est active.
- Votre compte Akeed n’a pas déjà une autre source de commandes. Un compte reçoit ses commandes d’une seule source.

## Connecter votre boutique

1. **Choisissez EasyOrders à l’inscription.** Vous arrivez sur l’écran de connexion après avoir validé votre adresse e-mail.
2. **Choisissez Connecter EasyOrders.** EasyOrders s’ouvre dans un nouvel onglet. Connectez-vous à la boutique à connecter, puis choisissez **Accept**.
3. **Revenez dans Akeed.** La page se met à jour toute seule quand la connexion est prête.
4. **Choisissez le pays et la devise de votre boutique.** EasyOrders envoie les montants des commandes sans devise et les numéros de téléphone sans indicatif de pays : Akeed a besoin des deux pour écrire correctement à vos clients.
5. **Envoyez le message de test gratuit.** Akeed envoie une confirmation de test à votre propre numéro WhatsApp. Votre boutique est alors configurée.

Akeed ne demande que deux autorisations à EasyOrders :

- lire vos nouvelles commandes,
- mettre à jour le statut d’une commande quand votre client confirme ou annule.

Les messages parviennent à vos clients depuis le numéro WhatsApp d’Akeed. Vous n’avez pas besoin de votre propre numéro WhatsApp.

> [!WARNING]
> Les commandes ne sont pas confirmées tant que vous n’avez pas choisi à la fois le pays des numéros des clients et la devise de la boutique.

## Ce qu’Akeed écrit dans votre boutique

| Ce qui se passe | Dans EasyOrders |
| --- | --- |
| Le client confirme | Le statut de la commande passe à **confirmed**. |
| Le client annule | Le statut de la commande passe à **canceled**. |
| Vous annulez depuis Akeed une commande sans réponse | Le statut de la commande passe à **canceled**. |
| Le client ne répond pas | Rien. La commande est marquée **Sans réponse** dans Akeed uniquement. |

Akeed n’annule jamais de lui-même une commande dans EasyOrders. Il ne met aussi à jour qu’une commande encore en attente : si vous avez déjà modifié le statut de la commande, Akeed n’y touche pas.

## Garder la connexion en bon état

Ouvrez **Paramètres**, puis votre source de commandes, pour voir la connexion.

| Ce que vous voyez | Ce que cela signifie | Que faire |
| --- | --- | --- |
| Votre boutique EasyOrders n’est pas active | EasyOrders signale la boutique comme inactive ou en retard de paiement. Les commandes n’arrivent pas dans Akeed. | Réactivez la boutique dans EasyOrders. |
| EasyOrders n’accepte plus l’accès d’Akeed | La clé API a été supprimée dans EasyOrders. | Déconnectez, puis reconnectez la même boutique. |
| Des commandes ont été refusées, car leur secret de webhook ne correspondait pas | Les webhooks Akeed ont été supprimés puis recréés dans EasyOrders. | Ouvrez **Corrigez les secrets de webhook** et choisissez **Réinitialiser et réapprendre**. |

Akeed sécurise les deux webhooks tout seul : il vérifie votre première commande auprès d’EasyOrders, puis conserve le secret qu’EasyOrders envoie avec elle. Vous n’avez rien à copier.

Conservez dans EasyOrders exactement un webhook de commandes et un webhook de statut des commandes nommés **Akeed**. Si une adresse apparaît deux fois, supprimez celle en trop.

> [!WARNING]
> Les commandes passées pendant que la boutique était déconnectée ou inactive ne sont pas envoyées à Akeed par la suite. Confirmez-les vous-même.

## Déconnecter et reconnecter

Choisissez **Déconnecter EasyOrders** dans les paramètres. Akeed ne reçoit plus les commandes de la boutique, n’envoie plus de messages pour elles et ne met plus à jour leur statut. Vos commandes précédentes, vos résultats et votre historique d’utilisation sont conservés.

Akeed demande à EasyOrders de supprimer les webhooks qu’il a créés. La clé API reste dans EasyOrders jusqu’à ce que vous la supprimiez :

1. Dans EasyOrders, ouvrez Settings > Public API.
2. Supprimez la clé API nommée **Akeed**.
3. Si Akeed vous indique que les webhooks n’ont pas été supprimés, supprimez tous les webhooks nommés **Akeed** sous Webhooks.

Vous pouvez reconnecter la même boutique à tout moment en approuvant de nouveau dans EasyOrders. Une autre boutique ne peut pas être connectée au même compte. Contactez l’assistance Akeed si vous en avez besoin.

## Erreurs fréquentes

| Erreur | Meilleure approche |
| --- | --- |
| Passer l’étape du pays et de la devise | Choisissez les deux. Sans eux, les commandes ne sont pas confirmées. |
| Se connecter à une autre boutique EasyOrders lors de la reconnexion | Connectez-vous à la boutique qui était connectée auparavant. |
| Supprimer les webhooks Akeed dans EasyOrders pour les « rafraîchir » | Laissez-les. S’ils ont été recréés, réinitialisez les secrets de webhook dans Akeed. |
| S’attendre à ce que les commandes manquées arrivent après une correction | Elles ne sont pas importées. Confirmez-les à la main. |

## Dépannage

### EasyOrders n’a pas été connecté

La demande n’a pas été acceptée, ou elle a expiré. Recommencez. Si vous avez choisi Accept et que la connexion a tout de même échoué, EasyOrders a peut-être créé une clé API et des webhooks nommés Akeed : supprimez-les sous Settings > Public API avant de réessayer.

### Cette boutique est déjà connectée à un autre compte Akeed

Une boutique se connecte à un seul compte Akeed. Contactez l’assistance Akeed.

### Les commandes n’arrivent plus

Vérifiez que la boutique est active dans EasyOrders, et ouvrez votre source de commandes dans les paramètres pour voir si des commandes sont refusées.

### Une commande n’a pas été confirmée

Vérifiez que son mode de paiement est le paiement à la livraison, que le numéro de téléphone du client est valide pour le pays que vous avez choisi, et que le montant de la commande est supérieur à zéro.

## FAQ

### Faut-il son propre numéro WhatsApp Business ?

Non. Les messages partent du numéro WhatsApp d’Akeed.

### Akeed importe-t-il les anciennes commandes ?

Non. Akeed confirme les commandes passées après la connexion de la boutique.

### Peut-on modifier le pays ou la devise plus tard ?

Oui, depuis votre source de commandes dans les paramètres.

### Comment paie-t-on ?

Avec des crédits, comme tout compte qui n’utilise pas Shopify. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform#fonctionnement-des-crédits).

## Guides associés

- [Premiers pas](/docs/getting-started)
- [Confirmation des commandes](/docs/order-confirmation)
- [Règles d’automatisation](/docs/automation-rules)
- [Dépannage](/docs/troubleshooting)
