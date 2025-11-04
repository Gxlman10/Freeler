# Freeler API - Resumen de Endpoints

Documento de referencia breve para los endpoints expuestos por el backend Freeler. Todas las rutas estan descritas con el prefijo base del servicio (por defecto `http://host:puerto`). Los endpoints marcados como protegidos requieren enviar `Authorization: Bearer <JWT>` con el token emitido por el backend; el payload del JWT incluye `type` (`freeler` o `empresa`) y, para empresas, el rol (`role`).

### Matriz de acceso por rol

| Modulo / Endpoint                                | Publico | Freeler | Empresa Admin | Empresa Supervisor | Empresa Vendedor | Empresa Analista |
|--------------------------------------------------|:-------:|:-------:|:-------------:|:------------------:|:----------------:|:----------------:|
| `/` (raiz), `/asignaciones/ping`, `/campanas/ping`, etc. |   ✅    |   ✅    |       ✅       |         ✅         |        ✅         |        ✅         |
| Auth (`/auth/*`, `/usuarios-freeler/register`)   |   ✅    |   ✅    |       ✅       |         ✅         |        ✅         |        ✅         |
| Campañas CRUD                                    |    -    |    -    |       ✅       |         ✅         |        ❌         |        ❌         |
| Campañas list/stats                              |    -    |    -    |       ✅       |         ✅         |        ❌         |        ✅         |
| Comisiones (list/stats/pay)                      |    -    |    -    |       ✅       |         ✅         |        ⚠️ (solo lectura) |     ✅      |
| Documentos (`/documentos/*`)                     |   ✅    |   ✅    |       ✅       |         ✅         |        ✅         |        ✅         |
| Empresas CRUD/list                               |    -    |    -    |       ✅       |         ✅         |        ❌         |        ❌         |
| Usuarios-empresa CRUD/list                       |    -    |    -    |       ✅       |         ✅         |        ❌         |        ❌         |
| Usuarios-freeler CRUD/list                       |    -    |   ✅ (self) |    ✅ (admin) |        ❌         |        ❌         |        ❌         |
| Leads (creación freeler)                         |    -    |   ✅    |       ❌       |         ❌         |        ❌         |        ❌         |
| Leads Admin (listar/asignar/bulk/import)         |    -    |    -    |       ✅       |         ✅         |        ❌         |        ❌         |
| Leads Vendedor (`/leads/assigned-to-me`, estado) |    -    |    -    |       ✅       |         ✅         |        ✅         |        ❌         |
| Leads CRM Empresa (`/leads/by-empresa`)          |    -    |    -    |       ✅       |         ✅         |        ⚠️ (solo los suyos) |  ✅    |
| Leads Referidos (`/leads/mine/*`)                |    -    |   ✅    |       ❌       |         ❌         |        ❌         |        ❌         |
| Roles catalogo                                   |    -    |    -    |       ✅       |         ✅         |        ✅         |        ✅         |

Notas:
- ✅ acceso total; ❌ no permitido; ⚠️ acceso restringido/solo lectura.
- Los endpoints que dependen del contexto de empresa usan `user.role` para validar permisos específicos (`admin`, `supervisor`, `vendedor`, `analista`). En caso de endpoints públicos, basta con omitir el encabezado Authorization.

## Convenciones
- Fechas se devuelven como cadenas ISO (ej. `2025-10-01` o `2025-10-01T12:00:00.000Z`).
- Valores monetarios (`comision`, `monto`, `saldo`) se entregan como string para no perder precision.
- Propiedades booleanas se devuelven como `true`/`false`.
- Las respuestas paginadas usan la forma `{ data, total }` y, cuando aplica, agregan `page` y `limit`.

## Recursos reutilizables

**Lead**
- `id_lead` (number)
- `id_campania` (number|null)
- `id_usuario_freeler` (number|null)
- `nombres`, `apellidos` (string)
- `dni`, `email`, `telefono`, `ocupacion`, `ciudad` (string|null)
- `descripcion` (string|null)
- `origen` (string)
- `id_estado_lead` (number|null)
- `estado_completo` (boolean)
- `fecha_creacion` (string ISO)
- `campania` (Campana|null)
- `estado` (EstadoLead|null)

