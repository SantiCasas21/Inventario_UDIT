# 📦 Inventario UDIT — Sistema de Gestión Integral de Inventario & Kardex

[![.NET 9.0](https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Angular 18](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC292B?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![xUnit Tests](https://img.shields.io/badge/Tests-66%20Passing-success?style=for-the-badge&logo=checkmarx&logoColor=white)](https://xunit.net/)

Bienvenido al repositorio oficial de **Inventario UDIT**, una solución web empresarial Full-Stack de alto rendimiento diseñada para la gestión, control transaccional, trazabilidad y auditoría de insumos tecnológicos, componentes electrónicos, materiales de laboratorio y herramientas institucionales de la **Universidad UDIT (Universidad Central)**.

---

## 📑 Tabla de Contenido

- [Visión General](#-visión-general)
- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
  - [1. Clonar el Repositorio](#1-clonar-el-repositorio)
  - [2. Configuración y Ejecución del Backend](#2-configuración-y-ejecución-del-backend-net-9)
  - [3. Configuración y Ejecución del Frontend](#3-configuración-y-ejecución-del-frontend-angular-18)
  - [4. Credenciales de Acceso por Defecto](#4-credenciales-de-acceso-por-defecto)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Pruebas Unitarias y Calidad](#-pruebas-unitarias-y-calidad)
- [Identidad Visual Institucional](#-identidad-visual-institucional-branding-udit)
- [Control de Acceso y Roles (RBAC)](#-control-de-acceso-y-roles-rbac)
- [Licencia y Créditos](#-licencia-y-créditos)

---

## 🎯 Visión General

**Inventario UDIT** resuelve las necesidades operativas complejas en entornos de laboratorio y talleres universitarios mediante:
- **Control estricto de existencias físicas:** Trazabilidad multi-ubicación en tiempo real (estantes, gavetas, laboratorios y bodegas).
- **Kardex inmutable:** Registro de auditoría transaccional para cada ingreso, salida, ajuste o traslado.
- **Catálogo paramétrico de precisión:** Búsqueda rápida de componentes electrónicos por magnitudes técnicas (Resistencias en $\Omega/\text{k}\Omega$, Condensadores en $\text{pF}/\mu\text{F}$, Diodos, Inductancias, etc.).
- **Detección inteligente de irregularidades:** Auditoría automatizada de insumos duplicados con asistente guiado de consolidación y unificación histórica.
- **Experiencia de usuario fluida y moderna:** Soporte 100% responsivo en smartphones, tablets y pantallas de alta resolución con selector de Modo Claro y Modo Oscuro.

---

## ✨ Características Principales

### 🔍 1. Filtros Paramétricos Inteligentes y Multicriterio
- **Búsqueda unificada "Código Fabricante / Descripción":** Permite buscar simultáneamente por código de parte de fábrica o por descripción del componente con un campo visualmente amplio y botón de limpieza rápida (`×`).
- **Filtrado dinámico de Unidades de Medida en cascada:** Al seleccionar una o varias categorías activas, el selector de *Unidad de Medida* filtra instantáneamente para mostrar únicamente las unidades correspondientes a las categorías elegidas (con deduplicación de unidades compartidas y recarga automática al deseleccionar o resetear).
- **Filtros por rangos:** Control de valores numéricos de medida (mínimo / máximo) y fechas de movimientos.
- **Filtrado inteligente reactivo:** Ejecución fluida con debounce optimizado y chips visuales interactivos para remover filtros aplicados.

### 🔄 2. Kardex Transaccional e Inmutable
- **Tipos de movimiento:**
  - `+ Ingreso`: Registro de compras o abastecimiento con proveedor, tipo de compra, proyecto y asignación de ubicación.
  - `- Salida`: Despacho para proyectos o docencia con control de stock suficiente en tiempo real.
  - `± Ajuste`: Corrección física de existencias y reubicación directa de inventario.
  - `⇄ Traslado`: Movimiento de inventario entre distintas ubicaciones físicas sin alterar el balance global.
- **Fórmulas de balance exacto:** El stock disponible se calcula a partir de la historia transaccional, garantizando la inmutabilidad de los registros.

### 📊 3. Dashboard Ejecutivo & Detección de Irregularidades
- **Métricas visuales:** Total de insumos registrados, movimientos del mes, valorizaciones y alertas de stock crítico.
- **Módulo de Irregularidades:** Detección de posibles duplicados por descripción o código, con asistente para unificar insumos y redirigir su Kardex histórico a un insumo principal.

### 📥 4. Importación Masiva desde Excel
- Descarga de plantilla oficial estructurada (`.xlsx`).
- Carga masiva de movimientos de ingreso mediante el servicio `ExcelParserService`.
- Validación previa de códigos, cantidades mayores a 0, unidades de medida y asignación automática o selectiva de bodegas.

### 📑 5. Reportes Especializados y Exportación
- **Kardex Detallado:** Trazabilidad completa de movimientos con saldos anteriores y posteriores.
- **Stock Crítico:** Detección de insumos por debajo del umbral mínimo con agregación de sus ubicaciones reales.
- **Movimientos:** Histórico filtrable por fechas, tipos de movimiento y usuarios.
- **Proyectos:** Consolidación de insumos asignados por proyecto universitario.
- **Exportación nativa:** Generación de libros de Microsoft Excel (`.xlsx`) con formato y estilizado corporativo.

### 🗂️ 6. HUBs Centralizados de Navegación
- **HUB de Inventario (`/inventario`):** Accesos directos a Insumos, Movimientos, Importación y Kardex.
- **HUB de Catálogos (`/catalogos`):** Gestión centralizada de Categorías, Ubicaciones, Empaquetamientos, Unidades de Medida, Proveedores, Proyectos y Tipos de Compra.
- **HUB del Sistema (`/sistema`):** Configuración de Usuarios, Roles, Permisos Granulares y Auditoría.
- **HUB de Reportes (`/reportes`):** Acceso unificado a los reportes analíticos del sistema.

### 🛡️ 7. Seguridad y Permisos Granulares (RBAC)
- Matriz de autorización con **31 permisos granulares específicos** por catálogo y módulo funcional.
- Gestión de roles (`Admin`, `Developer`, `Assistant`, `User`) con actualización dinámica en caliente.
- Flujo de cambio obligatorio de contraseña en el primer inicio de sesión.
- Módulo de perfil de usuario con selección de avatares personalizados.

### 🌓 8. Diseño 100% Responsivo y Modo Claro/Oscuro
- Interfaz fluida adaptable a dispositivos móviles (320px – 480px), tablets (600px – 960px), laptops y monitores 4K.
- Botón de alternancia de **Modo Claro / Modo Oscuro** en el encabezado superior con iconografía interactiva.
- Modales de confirmación (`ModalConfirmacionAccionComponent`) centrados con anchos equilibrados.

---

## 🏗️ Arquitectura del Sistema

El proyecto está diseñado bajo principios de ingeniería sólida, separación de responsabilidades y Clean Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Angular 18 + TS)                  │
│   Tailwind CSS · Angular Material MDC · Standalone Comps    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST (JSON / JWT)
┌──────────────────────────────▼──────────────────────────────┐
│                    API Layer (.NET 9 C#)                    │
│    Controllers · JWT Auth Filter · Exception Middleware     │
├─────────────────────────────────────────────────────────────┤
│                Application Layer (.NET 9 C#)                │
│    Services · DTOs · Interfaces · PredicateBuilder (LINQ)   │
├─────────────────────────────────────────────────────────────┤
│               Infrastructure Layer (.NET 9 C#)              │
│    EF Core 9 · AppDbContext · Repositories · Migrations      │
├─────────────────────────────────────────────────────────────┤
│                  Domain Layer (.NET 9 C#)                   │
│         Entities · Enums · Value Objects · Errors           │
└──────────────────────────────┬──────────────────────────────┘
                               │ T-SQL (TCP/IP 1433)
┌──────────────────────────────▼──────────────────────────────┐
│                  DATABASE (SQL Server 2022)                 │
│         UDIT_Inventario_V2 (Tablas, Índices, FKs)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Requisitos del Sistema

Antes de comenzar, asegúrate de tener instalado en tu entorno:

- **[.NET SDK 9.0+](https://dotnet.microsoft.com/download/dotnet/9.0)**
- **[Node.js](https://nodejs.org/)** (v18.x o v20.x LTS recomendado) & **npm** (v9+ o v10+)
- **[Angular CLI](https://angular.dev/)** versión 18 (`npm install -g @angular/cli@18`)
- **[Microsoft SQL Server](https://www.microsoft.com/sql-server)** (2019, 2022, Developer o Express Edition) o Azure SQL Edge / Docker
- **[Git](https://git-scm.com/)**

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el Repositorio

```bash
git clone https://github.com/SantiCasas21/Inventario_UDIT.git
cd Inventario_UDIT
```

---

### 2. Configuración y Ejecución del Backend (.NET 9)

1. Dirígete a la carpeta del backend:
   ```bash
   cd BE_Inventario_UDIT
   ```

2. Configura la cadena de conexión a tu base de datos en `src/API/appsettings.Development.json` o `src/API/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost,1433;Database=UDIT_Inventario_V2;User Id=sa;Password=TuPasswordSeguro!;TrustServerCertificate=True;Encrypt=False"
     }
   }
   ```

3. Aplica las migraciones de Entity Framework Core para crear la base de datos y su estructura:
   ```bash
   dotnet ef database update --project src/Infrastructure --startup-project src/API
   ```
   *(Alternativamente, al iniciar la aplicación, `DbInitializer` crea las tablas base y siembra catálogos iniciales automáticamente si la base de datos está vacía).*

4. Compila y ejecuta el servidor API:
   ```bash
   dotnet run --project src/API
   ```

La API quedará escuchando en `http://localhost:5000` (o el puerto configurado en `launchSettings.json`), y la documentación Swagger estará accesible en:
👉 `http://localhost:5000/swagger` (o `https://localhost:55535/swagger`).

---

### 3. Configuración y Ejecución del Frontend (Angular 18)

1. Abre una nueva terminal y navega al directorio del cliente web:
   ```bash
   cd "FE_Inventario_UDIT/Inventario DIT_Antiguo"
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Verifica la URL de la API en `src/environments/environment.development.ts`:
   ```typescript
   export const environment = {
     production: false,
     API_BASE_URL: 'http://localhost:5000/api',
   };
   ```

4. Inicia el servidor de desarrollo de Angular:
   ```bash
   npm start
   # o alternativamente: ng serve
   ```

5. Abre tu navegador en:
   👉 **`http://localhost:4200`**

---

### 4. Credenciales de Acceso por Defecto

Al inicializarse la base de datos, se crea automáticamente una cuenta de Administrador institucional:

| Campo | Valor Predeterminado |
| :--- | :--- |
| **Correo Electrónico** | `admin@udit-inventario.com` |
| **Contraseña** | `Admin2026!` |
| **Rol Inicial** | `Admin` (Acceso total con los 31 permisos activos) |

> [!TIP]
> Por políticas de seguridad, el sistema cuenta con validación de cambio de contraseña obligatoria para nuevos usuarios y asistentes.

---

## 📂 Estructura del Proyecto

```text
Inventario_UDIT/
├── BE_Inventario_UDIT/                 # Backend en .NET 9 (Clean Architecture)
│   ├── src/
│   │   ├── Domain/                     # Entidades principales, Enums y Value Objects
│   │   │   └── Entities/               # Insumo, MovimientoInventario, Catalogos, etc.
│   │   ├── Application/                # Casos de uso, Servicios, DTOs y LINQ Helpers
│   │   │   ├── Common/Helpers/         # FilterExpressionBuilder, PredicateBuilder
│   │   │   ├── DTOs/                   # InsumoDto, MovimientoFilterDto, etc.
│   │   │   └── Services/               # InsumoService, MovimientoService, ExcelParserService...
│   │   ├── Infrastructure/             # EF Core, AppDbContext, Migraciones y Repositorios
│   │   │   ├── Data/DbInitializer.cs   # Población y seeding inicial de catálogos y admin
│   │   │   └── Repositories/           # BaseRepository, InsumoRepository...
│   │   └── API/                        # Controladores REST, JWT Auth y Swagger
│   │       └── Controllers/            # InsumoController, UnidadMedidaController, etc.
│   ├── tests/
│   │   └── Application.Tests/          # Suite de pruebas unitarias xUnit (66 tests)
│   └── scripts/                        # Scripts SQL de soporte y seeding
│
├── FE_Inventario_UDIT/                 # Frontend en Angular 18 (Standalone)
│   └── Inventario DIT_Antiguo/
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/               # Servicios singleton, Guards, Interceptors y Auth
│       │   │   ├── shared/             # Componentes compartidos y filtros paramétricos
│       │   │   │   ├── components/     # ParametricFilterComponent, ModalConfirmacionAccion...
│       │   │   │   └── config/         # insumo-filter.config.ts, movimiento-filter.config.ts
│       │   │   ├── features/           # Módulos de funcionalidad (Insumos, Movimientos, Hubs...)
│       │   │   │   ├── insumos/        # Tabla y vista paramétrica de Insumos
│       │   │   │   ├── movimientos/    # Formularios y Kardex de Movimientos
│       │   │   │   ├── reportes/       # Reportes (Kardex, Stock Crítico, Proyectos...)
│       │   │   │   ├── hubs/           # Hubs centralizados (Inventario, Catálogos, Sistema)
│       │   │   │   ├── roles/          # Matriz de permisos RBAC y gestión de roles
│       │   │   │   └── perfil/         # Perfil de usuario y selección de avatares
│       │   │   └── layout/             # Layouts de aplicación (Navbars, modo oscuro/claro)
│       │   ├── assets/                 # Iconos, avatares SVG e imágenes institucionales
│       │   └── styles/                 # Estilos globales SCSS y temas corporativos UDIT
│       ├── tailwind.config.js          # Configuración de Tailwind CSS
│       └── package.json                # Dependencias y scripts de Angular
│
├── Claude.md                           # Guía técnica interna de arquitectura y estándares
└── README.md                           # Documentación principal del repositorio
```

---

## 🧪 Pruebas Unitarias y Calidad

El backend cuenta con una suite completa de pruebas automatizadas con **xUnit**, **Moq** y **FluentAssertions**:

```bash
# Ejecutar todas las pruebas unitarias del backend
cd BE_Inventario_UDIT
dotnet test tests/Application.Tests/Application.Tests.csproj
```

**Cobertura de pruebas destacada:**
- Validación de reglas de Kardex (stock suficiente, descuentos y restricciones de salidas).
- Filtros dinámicos con `FilterExpressionBuilder` (búsqueda dual Código Fabricante / Descripción y combinaciones multi-select).
- Detección y resolución de duplicados.
- Parser de archivos Excel e importación masiva.
- Autorización RBAC granular.

**Compilación del Frontend:**
```bash
cd "FE_Inventario_UDIT/Inventario DIT_Antiguo"
npm run build
```

---

## 🎨 Identidad Visual Institucional (Branding UDIT)

El diseño de la aplicación respeta con precisión el **Manual de Identidad Visual Corporativa de la Universidad UDIT (Universidad Central)**:

| Denominación Institucional | Código HEX | Pantone | Uso en la Interfaz |
| :--- | :---: | :---: | :--- |
| **Verde Oliva Institucional** | `#636F03` | `Pantone 378c` | **Color primario de marca**, botones de acción principal, encabezados y estados activos. |
| **Rojo Carmesí** | `#B11F16` | `Pantone 484c` | **Acciones de alerta**, stock agotado, botones de eliminación y movimientos de salida. |
| **Negro Institucional** | `#1A171B` | `Pantone Negro` | **Tipografía principal**, contrastes altos y bordes estructurales. |
| **Verde Lima** | `#ACAA00` | `Pantone 384c` | **Acentos e indicadores** de estado intermedio o advertencia. |
| **Beige Suave** | `#F3E7CE` | `Pantone 468c` | **Fondos suaves**, tarjetas informativas y selecciones hover. |

---

## 👥 Control de Acceso y Roles (RBAC)

| Rol | Alcance y Capacidades |
| :--- | :--- |
| **Admin** | Acceso global sin restricciones a insumos, movimientos, reportes, catálogos maestros y administración de usuarios/roles. |
| **Developer** | Acceso técnico y operativo completo a la gestión de datos e insumos. Restringido para manipular credenciales de administradores. |
| **Assistant** | Rol operativo diario enfocado en registrar Ingresos, Salidas, Ajustes y consultar stock en bodega. |
| **User (Lector)** | Acceso de solo lectura para consulta de inventario, existencias y reportes, sin permisos de modificación ni botones destructivos. |

---

## 📄 Licencia y Créditos

Este software ha sido desarrollado para el control y administración de inventarios de la **Universidad Central / UDIT**.  
Todos los derechos reservados © 2026.
