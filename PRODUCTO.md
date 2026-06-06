# EstacionAR — Especificación de producto (documento maestro)

> **Esta es la definición oficial y vigente del producto EstacionAR.** Guía de producto, negocio
> y prioridades. Ante conflicto con otros documentos del repo (incluido el modelo económico de
> `CLAUDE.md`), **manda este documento**. Se trabaja por etapas (ver §21).
>
> Definido por Jorge Francesia (Nativos Consultora) · incorporado al repo el 2026-06-05.

---

# 1. Qué es EstacionAR

EstacionAR es una plataforma para digitalizar el estacionamiento medido de la Ciudad de Salta.

El objetivo no es solamente cobrar estacionamiento. El objetivo real es resolver estos problemas:

1. Que el ciudadano pueda pagar fácil, sin descargar una app obligatoria.
2. Que el permisionario cobre su parte de forma inmediata o lo más directa posible.
3. Que el Municipio tenga trazabilidad, comprobantes, control y reportes sin manejar fondos ni liquidar manualmente a cientos de permisionarios.
4. Que el sistema reemplace el talonario informal por operaciones registradas, verificables y auditables.
5. Que se pueda convivir con pago digital y efectivo registrado sin perder control.
6. Que se pueda fiscalizar por patente y detectar vencimientos, excedentes o permanencias no regularizadas.
7. Que los permisionarios queden vinculados a su credencial oficial municipal, legajo, turno y cuadra asignada.

La demo actual está hecha como una sola plataforma con tres perfiles/accesos. Esa dirección nos interesa porque simplifica mantenimiento, despliegue y evolución.

---

# 2. Arquitectura deseada

Preferimos una sola webapp/PWA con rutas por rol, no tres aplicaciones separadas.

Estructura conceptual:

* `/` o `/pagar/:qrId`: flujo ciudadano para escanear QR, cargar patente, elegir tiempo y pagar.
* `/permisionario`: acceso del permisionario.
* `/municipio`: backoffice municipal.
* `/login`: acceso para usuarios internos o con roles.

La separación real debe estar en:

* Rutas.
* Permisos.
* Roles.
* Backend/API.
* Base de datos.
* Validación de operaciones.
* Auditoría.
* Carga diferida/code splitting por sección.

No hace falta separar en tres deploys si una sola webapp con rutas protegidas, permisos y code splitting resuelve bien el producto.

Importante: no tomar esto como una obligación ciega. Primero revisar cómo está armado el repo actual y elegir la evolución de menor riesgo.

---

# 3. Stack orientativo

Adaptar al código real si ya hay decisiones tomadas.

* Webapp única/PWA: React + Vite + TypeScript o Next si así está la demo.
* Backend/API: NestJS o estructura actual si ya existe una razonable.
* Base de datos: PostgreSQL + PostGIS vía Supabase.
* Auth/Storage/Realtime: Supabase.
* Pagos: orquestador propio de pagos, no hardcodeado a una sola billetera.
* Notificaciones: WhatsApp Business API/email si está disponible o dejar preparado.
* Deploy: Vercel para webapp y backend según estructura actual.

No migrar stack sin necesidad. Priorizar continuidad y producción realista.

---

# 4. Roles del sistema

## Ciudadano / conductor

Debe poder pagar con la menor fricción posible.

Flujo ideal:

1. Escanea el QR del permisionario con la cámara del celular.
2. Se abre una pantalla web de EstacionAR.
3. Ingresa patente.
4. Elige tiempo o fracción.
5. Ve monto, descuento y resumen.
6. Elige medio de pago.
7. Paga en el entorno seguro correspondiente.
8. Vuelve a EstacionAR.
9. Recibe comprobante digital.

Reglas importantes:

* No debe descargar app obligatoriamente.
* No debe registrarse obligatoriamente para pagar.
* No debe cargar tarjeta manualmente dentro de EstacionAR como flujo principal.
* Puede existir cuenta opcional para guardar patente, historial o pagos frecuentes.
* El QR físico del permisionario debe abrir EstacionAR primero, no una billetera directa.
* El ciudadano debe poder pagar con la mayor cantidad posible de medios digitales usados en Argentina.
* Si existe una alerta temporal de excedente pendiente para la patente, debe mostrarse como aviso suave, no como bloqueo.

## Permisionario

Debe tener una experiencia muy simple, pensada para personas con distinto nivel de manejo tecnológico.

Funciones esperadas:

