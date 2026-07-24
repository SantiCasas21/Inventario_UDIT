# Guía de Referencia y Contexto Técnico: Inventario UDIT

> **MANDATO PARA AGENTES Y DESARROLLADORES:**
> Todo desarrollador o agente de Inteligencia Artificial que trabaje en esta base de código **DEBE actuar con el nivel de rigor, pensamiento estructurado y estándares de calidad de un Desarrollador Senior / Staff Full-Stack Software Engineer**.
> 
> Queda estrictamente prohibido realizar parches superficiales, ignorar errores de compilación, enmascarar excepciones silenciosamente, asumir nombres de variables o endpoints sin consultar el código fuente, o desviarse del Manual de Identidad Visual Corporativa de la Universidad UDIT.

---

## 1. Visión General del Proyecto
**Inventario UDIT** es una solución web empresarial Full-Stack para la gestión integral de insumos tecnológicos, componentes electrónicos, materiales de laboratorio y herramientas de la Universidad UDIT (Universidad Central).

Permite el control transaccional del stock mediante un **Kardex inmutable**, registro de ingresos y salidas por proyecto/proveedor, filtrado paramétrico multicriterio de alto rendimiento, y generación de reportes operativos.

---

## 2. Manual de Identidad Visual Corporativa (Branding Oficial UDIT)

Toda la interfaz web (Frontend) se rige **estrictamente** por el *Manual de Identidad Visual Corporativa de la Universidad Central / UDIT*.

### 2.1. Paleta de Color Primaria (USO PRINCIPAL Y OBLIGATORIO)
La paleta primaria define la identidad visual de la institución. Debe ser la base de la aplicación (encabezados, botones primarios, estados activos, tipografía de marca y bordes principales).

| Color / Denominación | Pantone | HEX | CMYK | RGB | Uso en Interfaz Web |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Verde Oliva Institucional** | Pantone 378c | `#636F03` | C:34 M:0 Y:100 K:60 | R:102 G:111 B:27 | **COLOR PRIMARIO DE MARCA**. Botones principales, pestañas activas, encabezados, badges de stock disponible / Ingresos. |
| **Rojo Carmesí** | Pantone 484c | `#B11F16` | C:0 M:95 Y:100 K:29 | R:177 G:31 B:22 | **ACCIONES DE ALERTA Y SALIDAS**. Botones de eliminar, errores, advertencias y badges de salidas o stock agotado. |
| **Negro Institucional** | Pantone Negro | `#1A171B` | C:0 M:0 Y:0 K:100 | R:26 G:23 B:27 | **TEXTO PRINCIPAL Y BORDES OSCUROS**. Títulos principales, textos de alto contraste. |
| **Verde Lima** | Pantone 384c | `#ACAA00` | C:18 M:0 Y:100 K:31 | R:172 G:170 B:0 | **ACCENT / DESTACADOS**. Badges secundarios, indicadores de estado intermedio. |
| **Beige Suave** | Pantone 468c | `#F3E7CE` | C:3 M:9 Y:24 K:0 | R:243 G:231 B:204 | **FONDOS SUAVES**. Hover en elementos seleccionados, fondos de tarjetas y contenedores secundarios. |

### 2.2. Paleta de Color Secundaria (SOLO PARA ACCENTOS Y CONTEXTOS SECUNDARIOS)
Esta paleta complementa la primaria y **NUNCA** debe reemplazar el Verde Oliva (`#636F03`) en la identidad principal del sistema.

* **Pantone Orange 021:** `#E95D0F` (R:233 G:93 B:15) — Destacados secundarios.
* **Pantone 294 (Azul Navy):** `#122253` (R:18 G:34 B:83) — Encabezados oscuros secundarios / tablas.
* **Teal / Turquesa:** `#0B8689` (R:11 G:134 B:137) — Indicadores informativos.
* **Azul Claro:** `#1472B8` (R:20 G:114 B:184) — Acciones de edición / links secundarios.
* **Púrpura:** `#634998` (R:99 G:73 B:152) — Categorizaciones especiales.

