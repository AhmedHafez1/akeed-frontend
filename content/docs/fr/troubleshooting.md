---
title: Dépannage
description: Résolvez rapidement les problèmes courants de confirmation COD grâce à des vérifications claires et aux actions à mener ensuite.
order: 11
slug: troubleshooting
---

## Vue d’ensemble

Cette page vous aide à diagnostiquer et à résoudre rapidement les problèmes opérationnels les plus courants dans Akeed.

Servez-vous-en lorsque :

- des commandes ne sont pas confirmées,
- des messages sont retardés ou ne partent pas,
- trop de commandes passent en « Sans réponse »,
- l’utilisation du forfait ou un solde de crédits vide bloque les nouveaux envois,
- un import de fichier ne se comporte pas comme prévu.

## Liste de vérification rapide

Avant un dépannage approfondi, vérifiez d’abord ces points :

1. La confirmation automatique est activée.
2. La commande est éligible au COD.
3. L’utilisation du forfait n’a pas atteint la limite, ou votre solde de crédits (comptes autonomes) n’est pas vide.
4. Les heures de silence ne retardent pas les envois.
5. Le numéro de téléphone comporte l’indicatif du pays.

Ces cinq vérifications résolvent la plupart des problèmes.

## Problème : la commande n’a pas été confirmée

### Points à vérifier

- Le mode de paiement de la commande était-il le COD ?
- La confirmation automatique est-elle activée dans les paramètres ?
- La commande est-elle passée au statut « En attente » ou « Envoyé » dans le tableau de bord ?

### Que faire

1. Vérifiez que la commande est bien en COD.
2. Vérifiez que la confirmation automatique est activée.
3. Envoyez une confirmation de test à un numéro que vous savez valide.
4. Si le test fonctionne mais pas la vraie commande, examinez les données de la commande et les règles de délai.

## Problème : le message n’a pas été envoyé

### Points à vérifier

- L’utilisation actuelle du forfait (`used / limit`).
- Les envois échoués dans le tableau de bord.
- La configuration du délai d’envoi et des heures de silence.

### Que faire

1. Si l’utilisation est proche de la limite ou l’a atteinte, changez de forfait ou attendez le prochain cycle. Sur un compte autonome, achetez des crédits dans **Facturation et crédits**.
2. Si un statut d’échec apparaît, vérifiez la qualité du numéro du client.
3. En cas de retard, vérifiez les heures de silence et le fuseau horaire.

> [!WARNING]
> Une limite de forfait atteinte peut ressembler à une panne d’envoi. Vérifiez toujours l’utilisation avant un diagnostic plus poussé.

## Problème : le client dit ne pas avoir reçu le message

### Points à vérifier

- Le format du numéro de téléphone et l’indicatif du pays.
- Le statut : envoyé, remis ou en échec.
- Si le client se trouve dans une région ou une plage horaire où les réponses sont rares.

### Que faire

1. Refaites un test avec un numéro propre, que vous savez valide.
2. Revoyez la langue et le style du modèle pour ce segment de clientèle.
3. Utilisez les rappels de relance pour rattraper les premiers messages manqués.

## Problème : trop de commandes sans réponse

### Causes probables

- Le délai du premier envoi est trop long.
- La relance est désactivée.
- L’escalade est trop agressive.
- Le style ou la langue du message ne convient pas à la clientèle.

### Que faire

1. Réduisez le délai du premier envoi.
2. Activez la relance.
3. Allongez légèrement le délai d’escalade.
4. Testez un style de modèle mieux adapté.

## Problème : la confirmation automatique semble désactivée

### Points à vérifier

- L’interrupteur de confirmation automatique dans les paramètres.
- L’état de l’enregistrement (le changement a-t-il bien été enregistré ?).
- Un éventuel retour récent à l’ancienne configuration après une erreur.

### Que faire

1. Réactivez la confirmation automatique.
2. Enregistrez et vérifiez que le message de succès s’affiche.
3. Envoyez une confirmation de test pour vérifier le comportement.

## Problème : les heures de silence retardent trop les messages

### Points à vérifier

- Les heures de début et de fin des heures de silence.
- Le fuseau horaire sélectionné.
- Si la plage de silence recouvre votre principale période de commandes.

### Que faire