**Campana**
- `id_campania` (number)
- `id_empresa` (number|null)
- `nombre` (string)
- `descripcion`, `ubicacion` (string|null)
- `comision` (string decimal)
- `fecha_inicio`, `fecha_fin` (string ISO)
- `estado` (number, 1 activo / 0 inactivo)
- `fecha_creacion` (string ISO)
- `empresa` (Empresa|null, cuando se incluye)
- `totalReferidos` (number, solo en consultas que lo cargan)

**EstadoLead**
- `id_estado_lead` (number)
- `nombre` (string)
- `descripcion` (string|null)

**Comision**
- `id_comision` (number)
- `id_lead`, `id_usuario_freeler`, `id_campania` (number|null)
- `monto` (string decimal)
- `id_estado_comision` (number|null)
- `fecha_pago` (string ISO|null)
- Relaciones opcionales: `lead`, `freeler`, `campania`, `estado`

**EstadoComision**
- `id_estado_comision` (number)
- `nombre` (string)
- `descripcion` (string|null)

**Empresa**
- `id_empresa` (number)
- `razon_social`, `ruc` (string)
- `direccion`, `telefono`, `email`, `representante_legal` (string|null)
- `estado` (number)
- `fecha_creacion` (string ISO)

**UsuarioEmpresa**
- `id_usuario_empresa` (number)
- `id_empresa`, `id_rol` (number|null)
- `nombres`, `apellidos`, `email` (string)
- `password` (string hash; omitido en endpoints que sanitizan)
- `estado` (number)
- `fecha_creacion` (string ISO)
- Relaciones opcionales: `empresa` (Empresa|null), `rol` (Rol|null)

**UsuarioFreeler**
- `id_usuario_freeler` (number)
- `nombres`, `apellidos`, `dni`, `email` (string)
- `telefono` (string|null)
- `password` (string hash; omitido en endpoints que sanitizan)
- `saldo` (string decimal)
- `estado` (number)
- `fecha_creacion` (string ISO)

**Rol**
- `id_rol` (number)
- `nombre` (string)
- `descripcion` (string|null)

**CampaignSummary (leads/by-empresa)**
- `id_campania` (number)
- `nombre` (string)
- `totalReferidos` (number)

**LeadImportPreview**
- `importId` (string UUID)
- `headers` (string[])
- `sampleRows` (array de objetos `Record<string,string>`)
- `suggestedMapping` (`Record<string,string>`)

**LeadImportResult**
- `total` (number)
- `created` (number)
- `failed` (number)
- `errors` (array de `{ row: number, issues: string[] }`)

## Endpoints por modulo

### Raiz

#### GET /
- Descripcion: ping de la aplicacion Nest (publico).
- Respuesta 200: cadena `"Hello World!"`.

### Asignaciones

#### GET /asignaciones/ping
- Descripcion: verificacion rapida del modulo.
- Respuesta 200: `{ ok: true, resource: "asignaciones" }`.

### Auth

#### POST /auth/empresa/login
- Descripcion: autentica a un usuario empresa.
- Cuerpo JSON:
  - `email` (string, requerido).
  - `password` (string, requerido, minimo 6 caracteres).
- Respuesta 200: `{ access_token: string }`.
- Errores: `401 INVALID_CREDENTIALS` cuando las credenciales no coinciden o el usuario esta inactivo.

#### POST /auth/freeler/login
- Descripcion: autentica a un usuario freeler.
- Cuerpo JSON igual a `/auth/empresa/login`.
- Respuesta 200: `{ access_token: string }`.
- Errores: `401 INVALID_CREDENTIALS`.

#### POST /auth/empresa/register
- Descripcion: registra empresa + usuario administrador y devuelve JWT.
- Cuerpo JSON:
  - `nombre_empresa` (string, 2-255).
  - `ruc` (string, 11 digitos).
  - `email` (string, formato email).
  - `password` (string, 6-64).
  - `telefono` (string, opcional).
  - `direccion` (string, opcional).
- Respuesta 200: `{ access_token: string }` (usuario admin creado con rol `id_rol=1`).
- Errores: validaciones de formato y conflictos de RUC/email via capa de repositorios.

