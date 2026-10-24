---
title: Reglas de automatización
description: Configura los tiempos de envío, los recordatorios, el aviso por falta de respuesta y el horario de silencio según tu operación de pago contra entrega.
order: 8
slug: automation-rules
---

## Resumen

Las reglas de automatización controlan **cuándo** Akeed envía los mensajes de confirmación y **cómo** trata a los clientes que no responden.

Estos ajustes te permiten equilibrar la rapidez, la experiencia del cliente y el riesgo de envío.

## Por qué importan estas reglas

Un buen momento de envío mejora la calidad de las respuestas.

- Enviar demasiado pronto o demasiado tarde → menor tasa de respuesta.
- Sin recordatorio → más pedidos sin respuesta.
- Avisar demasiado rápido → puedes cancelar pedidos que se habrían confirmado.

El objetivo es sencillo: enviar en el momento adecuado, recordar una vez y avisar con reglas claras.

## Regla 1: Retraso del primer envío

Controla cuánto espera Akeed antes de enviar la primera confirmación por WhatsApp.

### Valor recomendado

- Empieza con **0 a 15 minutos** en la mayoría de las tiendas.

### Usa un retraso mayor cuando

- Necesitas un margen breve para editar pedidos.
- Quieres evitar envíos inmediatos durante los picos de compra.

> [!INFO]
> Los retrasos muy largos del primer envío suelen reducir el rendimiento de la confirmación, porque la intención del cliente se enfría con el tiempo.

## Regla 2: Recordatorio

Si está activado, Akeed envía un recordatorio a los clientes que no respondieron.

### Valor recomendado

- Deja el recordatorio **activado**.
- Empieza con **6 horas** después del primer envío. Es el valor predeterminado.

### Por qué ayuda

- Muchas veces los clientes no ven el primer mensaje.
- Un solo recordatorio recupera una parte importante de las confirmaciones.

## Regla 3: Aviso por falta de respuesta

El aviso marca el pedido como **Sin respuesta** cuando el cliente sigue sin responder después del tiempo que configuraste.

### Valor recomendado

- Empieza con **24 horas** después del recordatorio. Es el valor predeterminado.
- Deja el aviso para después del recordatorio.

### Uso operativo

Usa Sin respuesta como una cola de revisión para tu operación.

- Reintenta manualmente los pedidos de mayor valor.
- Cancela los pedidos de poca confianza según tu política.

> [!WARNING]
> Si el aviso llega demasiado pronto, puedes bloquear pedidos válidos que habrían respondido más tarde.

### Cancelar automáticamente los pedidos sin respuesta

Puedes dejar que Akeed cancele un pedido en tu tienda cuando queda **Sin respuesta**. Está desactivado hasta que lo activas en **Tiempos y recordatorio** dentro de Configuración, y necesita el aviso de pedidos sin respuesta. La cancelación ocurre en el momento en que el pedido queda **Sin respuesta**, así que tu plazo del aviso por falta de respuesta es también el plazo de cancelación.

Akeed cancela un pedido solo cuando se cumple todo esto:

- Se entregó la confirmación y, si tocaba, el recordatorio.
- El cliente no confirmó ni canceló. Akeed ignora los mensajes que no puede leer como una confirmación o una cancelación.
- No excluiste el pedido con **No cancelar automáticamente**.
- La tienda todavía muestra el pedido sin pagar y sin enviar.

Si Akeed no pudo enviar o entregar un mensaje, por ejemplo porque se agotó tu plan o tus créditos, la cancelación se pone en pausa. Akeed nunca cancela un pedido por sus propios límites de envío.

En Shopify eliges si se repone el inventario y si Shopify avisa al cliente. WooCommerce y EasyOrders siguen la configuración de tu tienda. Un pedido cancelado muestra **Sin respuesta tras los intentos de confirmación**. Si el cliente confirma después, el pedido muestra **Confirmó tras cancelar** y pasa a **Requieren tu acción** para que lo contactes. El pedido sigue cancelado. Cualquier otro mensaje después de la cancelación se ignora.

Desactivar la opción detiene todas las cancelaciones que aún no llegaron a tu tienda.

## Regla 4: Horario de silencio

El horario de silencio evita los envíos durante ciertas horas locales (por ejemplo, de madrugada).

### Uso recomendado

- Viene activado de forma predeterminada, de 22:00 a 09:00 en tu zona horaria. Desactívalo solo si tus clientes esperan mensajes de noche.
- Define el inicio y el fin según el comportamiento de tu mercado.

### Importante

Los mensajes se retrasan hasta que termina el horario de silencio.

Si tu equipo ve muchos casos pendientes o sin respuesta por la mañana, comprueba si el horario de silencio está retrasando los envíos más de lo esperado.

## Regla 5: Zona horaria

La zona horaria define cómo se aplica el horario de silencio.

Usa la misma zona horaria de tu equipo principal de operaciones y de tus clientes.

## Plantillas prácticas de configuración

| Tipo de tienda | Retraso inicial | Recordatorio | Aviso | Horario de silencio |
| --- | ---: | ---: | ---: | --- |
| Tienda con preparación rápida | 0–10 min | 60 min | 240 min | Opcional |
| Configuración equilibrada | 0 min | 360 min | 1440 min tras el recordatorio | 22:00–09:00 |

Úsalas como punto de partida y luego ajústalas cada semana con tus tasas de respuesta y de confirmación.

## Errores comunes

| Error | Mejor opción |
| --- | --- |
| Recordatorio desactivado desde el primer día | Deja un recordatorio activo y mide primero su efecto. |
| Aviso demasiado cerca del primer envío | Deja tiempo suficiente de respuesta entre el primer envío, el recordatorio y el aviso. |
| Horario de silencio activado con la zona horaria equivocada | Vuelve a comprobar la zona horaria después de cambiar la configuración. |
| Cambiar las reglas todos los días | Haz los cambios en ciclos semanales controlados y compara los resultados. |

## Solución de problemas

### La tasa de respuesta bajó después de cambiar las reglas

- Vuelve a los tiempos estables anteriores.
- Comprueba si el horario de silencio bloquea ahora las horas de mayor respuesta.
- Haz un solo cambio de tiempos a la vez.

### Demasiados pedidos en Sin respuesta

- Aumenta el plazo del aviso.
- Comprueba que el recordatorio esté activado.
- Reduce el retraso del primer envío si los mensajes salen demasiado tarde.

### Los clientes se quejan de la hora de los mensajes

- Activa el horario de silencio.
- Pasa los envíos al horario diurno de la zona horaria local.

## Preguntas frecuentes

### ¿Todas las tiendas deben usar las mismas reglas de automatización?

No. Ajusta las reglas según el comportamiento de tus pedidos, los hábitos de tu público y la capacidad de tu equipo de soporte.

### ¿Basta con un recordatorio?

En la mayoría de las tiendas, sí. Un recordatorio suele recuperar casi todas las respuestas recuperables sin resultar invasivo.

### ¿Cuál es el mejor plazo para el aviso?

No hay un valor universal. Empieza con 24 horas después del recordatorio y ajusta según los patrones reales de respuesta.

### ¿Dónde se comprueba si las reglas funcionan?

Sigue en tu panel la tasa de respuesta, la tasa de confirmación, el volumen de pedidos sin respuesta y los envíos fallidos.

Consulta también: [Confirmación de pedidos](/docs/order-confirmation)
