---
title: Confirmación de pedidos
description: Conoce cómo Akeed confirma por WhatsApp los pedidos contra entrega y qué hacer con cada estado en tu flujo diario de envíos.
order: 7
slug: order-confirmation
---

## Resumen

Akeed te ayuda a confirmar los pedidos con pago contra entrega (COD) antes de enviarlos.

Cuando se crea un nuevo pedido contra entrega que cumple los requisitos, Akeed envía al cliente un mensaje de confirmación por WhatsApp, espera la respuesta y luego actualiza el estado del pedido en tu panel.

Así tu equipo recibe una señal clara de «enviar» o «retener».

Los pedidos pueden llegar de Shopify, de un pedido que agregas manualmente o de un archivo que importas. Después del primer mensaje, todos siguen el mismo flujo. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform) e [Importación masiva de pedidos](/docs/bulk-order-import).

## Por qué importa

Las operaciones con pago contra entrega suelen perder dinero en dos puntos:

- Pedidos enviados antes de verificar la intención del cliente.
- Pedidos cuya entrega falla porque el cliente no responde.

La confirmación de pedidos ayuda a reducir ambos.

## Cómo funciona el flujo

1. Akeed comprueba si el pedido cumple los requisitos para la confirmación de pago contra entrega.
2. Akeed envía un mensaje de confirmación por WhatsApp.
3. El cliente confirma, cancela o no responde.
4. Akeed actualiza el estado y lo muestra en las vistas del panel.
5. Las reglas de recordatorio y de aviso se aplican según tu configuración.
6. En una tienda conectada, Akeed registra la respuesta en el pedido: una etiqueta en Shopify, un estado en EasyOrders, una nota o un estado de cancelado en WooCommerce.

> [!INFO]
> El flujo principal de confirmación de Akeed es para pedidos contra entrega.

## Estados y qué hacer con cada uno

| Estado | Significado | Acción recomendada |
| --- | --- | --- |
| Esperando inicio | Importado desde un archivo y en espera. Aún no se ha enviado ningún mensaje. | Inicia la confirmación desde la pantalla de importación, o sube el archivo de nuevo si pasó el plazo de 24 horas. |
| Pendiente | La verificación existe, pero aún no se ha enviado el primer mensaje. | Espera un momento y, si sigue pendiente demasiado tiempo, revisa la configuración de retraso. |
| Enviado | El mensaje se envió correctamente. | Espera la respuesta del cliente. |
| Entregado | WhatsApp informa que el mensaje se entregó. | Sigue atento a la respuesta. |
| Leído | El cliente abrió el mensaje. | Sigue atento o deja que actúe el recordatorio automático. |
| Confirmado | El cliente confirmó el pedido. | Dale prioridad en la preparación. |
| Cancelado | El cliente canceló (o el comerciante canceló por falta de respuesta). | No lo envíes. |
| Sin respuesta | No hubo respuesta dentro del plazo de aviso que configuraste. | Revísalo pronto y aplica tu política de cancelación. |
| Sin WhatsApp | El número del cliente no está en WhatsApp, así que el mensaje no le llega. Akeed no envía recordatorio y no cuenta el mensaje en tu uso. | Llama al cliente y después confirma o cancela el pedido manualmente. |
| En espera de envío | Se agotaron las confirmaciones de tu plan o tus créditos, así que el mensaje no se envió. No se cobra nada. | Mejora tu plan o compra créditos. Akeed lo enviará automáticamente. |
| Fallido | El envío falló o fue bloqueado. | Revisa la calidad del teléfono, el uso del plan o el saldo de créditos, y la configuración. |

## Flujo de trabajo práctico para el comerciante

### 1) Envía primero los pedidos confirmados

Usa el estado confirmado como tu cola de preparación más segura.

### 2) Revisa a diario los pedidos sin respuesta

No dejes que se acumulen los pedidos sin respuesta. Decide si reintentar o cancelar según tu procedimiento.

### 3) Da seguimiento a los envíos fallidos

