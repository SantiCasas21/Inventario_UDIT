-- ============================================================
-- SCRIPT DE POBLACIÓN DE UNIDADES DE MEDIDA POR CATEGORÍA
-- BD: UDIT_Inventario_V2
-- ============================================================

USE [UDIT_Inventario_V2];
GO

SET NOCOUNT ON;

-- 1. Limpieza de unidades mal ubicadas (ej. inductancias en condensadores)
DELETE u
FROM dbo.UnidadMedida u
JOIN dbo.CategoriaInsumo c ON u.IdCategoria = c.Id
WHERE UPPER(LTRIM(RTRIM(c.Nombre))) = 'CONDENSADOR' 
  AND u.Nombre IN ('H', 'mH', 'nH', 'uH');

-- 2. Tabla temporal con mapeo de Categoría (patrón LIKE) y Unidad
CREATE TABLE #SeedData (
    CatPattern NVARCHAR(100),
    Unidad NVARCHAR(50)
);

INSERT INTO #SeedData (CatPattern, Unidad) VALUES
-- RESISTENCIA y POTENCIOMETRO
('%RESISTENCIA%', 'OHM'),
('%RESISTENCIA%', 'KOHM'),
('%RESISTENCIA%', 'MOHM'),
('%RESISTENCIA%', 'GOHM'),
('%RESISTENCIA%', 'mOHM'),
('%RESISTENCIA%', 'W'),
('%RESISTENCIA%', 'mW'),

('%POTENCIOMETRO%', 'OHM'),
('%POTENCIOMETRO%', 'KOHM'),
('%POTENCIOMETRO%', 'MOHM'),
('%POTENCIOMETRO%', 'GOHM'),
('%POTENCIOMETRO%', 'W'),

-- CONDENSADOR
('%CONDENSADOR%', 'pF'),
('%CONDENSADOR%', 'nF'),
('%CONDENSADOR%', 'uF'),
('%CONDENSADOR%', 'mF'),
('%CONDENSADOR%', 'F'),
('%CONDENSADOR%', 'V'),
('%CONDENSADOR%', 'KV'),

-- INDUCTANCIA, BOBINA, NUCLEO
('%INDUCTANCIA%', 'nH'),
('%INDUCTANCIA%', 'uH'),
('%INDUCTANCIA%', 'mH'),
('%INDUCTANCIA%', 'H'),
('%INDUCTANCIA%', 'OHM'),
('%INDUCTANCIA%', 'A'),
('%INDUCTANCIA%', 'mA'),

('%BOBINA%', 'nH'),
('%BOBINA%', 'uH'),
('%BOBINA%', 'mH'),
('%BOBINA%', 'H'),
('%BOBINA%', 'OHM'),
('%BOBINA%', 'A'),

('%NUCLEO%', 'uH'),
('%NUCLEO%', 'mH'),
('%NUCLEO%', 'nH'),
('%NUCLEO%', 'MM'),

-- ANTENA
('%ANTENA%', 'dBi'),
('%ANTENA%', 'dB'),
('%ANTENA%', 'MHZ'),
('%ANTENA%', 'GHZ'),
('%ANTENA%', 'HZ'),
('%ANTENA%', 'OHM'),

-- SENSOR
('%SENSOR%', '°C'),
('%SENSOR%', '°F'),
('%SENSOR%', 'K'),
('%SENSOR%', 'V'),
('%SENSOR%', 'mV'),
('%SENSOR%', 'KV'),
('%SENSOR%', 'A'),
('%SENSOR%', 'mA'),
('%SENSOR%', 'uA'),
('%SENSOR%', 'HZ'),
('%SENSOR%', 'KHZ'),
('%SENSOR%', 'MHZ'),
('%SENSOR%', 'PPM'),
('%SENSOR%', 'LUX'),
('%SENSOR%', 'dB'),
('%SENSOR%', 'BAR'),
('%SENSOR%', 'PSI'),
('%SENSOR%', 'PA'),
('%SENSOR%', 'KPA'),
('%SENSOR%', 'MPA'),
('%SENSOR%', 'G'),
('%SENSOR%', 'MG'),
('%SENSOR%', 'MM'),
('%SENSOR%', 'CM'),
('%SENSOR%', 'M'),
('%SENSOR%', 'M/S'),
('%SENSOR%', 'RPM'),
('%SENSOR%', 'N'),
('%SENSOR%', '%'),

