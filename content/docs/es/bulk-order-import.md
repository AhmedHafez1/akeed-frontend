---
title: Importación masiva de pedidos
description: Importa pedidos contra entrega desde un archivo CSV o Excel, revísalos e inicia la confirmación por WhatsApp de todos a la vez.
order: 5
slug: bulk-order-import
---

## Resumen

La importación masiva de pedidos te permite cargar en Akeed muchos pedidos con pago contra entrega (COD) desde una hoja de cálculo, en lugar de agregarlos uno por uno.

**CSV o XLSX → Relacionar columnas → Vista previa de los pedidos → Importar → Iniciar la confirmación por WhatsApp**

Importar nunca envía mensajes a nadie por sí solo. Solo se contacta a los clientes cuando presionas **Enviar**, y solo después de que viste cuántos mensajes saldrán y cuánto costarán.

La importación masiva está disponible en las cuentas independientes. Si usas Akeed en Shopify, tus pedidos ya llegan automáticamente. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform).

> [!INFO]
> Solo los propietarios y administradores pueden importar pedidos. Los usuarios de solo lectura pueden ver los pedidos importados en la lista de Confirmaciones, pero no pueden importarlos ni cambiarlos.

## Antes de empezar

| Requisito | Detalles |
| --- | --- |
| Tipo de archivo | `.csv` o `.xlsx`. No se aceptan archivos `.xls` antiguos, archivos con macros ni archivos protegidos con contraseña. |
| Tamaño | Hasta 5 MB y 100 pedidos por archivo. Si tienes más pedidos, divide el archivo e importa cada parte. |
| Fila de encabezados | La primera fila debe contener los nombres de las columnas. |
| Columnas mínimas | Teléfono del cliente, nombre del cliente e importe del pedido. |
| Créditos | Créditos suficientes para todos los pedidos que quieres confirmar. Consulta [Usar Akeed sin Shopify](/docs/standalone-platform). |

¿No tienes un archivo listo? Descarga la plantilla de ejemplo en **CSV** o **Excel** en la pantalla de carga, en árabe o en inglés.

Columnas opcionales que Akeed puede usar: número de pedido, moneda, método de pago, fecha del pedido, ciudad, dirección y notas.

## Paso a paso

### 1. Elige tu archivo

Selecciona **Importar desde un archivo** en la barra superior y luego arrastra tu archivo o elígelo desde tu dispositivo. Akeed lee el archivo y pasa solo al siguiente paso.

### 2. Relaciona las columnas

Akeed relaciona automáticamente los nombres de tus columnas con sus propios campos, en árabe o en inglés, sin tener en cuenta las mayúsculas ni la puntuación. Las columnas relacionadas se marcan como **Relacionada**. En los elementos marcados como **Revisa esto** u **Obligatoria**, tienes que elegir la columna correcta de una lista. Las columnas que Akeed no puede relacionar no se importan.

Revisa también la configuración de la importación:

| Ajuste | Para qué sirve |
| --- | --- |
| País de los teléfonos | Se usa para leer los números de teléfono escritos sin código de país. |
| Moneda predeterminada | Se usa en las filas que no tienen moneda. |
| Formato de fecha | Se pregunta solo cuando fechas como `05/06/2026` se pueden leer de dos formas. |

Si tu archivo tiene una columna de pago, Akeed pregunta **¿Qué pedidos confirmamos?** y ordena los valores que usas en dos grupos, **Confirmar · pago contra entrega** y **Omitir · pago por adelantado**. Toca un valor para moverlo. Akeed recuerda tus elecciones para tus próximos archivos.

### 3. Revisa la vista previa de los pedidos

Akeed revisa cada fila y muestra cuántos pedidos están listos y por qué se omitirán los demás. Aún no se ha importado nada. Usa **Cambiar** o **Mostrar** junto a un motivo para ver las filas.

| Resultado | Significado | Qué hacer |
| --- | --- | --- |
| Listo | Se importará y se confirmará. | Nada. |
| Requiere corrección | Falta un dato obligatorio o no es válido, como un número de teléfono. | Corrige el número en pantalla, o corrige el archivo y súbelo de nuevo. |
| Duplicado | Ya se importó antes o se repite en el mismo archivo. | Nada. No se importará de nuevo. |
| Excluido | Se omite a propósito. Consulta los motivos más abajo. | Déjalo así, o inclúyelo si era un posible duplicado. |

Las filas se excluyen cuando el pago no es contra entrega, cuando la fecha del pedido tiene más de 7 días o cuando parece un pedido que ya tienes (el mismo teléfono e importe en los últimos 7 días, o el mismo número de pedido en los últimos 30 días). Si sabes que un posible duplicado es un pedido nuevo real, elige **Incluir de todos modos**.