Un envío fallido es una señal operativa, no solo un número del panel.

## Errores comunes

| Error | Mejor opción |
| --- | --- |
| Enviar todos los pedidos contra entrega sin esperar el estado | Haz de «primero los confirmados» tu regla predeterminada. |
| Dejar los pedidos sin respuesta sin revisar durante días | Agrega una rutina diaria de revisión de pedidos sin respuesta. |
| Desactivar la automatización sin un proceso alternativo | Asigna un responsable del proceso manual antes de desactivar la automatización. |
| Tratar «entregado» como «confirmado» | Solo «confirmado» debe guiar las decisiones de envío. |

## Solución de problemas

### Demasiados pedidos sin respuesta

- Reduce el retraso del primer envío.
- Activa los recordatorios.
- Comprueba que el horario de los mensajes coincida con las horas de actividad de tus clientes.

### Los pedidos quedan pendientes demasiado tiempo

- Revisa la configuración del retraso de envío.
- Comprueba que la verificación automática esté activada.
- Comprueba que los pedidos sean realmente de pago contra entrega.

### Aumentan las confirmaciones fallidas

- Verifica la calidad de los números de teléfono y el formato del código de país.
- Revisa el uso actual del plan o el saldo de créditos.
- Envía una confirmación de prueba a un número que sepas que es válido.

## Preguntas frecuentes

### ¿Akeed cancela automáticamente todos los pedidos sin confirmar?

Solo si activas **Cancelar automáticamente los pedidos sin respuesta** en Configuración, y aun así solo los pedidos que quedaron sin respuesta después de entregarse todos los mensajes y sin que el cliente escribiera. Si no, los pedidos sin respuesta te esperan. Consulta [Reglas de automatización](/docs/automation-rules).

### ¿Los clientes pueden responder después del estado sin respuesta?

Sí, en cualquier momento. Akeed no puede mostrar lo que escribieron, porque los mensajes salen desde el número de Akeed, así que el pedido pasa a **Requieren tu acción**. Contacta al cliente con **Ir a WhatsApp** o por teléfono. Si Akeed ya canceló el pedido, sigue cancelado hasta que lo cambies en tu tienda.

### ¿Basta con «entregado» para enviar el pedido?

No. Entregado solo significa que el mensaje llegó al cliente. Usa **Confirmado** para enviar con seguridad.

### ¿Qué pasa si el número del cliente no está en WhatsApp?

WhatsApp avisa a Akeed de que el mensaje no se puede entregar, y el pedido pasa a **Sin WhatsApp**. Lo encontrarás en la pestaña **Sin WhatsApp** y en **Requieren acción**. Akeed cancela el recordatorio, no cuenta el mensaje en tu uso y, en Shopify, etiqueta el pedido con `Akeed: No WhatsApp`. Llama al cliente y después confirma o cancela el pedido manualmente.

### ¿Qué pasa cuando se agotan las confirmaciones de mi plan o mis créditos?

Los pedidos nuevos se siguen recibiendo, pero sus mensajes quedan con el estado **En espera de envío**, y un aviso rojo en el panel muestra cuántos esperan y qué puedes hacer. No se cobra nada por ellos. En cuanto mejoras tu plan, compras créditos o tu cupo se renueva, Akeed los envía automáticamente, empezando por el más antiguo y respetando el retraso de envío y las horas de silencio. Un pedido que espera más de 24 horas no se envía solo: pasa a **Requieren acción**, donde puedes confirmarlo, cancelarlo o reintentarlo.

En un plan de pago de Shopify, el aviso también ofrece **Renovar ahora**. Apruebas de nuevo tu plan actual en Shopify y empieza en el acto un nuevo periodo de 30 días con la asignación completa, así que los pedidos en espera se envían. Los mensajes que quedan del periodo anterior no se acumulan.

### ¿Dónde se ajustan los tiempos y el recordatorio?

En la sección de automatización de tu configuración.

Consulta también: [Reglas de automatización](/docs/automation-rules)
