---
title: Solución de problemas
description: Resuelve rápido los problemas más comunes de la confirmación de pedidos contra entrega con comprobaciones claras y los pasos a seguir.
order: 11
slug: troubleshooting
---

## Resumen

Esta página te ayuda a diagnosticar y resolver rápido los problemas operativos más comunes en Akeed.

Úsala cuando:

- los pedidos no se confirman,
- los mensajes se retrasan o no se envían,
- demasiados pedidos pasan a sin respuesta,
- el uso del plan o un saldo de créditos en cero bloquea los envíos nuevos,
- una importación por archivo no se comporta como esperabas.

## Lista de comprobación rápida

Antes de investigar a fondo, revisa primero esto:

1. La confirmación automática está activada.
2. El pedido es de pago contra entrega.
3. El uso del plan no llegó al límite, o tu saldo de créditos (cuentas independientes) no está en cero.
4. El horario de silencio no está retrasando los envíos.
5. El número de teléfono incluye el código de país.

Estas cinco comprobaciones resuelven la mayoría de los problemas.

## Problema: el pedido no se confirmó

### Qué revisar

- ¿El método de pago del pedido era pago contra entrega?
- ¿La confirmación automática está activada en la configuración?
- ¿El pedido pasó al estado pendiente o enviado en el panel?

### Qué hacer

1. Comprueba que el pedido sea de pago contra entrega.
2. Comprueba que la confirmación automática esté activada.
3. Envía una confirmación de prueba a un número que sepas que es válido.
4. Si la prueba funciona pero el pedido real no, revisa los datos del pedido y las reglas de tiempos.

## Problema: el mensaje no se envió

### Qué revisar

- El uso actual del plan (`usado / límite`).
- Los envíos fallidos en el panel.
- La configuración del retraso de envío y del horario de silencio.

### Qué hacer

1. Si el uso está cerca del límite o lo alcanzó, mejora tu plan o espera al siguiente ciclo. En una cuenta independiente, compra créditos en **Facturación y créditos**.
2. Si aparece el estado fallido, verifica la calidad del teléfono del cliente.
3. Si hay retraso, revisa el horario de silencio y la zona horaria.

> [!WARNING]
> Llegar al límite del plan puede parecer una interrupción del envío. Revisa siempre el uso antes de investigar más a fondo.

## Problema: el cliente dice que no recibió el mensaje

### Qué revisar

- El formato del número de teléfono y el código de país.
- Si el estado es enviado, entregado o fallido.
- Si el cliente está en una región o franja horaria con poca respuesta.

### Qué hacer

1. Vuelve a probar con un número limpio que sepas que es válido.
2. Revisa el idioma y el estilo de la plantilla para ese segmento de clientes.
3. Usa los recordatorios para recuperar los primeros mensajes que no se vieron.

## Problema: demasiados pedidos sin respuesta

### Causas probables

- El retraso del primer envío es demasiado largo.
- El recordatorio está desactivado.
- El aviso llega demasiado pronto.
- El estilo o el idioma del mensaje no se ajusta al público.

### Qué hacer

1. Reduce el retraso del primer envío.
2. Activa el recordatorio.
3. Aumenta un poco el plazo del aviso.
4. Prueba un estilo de plantilla que se ajuste mejor.

## Problema: la confirmación automática parece desactivada

### Qué revisar

- El interruptor de confirmación automática en la configuración.
- El estado del guardado (¿el cambio realmente se guardó?).
- Si la configuración se revirtió hace poco después de un error.

### Qué hacer

1. Vuelve a activar la confirmación automática.
2. Guarda y comprueba que aparezca el aviso de éxito.
3. Envía una confirmación de prueba para verificar el comportamiento.

## Problema: el horario de silencio retrasa demasiado los mensajes

### Qué revisar

- Las horas de inicio y fin del horario de silencio.
- La zona horaria seleccionada.
- Si el horario de silencio coincide con tu periodo de mayor volumen de pedidos.

### Qué hacer