### 4. Importa e inicia la confirmación

La vista previa termina con el costo y el tiempo: la cantidad de mensajes, hasta el doble si los recordatorios están activados, tu saldo después del envío y el tiempo estimado. Presiona **Enviar a N clientes**.

Akeed importa entonces los pedidos listos e inicia la confirmación. Puedes seguir el estado de cada pedido en **Confirmaciones**.

> [!WARNING]
> Si tu saldo no cubre todos los pedidos, o la confirmación automática está desactivada, **Enviar** se bloquea y no se envía nada. Akeed muestra cuántos créditos te faltan y un botón **Comprar créditos**. No hay inicios parciales.

## Qué reconoce Akeed

No necesitas cambiar el nombre de tus columnas. Akeed reconoce los nombres comunes en inglés y en árabe, incluidos los que usan las exportaciones de pedidos de Shopify.

| Dato | Ejemplos de nombres reconocidos |
| --- | --- |
| Teléfono del cliente | Phone, Mobile, Shipping Phone, Billing Phone, WhatsApp, رقم الهاتف, الموبايل |
| Nombre del cliente | Customer name, Full name, Shipping Name, الاسم, اسم العميل. Las columnas de nombre y apellido se unen. |
| Importe | Amount, Total, Price, COD Amount, الإجمالي, المبلغ |
| Número de pedido | Order ID, Order Number, Name (cuando contiene valores como `#1001`), رقم الطلب |
| Moneda | Currency, العملة |
| Método de pago | Payment Method, Payment, Financial Status, طريقة الدفع |
| Fecha del pedido | Order Date, Created at, التاريخ |
| Ciudad y dirección | City, Governorate, Shipping City, Address, Shipping Street, المدينة, العنوان |

Las columnas de correo electrónico y de productos (líneas de artículos) no se importan. Las exportaciones de Shopify tienen una fila por producto. Las filas con el mismo número de pedido, teléfono e importe se combinan en un solo pedido.

### Números de teléfono

- Si un archivo tiene más de una columna de teléfono, Akeed usa primero el **teléfono de envío**, luego el **teléfono** y después el **teléfono de facturación**. Puedes elegir otra columna.
- Los números se convierten al formato internacional. Un número que empieza con `+` o `00` conserva su propio país. Los demás números usan tu **País de los teléfonos**, que de forma predeterminada es el país de tu tienda o Egipto.
- Los números egipcios que perdieron el cero inicial en Excel se reparan.
- Los teléfonos fijos, las celdas con dos números y los números que Excel convirtió a notación científica (como `2.01E+11`) se rechazan, porque WhatsApp necesita un solo número móvil válido. Da formato de texto a la columna de teléfono o corrige el número en la pantalla de vista previa.

### Moneda e importes

- La moneda se toma de la columna de moneda de la fila. Si no hay, Akeed también lee un código o símbolo escrito en el importe (como `EGP 750` o `750 ج.م`). Si eso también falta, usa tu moneda predeterminada.
- Monedas compatibles: EGP, SAR, AED, QAR, KWD, BHD, OMR, JOD, MAD, USD y EUR.
- Los importes deben ser mayores que cero y tener como máximo dos decimales. Se entienden los dígitos árabes. Si una coma puede significar miles o decimales, Akeed te pide que corrijas esa fila en lugar de adivinar.

## Relación de columnas guardada

Cuando continúas después del paso de columnas, Akeed guarda tu relación de columnas. La próxima vez que subas un archivo con los mismos nombres de columnas, en cualquier orden, se aplica automáticamente. Aun así puedes revisarla y cambiarla. También se recuerdan tus elecciones de pago contra entrega para los valores de pago.

## Pedidos en espera y seguridad

Después de la importación, y antes de que empiece la confirmación, los pedidos quedan **en espera** y aparecen como **Esperando inicio** en la lista de Confirmaciones. A un pedido en espera no se le ha enviado ningún mensaje.

Normalmente nunca ves este estado, porque **Enviar** importa e inicia en una sola acción. Solo lo ves si el inicio se bloquea después de la importación, por ejemplo si tu saldo cambió. En ese caso los pedidos esperan, y puedes iniciarlos desde la pantalla de importación.

| Regla | Detalles |
| --- | --- |
| Inicio | Al iniciar, se envía a todos los pedidos en espera de esa importación. Para dejar un pedido fuera, quítalo del archivo y súbelo de nuevo antes de enviar. |
| Plazo de inicio | Los pedidos en espera deben iniciarse en un plazo de 24 horas. De lo contrario se retiran sin costo, y puedes subir el archivo de nuevo. |
| Ritmo | Akeed envía de forma gradual, unos 20 primeros mensajes por minuto, para que la calidad de tu WhatsApp se mantenga en buen estado. |
| Horario de silencio | Si configuraste un horario de silencio en Configuración, el envío se pausa durante ese horario y se reanuda después. |
| Sin créditos | Si los créditos se agotan durante el envío, la importación se pausa. Compra créditos y elige **Reanudar**. |