* Login o activación de cuenta.
* Ver recaudación del día.
* Ver movimientos.
* Ver pagos acreditados.
* Ver operaciones en efectivo.
* Ver deuda acumulada por efectivo.
* Pagar deuda acumulada con botón.
* Ver su QR único.
* Registrar pagos en efectivo si el Municipio lo permite.
* Confirmar efectivo recibido.
* Consultar historial.
* Reportar incidencias.
* Recibir notificaciones.
* Recibir avisos de patentes próximas a vencer, vencidas o con excedente.
* Cobrar excedentes o extensiones de tiempo.
* Marcar excedente no pagado si el vehículo se retira sin regularizar.
* Subir o completar documentación si su cuenta está observada.
* Instalar la PWA si la usa todos los días.

La carga inicial de permisionarios no debe pensarse uno por uno. Debe contemplarse importación masiva desde padrón municipal en Excel/CSV y también formulario individual.

## Municipio

Los administradores municipales pueden crearse manualmente porque son pocos.

Funciones esperadas:

* Panel de control.
* Alta, baja y edición de permisionarios.
* Importación masiva.
* Formulario individual de registro de permisionario.
* Gestión de zonas, cuadras, sectores y horarios.
* Configuración de tarifas y fraccionamiento.
* Reportes por fecha, zona, permisionario, tipo de pago y patente.
* Auditoría de operaciones.
* Exportación a Excel/PDF si ya está o si es viable.
* Vista de comprobantes.
* Control de pagos en efectivo registrados.
* Control de deuda por efectivo de cada permisionario.
* Validación documental de permisionarios.
* Control de credencial oficial municipal.
* Gestión de incidencias.
* Módulo simple de fiscalización por patente.
* Visualización de excedentes cobrados, pendientes, cancelados o vencidos.
* Historial de alertas temporales por patente.

---

# 5. Alta, validación y credencial oficial del permisionario

Agregar soporte para registrar y validar permisionarios usando la documentación oficial municipal.

El sistema debe permitir dos caminos de carga:

1. Importación masiva por Excel/CSV desde padrón municipal.
2. Formulario individual para altas, correcciones, casos nuevos o carga manual.

## Datos requeridos del permisionario

El formulario de registro debe contemplar:

* Nombre y apellido completo.
* DNI.
* Foto de DNI frente.
* Foto de DNI dorso.
* Número de permisionario o legajo municipal.
* Cuadra asignada: calle, entre qué calles, altura y mano.
* Turno: mañana o tarde.
* Foto de la credencial municipal vigente, obligatoria.
* Teléfono de contacto.
* Email si existe.
* Medio/cuenta de acreditación.
* Observaciones internas.

También puede contemplarse como respaldo adicional:

* Decreto, resolución o acto administrativo de adjudicación del espacio, cuando exista.
* Período de vigencia de la credencial.
* Estado documental: completo, incompleto, observado, vencido.

## Credencial oficial municipal

La credencial oficial es el carnet físico emitido por el Municipio. Debe considerarse como documento principal de validación del permisionario.

Debe permitir registrar:

* Foto del trabajador.
* Nombre.
* DNI.
* Número de legajo.
* Cuadra exacta asignada.
* Mano o sector asignado.
* Turno.
* Período de vigencia.
* Foto o escaneo del carnet.

La aplicación no reemplaza la credencial municipal: la digitaliza, la vincula al perfil del permisionario y permite controlarla desde el sistema.

## QR municipal existente

Si la credencial o chaleco del permisionario ya incluye un QR municipal, el sistema debe contemplar la posibilidad de registrarlo.

Opciones:

* Cargar foto de la credencial con QR.
* Escanear el QR municipal durante el alta.
* Guardar el contenido leído del QR como dato de respaldo.
* Si existe API municipal disponible, cruzar datos automáticamente.
* Si no existe API, dejarlo como validación visual/manual para soporte o para el Municipio.

No depender de la API municipal para el MVP. El sistema debe funcionar con validación documental y carga manual/asistida.

## Regla de negocio: permiso personal e intransferible

El permiso municipal es personal e intransferible.

La plataforma debe impedir o advertir inconsistencias cuando:

* El titular de la credencial no coincide con el DNI cargado.
* El nombre/DNI del permisionario no coincide con la cuenta de acreditación declarada, cuando ese dato pueda validarse.
* Un mismo DNI aparece en más de una cuenta activa sin justificación.
* Un mismo legajo municipal aparece duplicado.
* Una misma cuadra/turno se asigna a más de un permisionario activo sin autorización.
* La credencial está vencida, ilegible u observada.

La cuenta de cobro o canal de acreditación debe estar vinculada al titular habilitado por el Municipio. Si no se puede validar automáticamente, debe quedar como pendiente de revisión.

## Estados sugeridos de validación

Para permisionarios:

* `draft`
* `pending_validation`
* `observed`
* `approved`
* `rejected`
* `inactive`
* `expired`

Para documentación:

