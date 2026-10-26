---
title: Usar Akeed sin Shopify
description: Confirma por WhatsApp los pedidos con pago contra entrega de cualquier tienda. Conecta WooCommerce o EasyOrders, agrega pedidos manualmente o importa un archivo, y paga por el uso con créditos.
order: 2
slug: standalone-platform
---

## Resumen

**Akeed: infraestructura de confirmación de pedidos contra entrega para comerciantes.**

Akeed no es solo para Shopify. Si vendes en redes sociales, en un marketplace, en otra plataforma o desde una hoja de cálculo, puedes usar Akeed por separado. Agregas a Akeed tus pedidos con pago contra entrega (COD), Akeed confirma cada uno con el cliente por WhatsApp y tú ves el resultado en tu panel.

A esto se le llama usar Akeed de forma **independiente**. El flujo de confirmación es el mismo que en Shopify. Solo cambian la forma en que llegan los pedidos y la forma en que pagas.

> [!INFO]
> Akeed sirve para confirmar pedidos contra entrega. No envía mensajes de confirmación para pedidos que ya se pagaron en línea.

## Para quién es

- Comerciantes que venden por Instagram, Facebook, WhatsApp o mediante un centro de llamadas.
- Comerciantes que reciben pedidos de un marketplace, un sitio web o una plataforma a la que Akeed aún no se conecta.
- Equipos que llevan sus pedidos contra entrega en Excel o en Google Sheets.

## Dos formas de agregar pedidos

| Forma | Ideal para | Dónde |
| --- | --- | --- |
| Verificar un pedido | Un solo pedido o una prueba rápida. | **Verificar pedido** en el panel. |
| Importar desde un archivo | Muchos pedidos a la vez desde un archivo CSV o Excel. | **Importar desde un archivo** en la barra superior. Consulta [Importación masiva de pedidos](/docs/bulk-order-import). |

Ambas formas envían la misma confirmación por WhatsApp y usan las mismas reglas de recordatorio y de falta de respuesta. Los pedidos importados aparecen en tu lista de **Confirmaciones** junto con todos los demás.

Si tienes tu propio sitio web o sistema de pedidos, este también puede enviar los pedidos a Akeed automáticamente. Consulta [API de servidor](/docs/server-api).

## Conectar una tienda en su lugar

Si tu tienda funciona con WooCommerce o EasyOrders, no agregas los pedidos tú. Elige la plataforma al registrarte, aprueba la conexión una sola vez y cada nuevo pedido contra entrega llega solo a Akeed. Akeed también registra la respuesta del cliente en el pedido de tu tienda. Consulta [Conectar WooCommerce](/docs/woocommerce) y [Conectar EasyOrders](/docs/easyorders).

Una cuenta recibe sus pedidos de un solo origen. Una cuenta conectada a una tienda no usa **Verificar pedido**, la importación por archivo ni la API de servidor.

> [!INFO]
> Solo los propietarios y administradores pueden agregar o importar pedidos. Los usuarios de solo lectura pueden ver los pedidos y los resultados, pero no pueden cambiar nada.

## Configuración en tres pasos

1. **Crea tu cuenta.** Regístrate y confirma tu correo electrónico.
2. **Configura tu tienda.** Ingresa el nombre de tu tienda y tu propio número de WhatsApp. Akeed envía los mensajes a los clientes desde su número oficial de WhatsApp, así que no necesitas conectar un número.
3. **Prueba el mensaje.** Akeed envía una confirmación de prueba gratis a tu propio número para que veas lo que ven los clientes. Puedes omitir este paso.

Después de eso ya estás en marcha. Agrega tu primer pedido o importa un archivo.

Las cuentas independientes nuevas empiezan con estos valores predeterminados: el primer mensaje se envía de inmediato, un recordatorio sale después de 6 horas y un pedido sin respuesta se marca como **Sin respuesta** 12 horas después del recordatorio. El horario de silencio está desactivado, así que los mensajes salen a cualquier hora. Actívalo para retenerlos de 22:00 a 09:00. Puedes cambiarlos en Configuración. Consulta [Reglas de automatización](/docs/automation-rules).

## Cómo funcionan los créditos

Las cuentas independientes no usan un plan mensual. Pagas por lo que usas con **créditos**.