1. Comprueba que la zona horaria sea la correcta para el mercado donde operas.
2. Reduce el horario de silencio si hace falta.
3. Vuelve a probar con un pedido real y observa los tiempos del estado.

## Problema: los pedidos de WooCommerce o EasyOrders dejaron de llegar

### Qué revisar

- Abre **Configuración**, luego tu origen de pedidos, y lee el estado de la conexión.
- En WooCommerce, comprueba si una notificación de pedidos está desactivada, en pausa o eliminada.
- En EasyOrders, comprueba que la tienda esté activa y que no se estén rechazando pedidos.

### Qué hacer

1. Sigue el paso que indica el estado: reactiva la notificación, restablece los secretos de webhook, o desconecta la tienda y vuelve a conectarla.
2. Confirma manualmente los pedidos realizados mientras la conexión estuvo caída. No se importan después.
3. Consulta [Conectar WooCommerce](/docs/woocommerce) o [Conectar EasyOrders](/docs/easyorders) para cada caso.

## Problema: los pedidos importados no se confirman

### Qué revisar

- ¿Presionaste **Enviar** después de la vista previa? Importar por sí solo no envía nada.
- ¿Los pedidos siguen en **Esperando inicio**? Hay que iniciarlos en un plazo de 24 horas.
- ¿La importación está en pausa porque se agotaron los créditos?
- ¿Se omitieron algunas filas por no ser válidas, estar duplicadas o quedar excluidas?

### Qué hacer

1. Abre la pantalla de importación y lee el motivo junto a cada grupo omitido.
2. Si **Enviar** está bloqueado, compra créditos o activa la confirmación automática y presiona **Enviar** de nuevo.
3. Si la importación está en pausa, compra créditos y elige **Reanudar**.
4. Si pasó el plazo o la importación venció, sube el archivo de nuevo. Los pedidos con número de pedido que ya se importaron se reconocen y no se duplican, y los pedidos parecidos se marcan para que los revises.

Para problemas de archivo y de columnas, consulta la tabla de solución de problemas en [Importación masiva de pedidos](/docs/bulk-order-import).

## Problema: dificultades con la facturación o el cambio de plan

### Qué revisar

- El estado actual de la facturación en la configuración.
- Si el cambio de plan se aprobó en Shopify (tiendas Shopify).
- Si tu pago de Paymob se completó y tu saldo de créditos se actualizó (cuentas independientes).
- El nivel de uso respecto al límite incluido.

### Qué hacer

1. Reintenta el cambio de plan si la aprobación no se completó.
2. Conserva el plan activo actual si la mejora fue rechazada.
3. Mejora tu plan antes de llegar al límite de uso en periodos de mucha actividad.
4. En una cuenta independiente, si un pago aparece como pendiente, espera un momento y revisa **Facturación y créditos** antes de pagar de nuevo.

## Cuándo contactar al soporte

Contacta al soporte cuando:

- el problema continúa después de la lista de comprobación y de los pasos específicos,
- el mensaje de prueba también falla repetidamente,
- el estado de la facturación no coincide con la aprobación de Shopify, o un pago de Paymob no aparece en tu saldo de créditos.

Al contactar al soporte, incluye:

- el nombre de la tienda,
- el número del pedido afectado,
- una captura de pantalla del estado,
- la fecha y la hora del problema,
- lo que ya intentaste.

Esto acorta mucho el tiempo de resolución.

## Preguntas frecuentes

### ¿Se puede recuperar el rendimiento después de un mal cambio de configuración?

Sí. Vuelve a la última configuración estable y luego prueba un cambio a la vez.

### ¿Conviene desactivar la automatización mientras se resuelve un problema?

Solo si hace falta para controlar el riesgo. En la mayoría de los casos basta con corregir los ajustes concretos.

### ¿Cuál es la comprobación de estado más rápida?

Envía una confirmación de prueba y verifica que:

- el mensaje se envió,
- la respuesta se registró,
- el estado se actualizó en el panel.

Consulta también: [Primeros pasos](/docs/getting-started)