* `pending`
* `uploaded`
* `verified`
* `observed`
* `expired`
* `rejected`

## Funciones para el panel municipal

El panel municipal debe permitir:

* Ver permisionarios pendientes de validación.
* Aprobar, observar o rechazar registros.
* Ver documentación cargada.
* Ver credencial municipal.
* Ver QR municipal si fue cargado o escaneado.
* Editar cuadra, turno, vigencia y estado.
* Descargar o imprimir credencial/QR de EstacionAR.
* Consultar historial de cambios.
* Detectar duplicados por DNI, legajo, teléfono o cuadra/turno.

## Funciones para el permisionario

El permisionario debe poder:

* Completar datos faltantes.
* Subir foto de DNI frente/dorso.
* Subir foto de credencial municipal.
* Subir respaldo de adjudicación si corresponde.
* Ver si su cuenta está pendiente, aprobada u observada.
* Corregir documentación observada.
* Ver su QR de EstacionAR una vez aprobado.

No permitir operación plena si el permisionario no está aprobado, salvo modo demo o excepción administrativa.

---

# 6. Regla central del QR

El QR del permisionario debe ser un QR de EstacionAR.

No debe ser un QR directo de Mercado Pago, Naranja X, MODO u otra billetera, porque si el pago va directo a una billetera se pierde parte del valor del sistema:

* Patente.
* Tiempo.
* Fraccionamiento.
* Tarifa.
* Descuento.
* Permisionario.
* Zona.
* Comprobante.
* Auditoría.
* Trazabilidad municipal.
* Distribución económica.
* Tiempo portable por patente.
* Posibilidad de cobrar excedentes.
* Historial de patente.

El QR debe abrir una orden de EstacionAR asociada al permisionario.

Ejemplo conceptual:

`/pagar/:qrId`

El sistema identifica:

* Permisionario.
* Zona/cuadra si corresponde.
* Turno si corresponde.
* Estado del permisionario.
* Tarifa aplicable.
* Medios de pago disponibles.

Después el ciudadano carga patente y tiempo, y recién ahí se genera la orden de pago.

---

# 7. Pagos: separar ciudadano de permisionario

Es muy importante no mezclar dos cosas distintas:

## A. Cómo paga el ciudadano

El ciudadano debe poder pagar con la mayor cantidad posible de medios digitales usados en Argentina.

El diseño del producto debe contemplar desde el inicio:

* Mercado Pago.
* MODO.
* Naranja X.
* Tarjetas de débito.
* Tarjetas de crédito.
* Billeteras bancarias.
* QR interoperable si técnicamente corresponde.
* Otros medios digitales integrables.

La experiencia pública no debe diseñarse como “solo Mercado Pago”. El ciudadano debe sentir que puede pagar con el medio que ya usa.

## B. Cómo cobra el permisionario

Esto es distinto. Para acreditar al permisionario y sostener el esquema 80/10, se puede priorizar el canal que mejor soporte split, marketplace o liquidación automática.

Si Mercado Pago es el proveedor que mejor se adapta inicialmente al split/acreditación, se puede usar como canal principal de liquidación para el permisionario en primera etapa.

Pero eso no debe limitar los medios de pago visibles para el ciudadano.

Regla del producto:

* El ciudadano elige entre múltiples medios de pago.
* EstacionAR crea y controla la orden de estacionamiento.
* El backend procesa la operación.
* La acreditación al permisionario se realiza por el canal compatible configurado para la liquidación.
* El sistema debe quedar preparado para sumar otros canales si más adelante permiten una liquidación equivalente.

---

# 8. Payment Orchestrator

Diseñar una capa de pagos que permita sumar proveedores.

No hace falta implementar todos de una vez, pero la arquitectura no debe quedar atada a Mercado Pago en cada componente.

Idea conceptual:

* `PaymentProvider`
* `MercadoPagoProvider`
* `ModoProvider`
* `NaranjaProvider`
* `CardGatewayProvider`
* `CashProvider`

Flujo conceptual para pago de estacionamiento:

1. `POST /parking-orders`
2. Backend crea orden pendiente.
3. `POST /parking-orders/:id/payment-intent`
4. Backend devuelve opciones/checkout según proveedor.
5. Usuario paga.
6. Webhook confirma.
7. Backend marca orden como pagada.
8. Se genera comprobante.
9. Se activa tiempo.
10. Se registra movimiento para permisionario.
11. Paneles se actualizan.

Para el MVP, si conviene, puede estar implementado con un primer proveedor real y mocks controlados para el resto, pero dejando la arquitectura preparada.

---

# 9. Pago en efectivo registrado

Agregar soporte para pago en efectivo, pero no como pago libre sin control.