## El mismo archivo dos veces: seguro por diseño

- Un pedido que tiene número de pedido se importa **una sola vez**, aunque subas el mismo archivo de nuevo o presiones Importar dos veces.
- Si subes el mismo archivo de nuevo en menos de 24 horas, Akeed te avisa y te deja continuar o ver la importación anterior.
- Los pedidos sin número de pedido reciben una referencia de Akeed. Si su teléfono e importe coinciden con un pedido reciente, se marcan como posibles duplicados y se dejan fuera a menos que los incluyas.

## Pedidos importados en la lista de Confirmaciones

Los pedidos importados están en la misma lista de **Confirmaciones** que todos los demás y funcionan igual: estado, recordatorio, tratamiento de la falta de respuesta, reintento y cancelación, y uso de créditos. Los estados previos al primer mensaje son **Esperando inicio**, **En cola** y **Enviando**.

## Privacidad y conservación

- Tu archivo en sí nunca se almacena. Akeed conserva solo su nombre, su tamaño y una huella digital.
- Una importación que no enviaste vence después de 24 horas y sus filas se eliminan.
- Los datos de las filas de las importaciones enviadas se eliminan después de 90 días. Los recuentos y el enlace a cada pedido se conservan.
- Los números de teléfono y los nombres no se escriben en los registros de Akeed.
- Puedes tener unas pocas importaciones en curso a la vez, y las cargas están limitadas a unas pocas por minuto.

## Solución de problemas

| Lo que ves | Qué hacer |
| --- | --- |
| Este tipo de archivo no es compatible | Guárdalo como Libro de Excel (`.xlsx`) o CSV UTF-8, sin macros ni contraseña. |
| Este archivo tiene demasiados pedidos | Divídelo en archivos de hasta 100 pedidos. |
| Necesitamos tu ayuda con una columna | Elige la columna correcta para el teléfono, el nombre o el importe en el paso de columnas. |
| Excel convirtió este teléfono en un número como 2.01E+11 | Da formato de texto a la columna de teléfono y exporta el archivo de nuevo. |
| Es un teléfono fijo | Reemplázalo por el número móvil del cliente. |
| No es pago contra entrega, así que no se confirmará | Revisa el valor de pago. Si realmente es contra entrega, muévelo a **Confirmar · pago contra entrega** en el paso de columnas. |
| El pedido tiene más de 7 días | Los pedidos tan antiguos ya no se pueden confirmar. Para omitir las comprobaciones de fecha, pon la fecha del pedido en **No está en el archivo** en el paso de columnas. |
| Compra créditos para empezar | Compra créditos para que tu saldo cubra todos los pedidos y presiona **Enviar** de nuevo. |
| La confirmación automática está desactivada | Actívala en Configuración y luego envía. |
| Esta importación venció | Sube el archivo de nuevo. |
| La importación no está disponible para esta tienda | La importación masiva es para cuentas independientes. Las tiendas Shopify reciben los pedidos automáticamente. |

## Preguntas frecuentes

### ¿Importar envía mensajes?

No. Los mensajes se envían solo después de que presionas **Enviar**, y Akeed muestra primero el costo.

### ¿Se pueden importar más de 100 pedidos?

No en un solo archivo. Divide el archivo en partes de hasta 100 pedidos e importa cada parte.

### ¿Se puede elegir qué pedidos confirmar después de la importación?

El inicio se aplica a toda la importación. Quita del archivo los pedidos que no quieras antes de presionar **Enviar**.

### ¿Qué pasa con los clientes que no responden?

Lo mismo que con cualquier otro pedido: un recordatorio y luego **Sin respuesta**. Consulta [Reglas de automatización](/docs/automation-rules).

### ¿Cuántos créditos usa una importación?

Un crédito por mensaje. Un archivo con 80 pedidos listos usa 80 créditos (EGP 160 a EGP 2.00 por crédito), o hasta 160 créditos si los recordatorios están activados y los clientes no responden.

### ¿Se puede descargar un informe de las filas omitidas?

Aún no. La pantalla de vista previa muestra el motivo de cada fila omitida.

## Guías relacionadas

- [Usar Akeed sin Shopify](/docs/standalone-platform)
- [Confirmación de pedidos](/docs/order-confirmation)
- [Reglas de automatización](/docs/automation-rules)
- [Solución de problemas](/docs/troubleshooting)