### Campanas

#### POST /campanas
- Auth: JWT empresa con rol `admin` o `supervisor`.
- Descripcion: crea campana.
- Cuerpo JSON (`CreateCampanaDto`):
  - `id_empresa` (number, requerido).
  - `nombre` (string 2-255).
  - `descripcion` (string, opcional).
  - `ubicacion` (string, opcional).
  - `comision` (string decimal, requerido).
  - `fecha_inicio`, `fecha_fin` (string ISO, requeridos).
  - `estado` (number 0/1, opcional).
  - `usuarioEmpresaId` (number, actor, requerido).
- Respuesta 200: objeto `Campana` persistido.
- Errores: 400 en fechas invalidas o falta de permisos.

#### GET /campanas
- Descripcion: lista campanas con filtros opcionales.
- Query (`FindCampanasDto`):
  - `page`, `limit` (number >=1, opcional).
  - `search` (string).
  - `estado` (number 0/1).
  - `fecha_inicio_desde`, `fecha_fin_hasta` (string ISO).
  - `id_empresa` (number, opcional para filtrar por empresa).
- Respuesta 200: `{ data: Campana[], total: number }`. Cada campana incluye `totalReferidos`.

#### PATCH /campanas/:id
- Auth: JWT empresa rol `admin` o `supervisor`.
- Cuerpo JSON: campos parciales de `CreateCampanaDto` + `usuarioEmpresaId` obligatorio.
- Respuesta 200: `Campana` actualizada.
- Errores: 400 en fechas invalidas, 404 si no existe, 403 si sin permiso.

#### DELETE /campanas/:id
- Auth: JWT empresa rol `admin` o `supervisor`.
- Requiere que el token incluya `sub` con id de usuario empresa (se usa como actor).
- Respuesta 200: `{ ok: true }`.
- Errores: 400 si el token no trae `sub`, 404 si no existe.

#### GET /campanas/stats/basic
- Descripcion: estadisticas basicas (placeholder).
- Respuesta 200: `{ total: number, activas: number, inactivas: number }` (actualmente retornados como 0).

#### GET /campanas/:id
- Descripcion: obtiene campana por id.
- Respuesta 200: `Campana` (incluye `empresa` y `totalReferidos`).
- Errores: 404 si no se encuentra.

#### GET /campanas/ping
- Respuesta 200: `{ ok: true, resource: "campanas" }`.

### Comisiones

#### POST /comisiones/:id/pay
- Descripcion: marca comision como pagada (actualiza a estado 3 y setea `fecha_pago=now`).
- Auth: actualmente sin guard, se espera integrarlo con JWT.
- Respuesta 200: `Comision` actualizada.
- Errores: 404 si la comision no existe.

#### GET /comisiones
- Query (`FindComisionesDto`):
  - `page`, `limit` (number >=1).
  - `search` (string, propagado desde `PaginationDto`).
  - `id_estado_comision`, `id_campania`, `id_usuario_freeler` (number).
  - `fecha_desde`, `fecha_hasta` (string ISO, aplican sobre `fecha_pago`).
- Respuesta 200: `{ data: Comision[], total: number }`.

#### GET /comisiones/:id
- Respuesta 200: `Comision`.
- Errores: 404 `COMISION_NOT_FOUND`.

#### GET /comisiones/stats/basic
- Respuesta 200: `{ byEstado: Record<string, number> }` (conteo por `id_estado_comision`).

#### GET /comisiones/catalogos/estado-comisiones
- Respuesta 200: `EstadoComision[]` ordenados por `id_estado_comision`.

#### GET /comisiones/ping
- Respuesta 200: `{ ok: true, resource: "comisiones" }`.

### Documentos

#### GET /documentos/dni/:dni
- Descripcion: consulta datos de persona (ApiPeru con fallback).
- Parametro de ruta: `dni` (8 digitos).
- Respuesta 200: objeto `DniResponseDto` con campos `dni`, `nombres`, `apellidoPaterno`, `apellidoMaterno`, `verificador`.
- Errores: 404 `DNI_INVALIDO` o `DNI_NO_ENCONTRADO`.

