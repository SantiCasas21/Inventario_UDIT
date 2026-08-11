-- ============================================================
-- REFACTOR DE VALOR / UNIDAD DE MEDIDA EN INSUMOS
--
-- ⚠️  EJECUTAR CONTRA: UDIT_Inventario_V2
-- ⚠️  Requiere que exista la BD legacy UDIT_Legacy en el MISMO servidor.
--
-- PROBLEMA:
--   La migración original (AddValorUnidadMedidaInsumos) extrajo
--   ValorMedida/UnidadMedida desde la DESCRIPCIÓN de cada insumo,
--   produciendo datos basura (ej. "µF 50 V ALUMINUM ELE").
--
-- SOLUCIÓN:
--   Leer la columna [valor] de la BD legacy (UDIT_Legacy.dbo.Insumo),
--   parsear el número + unidad, mapear al catálogo de unidades y
--   actualizar los valores correctos en la BD nueva.
--
-- PASOS:
--   1) SECCIÓN A: Registrar unidades faltantes (KV, GOHM) en catálogo.
--   2) SECCIÓN B: Reset de los valores basura actuales.
--   3) SECCIÓN C: (DRY-RUN) SELECT de lo que se actualizará — REVISAR.
--   4) SECCIÓN D: (APLICAR) UPDATE real desde UDIT_Legacy.
--   5) SECCIÓN E: Diagnóstico final.
-- ============================================================

USE [UDIT_Inventario_V2]
GO

-- ============================================================
-- SECCIÓN A: Registrar unidades faltantes en el catálogo
-- ============================================================
PRINT '=== A. Registrando unidades faltantes (KV, GOHM) ===';

-- KV → categorías con componentes de voltaje
IF NOT EXISTS (SELECT 1 FROM dbo.UnidadMedida WHERE Nombre = 'KV' AND IdCategoria = (SELECT TOP 1 Id FROM dbo.CategoriaInsumo WHERE Nombre = 'DIODO'))
BEGIN
    INSERT INTO dbo.UnidadMedida (Nombre, IdCategoria)
    SELECT 'KV', Id FROM dbo.CategoriaInsumo
    WHERE Nombre IN ('DIODO', 'MOTOR', 'SENSOR', 'TRANSFORMADOR', 'RELE', 'OTROS')
      AND NOT EXISTS (SELECT 1 FROM dbo.UnidadMedida WHERE Nombre = 'KV' AND IdCategoria = dbo.CategoriaInsumo.Id);
    PRINT '  - KV agregado';
END
ELSE
    PRINT '  - KV ya existía';

-- GOHM → categorías de resistencia
IF NOT EXISTS (SELECT 1 FROM dbo.UnidadMedida WHERE Nombre = 'GOHM')
BEGIN
    INSERT INTO dbo.UnidadMedida (Nombre, IdCategoria)
    SELECT 'GOHM', Id FROM dbo.CategoriaInsumo
    WHERE Nombre IN ('RESISTENCIA', 'POTENCIOMETRO')
      AND NOT EXISTS (SELECT 1 FROM dbo.UnidadMedida WHERE Nombre = 'GOHM' AND IdCategoria = dbo.CategoriaInsumo.Id);
    PRINT '  - GOHM agregado';
END
ELSE
    PRINT '  - GOHM ya existía';
GO

-- ============================================================
-- SECCIÓN B: Reset de valores actuales (basura de descripciones)
-- ============================================================
PRINT '=== B. Reseteando ValorMedida/UnidadMedida actuales ===';

-- ⚠️  Este UPDATE limpia los datos actuales para reemplazarlos por los correctos.
UPDATE dbo.Insumo SET ValorMedida = NULL, UnidadMedida = NULL;

PRINT '  - ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' insumos limpiados';
GO

-- ============================================================
-- SECCIÓN C: DRY-RUN — vista previa de lo que se actualizará
-- (ejecutar primero para revisar; NO modifica datos)
-- ============================================================
PRINT '';
PRINT '=== C. DRY-RUN: Vista previa de valores parseados ===';

