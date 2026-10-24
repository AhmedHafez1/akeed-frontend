---
title: Utiliser Akeed sans Shopify
description: Confirmez sur WhatsApp les commandes en paiement à la livraison de n’importe quelle boutique. Connectez WooCommerce ou EasyOrders, ajoutez des commandes à la main ou importez un fichier, et payez votre consommation avec des crédits.
order: 2
slug: standalone-platform
---

## Vue d’ensemble

**Akeed — l’infrastructure de confirmation COD pour les marchands.**

Akeed n’est pas réservé à Shopify. Si vous vendez sur les réseaux sociaux, sur une place de marché, sur une autre plateforme ou à partir d’une feuille de calcul, vous pouvez utiliser Akeed de façon autonome. Vous ajoutez vos commandes en paiement à la livraison (COD) dans Akeed, Akeed confirme chacune d’elles auprès du client sur WhatsApp, et vous voyez le résultat dans votre tableau de bord.

C’est ce qu’on appelle l’utilisation **autonome** d’Akeed. Le parcours de confirmation est le même que sur Shopify. Seules changent la façon dont les commandes arrivent et la façon dont vous payez.

> [!INFO]
> Akeed sert à confirmer les commandes COD. Il n’envoie pas de message de confirmation pour les commandes déjà payées en ligne.

## À qui s’adresse-t-il

- Aux marchands qui vendent sur Instagram, Facebook, WhatsApp ou via un centre d’appels.
- Aux marchands qui reçoivent des commandes d’une place de marché, d’un site web ou d’une plateforme à laquelle Akeed ne se connecte pas encore.
- Aux équipes qui tiennent leurs commandes COD dans Excel ou Google Sheets.

## Deux façons d’ajouter des commandes

| Façon | Idéale pour | Où |
| --- | --- | --- |
| Vérifier une commande | Une seule commande, ou un test rapide. | **Vérifier une commande** dans le tableau de bord. |
| Importer depuis un fichier | Plusieurs commandes à la fois depuis un fichier CSV ou Excel. | **Importer depuis un fichier** dans la barre supérieure. Consultez [Import de commandes en masse](/docs/bulk-order-import). |

Les deux façons envoient la même confirmation WhatsApp et appliquent les mêmes règles de relance et d’absence de réponse. Les commandes importées apparaissent dans votre liste **Confirmations** avec toutes les autres.

Si vous avez votre propre site web ou système de commandes, il peut aussi envoyer les commandes à Akeed automatiquement. Consultez [API serveur](/docs/server-api).

## Connecter plutôt une boutique

Si votre boutique fonctionne avec WooCommerce ou EasyOrders, vous n’ajoutez pas les commandes vous-même. Choisissez la plateforme à l’inscription, approuvez la connexion une seule fois, et chaque nouvelle commande COD arrive toute seule dans Akeed. Akeed enregistre aussi la réponse du client sur la commande dans votre boutique. Consultez [Connecter WooCommerce](/docs/woocommerce) et [Connecter EasyOrders](/docs/easyorders).

Un compte reçoit ses commandes d’une seule source. Un compte connecté à une boutique n’utilise ni **Vérifier une commande**, ni l’import de fichier, ni l’API serveur.

> [!INFO]
> Seuls les propriétaires et les administrateurs peuvent ajouter ou importer des commandes. Les lecteurs peuvent voir les commandes et les résultats, mais ne peuvent rien modifier.

## Configuration en trois étapes

1. **Créez votre compte.** Inscrivez-vous et validez votre adresse e-mail.
2. **Configurez votre boutique.** Saisissez le nom de votre boutique et votre propre numéro WhatsApp. Akeed écrit aux clients depuis son numéro WhatsApp officiel : vous n’avez donc pas besoin de connecter un numéro.
3. **Essayez le message.** Akeed envoie une confirmation de test gratuite à votre propre numéro pour que vous voyiez ce que voient les clients. Vous pouvez passer cette étape.

Vous êtes alors en service. Ajoutez votre première commande ou importez un fichier.

Les nouveaux comptes autonomes démarrent avec ces réglages par défaut : le premier message part immédiatement, une relance part au bout de 6 heures, et une commande sans réponse est marquée **Sans réponse** 24 heures après la relance. Les heures de silence sont activées de 22:00 à 09:00, donc rien n’est envoyé la nuit. Vous pouvez les modifier dans les paramètres. Consultez [Règles d’automatisation](/docs/automation-rules).

## Fonctionnement des crédits

