# Refactorización Visual de Páginas del Administrador

Este plan detalla la estandarización visual de todas las páginas de la sección de "Administración" para alinearlas con el nuevo diseño *premium* implementado en la página de Auditoría. El objetivo es ofrecer una experiencia unificada, accesible y estéticamente atractiva utilizando el tema UDIT.

## Cambios Propuestos

### 1. Sistema de Diseño Base
En lugar de repetir el código SCSS en cada componente, moveremos las clases globales de diseño premium (`.premium-bg`, `.glass-card`, `.gradient-text`, `.table-row-animate`, `.avatar-circle`, etc.) a un archivo global (`styles.scss` o un `admin-theme.scss`) para que cualquier vista administrativa pueda consumirlo fácilmente sin duplicar código.

### 2. Páginas a Modificar (HTML y SCSS)
Para cada una de las siguientes páginas se aplicarán fondos con gradientes sutiles, tarjetas tipo *glassmorphism*, animaciones de elevación en filas de tablas (*hover*), insignias de estado (badges), tooltips para celdas largas, y cabeceras más limpias.

#### [MODIFY] Empaquetamiento
- `src/app/modules/admin/apps/inventario/empaquetamiento/empaquetamiento.component.html`
- `src/app/modules/admin/apps/inventario/empaquetamiento/empaquetamiento.component.scss`

#### [MODIFY] Estado Proyecto
- `src/app/modules/admin/apps/inventario/estadoproyecto/estadoproyecto.component.html`
- `src/app/modules/admin/apps/inventario/estadoproyecto/estadoproyecto.component.scss`

#### [MODIFY] Estado Salida
- `src/app/modules/admin/apps/inventario/estadosalida/estadosalida.component.html`
- `src/app/modules/admin/apps/inventario/estadosalida/estadosalida.component.scss`

#### [MODIFY] Categorías (NombreInsumo)
- `src/app/modules/admin/apps/inventario/nombreinsumo/nombreinsumo.component.html`
- `src/app/modules/admin/apps/inventario/nombreinsumo/nombreinsumo.component.scss`

#### [MODIFY] Unidades de Medida
- `src/app/modules/admin/apps/inventario/unidad-medida/unidad-medida.component.html`
- `src/app/modules/admin/apps/inventario/unidad-medida/unidad-medida.component.scss`

#### [MODIFY] Proveedores
- `src/app/modules/admin/apps/inventario/proveedores/proveedores.component.html`
- `src/app/modules/admin/apps/inventario/proveedores/proveedores.component.scss`

#### [MODIFY] Proyectos
- `src/app/modules/admin/apps/inventario/proyectos/proyectos.component.html`
- `src/app/modules/admin/apps/inventario/proyectos/proyectos.component.scss`

#### [MODIFY] Tipo de Compra
- `src/app/modules/admin/apps/inventario/tipocompra/tipocompra.component.html`
- `src/app/modules/admin/apps/inventario/tipocompra/tipocompra.component.scss`

#### [MODIFY] Ubicaciones
- `src/app/modules/admin/apps/inventario/ubicaciones/ubicaciones.component.html`
- `src/app/modules/admin/apps/inventario/ubicaciones/ubicaciones.component.scss`

#### [MODIFY] Usuarios
- `src/app/features/usuarios/usuarios.component.html`
- `src/app/features/usuarios/usuarios.component.scss`

### 3. Ajustes de Código (TypeScript)
- Añadir importación de `MatTooltipModule` y `CommonModule` en los componentes que no lo tengan para garantizar el funcionamiento de los *tooltips* truncados de accesibilidad y las directivas estándar.

> [!TIP]
> **Accesibilidad Mejorada**
> Todos los botones de acciones (Editar/Eliminar) tendrán tooltips y contrastes revisados. Además se implementarán los `avatar-circle` para iniciales en las tablas que contengan nombres (como la de Usuarios o Proyectos) y `badges` de estado (Activo/Inactivo).

## Plan de Verificación

### Pruebas Manuales
- Una vez implementados los cambios, pediré que valides el diseño corriendo el frontend con `ng serve`.
- Verificaremos que todas las tablas rendericen sin errores, conserven su interactividad (modales de agregar/editar intactos) y que la navegación sea coherente y fluida.