La decisión de producto es usar efectivo registrado con deuda acumulada del permisionario, no saldo prepago.

No queremos obligar al permisionario a cargar saldo antes de operar. El flujo de saldo prepago agrega fricción y complica el uso. En esta etapa preferimos que el sistema acumule deuda por el porcentaje de plataforma correspondiente y permita pagarla con un botón.

## Flujo de efectivo

1. El ciudadano escanea el QR de EstacionAR.
2. Carga patente y tiempo.
3. Elige “Efectivo” como método de pago.
4. El sistema crea una orden en estado `pending_cash_confirmation`.
5. El ciudadano entrega el efectivo al permisionario.
6. El permisionario confirma desde su panel “Efectivo recibido”.
7. Recién al confirmar, el sistema marca la orden como `cash_confirmed`.
8. Se activa el tiempo de estacionamiento.
9. Se genera comprobante digital.
10. Se registra automáticamente una deuda del permisionario hacia Nativos por el porcentaje correspondiente de plataforma.
11. La deuda se acumula en una cuenta corriente del permisionario.
12. El permisionario puede pagar esa deuda desde su panel mediante un botón “Pagar deuda”, usando un checkout digital dirigido a la cuenta de Nativos.

## Reglas del efectivo

* El comprobante no se genera solo porque el ciudadano eligió efectivo.
* El comprobante se genera cuando el permisionario confirma que recibió el efectivo.
* Cada operación en efectivo confirmada genera un movimiento de deuda.
* La deuda debe verse en el dashboard del permisionario.
* Debe existir historial de operaciones en efectivo incluidas en la deuda.
* Debe existir botón para pagar deuda.
* Si la deuda supera un monto o antigüedad configurable, mostrar advertencia.
* Si supera un límite crítico, restringir temporalmente nuevos registros de efectivo para ese permisionario.
* No bloquear necesariamente los pagos digitales, porque esos no generan deuda manual.
* El Municipio debe poder ver deuda, operaciones en efectivo y estado de rendición por permisionario.

## Estados sugeridos

Para órdenes de efectivo:

* `pending_cash_confirmation`
* `cash_confirmed`
* `cash_cancelled`
* `expired_without_confirmation`

Para deuda:

* `pending`
* `partially_paid`
* `paid`
* `overdue`
* `restricted`

Adaptar nombres al código existente si ya hay convenciones.

---

# 10. Pago de deuda del permisionario

Agregar o dejar preparado un flujo de “Pagar deuda” para el permisionario.

La deuda nace de operaciones en efectivo confirmadas.

Ejemplo:

* Ciudadano paga efectivo.
* Permisionario confirma.
* EstacionAR activa tiempo.
* Se genera deuda por el porcentaje correspondiente de Nativos.
* Esa deuda se acumula.
* El permisionario entra a su panel y paga con botón.
* Ese pago va a la cuenta de Nativos.

El pago de deuda no es una orden de estacionamiento. Es una operación de cancelación de deuda de plataforma.

Datos deseados:

* ID de deuda/movimiento.
* Permisionario.
* Operaciones incluidas.
* Monto total.
* Monto pagado.
* Saldo pendiente.
* Fecha de generación.
* Fecha de vencimiento si aplica.
* Estado.
* Checkout/payment intent asociado.
* Comprobante interno de cancelación.

No hacer un sistema contable gigante si no hace falta. Primero resolver lo funcional: acumular deuda, mostrarla, pagarla, marcarla como pagada y auditarla.

---

# 11. Fraccionamiento y tarifas

El sistema debe estar preparado para modificar el fraccionamiento sin tocar código.

Actualmente se contempla tarifa por hora, pero existe la posibilidad de modificar la ordenanza para permitir cobro cada 30 minutos.

Ejemplo:

* Auto/camioneta: $700 por hora.
* Fracción de 30 minutos: $350.
* Motocicleta: tarifa diferenciada.
* Puede haber horarios, zonas, feriados o períodos especiales.

Debe existir un motor de tarifas configurable desde el panel municipal o al menos una estructura preparada para soportarlo.

Parámetros deseados:

* Tipo de vehículo.
* Tarifa base.
* Unidad mínima de cobro: 15, 30, 60, 90 o 120 minutos.
* Duración personalizada si el Municipio la habilita.
* Horario diurno/nocturno.
* Zona o corredor.
* Feriados sin cobro si aplica.
* Tolerancia.
* Tiempo portable por patente.
* Descuento por pago digital.
* Vigencia de tarifa desde/hasta.

---

# 12. Modelo económico base

Modelo conceptual actual:

* 80% para el permisionario.
* 10% para Nativos / plataforma / operación / mantenimiento.
* 10% de beneficio o descuento para el ciudadano.
* Municipio no maneja fondos y fiscaliza online.

