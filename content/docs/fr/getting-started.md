---
title: Premiers pas
description: Configurez Akeed sur Shopify, avec une boutique WooCommerce ou EasyOrders connectée, ou de façon autonome, et envoyez votre premier message de confirmation COD.
order: 1
slug: getting-started
---

## Vue d’ensemble

**Akeed — l’infrastructure de confirmation COD pour les marchands.** Akeed vous aide à confirmer sur WhatsApp les commandes en paiement à la livraison (COD) avant de les expédier. Pour chaque commande COD éligible, Akeed envoie un message de confirmation et met à jour votre tableau de bord quand le client répond.

Akeed fonctionne de trois façons. Suivez ce guide si vous le configurez pour la première fois.

| Si vous… | Utilisez | Comment arrivent les commandes | Comment vous payez |
| --- | --- | --- | --- |
| Avez une boutique Shopify | [Parcours A : Shopify](#parcours-a-shopify) | Automatiquement depuis votre boutique. | Un forfait mensuel facturé par Shopify. |
| Avez une boutique WooCommerce ou EasyOrders | [Connecter WooCommerce](/docs/woocommerce) ou [Connecter EasyOrders](/docs/easyorders) | Automatiquement depuis votre boutique. | Des crédits, achetés via Paymob. |
| Vendez ailleurs, ou travaillez à partir d’une feuille de calcul | [Parcours B : votre propre boutique](#parcours-b-votre-propre-boutique-sans-shopify) | Vous les ajoutez une par une, importez un fichier ou les envoyez depuis votre propre serveur. | Des crédits, achetés via Paymob. |

> [!INFO]
> Akeed est conçu pour la confirmation des commandes COD. Il n’envoie pas de message de confirmation pour les commandes payées en ligne.

## Parcours A : Shopify

### Avant de commencer

Assurez-vous d’avoir :

- Un accès à l’interface administrateur de votre boutique Shopify.
- L’autorisation d’installer des applications et d’approuver des abonnements.
- Au moins une commande COD récente, ou un numéro de téléphone utilisable pour une confirmation de test.

Vous n’avez pas besoin de connecter votre propre numéro WhatsApp pour la configuration standard. Akeed envoie les messages via l’infrastructure officielle de WhatsApp.

### Étape 1 : installer Akeed

Installez Akeed depuis Shopify et ouvrez l’application depuis votre interface administrateur Shopify. Si vous ouvrez Akeed pour la première fois, vous êtes guidé tout au long de la configuration.

Pendant l’installation, Shopify peut vous demander d’approuver les autorisations de l’application. Elles permettent à Akeed de lire les détails des commandes, de repérer les commandes COD et de mettre à jour les commandes Shopify après la confirmation.

### Étape 2 : terminer la configuration de la boutique

Sur l’écran de configuration, vérifiez les paramètres de votre boutique :

| Paramètre | Ce qu’il signifie |
| --- | --- |
| Nom de la boutique | Le nom affiché dans la configuration de l’application et dans les aperçus des messages. |
| Langue de l’application | La langue utilisée dans Akeed. |
| Langue par défaut des messages | La langue qu’Akeed utilise pour les messages WhatsApp envoyés aux clients. |
| Confirmation automatique | Détermine si les nouvelles commandes COD éligibles sont confirmées automatiquement. |

Pour la plupart des boutiques, laissez la confirmation automatique activée. Akeed envoie alors automatiquement les messages de confirmation à la création d’une nouvelle commande COD.

### Étape 3 : choisir un forfait

Choisissez le forfait qui correspond à votre volume mensuel prévu de confirmations COD.

| Forfait | Confirmations incluses | Idéal pour |
| --- | ---: | --- |
| Starter | 30 | Essayer Akeed pour la première fois. |
| Basic | 300 | Les petites boutiques qui confirment régulièrement des commandes COD. |
| Pro | 1 000 | Les boutiques avec un volume COD quotidien et des besoins d’automatisation. |
| Scale | 2 500 | Les activités COD à plus fort volume. |

> [!WARNING]
> Lorsque votre limite de confirmations incluses est atteinte, les nouveaux envois WhatsApp peuvent s’arrêter jusqu’au renouvellement de votre forfait ou à un changement de forfait.

### Étape 4 : envoyer une confirmation de test

Une fois la configuration terminée, ouvrez le tableau de bord Akeed et envoyez une confirmation de test à votre propre numéro de téléphone.

Le test permet de vérifier que :

- Le message WhatsApp est bien remis.
- Les boutons de confirmation et d’annulation fonctionnent.
- Le résultat apparaît dans votre tableau de bord Akeed.

Les confirmations de test vous aident à comprendre ce que vit le client avant l’arrivée des vraies commandes.

### Étape 5 : consulter votre tableau de bord

Le tableau de bord présente l’activité de confirmation de vos commandes, notamment :

- Les commandes confirmées.
- Les commandes annulées.
- Les commandes en attente de la réponse du client.
- Les envois échoués ou bloqués.
- Les relances envoyées.
- L’utilisation actuelle du forfait.

Consultez régulièrement le tableau de bord pour que votre équipe logistique sache quelles commandes COD sont prêtes à être expédiées.

## Parcours B : votre propre boutique (sans Shopify)

Suivez ce parcours si vous n’utilisez pas Shopify. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform) pour une vue complète. Si votre boutique fonctionne avec WooCommerce ou EasyOrders, choisissez cette plateforme à l’inscription et suivez plutôt [Connecter WooCommerce](/docs/woocommerce) ou [Connecter EasyOrders](/docs/easyorders) : vos commandes arrivent alors toutes seules.

### Étape 1 : créer votre compte

Inscrivez-vous et validez votre adresse e-mail.

### Étape 2 : configurer votre boutique

Saisissez le nom de votre boutique et votre propre numéro WhatsApp. Vous n’avez pas besoin de connecter un numéro WhatsApp pour vos clients. Akeed envoie les messages depuis son numéro officiel.

### Étape 3 : essayer le message

Akeed envoie une confirmation de test gratuite à votre propre numéro. Vérifiez qu’elle arrive et que les boutons de confirmation et d’annulation fonctionnent. Vous pouvez passer cette étape.

### Étape 4 : ajouter vos commandes

- **Une commande :** utilisez **Vérifier une commande** dans le tableau de bord.
- **Plusieurs commandes :** utilisez **Importer depuis un fichier** pour charger un fichier CSV ou Excel. Consultez [Import de commandes en masse](/docs/bulk-order-import).

### Étape 5 : garder des crédits disponibles

Vous commencez avec 30 crédits gratuits. Un crédit correspond à un message WhatsApp, et une relance en coûte un de plus. Ouvrez **Facturation et crédits** pour en acheter via Paymob, par carte ou avec Vodafone Cash.

> [!WARNING]
> Quand vos crédits sont épuisés, les nouvelles confirmations s’arrêtent jusqu’à ce que vous en achetiez.

## Erreurs fréquentes

| Erreur | Comment l’éviter |
| --- | --- |
| Désactiver la confirmation automatique par mégarde | Laissez la confirmation automatique activée, sauf si vous voulez suspendre toutes les nouvelles confirmations COD. |
| Expédier avant la réponse du client | Attendez le statut « Confirmée » chaque fois que c’est possible. |
| Ignorer l’utilisation du forfait ou le solde de crédits | Surveillez votre barre d’utilisation (Shopify) ou votre solde de crédits (compte autonome) pour que les envois ne s’arrêtent pas de façon inattendue. |
| Régler des délais très longs | Gardez des délais de premier envoi et de relance adaptés à votre logistique. |

## Dépannage

### Une commande COD n’a pas été confirmée

Vérifiez que la confirmation automatique est activée et que le mode de paiement de la commande est bien le paiement à la livraison.

### Un message de test n’est pas arrivé

Assurez-vous que le numéro de téléphone est valide et comporte l’indicatif du pays. Si le problème persiste, essayez un autre numéro avant de contacter l’assistance.

### Les nouveaux envois se sont arrêtés

Sur Shopify, vérifiez l’utilisation de votre forfait. Si vos confirmations incluses sont épuisées, changez de forfait ou attendez la prochaine période de facturation. Sur un compte autonome, vérifiez votre solde de crédits et achetez-en s’il est vide.

## FAQ

### Akeed confirme-t-il toutes les commandes ?

Non. Akeed se concentre sur les commandes en paiement à la livraison. Les commandes payées en ligne ne sont pas confirmées automatiquement par ce parcours.

### Faut-il Shopify pour utiliser Akeed ?

Non. Les boutiques Shopify installent Akeed depuis Shopify. Les boutiques WooCommerce et EasyOrders se connectent en quelques étapes. Tous les autres peuvent utiliser un compte autonome. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform).

### Faut-il son propre compte WhatsApp Business ?

Pas pour la configuration standard. Akeed peut envoyer les messages de confirmation via son infrastructure WhatsApp officielle.

### Peut-on changer la langue des messages plus tard ?

Oui. Vous pouvez modifier la langue par défaut des messages dans les paramètres.

### Que faire une fois que le client a confirmé ?

Appuyez-vous sur le statut du tableau de bord pour décider si la commande est prête à être traitée. Il est plus sûr d’expédier une commande COD confirmée qu’une commande sans réponse du client.
