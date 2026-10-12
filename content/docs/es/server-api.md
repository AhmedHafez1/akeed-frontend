---
title: Conectar tu servidor con Akeed (Server API)
description: Envía automáticamente a Akeed los pedidos con pago contra entrega de tu sitio web o de tu sistema con una sola solicitud HTTPS.
order: 6
slug: server-api
---

## Resumen

La Server API permite que tu sistema envíe los pedidos a Akeed en cuanto se crean, en lugar de agregarlos manualmente o importarlos desde un archivo. Esta página está dirigida al dueño de la tienda. El desarrollador que hará la integración necesita la guía completa, que está en inglés.

**Tu servidor → una solicitud a Akeed → mensaje de confirmación por WhatsApp → resultado en el panel**

[Abrir la guía completa para desarrolladores (en inglés)](/en/docs/server-api)

> [!INFO]
> La API está disponible para las cuentas independientes. Las tiendas Shopify no la necesitan porque sus pedidos llegan automáticamente. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform).

## Para quién es esta API

- Una tienda con sitio web propio o sistema de pedidos propio.
- Una empresa de mensajería o un sistema interno que recibe pedidos y quiere confirmarlos antes del envío.
- Cualquier sistema que pueda enviar una solicitud HTTPS desde un servidor.

Si no cuentas con un desarrollador, usa la [Importación masiva de pedidos](/docs/bulk-order-import) o agrega los pedidos desde el panel.

## Pasos de la integración

1. **Crea una clave de API.** En **Configuración → Claves de API**, elige **Crear clave**. La clave se muestra una sola vez, así que cópiala de inmediato.
2. **Entrega al desarrollador la clave y la dirección de envío.** La dirección aparece en la misma pantalla, debajo de **Envía los pedidos a**. Envía la clave por un medio seguro, no en una conversación pública.
3. **El desarrollador hace la integración** siguiendo la [guía completa](/en/docs/server-api). El primer pedido toma unos minutos.
4. **Sigue el resultado.** Cada pedido aparece en la lista de **Confirmaciones** junto con tus demás pedidos.

> [!WARNING]
> La clave es un secreto que pertenece solo a tu servidor. No la pongas en una página web, en una app móvil ni en ningún lugar que el cliente pueda ver. Quien tenga la clave puede enviar pedidos a tu tienda. Si sospechas que se filtró, revócala en **Configuración → Claves de API** y crea una nueva.

## Lo que debes saber

| Pregunta | Respuesta |
| --- | --- |
| ¿El mensaje se envía en cuanto se recibe el pedido? | Akeed primero guarda el pedido y luego envía el mensaje según tu configuración, como el horario de silencio y el retraso de envío. |
| ¿Qué pasa con los pedidos pagados por adelantado? | Se guardan y aparecen en el panel, pero no se envía ningún mensaje al cliente ni se usa ningún crédito. |
| ¿Qué pasa si el sistema envía el mismo pedido dos veces? | No se crea un segundo pedido, no se envía un segundo mensaje y no se descuenta el crédito dos veces. |
| ¿Se puede modificar o cancelar un pedido desde la API? | No. La API solo crea pedidos. |
| ¿Dónde se ve la respuesta del cliente? | En la lista de **Confirmaciones** del panel. Akeed no envía notificaciones a tu servidor. |
| ¿Hay un modo de prueba? | No. Cada pedido con pago contra entrega envía un mensaje real y usa un crédito. Prueba primero con tu propio número de teléfono. |
| ¿Qué detiene la recepción de pedidos? | Que se agote el saldo, que se desactive la confirmación automática en la configuración o que se revoque la clave. |

## Si hay un problema

Cada respuesta de Akeed incluye un número de referencia llamado `correlationId`. Pide al desarrollador que lo envíe al [soporte](/support) junto con la hora de la solicitud y el código de error. No envíes la clave a nadie, ni siquiera al soporte.

## Guías relacionadas

- [Guía completa para desarrolladores (en inglés)](/en/docs/server-api)
- [Usar Akeed sin Shopify](/docs/standalone-platform)
- [Importación masiva de pedidos](/docs/bulk-order-import)
- [Confirmación de pedidos](/docs/order-confirmation)