;WITH unit_map(unidad_raw, nombre) AS (
    SELECT * FROM (VALUES
        ('K OHM','KOHM'), ('KOHM','KOHM'), ('K OHMS','KOHM'), ('K OMH','KOHM'),
        ('OHM','OHM'),   ('OHMS','OHM'),   ('OMH','OHM'),
        ('M OHM','MOHM'),('MOHM','MOHM'),
        ('G OHM','GOHM'),('GOHM','GOHM'),
        ('UF','uF'), ('PF','pF'), ('NF','nF'), ('F','F'),
        ('UH','uH'), ('MH','mH'), ('H','H'),
        ('V','V'), ('KV','KV'), ('VDC','V'),
        ('MHZ','MHZ'), ('KHZ','KHZ'), ('HZ','HZ'),
        ('A','A'), ('W','W')
    ) AS t(unidad_raw, nombre)
),
parsed AS (
    SELECT
        ni.Id AS NewInsumoId,
        ni.CodigoFabrica,
        LEFT(oi.valor, 40) AS valor_original,
        TRY_CAST(SUBSTRING(v, 1, CASE WHEN PATINDEX('%[^0-9.]%', v) = 0 THEN LEN(v) ELSE PATINDEX('%[^0-9.]%', v) - 1 END) AS DECIMAL(18,6)) AS valor_num,
        CASE WHEN PATINDEX('%[^0-9.]%', v) = 0 THEN NULL
             ELSE UPPER(LTRIM(RTRIM(SUBSTRING(v, PATINDEX('%[^0-9.]%', v), LEN(v))))) END AS unidad_full,
        CASE WHEN PATINDEX('%[^0-9.]%', v) = 0 THEN NULL
             ELSE UPPER(LTRIM(RTRIM(SUBSTRING(v, PATINDEX('%[^0-9.]%', v), LEN(v))))) END AS unidad_first
    FROM dbo.Insumo ni
    JOIN UDIT_Legacy.dbo.Insumo oi
        ON oi.cod_fabrica COLLATE Modern_Spanish_CI_AS = ni.CodigoFabrica
    CROSS APPLY (SELECT LTRIM(RTRIM(REPLACE(REPLACE(oi.valor, ',', '.'), NCHAR(181), 'u'))) AS v) x
    WHERE oi.valor IS NOT NULL
      AND LTRIM(RTRIM(oi.valor)) NOT IN ('N/A', '')
      AND LEFT(LTRIM(RTRIM(oi.valor)), 1) LIKE '%[0-9]%'
),
parsed2 AS (
    SELECT *,
        CASE WHEN CHARINDEX(' ', unidad_full) > 0 THEN LEFT(unidad_full, CHARINDEX(' ', unidad_full) - 1)
             ELSE unidad_full END AS unidad_tok
    FROM parsed
)
SELECT
    p.NewInsumoId,
    p.CodigoFabrica,
    p.valor_original,
    p.valor_num,
    COALESCE(m1.nombre, m2.nombre) AS unidad_nueva,
    CASE WHEN p.unidad_full IS NULL THEN 'OK (solo número)'
         WHEN COALESCE(m1.nombre, m2.nombre) IS NOT NULL THEN 'OK'
         ELSE 'SIN MAPEO → queda NULL' END AS estado
FROM parsed2 p
LEFT JOIN unit_map m1 ON m1.unidad_raw = p.unidad_full
LEFT JOIN unit_map m2 ON m2.unidad_raw = p.unidad_tok
ORDER BY estado, p.NewInsumoId;
GO

-- ============================================================
-- SECCIÓN D: APLICAR — UPDATE real desde UDIT_Legacy
-- ============================================================
PRINT '';
PRINT '=== D. Aplicando actualización de valores ===';