No resolver legal o contablemente desde el código. El sistema debe ser flexible para parametrizar porcentajes, pero la propuesta actual usa 80/10/10.

Importante:

El 10% de Nativos no debe tratarse solo como “mantenimiento”. Representa plataforma, operación, soporte, hosting, seguridad, actualizaciones, mejoras y sostenimiento tecnológico.

---

# 13. Comprobante digital

Cada pago confirmado debe generar comprobante digital.

Debe quedar asociado a:

* ID de operación.
* Fecha y hora.
* Patente.
* Permisionario.
* Zona/cuadra si aplica.
* Tiempo adquirido.
* Inicio de vigencia.
* Fin de vigencia.
* Monto.
* Medio de pago.
* Estado del pago.
* Estado de acreditación/liquidación.
* Código verificable o QR de verificación si ya está previsto.

El ciudadano debe poder verlo al finalizar el pago y descargarlo o recibirlo por WhatsApp/email si el flujo lo permite.

El Municipio debe poder auditarlo desde el panel.

Para efectivo, el comprobante se emite solo después de confirmación del permisionario.

Para excedentes, no modificar ni pisar el comprobante original. El cobro de excedente debe generar una nueva operación vinculada.

---

# 14. Tiempo portable por patente

El tiempo de estacionamiento debe asociarse principalmente a la patente y a una ventana temporal, no solamente a una cuadra.

Si el conductor paga una fracción o una hora y se mueve dentro de una zona habilitada, el sistema debe poder reconocer el tiempo restante.

Esto permite:

* Mejor experiencia ciudadana.
* Menos conflicto con el permisionario.
* Base para fiscalización futura por patente.
* Reportes más útiles para movilidad urbana.

Regla central:

El control se realiza por patente + ventana de tiempo activa.

Si una persona paga 1 hora y permanece 5 horas, el sistema debe mostrar la patente como vencida una vez superado el horario pagado más la tolerancia configurada.

---

# 15. Fiscalización simple por patente

Agregar o dejar preparado un módulo simple de fiscalización por patente.

El objetivo inicial no es implementar cámaras ANPR ni actas complejas, sino permitir control rápido desde el panel municipal o desde un acceso de inspector.

Funciones mínimas:

* Buscar patente.
* Ver si tiene estacionamiento vigente, vencido o inexistente.
* Mostrar hora de inicio.
* Mostrar hora de vencimiento.
* Mostrar tolerancia.
* Mostrar zona/cuadra.
* Mostrar permisionario asociado.
* Mostrar comprobante.
* Mostrar método de pago.
* Permitir registrar observación de control.
* Notificar al permisionario cuando una patente vinculada a su zona esté vencida o próxima a vencer.
* Preparar estructura para futura etapa de actas digitales o lectura automática de patentes.

## Notificación al permisionario

Si una patente asociada a su zona/cuadra está vencida, próxima a vencer o fue observada por un inspector, el sistema puede notificar al permisionario.

Ejemplo:

“La patente AB123CD venció hace 18 minutos en tu sector. Verificar o solicitar renovación.”

La notificación puede ser inicialmente interna en la app/PWA y luego extenderse a WhatsApp si la integración está disponible.

No implementar un sistema complejo de multas en esta etapa salvo que ya exista algo avanzado. Primero resolver:

* consulta;
* estado;
* observación;
* notificación;
* trazabilidad.

---

# 16. Cobro de excedente o extensión de tiempo

Agregar soporte para cobrar excedentes cuando una patente supera el tiempo abonado.

El sistema debe detectar cuando una sesión de estacionamiento está vencida según patente, hora de inicio, hora de fin y tolerancia configurada. Al vencerse, puede notificar al permisionario asociado a la zona/cuadra y permitir una acción concreta: cobrar excedente o extender tiempo.

## Flujo esperado

1. El ciudadano paga una sesión de estacionamiento.
2. El sistema crea una ventana activa por patente con hora de inicio y hora de vencimiento.
3. Al superar el vencimiento más la tolerancia, la sesión pasa a estado `expired` o `overdue`.
4. El sistema notifica al permisionario correspondiente.
5. El permisionario puede abrir la sesión vencida y tocar “Cobrar excedente”.
6. El sistema calcula el monto según fracción configurable.
7. El permisionario puede cobrar 15, 30, 60, 90, 120 minutos o una duración personalizada si está habilitada.
8. El sistema también puede sugerir automáticamente la fracción según el tiempo excedido.
9. El permisionario puede registrar el cobro del excedente por medio digital o efectivo registrado.
10. Si el excedente se paga digitalmente, se procesa como una nueva orden vinculada a la sesión original.
11. Si el excedente se paga en efectivo, requiere confirmación del permisionario y genera deuda acumulada para Nativos igual que cualquier efectivo registrado.
12. Al confirmarse el excedente, el sistema genera comprobante digital y extiende la vigencia o crea una operación vinculada a la sesión original.