#### GET /documentos/ruc/:ruc
- Descripcion: consulta datos de empresa.
- Parametro de ruta: `ruc` (11 digitos).
- Respuesta 200: `RucResponseDto` con datos de razon social, direccion, ubicacion y telefonos.
- Errores: 404 `RUC_INVALIDO` o `RUC_NO_ENCONTRADO`.

### Empresas

#### POST /empresas
- Descripcion: registra empresa.
- Cuerpo JSON (`CreateEmpresaDto`).
- Respuesta 200: `Empresa`.
- Errores: conflictos `RUC_ALREADY_EXISTS` o `EMAIL_ALREADY_EXISTS`.

#### GET /empresas
- Query (`PaginationDto`): `page`, `limit`, `search`.
- Respuesta 200: `{ data: Empresa[], total: number }`.

#### GET /empresas/:id
- Respuesta 200: `Empresa`.
- Errores: 404 `Empresa no encontrada`.

#### PATCH /empresas/:id
- Cuerpo JSON: campos parciales de `CreateEmpresaDto`.
- Respuesta 200: `Empresa` actualizada.
- Errores: 404 si no existe, conflictos de RUC/email.

#### DELETE /empresas/:id
- Descripcion: soft delete (estado=0).
- Respuesta 200: `{ ok: true }`.

#### GET /empresas/ping
- Respuesta 200: `{ ok: true, resource: "empresas" }`.

### Leads

#### POST /leads/draft
- Auth: JWT (`type=freeler`).
- Descripcion: crea lead en borrador (estado_completo=false).
- Cuerpo JSON (`CreateLeadDraftDto`); `usuarioFreelerId` se sobreescribe con `sub` del token.
- Respuesta 200: objeto `Lead`.
- Errores: 403 si el token no pertenece a un freeler.

#### POST /leads
- Auth: JWT (`type=freeler`).
- Descripcion: crea lead completo (estado_completo por defecto true, id_estado_lead=1).
- Cuerpo JSON (`CreateLeadDto`), `usuarioFreelerId` tomado del token.
- Respuesta 200: `Lead`.
- Errores: 403 si no es freeler.

#### PATCH /leads/:id
- Descripcion: actualiza campos del lead (no protegido actualmente).
- Cuerpo JSON: parcial de `CreateLeadDto`; `usuarioFreelerId` se mapeara a `id_usuario_freeler` si se envia.
- Respuesta 200: `Lead` actualizado.
- Errores: 404 si no existe.

#### PATCH /leads/:id/refresh-created-at
- Auth: JWT (`type=freeler`) y debe ser propietario del lead.
- Descripcion: recalcula `fecha_creacion` a timestamp actual.
- Respuesta 200: `Lead` con fecha actualizada.
- Errores: 403 si el freeler no es dueño, 404 si no existe.

#### GET /leads
- Query (`FindLeadsDto`):
  - `page`, `limit`, `search`.
  - `id_campania`, `id_campanias[]`, `id_usuario_freeler`, `id_estado_lead`.
  - `estado_completo` (boolean).
  - `fecha_desde`, `fecha_hasta` (string ISO).
  - `asignado_a_usuario_empresa_id`, `id_empresa` (number).
- Respuesta 200: `{ data: Lead[], total: number, page: number, limit: number }`.

#### GET /leads/by-campana/:id
- Query: mismos filtros de `FindLeadsDto`.
- Respuesta 200: paginacion de leads para la campana indicada.

#### POST /leads/assign
- Auth: JWT empresa rol `admin` o `supervisor`.
- Cuerpo JSON (`AssignLeadDto`):
  - `leadId` (number).
  - `usuarioEmpresaId` (number, actor).
  - `asignarAUsuarioEmpresaId` (number, destino).
- Respuesta 200: `{ ok: true, id_asignacion: number }`.
- Efecto: desactiva asignaciones activas previas del lead y crea nueva.

#### POST /leads/assign/self
- Descripcion: autoasignar lead a un usuario empresa (sin guard actualmente).
- Cuerpo JSON (`SelfAssignLeadDto`).
- Respuesta 200: `{ ok: true, id_asignacion: number }`.

