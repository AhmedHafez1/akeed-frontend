---
title: Import de commandes en masse
description: Importez des commandes COD depuis un fichier CSV ou Excel, vérifiez-les, puis lancez la confirmation WhatsApp pour toutes à la fois.
order: 5
slug: bulk-order-import
---

## Vue d’ensemble

L’import de commandes en masse vous permet de charger dans Akeed de nombreuses commandes en paiement à la livraison (COD) depuis une feuille de calcul, au lieu de les ajouter une par une.

**CSV ou XLSX → Associer les colonnes → Prévisualiser les commandes → Importer → Démarrer la confirmation WhatsApp**

L’import n’écrit jamais à personne de lui-même. Les clients ne sont contactés que lorsque vous appuyez sur **Envoyer**, et seulement après que vous avez vu combien de messages partiront et ce qu’ils coûteront.

L’import en masse est disponible sur les comptes autonomes. Si vous utilisez Akeed sur Shopify, vos commandes arrivent déjà automatiquement. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform).

> [!INFO]
> Seuls les propriétaires et les administrateurs peuvent importer des commandes. Les lecteurs peuvent voir les commandes importées dans la liste Confirmations, mais ne peuvent ni les importer ni les modifier.

## Avant de commencer

| Exigence | Détails |
| --- | --- |
| Type de fichier | `.csv` ou `.xlsx`. Les anciens fichiers `.xls`, les fichiers avec macros et les fichiers protégés par mot de passe ne sont pas acceptés. |
| Taille | Jusqu’à 5 Mo et 100 commandes par fichier. Pour davantage de commandes, divisez le fichier et importez chaque partie. |
| Ligne d’en-tête | La première ligne doit contenir les noms des colonnes. |
| Colonnes minimales | Téléphone du client, nom du client et montant de la commande. |
| Crédits | Assez de crédits pour toutes les commandes à confirmer. Consultez [Utiliser Akeed sans Shopify](/docs/standalone-platform). |

Pas de fichier prêt ? Téléchargez le modèle d’exemple **CSV** ou **Excel** sur l’écran d’envoi, en arabe ou en anglais.

Colonnes facultatives qu’Akeed sait utiliser : numéro de commande, devise, mode de paiement, date de commande, ville, adresse et notes.

## Pas à pas

### 1. Choisir votre fichier

Sélectionnez **Importer depuis un fichier** dans la barre supérieure, puis glissez-y votre fichier ou choisissez-le sur votre appareil. Akeed lit le fichier et passe tout seul à l’étape suivante.

### 2. Associer les colonnes

Akeed associe automatiquement les noms de vos colonnes à ses propres champs, en arabe ou en anglais, sans tenir compte des majuscules ni de la ponctuation. Les colonnes associées portent la mention **Associé**. Pour les éléments marqués **À vérifier** ou **Obligatoire**, vous devez choisir la bonne colonne dans une liste. Les colonnes qu’Akeed ne parvient pas à associer ne sont pas importées.

Vérifiez aussi les paramètres d’import :

| Paramètre | Son rôle |
| --- | --- |
| Pays des numéros de téléphone | Sert à lire les numéros écrits sans indicatif de pays. |
| Devise par défaut | Utilisée pour les lignes sans devise. |
| Format de date | Demandé uniquement quand une date comme `05/06/2026` peut se lire de deux façons. |

Si votre fichier comporte une colonne de paiement, Akeed demande **Quelles commandes confirmons-nous ?** et répartit les valeurs que vous utilisez en deux groupes, **Confirmer · paiement à la livraison** et **Ignorer · payées d’avance**. Touchez une valeur pour la déplacer. Akeed se souvient de vos choix pour vos prochains fichiers.

### 3. Prévisualiser les commandes

Akeed vérifie chaque ligne et indique combien de commandes sont prêtes, et pourquoi les autres seront ignorées. Rien n’a encore été importé. Utilisez **Modifier** ou **Afficher** à côté d’une raison pour voir les lignes concernées.

| Résultat | Signification | Que faire |
| --- | --- | --- |
| Prête | Sera importée et confirmée. | Rien. |
| À corriger | Une information obligatoire est manquante ou invalide, par exemple un numéro de téléphone. | Corrigez le numéro à l’écran, ou corrigez le fichier et envoyez-le de nouveau. |
| Doublon | Déjà importée auparavant, ou répétée dans le même fichier. | Rien. Elle ne sera pas importée une seconde fois. |
| Exclue | Ignorée volontairement. Voir les raisons ci-dessous. | Laissez-la, ou incluez-la s’il s’agissait d’un doublon possible. |

Une ligne est exclue quand le paiement n’est pas un paiement à la livraison, quand la date de la commande remonte à plus de 7 jours, ou quand elle ressemble à une commande que vous avez déjà (même téléphone et même montant au cours des 7 derniers jours, ou même numéro de commande au cours des 30 derniers jours). Si vous savez qu’un doublon possible est une vraie nouvelle commande, choisissez **Inclure quand même**.

### 4. Importer et démarrer la confirmation