;WITH unit_map(unidad_raw, nombre) AS (
    SELECT * FROM (VALUES
        ('K OHM','KOHM'), ('KOHM','KOHM'), ('K OHMS','KOHM'), ('K OMH','KOHM'),
        ('OHM','OHM'),   ('OHMS','OHM'),   ('OMH','OHM'),
        ('M OHM','MOHM'),('MOHM','MOHM'),
        ('G OHM','GOHM'),('GOHM','GOHM'),
        ('UF','uF'), ('PF','pF'), ('NF','nF'), ('F','F'),
        ('UH','uH'), ('MH','mH'), ('H','H'),
        ('V','V'), ('KV','KV'), ('VDC','V'),
        ('MHZ','MHZ'), ('KHZ','KHZ'), ('HZ','HZ'),
        ('A','A'), ('W','W')
    ) AS t(unidad_raw, nombre)
),
parsed AS (
    SELECT
        ni.Id AS NewInsumoId,
        TRY_CAST(SUBSTRING(v, 1, CASE WHEN PATINDEX('%[^0-9.]%', v) = 0 THEN LEN(v) ELSE PATINDEX('%[^0-9.]%', v) - 1 END) AS DECIMAL(18,6)) AS valor_num,
        CASE WHEN PATINDEX('%[^0-9.]%', v) = 0 THEN NULL
             ELSE UPPER(LTRIM(RTRIM(SUBSTRING(v, PATINDEX('%[^0-9.]%', v), LEN(v))))) END AS unidad_full
    FROM dbo.Insumo ni
    JOIN UDIT_Legacy.dbo.Insumo oi
        ON oi.cod_fabrica COLLATE Modern_Spanish_CI_AS = ni.CodigoFabrica
    CROSS APPLY (SELECT LTRIM(RTRIM(REPLACE(REPLACE(oi.valor, ',', '.'), NCHAR(181), 'u'))) AS v) x
    WHERE oi.valor IS NOT NULL
      AND LTRIM(RTRIM(oi.valor)) NOT IN ('N/A', '')
      AND LEFT(LTRIM(RTRIM(oi.valor)), 1) LIKE '%[0-9]%'
),
parsed2 AS (
    SELECT *,
        CASE WHEN CHARINDEX(' ', unidad_full) > 0 THEN LEFT(unidad_full, CHARINDEX(' ', unidad_full) - 1)
             ELSE unidad_full END AS unidad_tok
    FROM parsed
)
UPDATE ni
SET
    ValorMedida = CASE
        WHEN COALESCE(m1.nombre, m2.nombre) IS NOT NULL OR p.unidad_full IS NULL THEN p.valor_num
        ELSE NULL
    END,
    UnidadMedida = COALESCE(m1.nombre, m2.nombre)
FROM dbo.Insumo ni
JOIN parsed2 p ON p.NewInsumoId = ni.Id
LEFT JOIN unit_map m1 ON m1.unidad_raw = p.unidad_full
LEFT JOIN unit_map m2 ON m2.unidad_raw = p.unidad_tok
WHERE (COALESCE(m1.nombre, m2.nombre) IS NOT NULL OR p.unidad_full IS NULL)
  AND p.valor_num IS NOT NULL;

PRINT '  - ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' insumos actualizados';
GO

-- ============================================================
-- SECCIÓN E: Diagnóstico final
-- ============================================================
PRINT '';
PRINT '=== E. DIAGNÓSTICO FINAL ===';

SELECT 'Insumos totales' AS concepto, COUNT(*) AS cantidad FROM dbo.Insumo
UNION ALL
SELECT 'Con ValorMedida', COUNT(*) FROM dbo.Insumo WHERE ValorMedida IS NOT NULL
UNION ALL
SELECT 'Con UnidadMedida', COUNT(*) FROM dbo.Insumo WHERE UnidadMedida IS NOT NULL
UNION ALL
SELECT 'Sin valor (N/A o ruido)', COUNT(*) FROM dbo.Insumo WHERE ValorMedida IS NULL
ORDER BY 1;
GO

PRINT '=== Distribución por unidad ===';
SELECT UnidadMedida, COUNT(*) AS n
FROM dbo.Insumo
WHERE UnidadMedida IS NOT NULL
GROUP BY UnidadMedida
ORDER BY n DESC;
GO