#### POST /leads/status
- Auth: JWT empresa con rol `admin`, `supervisor` o `vendedor`.
- Cuerpo JSON (`UpdateLeadStatusDto`):
  - `leadId`, `id_estado_lead`, `usuarioEmpresaId`.
- Respuesta 200: `Lead` actualizado.
- Errores: 403 si el actor vendedor no es el asignado, 404 si el lead/asignacion no existe.

#### POST /leads/mark-sold
- Auth: JWT empresa rol `admin` o `supervisor`.
- Cuerpo JSON (`MarkLeadSoldDto`): `leadId`, `usuarioEmpresaId`.
- Respuesta 200: `Comision` creada o existente asociada al lead (y actualiza `id_estado_lead=2`).
- Errores: 404 si el lead o la campana no existen.

#### PATCH /leads/assignments/:id
- Auth: JWT empresa rol `admin` o `supervisor`.
- Cuerpo JSON (`UpdateAsignacionDto`):
  - `usuarioEmpresaId` (number, actor).
  - `estado` (`"activo"` | `"inactivo"`).
- Respuesta 200: `{ ok: true }`.

#### PATCH /leads/assignments/bulk
- Auth: JWT empresa rol `admin` o `supervisor`.
- Cuerpo JSON (`BulkUpdateAsignacionesDto`):
  - `actorUsuarioEmpresaId` (number, requerido).
  - `estadoObjetivo` (`"activo"` | `"inactivo"`, requerido).
  - Filtros opcionales: `id_campania`, `leadIds[]`, `usuarioEmpresaIdAsignado`, `soloInactivas`, `fecha_desde`, `fecha_hasta`, `simulate`, `maxRows`.
- Respuesta 200:
  - Si `simulate=true`: `{ simulate: true, affected: number }`.
  - En caso contrario: `{ simulate: false, affected: number }`.

#### GET /leads/catalogos/estado-lead
- Respuesta 200: `EstadoLead[]`.

#### GET /leads/by-empresa
- Auth: JWT (`type=empresa`); valida que el usuario tenga empresa asociada.
- Query (`FindLeadsDto`).
- Respuesta 200:
  ```
  {
    data: Lead[],
    total: number,
    page: number,
    limit: number,
    campaigns: CampaignSummary[]
  }
  ```
- Errores: 403 si el actor no pertenece a una empresa.

#### GET /leads/import/template
- Auth: JWT empresa rol `admin` o `supervisor`.
- Descripcion: descarga CSV de ejemplo. Encabezados `text/csv; charset=utf-8`, nombre `plantilla_leads.csv`.
- Respuesta 200: contenido CSV en cuerpo.

#### POST /leads/import/preview
- Auth: JWT empresa rol `admin` o `supervisor`.
- Descripcion: preprocesa archivo de importacion.
- Request `multipart/form-data` con campo `file` (CSV/XLSX/XLS, max 5 MB).
- Respuesta 200: `LeadImportPreview`.
- Errores: 400 `FILE_REQUIRED`, `FILE_TYPE_NOT_SUPPORTED`, `EMPTY_FILE`.

#### POST /leads/import/confirm
- Auth: JWT empresa rol `admin` o `supervisor`.
- Cuerpo JSON (`ConfirmLeadImportDto`):
  - `importId` (string, requerido).
  - `mapping` (`Record<string,string>`, requerido; claves esperadas: `nombres`, `apellidos`, `email`, `telefono`, `dni`, `ciudad`, `ocupacion`, `descripcion`).
  - `campaignId` (number, requerido) definido por la campaña destino seleccionada por el usuario.
  - `actorLabel` (string, opcional) para personalizar el texto `Importación n de Excel por {actor}`.
- Respuesta 200: `LeadImportResult`.
- Errores: 400 cuando el mapping no cubre campos obligatorios o el import expiro.

#### GET /leads/:id
- Respuesta 200: `Lead`.
- Errores: 400 `LEAD_ID_INVALIDO`, 404 `LEAD_NOT_FOUND`.

#### GET /leads/mine/by-user/:usuarioFreelerId
- Descripcion: lista leads filtrando por `id_usuario_freeler`.
- Query (`FindLeadsDto`).
- Respuesta 200: `{ data: Lead[], total: number, page: number, limit: number }`.