## Regla de auditoría

No modificar ni pisar el comprobante original.

El cobro de excedente debe quedar como una operación nueva vinculada a la sesión inicial, para mantener trazabilidad clara.

Ejemplo:

* Sesión original: patente AB123CD, vigente de 10:00 a 11:00.
* Excedente detectado: 11:20.
* Cobro de excedente: 30 minutos.
* Nueva operación vinculada: 11:00 a 11:30.
* Comprobante de excedente generado.
* Historial completo visible para permisionario, ciudadano si corresponde y Municipio.

## Estados sugeridos

Para sesiones:

* `active`
* `expiring_soon`
* `expired`
* `overdue`
* `extended`
* `closed`

Para excedentes:

* `pending_excess_payment`
* `excess_paid`
* `excess_cash_pending_confirmation`
* `excess_cash_confirmed`
* `excess_cancelled`

Adaptar nombres al código existente si ya hay convenciones.

## Restricciones

* No generar excedente si la patente ya tiene una nueva sesión activa que cubre ese período.
* No permitir duplicar cobros de excedente sobre la misma ventana temporal.
* Registrar usuario, fecha, hora, patente, permisionario, zona, monto, método de pago y comprobante.
* El Municipio debe poder ver excedentes cobrados, pendientes y cancelados.
* El permisionario debe recibir notificación de patentes vencidas o próximas a vencer dentro de su zona asignada.

---

# 17. Excedente no pagado e historial temporal de patente

Agregar soporte para registrar excedentes no regularizados cuando una patente supera el tiempo abonado y el vehículo se retira sin pagar la diferencia.

El objetivo no es crear una deuda permanente ni perseguir al ciudadano indefinidamente, sino dejar una alerta operativa temporal para que el sistema pueda sugerir regularización si la patente vuelve a operar dentro de un plazo razonable.

## Si el ciudadano se va sin pagar el excedente

Si el vehículo se retira o el permisionario registra que no pudo cobrar el excedente, el sistema debe permitir marcar la sesión como `excess_left_unpaid`.

En ese caso:

* Se registra el excedente no pagado.
* Se guarda patente, fecha, hora, zona, permisionario, monto sugerido, tiempo excedido y observación.
* Se crea una alerta temporal asociada a la patente.
* La alerta puede aparecer si la misma patente vuelve a estacionar dentro del plazo configurado.
* La alerta no debe bloquear el nuevo estacionamiento.
* La alerta debe permitir regularizar el excedente si el ciudadano acepta.
* La alerta debe vencer automáticamente luego de un plazo configurable, por ejemplo 24, 48 o 72 horas.

## Regla para evitar molestias al ciudadano

El excedente no pagado no debe quedar como una deuda permanente visible para todos los permisionarios indefinidamente.

Debe funcionar como aviso temporal y operativo.

Cuando vence el plazo de alerta:

* Deja de mostrarse como pendiente activo al permisionario.
* Queda solo en historial municipal para análisis, control y reportes.
* No se debe intentar cobrar automáticamente en futuras operaciones salvo decisión explícita del Municipio.

## Regularización posterior

Si la patente vuelve a estacionar mientras la alerta está activa, el sistema puede mostrar al permisionario o al ciudadano un aviso:

“Esta patente registra un excedente pendiente reciente. ¿Desea regularizarlo?”

Si se regulariza:

* Se genera una operación de pago de excedente vinculada a la sesión original.
* Puede pagarse por medio digital o efectivo registrado.
* Si se paga en efectivo, requiere confirmación del permisionario y genera deuda acumulada para Nativos como cualquier efectivo registrado.
* Se emite comprobante de regularización.
* La alerta pasa a estado `excess_paid`.

## Estados sugeridos

Para excedentes y alertas:

* `overdue_detected`
* `excess_payment_pending`
* `excess_paid`
* `excess_left_unpaid`
* `excess_alert_active`
* `excess_alert_expired`
* `excess_cancelled`

Adaptar nombres al código existente si ya hay convenciones.

## Restricciones

* No duplicar cobros por la misma ventana excedida.
* No permitir que varios permisionarios cobren el mismo excedente.
* No bloquear el pago de una nueva sesión por tener un excedente temporal pendiente.
* Permitir vencimiento automático de alertas.
* Mantener historial visible para el Municipio.
* Registrar toda acción con usuario, fecha, hora, patente, zona y observación.

---

# 18. Importación masiva y onboarding de permisionarios

