---
title: Conectar WooCommerce
description: Conecta tu tienda WooCommerce para que Akeed confirme por WhatsApp los nuevos pedidos con pago contra entrega y registre la respuesta del cliente en el pedido.
order: 3
slug: woocommerce
---

## Resumen

Conecta tu tienda WooCommerce una sola vez y Akeed recibirá solo cada nuevo pedido con pago contra entrega (COD). Confirma el pedido con el cliente por WhatsApp y registra la respuesta en el pedido de tu tienda.

No instalas un plugin de WordPress ni copias ninguna clave. Apruebas la conexión dentro de tu propia tienda.

> [!INFO]
> Akeed confirma solo los pedidos contra entrega. Los pedidos pagados en línea se reciben y se omiten.

## Antes de empezar

Tu tienda necesita todo lo siguiente:

- Una dirección que empiece con `https://` y sea accesible desde internet.
- Los enlaces permanentes configurados en cualquier opción que no sea **Plain** (WordPress > Settings > Permalinks).
- El método de pago estándar **Cash on delivery** de WooCommerce.
- Un usuario de WordPress que sea administrador o gestor de la tienda, para aprobar la conexión.

También debes ser propietario o administrador de tu cuenta de Akeed. Una cuenta de Akeed recibe sus pedidos de un solo origen, así que la cuenta no debe tener ya otro.

> [!WARNING]
> Akeed no puede garantizar que funcione con todas las configuraciones de hosting ni con todos los plugins. Un método de pago personalizado, un estado de pedido personalizado o un plugin que cambie la forma en que se envían los pedidos puede hacer que se omitan pedidos.

## Conecta tu tienda

1. **Elige WooCommerce al registrarte.** Después de confirmar tu correo electrónico, pasas a la pantalla de conexión.
2. **Ingresa la dirección de tu tienda.** Usa la dirección que visitan tus clientes, por ejemplo `https://example.com`. Akeed comprueba que puede acceder a la tienda.
3. **Aprueba en tu tienda.** Tu tienda se abre en la misma pestaña. Inicia sesión con una cuenta de administrador o de gestor de la tienda y luego elige **Approve**. Tu tienda te pide que le des a Akeed acceso de lectura y escritura.
4. **Espera a que termine la conexión.** Vuelves a Akeed, y la página se actualiza sola.
5. **Envía el mensaje de prueba gratis.** Akeed envía una confirmación de prueba a tu propio número de WhatsApp para que veas lo que ven los clientes. Después tu tienda queda configurada.

Akeed usa el acceso solo para:

- recibir tus pedidos nuevos,
- configurar en tu tienda las dos notificaciones de pedidos que necesita,
- registrar en el pedido la respuesta de tu cliente.

Los mensajes llegan a tus clientes desde el número de WhatsApp de Akeed. No necesitas un número de WhatsApp propio.

## Qué escribe Akeed en tu tienda

| Qué pasa | En tu pedido de WooCommerce |
| --- | --- |
| El cliente confirma | Akeed agrega una nota privada al pedido. El estado del pedido no cambia. |
| El cliente cancela | El estado del pedido cambia a **Cancelled**. |
| Cancelas desde Akeed un pedido sin respuesta | El estado del pedido cambia a **Cancelled**. |
| El cliente no responde | Nada. El pedido se marca como **Sin respuesta** solo en Akeed. |

Akeed nunca cancela por sí solo un pedido en WooCommerce. Cuando un cliente no responde, tú decides qué hacer.

Cuando un pedido se cancela, WooCommerce hace lo que siempre hace con un pedido cancelado, como devolver el inventario y enviar su correo de cancelación.

Akeed solo escribe en un pedido que sigue en **Processing** o en **On hold**. Si ya completaste, reembolsaste o cambiaste el pedido, Akeed no lo toca.

## Mantén la conexión en buen estado

Abre **Configuración** y luego tu origen de pedidos para ver la conexión:

| Lo que ves | Qué significa | Qué hacer |
| --- | --- | --- |
| Las notificaciones de pedidos están en **Activa** | Tu tienda envía los pedidos nuevos a Akeed. | Nada. |
| **Desactivada por tu tienda** | WooCommerce desactiva una notificación después de varias entregas fallidas seguidas. Los pedidos nuevos no llegan a Akeed. | Elige **Reactivar las notificaciones de pedidos**. |
| **En pausa en tu tienda** | Alguien pausó la notificación en WooCommerce. | Actívala en WordPress, en WooCommerce > Settings > Advanced > Webhooks. |
| **Eliminada de tu tienda** | La notificación se eliminó en WooCommerce. | Desconecta la tienda y vuelve a conectarla. |
| Tu tienda ya no acepta el acceso de Akeed | La clave de API fue revocada, o el usuario de WordPress ya no puede administrar WooCommerce. | Desconecta la tienda y vuelve a conectarla. |