L’aperçu se termine par le coût et la durée : le nombre de messages, jusqu’au double si les relances sont activées, votre solde après l’envoi et la durée prévue. Appuyez sur **Envoyer à N clients**.

Akeed importe alors les commandes prêtes et démarre la confirmation. Vous pouvez suivre le statut de chaque commande dans **Confirmations**.

> [!WARNING]
> Si votre solde ne couvre pas toutes les commandes, ou si la confirmation automatique est désactivée, **Envoyer** est bloqué et rien n’est envoyé. Akeed indique combien de crédits il vous manque et affiche un bouton **Acheter des crédits**. Il n’y a pas de démarrage partiel.

## Ce qu’Akeed reconnaît

Vous n’avez pas besoin de renommer vos colonnes. Akeed reconnaît les noms courants en anglais et en arabe, y compris ceux des exports de commandes Shopify.

| Information | Exemples de noms reconnus |
| --- | --- |
| Téléphone du client | Phone, Mobile, Shipping Phone, Billing Phone, WhatsApp, رقم الهاتف, الموبايل |
| Nom du client | Customer name, Full name, Shipping Name, الاسم, اسم العميل. Les colonnes prénom et nom sont réunies. |
| Montant | Amount, Total, Price, COD Amount, الإجمالي, المبلغ |
| Numéro de commande | Order ID, Order Number, Name (lorsqu’elle contient des valeurs comme `#1001`), رقم الطلب |
| Devise | Currency, العملة |
| Mode de paiement | Payment Method, Payment, Financial Status, طريقة الدفع |
| Date de commande | Order Date, Created at, التاريخ |
| Ville et adresse | City, Governorate, Shipping City, Address, Shipping Street, المدينة, العنوان |

Les colonnes d’e-mail et de produit (lignes d’articles) ne sont pas importées. Les exports Shopify comportent une ligne par produit. Les lignes ayant le même numéro de commande, le même téléphone et le même montant sont regroupées en une seule commande.

### Numéros de téléphone

- Si un fichier comporte plusieurs colonnes de téléphone, Akeed utilise d’abord le **téléphone de livraison**, puis le **téléphone**, puis le **téléphone de facturation**. Vous pouvez choisir une autre colonne.
- Les numéros sont convertis au format international. Un numéro qui commence par `+` ou `00` conserve son propre pays. Les autres numéros utilisent votre **Pays des numéros de téléphone**, qui est par défaut le pays de votre boutique ou l’Égypte.
- Les numéros égyptiens qui ont perdu leur zéro initial dans Excel sont réparés.
- Les lignes fixes, les cellules contenant deux numéros et les numéros qu’Excel a convertis en notation scientifique (comme `2.01E+11`) sont rejetés, car WhatsApp a besoin d’un seul numéro de mobile valide. Mettez la colonne de téléphone au format texte, ou corrigez le numéro sur l’écran d’aperçu.

### Devise et montants

- La devise provient de la colonne de devise de la ligne. S’il n’y en a pas, Akeed lit aussi un code ou un symbole écrit dans le montant (comme `EGP 750` ou `750 ج.م`). S’il manque également, il utilise votre devise par défaut.
- Devises prises en charge : EGP, SAR, AED, QAR, KWD, BHD, OMR, JOD, MAD, USD et EUR.
- Les montants doivent être supérieurs à zéro, avec deux décimales au maximum. Les chiffres arabes sont compris. Si une virgule peut désigner les milliers ou les décimales, Akeed vous demande de corriger la ligne au lieu de deviner.

## Association de colonnes enregistrée

Quand vous passez l’étape des colonnes, Akeed enregistre votre association. La prochaine fois que vous envoyez un fichier avec les mêmes noms de colonnes, dans n’importe quel ordre, elle est appliquée automatiquement. Vous pouvez toujours la vérifier et la modifier. Vos choix de paiement à la livraison pour les valeurs de paiement sont mémorisés eux aussi.

## Commandes en attente et sécurité

Après l’import, et avant le démarrage de la confirmation, les commandes sont **mises en attente** et affichées comme **En attente de démarrage** dans la liste Confirmations. Une commande en attente n’a reçu aucun message.

En temps normal, vous ne voyez jamais cet état, car **Envoyer** importe et démarre en une seule action. Vous ne le voyez que si le démarrage est bloqué après l’import, par exemple si votre solde a changé. Dans ce cas, les commandes attendent, et vous pouvez les démarrer depuis l’écran d’import.

| Règle | Détails |
| --- | --- |
| Démarrage | Le démarrage envoie à toutes les commandes en attente de cet import. Pour écarter une commande, retirez-la du fichier et envoyez-le de nouveau avant l’envoi. |
| Délai de démarrage | Les commandes en attente doivent être démarrées dans les 24 heures. Sinon, elles sont retirées sans frais, et vous pouvez envoyer de nouveau le fichier. |
| Rythme | Akeed envoie progressivement, environ 20 premiers messages par minute, pour préserver la qualité de votre WhatsApp. |
| Heures de silence | Si vous avez défini des heures de silence dans les paramètres, l’envoi s’interrompt pendant celles-ci et reprend ensuite. |
| Crédits épuisés | Si les crédits s’épuisent pendant l’envoi, l’import se met en pause. Achetez des crédits et choisissez **Reprendre**. |