| Regla | Detalles |
| --- | --- |
| Un crédito | Un mensaje de WhatsApp enviado a un cliente. |
| Recordatorios | Un recordatorio a un cliente que no ha respondido usa un crédito más. |
| Envíos fallidos | Si WhatsApp no acepta un mensaje, el crédito vuelve a tu cuenta automáticamente. |
| Créditos de bienvenida | Las cuentas nuevas reciben **30 créditos gratis** una sola vez, sin tarjeta de crédito. Tu saldo se muestra en la app. |
| Precio | **EGP 2.00** por crédito al momento de escribir esta guía. Un mensaje y su recordatorio cuestan EGP 4.00 en total. |
| Sin suscripción | Solo pagas cuando compras créditos. No hay cargo mensual. |

### Comprar créditos

Abre **Facturación y créditos**, elige cuántos créditos necesitas y continúa al pago. Puedes comprar de 100 a 5,000 créditos por vez, en incrementos de 50. Por ejemplo, 500 créditos cuestan EGP 1,000. El pago lo gestiona **Paymob**, el proveedor de pagos egipcio, y puedes pagar con tarjeta o con Vodafone Cash. Los precios están en libras egipcias y pueden cambiar, así que el precio que aparece en la página de facturación es siempre el que se aplica.

Akeed nunca pide ni almacena los datos de tu tarjeta o de tu billetera. Los créditos se agregan a tu saldo después de que Paymob confirma el pago.

> [!WARNING]
> Cuando tu saldo se agota, las confirmaciones nuevas se detienen hasta que compres más créditos. Vigila tu saldo y recarga antes de enviar una importación grande.

## Qué cambia respecto a Shopify

| | Shopify | WooCommerce o EasyOrders | Independiente |
| --- | --- | --- | --- |
| Cómo llegan los pedidos | Automáticamente desde tu tienda. | Automáticamente desde tu tienda. | Los agregas tú, uno por uno, desde un archivo o desde tu servidor. |
| Dónde aparecen los resultados | En tu panel de Akeed y en tu pedido de Shopify. | En tu panel de Akeed y en el pedido de tu tienda. | En tu panel de Akeed. |
| Cómo pagas | Un plan mensual que cobra Shopify. | Créditos comprados mediante Paymob. | Créditos comprados mediante Paymob. |

En los pedidos que agregas tú, Akeed no cambia nada en otro sistema. Usa el estado de tu panel para decidir qué enviar.

## Errores comunes

| Error | Mejor opción |
| --- | --- |
| Iniciar una importación grande con poco saldo | Revisa primero tu saldo. Akeed no empieza a menos que tus créditos cubran todos los pedidos de la importación. |
| Enviar el pedido antes de que el cliente confirme | Envía primero los pedidos con estado **Confirmado**. |
| Olvidar que los recordatorios usan créditos | Calcula hasta dos créditos por pedido. |
| Esperar que se confirmen los pedidos pagados en línea | Solo se confirman los pedidos contra entrega. |

## Preguntas frecuentes

### ¿Se necesita una tienda Shopify?

No. Las cuentas independientes no necesitan Shopify ni ninguna otra plataforma.

### ¿Akeed es distinto para las tiendas Shopify?

Las tiendas Shopify instalan Akeed desde Shopify, reciben los pedidos automáticamente y usan un plan mensual que cobra Shopify. Los demás comerciantes crean una cuenta, conectan una tienda WooCommerce o EasyOrders o agregan sus propios pedidos, y usan créditos.

### ¿Se necesita una cuenta propia de WhatsApp Business?

No. Akeed envía las confirmaciones mediante su infraestructura oficial de WhatsApp.

### ¿El equipo puede compartir una cuenta?

Sí. Los propietarios y administradores pueden agregar e importar pedidos. Los usuarios de solo lectura no pueden hacer cambios.

## Guías relacionadas

- [Conectar WooCommerce](/docs/woocommerce)
- [Conectar EasyOrders](/docs/easyorders)
- [Importación masiva de pedidos](/docs/bulk-order-import)
- [API de servidor](/docs/server-api)
- [Primeros pasos](/docs/getting-started)
- [Confirmación de pedidos](/docs/order-confirmation)
- [Preguntas frecuentes generales](/docs/general-faq)
