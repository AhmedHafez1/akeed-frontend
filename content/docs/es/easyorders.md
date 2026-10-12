---
title: Conectar EasyOrders
description: Conecta tu tienda EasyOrders para que Akeed confirme por WhatsApp los nuevos pedidos con pago contra entrega y actualice el estado del pedido con la respuesta del cliente.
order: 4
slug: easyorders
---

## Resumen

Conecta tu tienda EasyOrders una sola vez y Akeed recibirá solo cada nuevo pedido con pago contra entrega (COD). Confirma el pedido con el cliente por WhatsApp y actualiza el estado del pedido en EasyOrders.

No copias ninguna clave. Apruebas la conexión dentro de EasyOrders.

> [!INFO]
> Akeed confirma solo los pedidos contra entrega. Los pedidos con otro método de pago se reciben y se omiten.

## Antes de empezar

- Eres propietario o administrador de tu cuenta de Akeed.
- Tu tienda EasyOrders está activa.
- Tu cuenta de Akeed no tiene ya otro origen de pedidos. Una cuenta recibe sus pedidos de un solo origen.

## Conecta tu tienda

1. **Elige EasyOrders al registrarte.** Después de confirmar tu correo electrónico, pasas a la pantalla de conexión.
2. **Elige Conectar EasyOrders.** EasyOrders se abre en una pestaña nueva. Inicia sesión en la tienda que quieres conectar y luego elige **Accept**.
3. **Vuelve a Akeed.** La página se actualiza sola cuando la conexión está lista.
4. **Elige el país y la moneda de tu tienda.** EasyOrders envía los totales de los pedidos sin moneda y los números de teléfono sin código de país, así que Akeed necesita ambos datos para escribir correctamente a tus clientes.
5. **Envía el mensaje de prueba gratis.** Akeed envía una confirmación de prueba a tu propio número de WhatsApp. Después tu tienda queda configurada.

Akeed le pide a EasyOrders solo dos permisos:

- leer tus pedidos nuevos,
- actualizar el estado de un pedido cuando tu cliente confirma o cancela.

Los mensajes llegan a tus clientes desde el número de WhatsApp de Akeed. No necesitas un número de WhatsApp propio.

> [!WARNING]
> Los pedidos no se confirman hasta que elijas tanto el país de los teléfonos de los clientes como la moneda de la tienda.

## Qué escribe Akeed en tu tienda

| Qué pasa | En EasyOrders |
| --- | --- |
| El cliente confirma | El estado del pedido cambia a **confirmed**. |
| El cliente cancela | El estado del pedido cambia a **canceled**. |
| Cancelas desde Akeed un pedido sin respuesta | El estado del pedido cambia a **canceled**. |
| El cliente no responde | Nada. El pedido se marca como **Sin respuesta** solo en Akeed. |

Akeed nunca cancela por sí solo un pedido en EasyOrders. Además, solo actualiza un pedido que sigue pendiente: si ya cambiaste el estado del pedido, Akeed no lo toca.

## Mantén la conexión en buen estado

Abre **Configuración** y luego tu origen de pedidos para ver la conexión.

| Lo que ves | Qué significa | Qué hacer |
| --- | --- | --- |
| Tu tienda EasyOrders no está activa | EasyOrders informa que la tienda está inactiva o con pagos vencidos. Los pedidos no llegan a Akeed. | Reactiva la tienda en EasyOrders. |
| EasyOrders ya no acepta el acceso de Akeed | La clave de API se eliminó en EasyOrders. | Desconecta la tienda y vuelve a conectarla. |
| Se rechazaron pedidos porque su secreto de webhook no coincidía | Los webhooks de Akeed se eliminaron y se crearon de nuevo en EasyOrders. | Abre **Corrige los secretos de webhook** y elige **Restablecer y obtener de nuevo**. |

Akeed protege los dos webhooks por sí solo: comprueba tu primer pedido con EasyOrders y luego conserva el secreto que EasyOrders envía con él. No tienes nada que copiar.

Deja exactamente un webhook de pedidos y un webhook de estado de pedidos con el nombre **Akeed** en EasyOrders. Si una dirección aparece dos veces, elimina la que sobra.

> [!WARNING]
> Los pedidos realizados mientras la tienda estuvo desconectada o inactiva no se envían a Akeed después. Confirma esos pedidos tú.

## Desconectar y reconectar

Elige **Desconectar EasyOrders** en Configuración. Akeed deja de recibir pedidos de la tienda, de enviar mensajes para ellos y de actualizar su estado. Tus pedidos anteriores, los resultados y el historial de uso se conservan.

Akeed le pide a EasyOrders que elimine los webhooks que creó. La clave de API permanece en EasyOrders hasta que la elimines:

1. En EasyOrders, abre Settings > Public API.
2. Elimina la clave de API con el nombre **Akeed**.
3. Si Akeed te indica que los webhooks no se eliminaron, elimina en Webhooks todos los webhooks con el nombre **Akeed**.

Puedes reconectar la misma tienda en cualquier momento aprobando de nuevo en EasyOrders. No se puede conectar otra tienda a la misma cuenta. Contacta al soporte de Akeed si lo necesitas.

## Errores comunes

| Error | Mejor opción |
| --- | --- |
| Omitir el país y la moneda | Elige ambos. Sin ellos, los pedidos no se confirman. |
| Iniciar sesión en otra tienda EasyOrders al reconectar | Inicia sesión en la tienda que estaba conectada antes. |
| Eliminar los webhooks de Akeed en EasyOrders para «actualizarlos» | Déjalos como están. Si se volvieron a crear, restablece los secretos de webhook en Akeed. |
| Esperar que los pedidos perdidos lleguen después de una corrección | No se importan. Confírmalos manualmente. |

## Solución de problemas

### EasyOrders no se conectó

La solicitud no fue aceptada o venció. Empieza de nuevo. Si elegiste Accept y aun así falló, es posible que EasyOrders haya creado una clave de API y webhooks con el nombre Akeed: elimínalos en Settings > Public API antes de intentarlo de nuevo.

### Esta tienda ya está conectada a otra cuenta de Akeed

Una tienda se conecta a una sola cuenta de Akeed. Contacta al soporte de Akeed.

### Los pedidos dejaron de llegar

Comprueba que la tienda esté activa en EasyOrders y abre tu origen de pedidos en Configuración para ver si se están rechazando pedidos.

### Un pedido no se confirmó

Comprueba que su método de pago sea pago contra entrega, que el número de teléfono del cliente sea válido para el país que elegiste y que el total del pedido sea mayor que cero.

## Preguntas frecuentes

### ¿Se necesita un número propio de WhatsApp Business?

No. Los mensajes se envían desde el número de WhatsApp de Akeed.

### ¿Akeed importa los pedidos antiguos?

No. Akeed confirma los pedidos realizados después de conectar la tienda.

### ¿Se puede cambiar el país o la moneda más adelante?

Sí, desde tu origen de pedidos en Configuración.

### ¿Cómo se paga?

Con créditos, como todas las cuentas que no usan Shopify. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform#cómo-funcionan-los-créditos).

## Guías relacionadas

- [Primeros pasos](/docs/getting-started)
- [Confirmación de pedidos](/docs/order-confirmation)
- [Reglas de automatización](/docs/automation-rules)
- [Solución de problemas](/docs/troubleshooting)
