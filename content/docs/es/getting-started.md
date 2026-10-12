---
title: Primeros pasos
description: Configura Akeed en Shopify, con una tienda WooCommerce o EasyOrders conectada, o por separado, y envía tu primer mensaje de confirmación de pago contra entrega.
order: 1
slug: getting-started
---

## Resumen

**Akeed: infraestructura de confirmación de pedidos contra entrega para comerciantes.** Akeed te ayuda a confirmar por WhatsApp los pedidos con pago contra entrega (COD) antes de enviarlos. Por cada pedido contra entrega que cumple los requisitos, Akeed envía un mensaje de confirmación y actualiza tu panel cuando el cliente responde.

Akeed funciona de tres maneras. Usa esta guía cuando lo configures por primera vez.

| Si tú… | Usa | Cómo llegan los pedidos | Cómo pagas |
| --- | --- | --- | --- |
| Tienes una tienda Shopify | [Ruta A: Shopify](#ruta-a-shopify) | Automáticamente desde tu tienda. | Un plan mensual que cobra Shopify. |
| Tienes una tienda WooCommerce o EasyOrders | [Conectar WooCommerce](/docs/woocommerce) o [Conectar EasyOrders](/docs/easyorders) | Automáticamente desde tu tienda. | Créditos, comprados mediante Paymob. |
| Vendes en cualquier otro lugar o trabajas con una hoja de cálculo | [Ruta B: Tu propia tienda](#ruta-b-tu-propia-tienda-sin-shopify) | Los agregas uno por uno, importas un archivo o los envías desde tu propio servidor. | Créditos, comprados mediante Paymob. |

> [!INFO]
> Akeed está diseñado para confirmar pedidos contra entrega. No envía mensajes de confirmación para pedidos pagados en línea.

## Ruta A: Shopify

### Antes de empezar

Comprueba que tienes:

- Acceso al panel de administración de tu tienda Shopify.
- Permiso para instalar apps y aprobar suscripciones de apps.
- Al menos un pedido contra entrega reciente o un número de teléfono que puedas usar para una confirmación de prueba.

En la configuración estándar no necesitas conectar tu propio número de WhatsApp. Akeed envía los mensajes mediante la infraestructura oficial de WhatsApp.

### Paso 1: Instala Akeed

Instala Akeed desde Shopify y abre la app desde tu panel de Shopify. Si es la primera vez que abres Akeed, te guiaremos por la configuración inicial.

Durante la instalación, Shopify puede pedirte que apruebes los permisos de la app. Estos permisos permiten que Akeed lea los datos de los pedidos, detecte los pedidos contra entrega y actualice los pedidos de Shopify después de la confirmación.

### Paso 2: Completa la configuración de la tienda

En la pantalla de configuración, revisa los ajustes de tu tienda:

| Ajuste | Qué significa |
| --- | --- |
| Nombre de la tienda | El nombre que aparece en la configuración de la app y en las vistas previas de los mensajes. |
| Idioma de la app | El idioma que se usa dentro de Akeed. |
| Idioma predeterminado de los mensajes | El idioma que Akeed usa en los mensajes de WhatsApp para los clientes. |
| Confirmación automática | Si los nuevos pedidos contra entrega que cumplen los requisitos se confirman automáticamente. |

En la mayoría de las tiendas conviene dejar activada la confirmación automática. Así Akeed envía los mensajes de confirmación automáticamente cuando se crea un nuevo pedido contra entrega.

### Paso 3: Elige un plan

Elige el plan que corresponda a tu volumen mensual esperado de confirmaciones de pedidos contra entrega.

| Plan | Confirmaciones incluidas | Ideal para |
| --- | ---: | --- |
| Starter | 30 | Probar Akeed por primera vez. |
| Basic | 300 | Tiendas pequeñas que confirman pedidos contra entrega con regularidad. |
| Pro | 1,000 | Tiendas con volumen diario de pedidos contra entrega y necesidades de automatización. |
| Scale | 2,500 | Operaciones de pago contra entrega de mayor volumen. |

> [!WARNING]
> Cuando alcanzas el límite de confirmaciones incluidas, los nuevos envíos por WhatsApp pueden detenerse hasta que tu plan se renueve o lo mejores.

### Paso 4: Envía una confirmación de prueba

Después de la configuración inicial, abre el panel de Akeed y envía una confirmación de prueba a tu propio número de teléfono.

Usa la prueba para verificar que:

- El mensaje de WhatsApp se entrega.
- Los botones de confirmar y cancelar funcionan.
- El resultado aparece en tu panel de Akeed.

Las confirmaciones de prueba te ayudan a conocer la experiencia del cliente antes de que empiecen a llegar pedidos reales.

### Paso 5: Revisa tu panel

El panel muestra la actividad de confirmación de tus pedidos, que incluye:

- Pedidos confirmados.
- Pedidos cancelados.
- Pedidos que esperan la respuesta del cliente.
- Envíos fallidos o bloqueados.
- Recordatorios enviados.
- Uso actual del plan.

Revisa el panel con regularidad para que tu equipo de logística sepa qué pedidos contra entrega están listos para enviarse.

## Ruta B: Tu propia tienda (sin Shopify)

Usa esta ruta si no usas Shopify. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform) para ver el panorama completo. Si tu tienda funciona con WooCommerce o EasyOrders, elígelo al registrarte y sigue [Conectar WooCommerce](/docs/woocommerce) o [Conectar EasyOrders](/docs/easyorders): así tus pedidos llegan solos.

### Paso 1: Crea tu cuenta

Regístrate y confirma tu correo electrónico.

### Paso 2: Configura tu tienda

Ingresa el nombre de tu tienda y tu propio número de WhatsApp. No necesitas conectar un número de WhatsApp para los clientes. Akeed envía los mensajes desde su número oficial.

### Paso 3: Prueba el mensaje

Akeed envía una confirmación de prueba gratis a tu propio número. Comprueba que llega y que los botones de confirmar y cancelar funcionan. Puedes omitir este paso.

### Paso 4: Agrega tus pedidos

- **Un pedido:** usa **Verificar pedido** en el panel.
- **Muchos pedidos:** usa **Importar desde un archivo** para cargar un archivo CSV o Excel. Consulta [Importación masiva de pedidos](/docs/bulk-order-import).

### Paso 5: Mantén créditos disponibles

Empiezas con 30 créditos gratis. Un crédito es un mensaje de WhatsApp, y un recordatorio cuesta uno más. Abre **Facturación y créditos** para comprar más mediante Paymob, con tarjeta o Vodafone Cash.

> [!WARNING]
> Cuando se agotan tus créditos, las confirmaciones nuevas se detienen hasta que compres más.

## Errores comunes

| Error | Cómo evitarlo |
| --- | --- |
| Desactivar la confirmación automática por accidente | Deja activada la confirmación automática, salvo que quieras pausar todas las confirmaciones nuevas. |
| Enviar el pedido antes de que el cliente responda | Siempre que sea posible, espera a que el estado sea confirmado. |
| No vigilar el uso del plan o el saldo de créditos | Revisa tu barra de uso (Shopify) o tu saldo de créditos (cuenta independiente) para que los envíos no se detengan de forma inesperada. |
| Configurar retrasos muy largos | Usa retrasos de primer envío y de recordatorio que sean prácticos para tu flujo de preparación de pedidos. |

## Solución de problemas

### Un pedido contra entrega no se confirmó

Comprueba que la confirmación automática esté activada y que el método de pago del pedido sea realmente pago contra entrega.

### Un mensaje de prueba no llegó

Comprueba que el número de teléfono sea válido e incluya el código de país. Si el problema continúa, prueba con otro número antes de contactar al soporte.

### Los envíos nuevos se detuvieron

En Shopify, revisa el uso de tu plan. Si se agotaron tus confirmaciones incluidas, mejora tu plan o espera al siguiente periodo de facturación. En una cuenta independiente, revisa tu saldo de créditos y compra más si está en cero.

## Preguntas frecuentes

### ¿Akeed confirma todos los pedidos?

No. Akeed se centra en los pedidos con pago contra entrega. Los pedidos pagados en línea no se confirman automáticamente con este flujo.

### ¿Se necesita Shopify para usar Akeed?

No. Las tiendas Shopify instalan Akeed desde Shopify. Las tiendas WooCommerce y EasyOrders se conectan en pocos pasos. Todos los demás pueden usar una cuenta independiente. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform).

### ¿Se necesita una cuenta propia de WhatsApp Business?

No en la configuración estándar. Akeed puede enviar los mensajes de confirmación con su infraestructura oficial de WhatsApp.

### ¿Se puede cambiar el idioma de los mensajes más adelante?

Sí. Puedes cambiar el idioma predeterminado de los mensajes desde la configuración.

### ¿Qué hay que hacer después de que un cliente confirma?

Usa el estado del panel para decidir si el pedido está listo para prepararse. Enviar los pedidos contra entrega confirmados es más seguro que enviar pedidos sin respuesta del cliente.