Les comptes autonomes n’ont pas de forfait mensuel. Vous payez ce que vous consommez avec des **crédits**.

| Règle | Détails |
| --- | --- |
| Un crédit | Un message WhatsApp envoyé à un client. |
| Relances | Un rappel à un client qui n’a pas répondu utilise un crédit de plus. |
| Envois échoués | Si WhatsApp n’accepte pas un message, le crédit revient automatiquement sur votre compte. |
| Crédits de bienvenue | Les nouveaux comptes reçoivent **30 crédits gratuits** une seule fois, sans carte bancaire. Votre solde est affiché dans l’application. |
| Prix | **2,00 EGP** par crédit au moment de la rédaction. Un message et sa relance coûtent 4,00 EGP au total. |
| Pas d’abonnement | Vous ne payez que lorsque vous achetez des crédits. Il n’y a aucun prélèvement mensuel. |

### Acheter des crédits

Ouvrez **Facturation et crédits**, choisissez le nombre de crédits dont vous avez besoin, puis passez au paiement. Vous pouvez acheter de 100 à 5 000 crédits à la fois, par paliers de 50. Par exemple, 500 crédits coûtent 1 000 EGP. Le paiement est assuré par **Paymob**, prestataire de paiement égyptien, et vous pouvez payer par carte ou avec Vodafone Cash. Les prix sont en livres égyptiennes et peuvent changer : le prix affiché sur la page de facturation est toujours celui qui s’applique.

Akeed ne demande ni ne conserve jamais les données de votre carte ou de votre portefeuille électronique. Les crédits sont ajoutés à votre solde dès que Paymob confirme le paiement.

> [!WARNING]
> Quand votre solde est épuisé, les nouvelles confirmations s’arrêtent jusqu’à ce que vous achetiez des crédits. Surveillez votre solde, et rechargez avant de lancer un gros import.

## Ce qui diffère de Shopify

| | Shopify | WooCommerce ou EasyOrders | Autonome |
| --- | --- | --- | --- |
| Comment arrivent les commandes | Automatiquement depuis votre boutique. | Automatiquement depuis votre boutique. | Vous les ajoutez, une par une, depuis un fichier ou depuis votre serveur. |
| Où apparaissent les résultats | Dans votre tableau de bord Akeed et sur votre commande Shopify. | Dans votre tableau de bord Akeed et sur la commande dans votre boutique. | Dans votre tableau de bord Akeed. |
| Comment vous payez | Un forfait mensuel facturé par Shopify. | Des crédits achetés via Paymob. | Des crédits achetés via Paymob. |

Pour les commandes que vous ajoutez vous-même, Akeed ne modifie rien dans un autre système. Fiez-vous au statut de votre tableau de bord pour décider quoi expédier.

## Erreurs fréquentes

| Erreur | Meilleure approche |
| --- | --- |
| Lancer un gros import avec un solde bas | Vérifiez d’abord votre solde. Akeed ne démarre pas si vos crédits ne couvrent pas toutes les commandes de l’import. |
| Expédier avant la confirmation du client | Expédiez d’abord les commandes au statut **Confirmée**. |
| Oublier que les relances utilisent des crédits | Prévoyez jusqu’à deux crédits par commande. |
| S’attendre à ce que les commandes payées en ligne soient confirmées | Seules les commandes COD sont confirmées. |

## FAQ

### Faut-il une boutique Shopify ?

Non. Les comptes autonomes n’ont besoin ni de Shopify ni d’aucune autre plateforme.

### Akeed est-il différent pour les boutiques Shopify ?

Les boutiques Shopify installent Akeed depuis Shopify, reçoivent les commandes automatiquement et utilisent un forfait mensuel facturé par Shopify. Les autres marchands créent un compte, connectent une boutique WooCommerce ou EasyOrders ou ajoutent leurs propres commandes, et utilisent des crédits.

### Faut-il son propre compte WhatsApp Business ?

Non. Akeed envoie les confirmations via son infrastructure WhatsApp officielle.

### Mon équipe peut-elle partager un compte ?

Oui. Les propriétaires et les administrateurs peuvent ajouter et importer des commandes. Les lecteurs ont un accès en lecture seule.

## Guides associés

- [Connecter WooCommerce](/docs/woocommerce)
- [Connecter EasyOrders](/docs/easyorders)
- [Import de commandes en masse](/docs/bulk-order-import)
- [API serveur](/docs/server-api)
- [Premiers pas](/docs/getting-started)
- [Confirmation des commandes](/docs/order-confirmation)
- [FAQ générale](/docs/general-faq)