**Comprobar la conexión** le pregunta a tu tienda si todo sigue funcionando y enumera lo que requiere atención.

> [!WARNING]
> Los pedidos realizados mientras una notificación estuvo desactivada, o mientras la tienda estuvo desconectada, no se envían a Akeed después. Confirma esos pedidos tú.

## Desconectar y reconectar

Elige **Desconectar WooCommerce** en Configuración. Akeed deja de recibir pedidos de la tienda, de enviar mensajes para ellos y de actualizarlos. Tus pedidos anteriores, los resultados y el historial de uso se conservan.

Akeed le pide a tu tienda que elimine sus dos notificaciones de pedidos. Te queda una cosa por hacer, porque Akeed no puede revocar su propia clave en tu tienda:

1. En WordPress, abre WooCommerce > Settings > Advanced > REST API.
2. Busca la clave con el nombre **Akeed** y elige **Revoke**.
3. Si Akeed te indica que las notificaciones no se eliminaron, abre WooCommerce > Settings > Advanced > Webhooks y elimina todos los webhooks cuyo nombre empiece con **Akeed**.

Puedes reconectar la misma tienda en cualquier momento aprobando de nuevo. No se puede conectar a la misma cuenta otra tienda, ni la misma tienda en otra dirección. Contacta al soporte de Akeed si lo necesitas.

## Errores comunes

| Error | Mejor opción |
| --- | --- |
| Ingresar una dirección que redirige | Ingresa la dirección final, con o sin `www`, exactamente como aparece en el navegador. |
| Aprobar con un usuario que no puede administrar WooCommerce | Inicia sesión con una cuenta de administrador o de gestor de la tienda. |
| Editar los webhooks de Akeed en WooCommerce | Déjalos como están. Si alguno se modificó, desconecta y vuelve a conectar. |
| Esperar que los pedidos perdidos lleguen después de una corrección | No se importan. Confírmalos manualmente. |

## Solución de problemas

### Akeed no pudo encontrar la API REST de WooCommerce

En WordPress, abre Settings > Permalinks, elige cualquier opción que no sea **Plain** y comprueba que WooCommerce esté activo y actualizado.

### Mi tienda no aceptó la clave de API

Algunas configuraciones de hosting eliminan el encabezado `Authorization` antes de que llegue a WordPress. Pide a tu proveedor de hosting que lo permita. Luego elimina la clave sin usar en WooCommerce > Settings > Advanced > REST API y conecta de nuevo.

### Mi tienda informa una dirección distinta

Ingresa la dirección exactamente como está configurada en WordPress. Si tu tienda se mudó a una dirección nueva después de conectarla, contacta al soporte de Akeed.

### Los pedidos dejaron de llegar

Abre Configuración y revisa las notificaciones de pedidos. Si alguna está desactivada, reactívala. Si la comprobación encuentra un problema con tu hosting, tu certificado o tu dominio, tu proveedor de hosting puede resolverlo.

### Un pedido no se confirmó

Comprueba que su método de pago sea pago contra entrega, que sea un pedido nuevo realizado después de conectar la tienda y que el número de teléfono del cliente sea válido.

## Preguntas frecuentes

### ¿Se necesita un plugin de WordPress?

No. Akeed se conecta mediante la pantalla de aprobación propia de WooCommerce.

### ¿Se necesita un número propio de WhatsApp Business?

No. Los mensajes se envían desde el número de WhatsApp de Akeed.

### ¿Akeed importa los pedidos antiguos?

No. Akeed confirma los pedidos realizados después de conectar la tienda.

### ¿Cómo se paga?

Con créditos, como todas las cuentas que no usan Shopify. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform#cómo-funcionan-los-créditos).

### ¿Se pueden conectar dos tiendas a una cuenta?

No. Una cuenta tiene un solo origen de pedidos.

## Guías relacionadas

- [Primeros pasos](/docs/getting-started)
- [Confirmación de pedidos](/docs/order-confirmation)
- [Reglas de automatización](/docs/automation-rules)
- [Solución de problemas](/docs/troubleshooting)