#### GET /leads/assigned-to-me
- Auth: JWT (`type=empresa`).
- Descripcion: lista leads asignados al usuario empresa autenticado.
- Query (`FindLeadsDto`); el backend fuerza `asignado_a_usuario_empresa_id` al `sub` del token.
- Respuesta 200: paginacion de leads.

#### GET /leads/ping
- Respuesta 200: `{ ok: true, resource: "leads" }`.

### Roles

#### GET /roles
- Descripcion: devuelve todos los roles registrados.
- Respuesta 200: `Rol[]` ordenados por `id_rol`.

#### GET /roles/ping
- Respuesta 200: `{ ok: true, resource: "roles" }`.

### Usuarios empresa

#### POST /usuarios-empresa
- Descripcion: crea usuario empresa.
- Cuerpo JSON (`CreateUsuarioEmpresaDto`); el password se almacena hasheado.
- Respuesta 200: usuario creado sin el campo `password`.
- Errores: `EMAIL_ALREADY_EXISTS`.

#### GET /usuarios-empresa
- Auth: JWT (`type=empresa`) con cualquier rol listado en `@Roles`.
- Descripcion: lista usuarios de la misma empresa que el actor (el backend fuerza `id_empresa`).
- Query (`PaginationDto`): `page`, `limit`, `search`. El campo `id_empresa` será ignorado si intenta apuntar a otra empresa.
- Respuesta 200: `{ data: UsuarioEmpresa[], total: number }`. Cada item incluye relaciones `empresa` y `rol`; el campo `password` se devuelve hasheado.
- Errores: 403 si el actor no pertenece a empresa o intenta otra empresa.

#### GET /usuarios-empresa/:id
- Respuesta 200: usuario sin `password`.
- Errores: 404 `Usuario Empresa no encontrado`.

#### PATCH /usuarios-empresa/:id
- Cuerpo JSON: parcial de `CreateUsuarioEmpresaDto`. Si incluye `password`, se rehashea antes de guardar.
- Respuesta 200: usuario actualizado sin `password`.

#### DELETE /usuarios-empresa/:id
- Descripcion: soft delete (estado=0).
- Respuesta 200: `{ ok: true }`.

#### GET /usuarios-empresa/ping
- Respuesta 200: `{ ok: true, resource: "usuarios-empresa" }`.

### Usuarios freeler

#### GET /usuarios-freeler/db-check
- Descripcion: diagnostico rapido de conexion a BD.
- Respuesta 200: objeto `{ db: string|null, usr: string|null, schemas: unknown, regclass: string|null }`.

#### POST /usuarios-freeler/register
- Descripcion: crea usuario freeler y devuelve JWT.
- Cuerpo JSON (`CreateUsuarioFreelerDto`).
- Respuesta 200: `{ access_token: string }`.
- Errores: conflictos `EMAIL_ALREADY_EXISTS`, `DNI_ALREADY_EXISTS`.

#### GET /usuarios-freeler/:id
- Respuesta 200: usuario sin `password`.
- Errores: 404 `Usuario Freeler no encontrado`.

#### PATCH /usuarios-freeler/:id
- Cuerpo JSON: parcial de `CreateUsuarioFreelerDto` (password no se rehashea aqui; se persiste el valor enviado).
- Respuesta 200: usuario actualizado sin `password`.

#### GET /usuarios-freeler
- Query (`PaginationDto`).
- Respuesta 200: `{ data: UsuarioFreeler[], total: number }`. Incluye campo `password` hasheado.

#### DELETE /usuarios-freeler/:id
- Descripcion: soft delete (estado=0).
- Respuesta 200: `{ ok: true }`.

#### GET /usuarios-freeler/:id/stats
- Descripcion: estadisticas placeholder por usuario.
- Respuesta 200: `{ userId: string|number, leadsReferidos: 0, comisionesPendientes: 0, comisionesPagadas: 0 }`.

#### GET /usuarios-freeler/ping
- Respuesta 200: `{ ok: true, resource: "usuarios-freeler" }`.

### Ping adicionales
- Cada modulo incluye un endpoint `GET /<modulo>/ping` que responde `{ ok: true, resource: "<modulo>" }` para monitoreo rapido.