### 2.3. Tipografía Corporativa
* **Principal de Marca:** `Galliard`
* **Secundarias Permitidas en UI:** `Titillium Web`, `ZapfHumanist`, `Roboto`, `Inter`.
* **Código y Datos Numéricos:** `IBM Plex Mono` (para Códigos de Fábrica, IDs y valores numéricos).

---

## 3. Arquitectura del Sistema

### 3.1. Backend (`BE_Inventario_UDIT`)
- **Tecnología:** .NET 9.0 (C#)
- **Patrón de Arquitectura:** Clean Architecture en 4 Capas:
  1. `Domain`: Entidades del dominio (`Insumo`, `MovimientoInventario`), Enums (`TipoMovimiento`), y clases base del dominio.
  2. `Application`: DTOs (`InsumoDto`, `InsumoFilterDto`, `MovimientoFilterDto`), Interfaces de Servicios y Repositorios, Servicios con Reglas de Negocio (`InsumoService`, `MovimientoService`), y la clase `FilterExpressionBuilder`.
  3. `Infrastructure`: `AppDbContext` (EF Core Code-First), Implementación de Repositorios (`BaseRepository<T>`, `InsumoRepository`, `MovimientoRepository`), Migraciones de Base de Datos.
  4. `API`: Controladores REST (`InsumoController`, `MovimientoController`, `CatalogoControllers`), Filtros de Autorización JWT y Middlewares.
- **ORM & Traductores LINQ:** 
  - `BaseRepository<T>` maneja operaciones CRUD paginadas de forma genérica.
  - `PredicateBuilder` utiliza un `ReplaceExpressionVisitor` para combinar expresiones lambda (`And` / `Or`) de forma transparente para Entity Framework Core, evitando errores de traducción SQL por `Expression.Invoke`.
- **Reglas de Migraciones SQL:**
  - Al migrar campos de texto desestructurados (ej: `"200 OHM"`) hacia columnas numéricas (`ValorMedida`, `UnidadMedida`), los scripts embebidos en las migraciones de EF Core deben usar funciones seguras como `TRY_CAST`, expresiones regulares o divisiones de cadenas con trancado seguro (`LEFT(..., 20)`).

### 3.2. Frontend (`FE_Inventario_UDIT`)
- **Tecnología:** Angular 17+ (Modo Standalone Components).
- **Estilos & UI:** Tailwind CSS + Angular Material 17+.
- **Estructura de Directorios:**
  - `src/app/core`: Servicios singleton (`ApiClientService`, `InsumoService`, `MovimientoService`, `CatalogoService`, `UserService`), Modelos e Interfaces de TypeScript, Guardias e Interceptores HTTP.
  - `src/app/shared`: Componentes reutilizables (`ParametricFilterComponent`, `FilterColumnComponent`), Configuraciones de Filtros (`insumo-filter.config.ts`, `movimiento-filter.config.ts`).
  - `src/app/features`: Vistas principales de la aplicación (`insumos`, `movimientos`, `usuarios`, `reportes`, `dashboard`).
  - `src/app/modules/admin/apps/inventario/popup`: Ventanas modales emergentes (`PopupInsumosComponent`).
- **Manejo de Respuestas API (`ApiClientService`):**
  - El Backend siempre retorna una envoltura `OperationResult<T>` (`{ success: boolean, message: string, data: T }`).
  - `ApiClientService` desenvuelve automáticamente el atributo `data` o lanza una excepción manejada con el `message` original en caso de `success === false`.

---

## 4. Reglas de Negocio Críticas

1. **Inmutabilidad del Kardex (Movimientos de Inventario):**
   - Los registros en `MovimientoInventario` son estrictamente **inmutables**. NUNCA deben actualizarse ni eliminarse directamente.
   - Cualquier corrección en el stock debe realizarse registrando un nuevo movimiento de tipo `AJUSTE`.
2. **Cálculo Dinámico de Stock:**
   - El stock de un insumo no es un campo estático mutable arbitrariamente. Se calcula mediante la sumatoria transaccional del Kardex:
     $$\text{Stock Actual} = \sum(\text{Ingresos}) - \sum(\text{Salidas}) \pm \sum(\text{Ajustes})$$
3. **Validación de Salidas:**
   - No se permite registrar movimientos de tipo `SALIDA` si la cantidad solicitada excede el stock actual disponible en el sistema.
4. **Relación Condicional de Unidades de Medida en Insumos:**
   - Al crear o editar un insumo en la interfaz gráfica, las opciones del selector `UnidadMedida` cambian dinámicamente según la `Categoria` seleccionada:
     - **Resistencias / Potenciómetros:** `OHM`, `KOHM`, `MOHM`.
     - **Condensadores / Capacitores:** `PF`, `NF`, `UF`, `MF`, `F`.
     - **Inductores / Bobinas:** `NH`, `UH`, `MH`, `H`.
     - **Transistores:** `NPN`, `PNP`, `MOSFET`.
     - **Diodos / Baterías:** `V`, `A`, `W`, `MAH`, `AH`.
     - **Cables:** `M`, `CM`, `MM`, `AWG`, `CALIBRE`.
     - **Microcontroladores / Integrados:** `BITS`, `MHZ`, `KB`, `MB`, `PINS`.
5. **Filtrado Paramétrico Reactivo:**
   - El componente de filtro paramétrico (`ParametricFilterComponent`) debe operar con respuesta reactiva e instantánea cuando el "Filtrado Inteligente" está activado, aplicando un `debounce` de 300-400ms para evitar solicitudes excesivas pero garantizando que la tabla se refresque al marcar casillas o cambiar rangos.

---

## 5. Control de Acceso y Roles (RBAC)

- **Admin (Administrador):** Acceso total a lectura, creación, modificación y eliminación en todas las entidades, catálogos y gestión de usuarios.
- **Developer (Desarrollador):** Acceso técnico CRUD completo a insumos, movimientos y catálogos. No puede modificar credenciales de otros usuarios.
- **Assistant (Asistente):** Rol operativo. Puede registrar Ingresos y Salidas de inventario y gestionar insumos en el flujo diario.
- **User (Lector / Usuario Base):** Acceso de **Solo Lectura**. Puede consultar dashboards, listados de insumos, historial de movimientos y reportes. Todos los botones de creación, edición o borrado deben estar ocultos (`*ngIf="userRole !== 'User'"`).

---

## 6. Estándares y Directivas de Ingeniería para Agentes AI

Cualquier agente que trabaje en esta base de código debe cumplir rigurosamente las siguientes directivas:

1. **Investigación Antes de Mutar Código:** 
   - Inspeccionar siempre la fuente de verdad mediante búsqueda de código (`grep_search` / `view_file`) antes de asumir nombres de variables, firmas de métodos o esquemas de base de datos.
2. **Inspección de Logs sin Suposiciones:**
   - Ante cualquier fallo de compilación o runtime, leer el traceback o log completo antes de formular hipótesis.
3. **Prohibición de Parches Superficiales:**
   - NUNCA tragar excepciones en bloques `try/catch` vacíos, ni retornar valores nulos simulados para ocultar errores de contrato o consultas SQL fallidas.
4. **Verificación Runtime Obligatoria:**
   - Ninguna tarea se considera finalizada sin verificar la compilación limpia de ambos proyectos (`dotnet build` en Backend y `npm run build` o `ng build` en Frontend).
5. **Fidelidad al Diseño:**
   - Respetar siempre el Manual de Identidad de la Universidad UDIT. Utilizar los tokens de color primarios (`#636F03`, `#B11F16`, `#1A171B`, `#ACAA00`, `#F3E7CE`) y evitar agregar paletas genéricas o colores no autorizados.

---
*Este documento es la fuente primaria de contexto para el desarrollo continuo de Inventario UDIT.*