1. Vérifiez que le fuseau horaire correspond à votre marché.
2. Réduisez la plage de silence si nécessaire.
3. Refaites un test avec une vraie commande et observez l’heure des changements de statut.

## Problème : les commandes WooCommerce ou EasyOrders n’arrivent plus

### Points à vérifier

- Ouvrez **Paramètres**, puis votre source de commandes, et lisez l’état de la connexion.
- Sur WooCommerce, vérifiez si une notification de commande est désactivée, en pause ou supprimée.
- Sur EasyOrders, vérifiez que la boutique est active et que les commandes ne sont pas refusées.

### Que faire

1. Suivez l’étape indiquée par l’état : réactiver la notification, réinitialiser les secrets de webhook, ou déconnecter puis reconnecter la même boutique.
2. Confirmez à la main les commandes passées pendant l’interruption de la connexion. Elles ne sont pas importées par la suite.
3. Consultez [Connecter WooCommerce](/docs/woocommerce) ou [Connecter EasyOrders](/docs/easyorders) pour chaque cas.

## Problème : les commandes importées ne sont pas confirmées

### Points à vérifier

- Avez-vous appuyé sur **Envoyer** après l’aperçu ? L’import seul n’envoie rien.
- Les commandes sont-elles toujours **En attente de démarrage** ? Elles doivent être démarrées dans les 24 heures.
- L’import est-il en pause parce que les crédits sont épuisés ?
- Certaines lignes ont-elles été ignorées, car invalides, en double ou exclues ?

### Que faire

1. Ouvrez l’écran d’import et lisez la raison indiquée à côté de chaque groupe ignoré.
2. Si **Envoyer** est bloqué, achetez des crédits ou activez la confirmation automatique, puis appuyez de nouveau sur **Envoyer**.
3. Si l’import est en pause, achetez des crédits et choisissez **Reprendre**.
4. Si le délai est dépassé ou si l’import a expiré, envoyez de nouveau le fichier. Les commandes dotées d’un numéro de commande et déjà importées sont reconnues et ne sont pas dupliquées, et les commandes ressemblantes vous sont signalées pour examen.

Pour les problèmes de fichier et de colonnes, consultez le tableau de dépannage dans [Import de commandes en masse](/docs/bulk-order-import).

## Problème : difficultés de facturation ou de changement de forfait

### Points à vérifier

- L’état actuel de la facturation dans les paramètres.
- Si le changement de forfait a été approuvé dans Shopify (boutiques Shopify).
- Si votre paiement Paymob a abouti et si votre solde de crédits a été mis à jour (comptes autonomes).
- Le niveau d’utilisation par rapport à la limite incluse.

### Que faire

1. Relancez le changement de forfait si l’approbation n’a pas été finalisée.
2. Conservez le forfait actif actuel si le changement a été refusé.
3. Changez de forfait avant d’atteindre la limite stricte d’utilisation en période chargée.
4. Sur un compte autonome, si un paiement apparaît en attente, patientez un instant et consultez **Facturation et crédits** avant de payer de nouveau.

## Quand contacter l’assistance

Contactez l’assistance lorsque :

- le problème persiste après la liste de vérification et les étapes propres au problème,
- le message de test échoue lui aussi à répétition,
- l’état de la facturation semble incohérent avec l’approbation Shopify, ou un paiement Paymob n’apparaît pas dans votre solde de crédits.

Lorsque vous contactez l’assistance, indiquez :

- le nom de la boutique,
- le numéro de la commande concernée,
- une capture d’écran du statut,
- la date et l’heure du problème,
- ce que vous avez déjà essayé.

Cela raccourcit nettement le délai de résolution.

## FAQ

### Peut-on retrouver ses performances après un mauvais changement de configuration ?

Oui. Revenez aux derniers paramètres stables, puis testez de nouveau un changement à la fois.

### Faut-il désactiver l’automatisation pendant le dépannage ?

Seulement si la maîtrise du risque l’exige. Dans la plupart des cas, des corrections ciblées des paramètres suffisent.

### Quel est le contrôle de bon fonctionnement le plus rapide ?

Lancez une confirmation de test et vérifiez que :

- le message est envoyé,
- la réponse est enregistrée,
- le statut est mis à jour dans le tableau de bord.

Voir aussi : [Premiers pas](/docs/getting-started)
