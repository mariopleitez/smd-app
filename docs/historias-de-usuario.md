# SaveMyDish - Historias de Usuario

Documento vivo de funcionalidades actuales de la app, organizado por pantalla/flujo.

## Convenciones
- Formato: `Como <tipo de usuario>, quiero <accion>, para <beneficio>.`
- Todas las historias listadas abajo corresponden a funcionalidades visibles en la app actual.

## Historias
| ID | Pantalla / Flujo | Historia de usuario |
|---|---|---|
| HU-001 | Splash | Como usuario, quiero ver una pantalla de carga inicial con branding, para identificar la app mientras se prepara la navegacion. |
| HU-002 | Comenzar | Como usuario, quiero entrar a la pantalla de inicio, para elegir si iniciar sesion o crear cuenta. |
| HU-003 | Comenzar | Como usuario nuevo, quiero ir a registro desde Comenzar, para crear mi cuenta. |
| HU-004 | Comenzar | Como usuario existente, quiero ir a login desde Comenzar, para entrar con mis credenciales. |
| HU-005 | Registro | Como usuario, quiero registrar nombre, correo y contrasena, para crear una cuenta. |
| HU-006 | Registro | Como usuario, quiero validacion de campos obligatorios en registro, para evitar enviar formularios incompletos. |
| HU-007 | Registro | Como usuario, quiero validacion de longitud minima de contrasena, para cumplir requisitos de seguridad. |
| HU-008 | Registro | Como usuario, quiero ver mensajes de error o exito al registrarme, para saber el resultado de la operacion. |
| HU-009 | Registro | Como usuario, quiero volver a login desde registro, para usar una cuenta que ya existe. |
| HU-010 | Login | Como usuario, quiero iniciar sesion con correo y contrasena, para acceder a mi informacion. |
| HU-011 | Login | Como usuario, quiero validacion de campos obligatorios en login, para evitar intentos invalidos. |
| HU-012 | Login | Como usuario, quiero ver mensajes claros si falla el inicio de sesion, para saber como corregirlo. |
| HU-013 | Login | Como usuario, quiero ir a registro desde login, para crear cuenta si aun no tengo una. |
| HU-014 | Login | Como usuario, quiero volver a Comenzar desde login, para cambiar de flujo. |
| HU-015 | Global / Sesion | Como usuario autenticado, quiero que la app me lleve automaticamente a Principal, para continuar rapido. |
| HU-016 | Global / Sesion | Como usuario sin sesion, quiero ser redirigido a Comenzar, para iniciar sesion o registrarme. |
| HU-017 | Onboarding inicial | Como usuario nuevo o sin recetas, quiero ver una oferta de 3 recetas de bienvenida, para empezar rapido. |
| HU-018 | Onboarding inicial | Como usuario, quiero aceptar la oferta de recetas de bienvenida, para cargarlas en mi perfil. |
| HU-019 | Onboarding inicial | Como usuario, quiero poder rechazar la oferta de recetas de bienvenida, para continuar sin cargar recetas. |
| HU-020 | Navegacion principal | Como usuario, quiero navegar por tabs (Recetas, Plan, Lista, Perfil), para gestionar todas las funciones de la app. |
| HU-021 | Navegacion principal | Como usuario, quiero un boton flotante de crear/importar, para agregar recetas desde cualquier momento. |
| HU-092 | Navegacion principal | Como usuario, quiero una campana de notificaciones con contador no leido y poder cerrar cada notificacion individualmente, para mantener el panel limpio y relevante. |
| HU-022 | Recetas (tab) | Como usuario, quiero ver todos mis recetarios, para organizar mis recetas por categorias. |
| HU-023 | Recetas (tab) | Como usuario, quiero crear un nuevo recetario, para agrupar recetas segun mi criterio. |
| HU-024 | Recetas (tab) | Como usuario, quiero abrir un recetario y ver sus recetas, para trabajar sobre su contenido. |
| HU-025 | Recetas (tab) | Como usuario, quiero tener un espacio "Sin Recetario", para recetas que aun no he organizado. |
| HU-026 | Recetas (tab) | Como usuario, quiero buscar recetas por texto, para encontrar rapido una receta puntual. |
| HU-027 | Recetas (tab) | Como usuario, quiero filtrar busqueda por alcance (mis recetas / publico), para controlar el origen de resultados. |
| HU-028 | Recetas (tab) | Como usuario, quiero abrir una receta desde resultados de busqueda, para consultarla o editarla. |
| HU-029 | Recetas (tab) | Como usuario, quiero ver metadata del autor en recetas externas, para identificar de quien es la receta. |
| HU-030 | Organizar recetario | Como usuario dueno del recetario, quiero renombrarlo, para mantener nombres claros. |
| HU-031 | Organizar recetario | Como usuario dueno del recetario, quiero seleccionar varias recetas, para ejecutar acciones en lote. |
| HU-032 | Organizar recetario | Como usuario dueno del recetario, quiero mover recetas seleccionadas a otro recetario, para reorganizar contenido. |
| HU-033 | Organizar recetario | Como usuario dueno del recetario, quiero remover recetas del recetario sin borrarlas, para enviarlas a "Sin Recetario". |
| HU-034 | Organizar recetario | Como usuario dueno del recetario, quiero eliminar recetas seleccionadas, para limpiar contenido no deseado. |
| HU-035 | Organizar recetario | Como usuario dueno del recetario, quiero eliminar el recetario sin perder sus recetas, para simplificar estructura. |
| HU-036 | Crear receta (sheet) | Como usuario, quiero abrir opciones de creacion/importacion, para elegir mi metodo preferido. |
| HU-037 | Crear receta manual | Como usuario, quiero crear una receta manualmente, para registrar recetas propias. |
| HU-038 | Crear receta manual | Como usuario, quiero agregar foto principal a la receta manual, para identificarla visualmente. |
| HU-039 | Crear receta manual | Como usuario, quiero escribir descripcion, ingredientes y pasos, para guardar la receta completa. |
| HU-040 | Crear receta manual | Como usuario, quiero asignar la receta a uno o varios recetarios al guardarla, para mantener organizacion. |
| HU-041 | Crear receta manual | Como usuario, quiero definir si la receta es publica o privada, para controlar visibilidad. |
| HU-042 | Crear receta manual | Como usuario, quiero abrir planificacion desde la receta manual guardada, para asignarla al plan semanal. |
| HU-043 | Crear receta manual | Como usuario, quiero compartir mi receta manual, para enviarla a otras personas. |
| HU-044 | Importar por URL | Como usuario, quiero importar receta desde un enlace web/social, para ahorrar captura manual. |
| HU-045 | Importar por URL | Como usuario, quiero validacion de URL (http/https), para evitar entradas invalidas. |
| HU-046 | Importar por URL | Como usuario, quiero que la receta importada se abra en modo edicion, para ajustar datos antes de usarla. |
| HU-047 | Importar por imagen | Como usuario, quiero importar receta desde una imagen de galeria, para digitalizar recetas visuales. |
| HU-048 | Importar por imagen | Como usuario, quiero importar receta tomando una foto, para capturar recetas fisicas al momento. |
| HU-049 | Importar por imagen | Como usuario, quiero mensajes claros sobre si la imagen se pudo leer o no, para entender el resultado. |
| HU-050 | Importar por texto | Como usuario, quiero pegar texto de una receta y procesarlo, para convertirlo en receta estructurada. |
| HU-051 | Importar por texto | Como usuario, quiero pegar desde portapapeles en un clic, para agilizar la importacion por texto. |
| HU-052 | Ver receta | Como usuario, quiero ver el detalle de receta (titulo, descripcion, ingredientes, pasos), para consultarla mientras cocino. |
| HU-053 | Ver receta | Como usuario, quiero ver informacion contextual (recetario, planificacion, visibilidad, cobertura en lista), para entender estado de la receta. |
| HU-054 | Ver receta | Como usuario, quiero abrir enlace de origen cuando exista, para revisar la fuente original. |
| HU-055 | Ver receta | Como usuario, quiero compartir receta, para enviarla facilmente. |
| HU-056 | Ver receta | Como usuario, quiero exportar/imprimir receta, para usarla fuera de la app. |
| HU-057 | Ver receta propia | Como usuario, quiero marcar receta como cocinada, para llevar historial. |
| HU-058 | Ver receta propia | Como usuario, quiero calificar una receta con estrellas, para registrar mi valoracion personal. |
| HU-059 | Ver receta propia | Como usuario, quiero guardar notas de cocinado por receta, para recordar ajustes o comentarios. |
| HU-060 | Ver receta propia | Como usuario, quiero editar receta, para actualizar informacion. |
| HU-061 | Editar receta propia | Como usuario, quiero cambiar foto principal (camara/galeria), para mejorar la presentacion. |
| HU-062 | Editar receta propia | Como usuario, quiero agregar foto por paso, para documentar mejor el proceso. |
| HU-063 | Editar receta propia | Como usuario, quiero reordenar pasos con botones subir/bajar, para corregir el orden facilmente. |
| HU-064 | Editar receta propia | Como usuario, quiero agregar y eliminar ingredientes y pasos, para mantener la receta al dia. |
| HU-065 | Editar receta propia | Como usuario, quiero cambiar visibilidad publica/privada desde detalle, para ajustar privacidad rapidamente. |
| HU-066 | Ver receta propia | Como usuario, quiero borrar una receta con confirmacion, para evitar eliminaciones accidentales. |
| HU-067 | Ver receta propia | Como usuario, quiero gestionar en que recetarios aparece una receta, para controlar su ubicacion. |
| HU-068 | Ver receta propia | Como usuario, quiero seleccionar ingredientes de la receta y agregarlos a lista de compras, para planificar compras rapido. |
| HU-069 | Ver receta externa | Como usuario, quiero ver recetas publicas de otros usuarios sin editarlas, para inspirarme y explorar. |
| HU-070 | Ver receta externa | Como usuario, quiero copiar una receta externa a mis recetarios, para editarla como propia despues. |
| HU-091 | Ver receta propia | Como usuario, quiero ver un boton para traducir cuando una receta este en ingles, para convertir titulo, descripcion, ingredientes y pasos al espanol. |
| HU-071 | Plan (tab) | Como usuario, quiero ver mi semana de comidas, para planificar desayuno, snack, almuerzo y cena. |
| HU-072 | Plan (tab) | Como usuario, quiero moverme entre semanas (anterior/siguiente), para revisar o planificar periodos distintos. |
| HU-073 | Plan (tab) | Como usuario, quiero asignar receta a un dia completo o a un tiempo especifico de comida, para planificar con precision. |
| HU-074 | Plan (tab) | Como usuario, quiero abrir la receta asignada desde el plan, para consultar detalles al instante. |
| HU-075 | Plan (tab) | Como usuario, quiero remover una receta de un slot del plan, para ajustar cambios de ultima hora. |
| HU-076 | Plan (modal de asignacion) | Como usuario, quiero elegir receta, fecha futura y tiempo de comida al planificar, para guardar una asignacion valida. |
| HU-077 | Plan (modal de asignacion) | Como usuario, quiero validaciones de fecha y tipo de comida, para evitar guardar asignaciones invalidas. |
| HU-078 | Lista (tab) | Como usuario, quiero agregar items a mi lista de compras, para no olvidar productos. |
| HU-079 | Lista (tab) | Como usuario, quiero marcar items como completados/no completados, para llevar progreso de compras. |
| HU-080 | Lista (tab) | Como usuario, quiero borrar items completados, para mantener la lista limpia. |
| HU-081 | Lista (tab) | Como usuario, quiero borrar toda la lista, para reiniciar una compra nueva. |
| HU-082 | Lista (tab) | Como usuario, quiero ver el origen "de <receta>" en items generados desde recetas, para entender contexto. |
| HU-083 | Lista (tab) | Como usuario, quiero ver emojis relacionados por item, para identificar productos visualmente mas rapido. |
| HU-084 | Perfil (tab) | Como usuario, quiero ver mi informacion de perfil (nombre, correo, foto), para confirmar mi cuenta activa. |
| HU-085 | Perfil (tab) | Como usuario, quiero editar nombre y foto de perfil, para personalizar mi cuenta. |
| HU-086 | Perfil (tab) | Como usuario, quiero guardar cambios de perfil y recibir confirmacion, para saber que se actualizo correctamente. |
| HU-087 | Perfil (tab) | Como usuario, quiero compartir la app con amigos, para recomendar SaveMyDish. |
| HU-088 | Perfil (tab) | Como usuario, quiero abrir ayuda (placeholder), para consultar soporte cuando lo necesite. |
| HU-089 | Perfil (tab) | Como usuario, quiero abrir informacion de SaveMyDish Plus, para conocer proximas mejoras. |
| HU-090 | Perfil (tab) | Como usuario, quiero cerrar sesion desde perfil, para proteger mi cuenta al terminar. |
| HU-093 | Perfil (tab) | Como usuario, quiero cerrar mi cuenta desde modo editar perfil con una confirmacion irreversible, para borrar mi usuario y todo mi contenido de forma definitiva. |

## Notas
- Este documento describe funcionalidades de interfaz y flujos de usuario actualmente implementados.
- Puede extenderse con criterios de aceptacion por historia en una segunda version (`Given/When/Then`).