Priorizar una solución simple para cargar muchos permisionarios.

Revisar si ya existe algo en el código. Si no existe, proponer o implementar:

* Importación CSV/Excel desde backoffice.
* Validación de columnas.
* Preview antes de confirmar.
* Detección de duplicados por DNI, credencial, legajo, teléfono o cuadra/turno.
* Creación de perfiles en estado pendiente.
* Generación de QR por permisionario.
* Exportación/impresión de credenciales.
* Activación posterior por teléfono, DNI, código o gestión manual.
* Alternativa de formulario individual para carga manual.

No complicar de más si el estado actual del proyecto está en demo. Primero dejar una base limpia y extensible.

---

# 19. Seguridad y permisos

El frontend puede ser una sola webapp, pero la seguridad debe estar en backend/API y base de datos.

Reglas:

* Ningún endpoint sensible debe depender solo de ocultar pantallas en el frontend.
* El rol debe validarse del lado servidor.
* El ciudadano no debe acceder a datos de permisionarios ni municipio.
* El permisionario solo ve su propia información.
* Supervisores pueden ver sectores asignados.
* Admin municipal puede ver todo lo municipal.
* Superadmin/Nativos puede administrar configuración técnica si corresponde.
* Registrar logs de operaciones sensibles.
* No permitir operación plena a permisionarios no aprobados salvo modo demo o excepción administrativa.
* Auditar cambios de cuadra, turno, credencial, legajo y estado documental.

Roles sugeridos:

* `citizen` opcional.
* `permit_holder` o `permisionario`.
* `municipal_operator`.
* `municipal_inspector`.
* `municipal_admin`.
* `super_admin`.

Adaptar nombres al código existente si ya hay convenciones.

---

# 20. Demo actual vs producción

La demo actual sirve para mostrar los tres perfiles de forma simple.

No eliminar lo que ya funciona salvo que sea necesario.

Objetivo:

* Mantener la demo navegable.
* Evolucionarla hacia producción.
* Evitar reescrituras innecesarias.
* Mejorar arquitectura donde haga falta.
* Priorizar flujos completos sobre pantallas decorativas.

Antes de tocar fuerte, revisar:

* Estructura del repo.
* Rutas actuales.
* Estado del backend.
* Estado de Supabase/base.
* Si hay mocks.
* Si hay datos hardcodeados.
* Si hay componentes reutilizables.
* Si hay flujo real o simulado de pagos.
* Qué falta para una demo más convincente.

---

# 21. Prioridades de desarrollo

Trabajar por etapas.

## Etapa 1 — Revisión y plan corto

* Analizar el estado actual del repo.
* Identificar qué ya existe.
* Identificar qué está mockeado.
* Detectar inconsistencias con este criterio.
* Proponer un plan corto de implementación.
* Evitar cambios grandes sin necesidad.

## Etapa 2 — Ordenar producto y rutas

* Confirmar estructura de rutas.
* Asegurar que ciudadano, permisionario y municipio estén separados por experiencia.
* Mantener una sola webapp/PWA.
* Mejorar navegación y estados.
* Dejar claro qué es demo y qué es real.

## Etapa 3 — Modelo de datos base

Diseñar o revisar entidades:

* Users.
* Roles.
* Permisionarios.
* Documentación de permisionarios.
* Credenciales municipales.
* Legajos municipales.
* Municipios.
* Zonas.
* Cuadras.
* Turnos.
* Tarifas.
* Vehículos/patentes.
* Órdenes de estacionamiento.
* Pagos.
* Comprobantes.
* Movimientos/acreditaciones.
* Deudas por efectivo.
* Pagos de deuda.
* Incidencias.
* Observaciones de fiscalización.
* Sesiones de estacionamiento.
* Excedentes.
* Alertas temporales por patente.
* Auditoría.

No crear complejidad innecesaria si el proyecto todavía está en MVP, pero evitar estructuras que impidan crecer.

## Etapa 4 — Alta y validación de permisionarios

* Importación Excel/CSV.
* Formulario individual.
* Carga de DNI frente/dorso.
* Carga de credencial municipal vigente.
* Registro de legajo municipal.
* Registro de cuadra asignada, mano y turno.
* Registro opcional de decreto/resolución.
* Registro o lectura de QR municipal si existe.
* Estados de validación.
* Detección de duplicados.
* Aprobación/observación/rechazo desde panel municipal.
* Generación de QR de EstacionAR solo para permisionarios aprobados o bajo excepción administrativa.

## Etapa 5 — Flujo ciudadano completo

* QR de EstacionAR.
* Pantalla de pago por patente.
* Selector de tiempo/fracción.
* Cálculo de tarifa.
* Selección de medio de pago.
* Opción de efectivo.
* Estado de pago.
* Comprobante.
* Manejo de error/cancelación.
* Aviso suave si existe alerta temporal de excedente pendiente.
* Opción de regularizar excedente si corresponde.