## Le même fichier deux fois : sûr par conception

- Une commande dotée d’un numéro de commande est importée **une seule fois**, même si vous envoyez de nouveau le même fichier ou appuyez deux fois sur Importer.
- Si vous envoyez de nouveau le même fichier dans les 24 heures, Akeed vous avertit et vous laisse continuer ou consulter l’import précédent.
- Les commandes sans numéro de commande reçoivent une référence d’Akeed. Si leur téléphone et leur montant correspondent à une commande récente, elles sont signalées comme doublons possibles et écartées, sauf si vous les incluez.

## Les commandes importées dans la liste Confirmations

Les commandes importées se trouvent dans la même liste **Confirmations** que toutes les autres et fonctionnent de la même façon : statut, relance, traitement des absences de réponse, nouvelle tentative et annulation, et utilisation des crédits. Les statuts antérieurs au premier message sont **En attente de démarrage**, **En file d’attente** et **Envoi en cours**.

## Confidentialité et conservation

- Votre fichier lui-même n’est jamais stocké. Akeed ne conserve que son nom, sa taille et une empreinte.
- Un import que vous n’avez pas envoyé expire au bout de 24 heures et ses lignes sont supprimées.
- Le détail des lignes des imports envoyés est supprimé au bout de 90 jours. Les décomptes et le lien vers chaque commande sont conservés.
- Les numéros de téléphone et les noms ne sont pas écrits dans les journaux d’Akeed.
- Vous pouvez avoir quelques imports en cours à la fois, et les envois de fichiers sont limités à quelques-uns par minute.

## Dépannage

| Ce que vous voyez | Que faire |
| --- | --- |
| Ce type de fichier n’est pas pris en charge | Enregistrez au format Classeur Excel (`.xlsx`) ou CSV UTF-8, sans macros ni mot de passe. |
| Ce fichier contient trop de commandes | Divisez-le en fichiers de 100 commandes au maximum. |
| Nous avons besoin de votre aide pour une colonne | Choisissez la bonne colonne pour le téléphone, le nom ou le montant à l’étape des colonnes. |
| Excel a transformé ce téléphone en un nombre du type 2.01E+11 | Mettez la colonne de téléphone au format texte et exportez de nouveau le fichier. |
| C’est une ligne fixe | Remplacez-la par le numéro de mobile du client. |
| Pas un paiement à la livraison : elle ne sera pas confirmée | Vérifiez la valeur de paiement. S’il s’agit bien de COD, déplacez-la vers **Confirmer · paiement à la livraison** à l’étape des colonnes. |
| La commande date de plus de 7 jours | Il est trop tard pour confirmer des commandes aussi anciennes. Pour ignorer les contrôles de date, réglez la date de commande sur **Absent du fichier** à l’étape des colonnes. |
| Achetez des crédits pour démarrer | Achetez des crédits pour que votre solde couvre toutes les commandes, puis appuyez de nouveau sur **Envoyer**. |
| La confirmation automatique est désactivée | Activez-la dans les paramètres, puis envoyez. |
| Cet import a expiré | Envoyez de nouveau le fichier. |
| L’import n’est pas disponible pour cette boutique | L’import en masse est réservé aux comptes autonomes. Les boutiques Shopify reçoivent leurs commandes automatiquement. |

## FAQ

### L’import envoie-t-il des messages ?

Non. Les messages ne partent qu’après que vous avez appuyé sur **Envoyer**, et Akeed affiche d’abord le coût.

### Peut-on importer plus de 100 commandes ?

Pas dans un seul fichier. Divisez le fichier en parties de 100 commandes au maximum et importez chaque partie.

### Peut-on choisir les commandes à confirmer après l’import ?

Le démarrage s’applique à l’import entier. Retirez du fichier les commandes que vous ne voulez pas avant d’appuyer sur **Envoyer**.

### Que se passe-t-il pour les clients qui ne répondent pas ?

La même chose que pour toute autre commande : une relance, puis **Sans réponse**. Consultez [Règles d’automatisation](/docs/automation-rules).

### Combien de crédits un import utilise-t-il ?

Un crédit par message. Un fichier de 80 commandes prêtes utilise 80 crédits (160 EGP à 2,00 EGP le crédit), ou jusqu’à 160 crédits si les relances sont activées et que les clients ne répondent pas.

### Peut-on télécharger un rapport des lignes ignorées ?

Pas encore. L’écran d’aperçu indique la raison pour chaque ligne ignorée.

## Guides associés

- [Utiliser Akeed sans Shopify](/docs/standalone-platform)
- [Confirmation des commandes](/docs/order-confirmation)
- [Règles d’automatisation](/docs/automation-rules)
- [Dépannage](/docs/troubleshooting)
