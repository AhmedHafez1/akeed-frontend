---
title: Avisos de envío
description: Envía un mensaje de WhatsApp cuando se envía un pedido de Shopify y actúa según la respuesta del cliente.
order: 8
slug: shipping-notifications
---

## Resumen

Cuando envías un pedido contra reembolso, Akeed puede mandar al cliente un mensaje de WhatsApp. El mensaje dice que el pedido va en camino, pide al cliente tener listo el total en efectivo y mantener el teléfono encendido para el repartidor, incluye el número de seguimiento si lo agregas y ofrece tres botones, **Lo recibiré**, **No estaré disponible** y **Cambiar dirección**, seguidos de un botón **Rastrear pedido**.

Los avisos de envío están disponibles para tiendas Shopify.

## Actívalo

1. Abre **Configuración › Envíos**.
2. Marca **Enviar un mensaje cuando se envía un pedido**.
3. En **Cuándo enviarlo**, elige qué marca un pedido como enviado.
4. Haz clic en **Guardar**.

## Cuándo se envía el mensaje

- **Cuando preparo el pedido**: Akeed envía el mensaje cuando preparas el pedido en Shopify.
- **Cuando agrego una etiqueta**: agrega hasta 10 etiquetas que ya usas, como `Shipped`. Akeed envía el mensaje cuando se agrega una de ellas al pedido.

Cada pedido recibe un solo aviso de envío, la primera vez que ocurre cualquiera de las dos cosas. Las etiquetas propias de Akeed, como `Akeed: Verified`, nunca cuentan.

El mensaje se envía a los pedidos contra reembolso que recibió Akeed. Se omiten los pedidos de prueba, los cancelados y los de más de 30 días.

## La columna Envío

Tu lista de pedidos muestra una palabra por pedido en la columna **Envío**. La columna **Estado** conserva el resultado de la confirmación, como **Confirmado**.

| Lo que ves | Qué significa |
| --- | --- |
| **Enviado** | El mensaje salió. Pasa el cursor sobre la palabra para ver si se entregó o se leyó. |
| **Lo recibirá** | El cliente tocó **Lo recibiré**. |
| **No disponible** | El cliente tocó **No estaré disponible**. Contáctalo. |
| **Cambiar dirección** | El cliente pidió cambiar la dirección. Contáctalo. |
| **No entregado en WhatsApp** | El cliente no tiene número de teléfono, o el número no está en WhatsApp. |
| **Envío fallido** | Algo detuvo el mensaje. Pasa el cursor sobre la palabra para ver por qué. |
| **No enviado** | El pedido tiene más de 30 días o fue cancelado. |

Después de hacer clic en **Marcar como resuelto**, la palabra queda en gris. Pasa el cursor sobre ella para ver cuándo se resolvió.

Abre un pedido para ver por qué se envió el mensaje, su seguimiento y la respuesta del cliente.

## Por qué no se envió un mensaje

| Motivo | Qué hacer |
| --- | --- |
| Sin número de teléfono | Contacta al cliente de otra forma. |
| El número no está en WhatsApp | Llama al cliente. |
| No quedan mensajes en tu plan | Elige un plan mayor o espera al siguiente periodo. |
| WhatsApp no pudo entregarlo | Contacta al cliente directamente. |
| Aún no disponible en este idioma | El mensaje en ese idioma espera la aprobación de WhatsApp. |
| El pedido tiene más de 30 días | No hace falta hacer nada. |
| El pedido fue cancelado | No hace falta hacer nada. |

## Botón Rastrear pedido

**Rastrear pedido** abre la página de seguimiento de tu transportista cuando el envío tiene un enlace de seguimiento, o cuando Akeed reconoce el transportista y el número de seguimiento. Si no, abre una página breve de Akeed con el nombre de tu tienda, el número de pedido, el transportista y el número de seguimiento para copiarlo. Nunca muestra la dirección ni el teléfono del cliente.

## Respuestas del cliente

Cuando el cliente toca **No estaré disponible** o **Cambiar dirección**, el pedido pasa a **Requieren tu acción**. Contacta al cliente, coordina la entrega con tu mensajería y luego haz clic en **Marcar como resuelto** en el menú **⋯** del pedido o en sus detalles.

**Lo recibiré** no requiere nada de tu parte. Si los mensajes de agradecimiento están activados, Akeed le agradece al cliente su respuesta.

Un pedido cuyo mensaje no llegó al cliente también aparece en **Requieren tu acción**, con **No entregado en WhatsApp** en la columna **Envío**. Llama al cliente y luego haz clic en **Marcar como resuelto**.

Solo el propietario de la tienda y los administradores pueden marcar una respuesta como resuelta.

## Facturación

Cada aviso de envío usa 1 mensaje de tu plan, igual que una confirmación. Si envías desde tu propio número de WhatsApp, primero se usan los mensajes de tu número. Cuando tu plan no tiene mensajes disponibles, el aviso de envío no se envía.