## Etapa 6 — Permisionario

* Login.
* Dashboard simple.
* Recaudación del día.
* Movimientos.
* QR propio.
* Confirmación de efectivo.
* Deuda acumulada por efectivo.
* Botón para pagar deuda.
* Incidencias.
* Historial.
* Notificaciones.
* Patentes próximas a vencer.
* Patentes vencidas.
* Cobro de excedente.
* Marcar excedente no pagado.
* Ver alertas temporales vinculadas a su zona.
* Ver estado de validación documental.
* Completar documentación observada.

## Etapa 7 — Municipio

* Panel general.
* ABM permisionarios.
* Importación masiva.
* Formulario individual.
* Validación documental.
* Tarifas/fraccionamiento.
* Zonas/sectores/cuadras.
* Turnos.
* Reportes.
* Auditoría.
* Deuda por efectivo.
* Fiscalización simple por patente.
* Observaciones.
* Excedentes cobrados/pendientes/cancelados.
* Alertas temporales por patente.
* Exportaciones si ya es viable.

## Etapa 8 — Pagos reales

* Diseñar Payment Orchestrator.
* No hardcodear todo a un solo proveedor.
* Ciudadano debe tener diseño preparado para múltiples medios.
* Mercado Pago puede ser el primer proveedor real para split/liquidación al permisionario si es el más viable.
* Agregar flujo para pago de deuda de permisionario hacia cuenta de Nativos.
* Agregar flujo para pago de excedente.
* Webhooks.
* Estados de pago.
* Reintentos.
* Cancelaciones.
* Conciliación.
* Comprobantes.

---

# 22. Qué evitar

Evitar:

* Convertir esto en tres apps nativas separadas sin necesidad.
* Obligar al ciudadano a instalar app.
* Obligar al ciudadano a registrarse para pagar.
* Hacer QR directo a una billetera sin pasar por EstacionAR.
* Mezclar medio de pago del ciudadano con canal de cobro del permisionario.
* Diseñar el ciudadano como “solo Mercado Pago”.
* Hardcodear tarifas.
* Hardcodear porcentajes.
* Hardcodear un solo proveedor de pago en todo el sistema.
* Crear pantallas lindas pero sin flujo real.
* Generar comprobante de efectivo sin confirmación del permisionario.
* Perder trazabilidad del efectivo.
* Crear saldo prepago para permisionarios en esta etapa.
* Bloquear pagos digitales por deuda de efectivo salvo que sea una decisión explícita posterior.
* Crear deuda permanente al ciudadano por excedente sin definición municipal.
* Mostrar alertas de excedente de manera indefinida.
* Permitir que varios permisionarios cobren el mismo excedente.
* Aprobar operación plena de permisionarios sin validación documental, salvo modo demo o excepción administrativa.
* Permitir duplicados activos de DNI, legajo o cuadra/turno sin advertencia.
* Permitir que la cuenta de cobro quede desvinculada del titular habilitado sin revisión.
* Romper la demo actual.
* Reescribir todo si no hace falta.

---

# 23. Resultado esperado

Al finalizar las etapas, el proyecto debe quedar más cerca de producción en estos puntos:

* Arquitectura clara de una sola webapp/PWA con rutas por rol.
* Flujo ciudadano más realista.
* QR de EstacionAR como entrada principal.
* Modelo preparado para múltiples medios de pago ciudadano.
* Canal de liquidación/acreditación para permisionario separado conceptualmente.
* Efectivo registrado con confirmación del permisionario.
* Deuda acumulada por efectivo para Nativos.
* Botón para que el permisionario pague deuda.
* Restricciones configurables por deuda vencida o excesiva.
* Fraccionamiento configurable, incluyendo 30 minutos y más duraciones.
* Fiscalización simple por patente.
* Notificación al permisionario por patente vencida o próxima a vencer.
* Cobro de excedente o extensión de tiempo.
* Registro de excedentes no pagados.
* Alerta temporal por patente con vencimiento automático.
* Carga masiva por Excel/CSV.
* Formulario individual de alta de permisionarios.
* Validación por credencial oficial municipal.
* Registro de DNI frente/dorso.
* Registro de legajo municipal.
* Registro de cuadra, mano, turno y vigencia.
* Registro opcional de decreto/resolución de adjudicación.
* Registro o lectura asistida de QR municipal si existe.
* Control de permiso personal e intransferible.
* Panel municipal más orientado a gestión real.
* Código más ordenado, sin romper lo ya funcional.
* Documentación breve de decisiones tomadas.