-- AMPLIFICADOR
('%AMPLIFICADOR%', 'dB'),
('%AMPLIFICADOR%', 'W'),
('%AMPLIFICADOR%', 'mW'),
('%AMPLIFICADOR%', 'V'),
('%AMPLIFICADOR%', 'V/us'),
('%AMPLIFICADOR%', 'MHZ'),
('%AMPLIFICADOR%', 'KHZ'),
('%AMPLIFICADOR%', 'A'),
('%AMPLIFICADOR%', 'mA'),

-- DIODO
('%DIODO%', 'V'),
('%DIODO%', 'mV'),
('%DIODO%', 'KV'),
('%DIODO%', 'A'),
('%DIODO%', 'mA'),
('%DIODO%', 'uA'),
('%DIODO%', 'W'),
('%DIODO%', 'mW'),

-- TRANSISTOR
('%TRANSISTOR%', 'NPN'),
('%TRANSISTOR%', 'PNP'),
('%TRANSISTOR%', 'JFET'),
('%TRANSISTOR%', 'MOSFET'),
('%TRANSISTOR%', 'IGBT'),
('%TRANSISTOR%', 'FOTOTRANSISTOR'),
('%TRANSISTOR%', 'V'),
('%TRANSISTOR%', 'A'),
('%TRANSISTOR%', 'mA'),
('%TRANSISTOR%', 'W'),

-- CRISTAL
('%CRISTAL%', 'HZ'),
('%CRISTAL%', 'KHZ'),
('%CRISTAL%', 'MHZ'),
('%CRISTAL%', 'GHZ'),
('%CRISTAL%', 'PPM'),
('%CRISTAL%', 'pF'),

-- REGULADOR, CONVERTIDOR, GATE DRIVER
('%REGULADOR%', 'V'),
('%REGULADOR%', 'mV'),
('%REGULADOR%', 'A'),
('%REGULADOR%', 'mA'),
('%REGULADOR%', 'W'),

('%CONVERTIDOR%', 'V'),
('%CONVERTIDOR%', 'mV'),
('%CONVERTIDOR%', 'A'),
('%CONVERTIDOR%', 'mA'),
('%CONVERTIDOR%', 'W'),
('%CONVERTIDOR%', 'KW'),

('%GATE DRIVER%', 'V'),
('%GATE DRIVER%', 'A'),
('%GATE DRIVER%', 'mA'),
('%GATE DRIVER%', 'ns'),
('%GATE DRIVER%', 'KHZ'),
('%GATE DRIVER%', 'MHZ'),

-- FUSIBLE
('%FUSIBLE%', 'A'),
('%FUSIBLE%', 'mA'),
('%FUSIBLE%', 'V'),
('%FUSIBLE%', 'KV'),

-- RELE
('%RELE%', 'V'),
('%RELE%', 'A'),
('%RELE%', 'mA'),
('%RELE%', 'W'),
('%RELE%', 'OHM'),

-- TRANSFORMADOR
('%TRANSFORMADOR%', 'VA'),
('%TRANSFORMADOR%', 'KVA'),
('%TRANSFORMADOR%', 'V'),
('%TRANSFORMADOR%', 'KV'),
('%TRANSFORMADOR%', 'A'),
('%TRANSFORMADOR%', 'mA'),
('%TRANSFORMADOR%', 'W'),

-- MOTOR
('%MOTOR%', 'RPM'),
('%MOTOR%', 'V'),
('%MOTOR%', 'KV'),
('%MOTOR%', 'W'),
('%MOTOR%', 'KW'),
('%MOTOR%', 'A'),
('%MOTOR%', 'mA'),
('%MOTOR%', 'Nm'),
('%MOTOR%', 'mNm'),

-- DISPLAY / PANTALLA
('%DISPLAY%', 'PULGADAS'),
('%DISPLAY%', 'PIXELES'),
('%DISPLAY%', 'CARACTERES'),
('%DISPLAY%', 'CM'),
('%DISPLAY%', 'MM'),

-- DISIPADOR
('%DISIPADOR%', '°C/W'),
('%DISIPADOR%', 'K/W'),
('%DISIPADOR%', 'MM'),
('%DISIPADOR%', 'CM'),

-- MICROCONTROLADOR, INTEGRADO, TARJETA DE DESARROLLO, MODULO
('%MICROCONTROLADOR%', 'BITS'),
('%MICROCONTROLADOR%', 'MHZ'),
('%MICROCONTROLADOR%', 'GHZ'),
('%MICROCONTROLADOR%', 'KB'),
('%MICROCONTROLADOR%', 'MB'),
('%MICROCONTROLADOR%', 'GB'),
('%MICROCONTROLADOR%', 'PINS'),
('%MICROCONTROLADOR%', 'V'),
('%MICROCONTROLADOR%', 'mA'),

('%INTEGRADO%', 'BITS'),
('%INTEGRADO%', 'MHZ'),
('%INTEGRADO%', 'GHZ'),
('%INTEGRADO%', 'PINS'),
('%INTEGRADO%', 'V'),
('%INTEGRADO%', 'mA'),
('%INTEGRADO%', 'W'),

('%TARJETA DE DESARROLLO%', 'BITS'),
('%TARJETA DE DESARROLLO%', 'MHZ'),
('%TARJETA DE DESARROLLO%', 'GHZ'),
('%TARJETA DE DESARROLLO%', 'MB'),
('%TARJETA DE DESARROLLO%', 'GB'),
('%TARJETA DE DESARROLLO%', 'PINS'),
('%TARJETA DE DESARROLLO%', 'V'),

('%MODULO%', 'V'),
('%MODULO%', 'A'),
('%MODULO%', 'mA'),
('%MODULO%', 'W'),
('%MODULO%', 'MHZ'),
('%MODULO%', 'GHZ'),
('%MODULO%', 'dBm'),

-- CONECTOR, INTERRUPTOR
('%CONECTOR%', 'PINS'),
('%CONECTOR%', 'AWG'),
('%CONECTOR%', 'MM'),
('%CONECTOR%', 'V'),
('%CONECTOR%', 'A'),

('%INTERRUPTOR%', 'V'),
('%INTERRUPTOR%', 'A'),
('%INTERRUPTOR%', 'mA'),
('%INTERRUPTOR%', 'PINS'),

-- OTROS, Celda Peltier
('%OTROS%', 'V'),
('%OTROS%', 'A'),
('%OTROS%', 'mA'),
('%OTROS%', 'W'),
('%OTROS%', 'HZ'),
('%OTROS%', 'KHZ'),
('%OTROS%', 'MHZ'),
('%OTROS%', 'OHM'),
('%OTROS%', 'KOHM'),
('%OTROS%', 'MOHM'),
('%OTROS%', 'pF'),
('%OTROS%', 'nF'),
('%OTROS%', 'uF'),
('%OTROS%', 'dB'),
('%OTROS%', '°C'),
('%OTROS%', 'KV'),

('%Celda Peltier%', 'V'),
('%Celda Peltier%', 'A'),
('%Celda Peltier%', 'W'),
('%Celda Peltier%', '°C'),
('%Celda Peltier%', 'MM');

-- 3. Insertar registros no existentes
INSERT INTO dbo.UnidadMedida (Nombre, IdCategoria)
SELECT DISTINCT s.Unidad, c.Id
FROM #SeedData s
JOIN dbo.CategoriaInsumo c ON UPPER(LTRIM(RTRIM(c.Nombre))) LIKE UPPER(s.CatPattern)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.UnidadMedida u 
    WHERE u.IdCategoria = c.Id AND UPPER(LTRIM(RTRIM(u.Nombre))) = UPPER(s.Unidad)
);

DROP TABLE #SeedData;
GO

PRINT 'Población de Unidades de Medida completada.';
GO
