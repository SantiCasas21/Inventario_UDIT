using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Entities.Catalogos;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace Application.Services
{
    public class ExcelParserService : IExcelParserService
    {
        private readonly IInsumoRepository _insumoRepo;
        private readonly IMovimientoRepository _movRepo;
        private readonly IBaseRepository<CategoriaInsumo> _categoriaRepo;
        private readonly IBaseRepository<Empaquetamiento> _empaquetamientoRepo;
        private readonly IBaseRepository<UnidadMedida> _unidadMedidaRepo;
        private readonly IBaseRepository<Proveedor> _proveedorRepo;
        private readonly IBaseRepository<TipoCompra> _tipoCompraRepo;
        private readonly IBaseRepository<Ubicacion> _ubicacionRepo;

        public ExcelParserService(
            IInsumoRepository insumoRepo,
            IMovimientoRepository movRepo,
            IBaseRepository<CategoriaInsumo> categoriaRepo,
            IBaseRepository<Empaquetamiento> empaquetamientoRepo,
            IBaseRepository<UnidadMedida> unidadMedidaRepo,
            IBaseRepository<Proveedor> proveedorRepo,
            IBaseRepository<TipoCompra> tipoCompraRepo,
            IBaseRepository<Ubicacion> ubicacionRepo)
        {
            _insumoRepo = insumoRepo;
            _movRepo = movRepo;
            _categoriaRepo = categoriaRepo;
            _empaquetamientoRepo = empaquetamientoRepo;
            _unidadMedidaRepo = unidadMedidaRepo;
            _proveedorRepo = proveedorRepo;
            _tipoCompraRepo = tipoCompraRepo;
            _ubicacionRepo = ubicacionRepo;
        }

        public async Task<OperationResult<IngresoPreviewResponseDto>> ProcesarExcelIngresoAsync(Stream fileStream, string fileName)
        {
            if (fileStream == null || fileStream.Length == 0)
                return OperationResult<IngresoPreviewResponseDto>.Fail("El archivo proporcionado está vacío.");

            using var ms = new MemoryStream();
            await fileStream.CopyToAsync(ms);

            List<RawExcelRow> rawRows = new();

            // 1. Intentar como XML Spreadsheet 2003 (.xls)
            try
            {
                ms.Position = 0;
                rawRows = ParseXmlSpreadsheet(ms);
            }
            catch { }

            // 2. Si no hay filas, intentar como XLSX (OpenXML zip)
            if (rawRows == null || rawRows.Count == 0)
            {
                try
                {
                    ms.Position = 0;
                    rawRows = ParseXlsx(ms);
                }
                catch { }
            }

            // 3. Si aún no hay filas, intentar como CSV
            if (rawRows == null || rawRows.Count == 0)
            {
                try
                {
                    ms.Position = 0;
                    rawRows = ParseCsv(ms);
                }
                catch { }
            }

            if (rawRows == null || rawRows.Count == 0)
                return OperationResult<IngresoPreviewResponseDto>.Fail("No se encontraron registros de insumos válidos en el archivo. Verifique que las columnas 'CodigoFabrica' y 'Cantidad' estén presentes.");

            // Cargar catálogos en memoria para cruce rápido
            var categorias = (await _categoriaRepo.GetAllAsync()).ToList();
            var empaquetamientos = (await _empaquetamientoRepo.GetAllAsync()).ToList();
            var unidades = (await _unidadMedidaRepo.GetAllAsync()).ToList();
            var proveedores = (await _proveedorRepo.GetAllAsync()).ToList();
            var tiposCompra = (await _tipoCompraRepo.GetAllAsync()).ToList();
            var todasUbicaciones = (await _ubicacionRepo.GetAllAsync())
                .Where(u => !string.IsNullOrWhiteSpace(u.Nombre))
                .Select(u => new StockUbicacionDto { IdUbicacion = u.Id, UbicacionNombre = u.Nombre, Stock = 0 })
                .ToList();

            var response = new IngresoPreviewResponseDto
            {
                TotalFilas = rawRows.Count
            };

            // Detectar duplicados en el lote
            var codigosFrecuencia = rawRows
                .Where(r => !string.IsNullOrWhiteSpace(r.CodigoFabrica))
                .GroupBy(r => r.CodigoFabrica.Trim().ToLower())
                .ToDictionary(g => g.Key, g => g.Count());

            // Optimización: Pre-cargar todos los insumos existentes en batch para evitar N+1 consultas en el loop
            var codigosLimpios = rawRows
                .Where(r => !string.IsNullOrWhiteSpace(r.CodigoFabrica))
                .Select(r => r.CodigoFabrica!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var insumosExistentes = codigosLimpios.Count > 0
                ? (await _insumoRepo.FindAsync(ins => codigosLimpios.Contains(ins.CodigoFabrica)) ?? Enumerable.Empty<Insumo>()).ToList()
                : new List<Insumo>();

            var insumosDict = insumosExistentes
                .GroupBy(i => i.CodigoFabrica.Trim().ToLower())
                .ToDictionary(g => g.Key, g => g.First());

            // Pre-cargar ubicaciones de stock de todos los insumos existentes en un solo batch
            var insumoIdsExistentes = insumosExistentes.Select(i => i.Id).ToArray();
            var ubicacionesStockBatch = insumoIdsExistentes.Length > 0
                ? await _movRepo.GetStockPorUbicacionPorInsumosAsync(insumoIdsExistentes)
                : new Dictionary<int, List<StockUbicacionResult>>();

            for (int i = 0; i < rawRows.Count; i++)
            {
                var raw = rawRows[i];
                var codigo = (raw.CodigoFabrica ?? "").Trim();
                bool esDuplicado = codigosFrecuencia.TryGetValue(codigo.ToLower(), out var count) && count > 1;

                if (esDuplicado) response.TotalDuplicados++;

                var item = new IngresoPreviewItemDto
                {
                    Fila = i + 1,
                    CodigoFabrica = codigo,
                    Cantidad = raw.Cantidad,
                    PrecioUnitario = raw.PrecioUnitario,
                    Descripcion = raw.Descripcion,
                    ValorMedida = raw.ValorMedida,
                    UnidadMedida = raw.UnidadMedida,
                    Observacion = raw.Observacion,
                    EsDuplicadoEnLote = esDuplicado,
                    UbicacionesDisponibles = new List<StockUbicacionDto>(todasUbicaciones)
                };

                // Validar código de fábrica
                if (string.IsNullOrWhiteSpace(codigo))
                {
                    item.InsumoExiste = false;
                    item.EstadoValidacion = "CANTIDAD_INVALIDA";
                    item.MensajeError = "El código de fábrica está vacío.";
                    response.Filas.Add(item);
                    continue;
                }

                // Cruce en memoria con Insumo existente (O(1), sin queries a BD)
                insumosDict.TryGetValue(codigo.ToLower(), out var insumo);

                if (insumo != null)
                {
                    item.InsumoExiste = true;
                    item.IdInsumo = insumo.Id;
                    item.Descripcion = !string.IsNullOrWhiteSpace(raw.Descripcion) ? raw.Descripcion : insumo.Descripcion;
                    item.IdCategoria = insumo.IdCategoria;
                    item.CategoriaNombre = categorias.FirstOrDefault(c => c.Id == insumo.IdCategoria)?.Nombre;
                    item.IdEmpaquetamiento = insumo.IdEmpaquetamiento;
                    item.EmpaquetamientoNombre = empaquetamientos.FirstOrDefault(e => e.Id == insumo.IdEmpaquetamiento)?.Tipo;
                    item.ValorMedida = raw.ValorMedida ?? insumo.ValorMedida;
                    item.UnidadMedida = !string.IsNullOrWhiteSpace(raw.UnidadMedida) ? raw.UnidadMedida : insumo.UnidadMedida;

                    if (!item.PrecioUnitario.HasValue || item.PrecioUnitario.Value <= 0)
                    {
                        item.PrecioUnitario = insumo.PrecioReferencia;
                    }

                    // Ubicaciones de stock desde cache batch en memoria (0 queries)
                    var ubicacionesStockRaw = ubicacionesStockBatch.GetValueOrDefault(insumo.Id) ?? new List<StockUbicacionResult>();
                    var ubicacionesStock = ubicacionesStockRaw
                        .Select(u => new StockUbicacionDto { IdUbicacion = u.IdUbicacion, UbicacionNombre = u.UbicacionNombre, Stock = u.Stock })
                        .ToList();

                    if (ubicacionesStock.Count > 0)
                    {
                        var listaUbis = new List<StockUbicacionDto>(ubicacionesStock);
                        foreach (var u in todasUbicaciones)
                        {
                            if (!listaUbis.Any(lu => lu.IdUbicacion == u.IdUbicacion))
                            {
                                listaUbis.Add(u);
                            }
                        }
                        item.UbicacionesDisponibles = listaUbis;
                        item.IdUbicacion = ubicacionesStock[0].IdUbicacion;
                        item.UbicacionNombre = ubicacionesStock[0].UbicacionNombre;
                    }
                    else if (todasUbicaciones.Count > 0)
                    {
                        item.IdUbicacion = null;
                    }
                }
                else
                {
                    item.InsumoExiste = false;
                    response.TotalInsumosNuevos++;

                    // Cruce de Categoría desde Excel para prellenado
                    if (!string.IsNullOrWhiteSpace(raw.Categoria))
                    {
                        item.CategoriaTextoExcel = raw.Categoria.Trim();
                        var catMatch = categorias.FirstOrDefault(c =>
                            c.Nombre.Trim().Equals(raw.Categoria.Trim(), StringComparison.OrdinalIgnoreCase) ||
                            c.Nombre.ToLower().Contains(raw.Categoria.ToLower()));
                        if (catMatch != null)
                        {
                            item.IdCategoria = catMatch.Id;
                            item.CategoriaNombre = catMatch.Nombre;
                            item.CategoriaExiste = true;
                        }
                        else
                        {
                            item.CategoriaExiste = false;
                            response.TotalCategoriasNuevas++;
                        }
                    }

                    // Cruce de Empaquetamiento desde Excel para prellenado
                    if (!string.IsNullOrWhiteSpace(raw.Empaquetamiento))
                    {
                        item.EmpaquetamientoTextoExcel = raw.Empaquetamiento.Trim();
                        var empMatch = empaquetamientos.FirstOrDefault(e =>
                            e.Tipo.Trim().Equals(raw.Empaquetamiento.Trim(), StringComparison.OrdinalIgnoreCase) ||
                            e.Tipo.ToLower().Contains(raw.Empaquetamiento.ToLower()));
                        if (empMatch != null)
                        {
                            item.IdEmpaquetamiento = empMatch.Id;
                            item.EmpaquetamientoNombre = empMatch.Tipo;
                            item.EmpaquetamientoExiste = true;
                        }
                        else
                        {
                            item.EmpaquetamientoExiste = false;
                            response.TotalEmpaquetamientosNuevos++;
                        }
                    }
                }

                // Cruce de Proveedor por texto
                if (!string.IsNullOrWhiteSpace(raw.Proveedor))
                {
                    item.ProveedorTextoExcel = raw.Proveedor.Trim();
                    var provMatch = proveedores.FirstOrDefault(p =>
                        p.Nombre.Trim().Equals(raw.Proveedor.Trim(), StringComparison.OrdinalIgnoreCase) ||
                        p.Nombre.ToLower().Contains(raw.Proveedor.ToLower()));
                    if (provMatch != null)
                    {
                        item.IdProveedor = provMatch.Id;
                        item.ProveedorNombre = provMatch.Nombre;
                        item.ProveedorExiste = true;
                    }
                    else
                    {
                        item.IdProveedor = null;
                        item.ProveedorExiste = false;
                        response.TotalProveedoresNuevos++;
                    }
                }
                else
                {
                    item.ProveedorExiste = true;
                }

                // Cruce de Tipo de Compra por texto
                if (!string.IsNullOrWhiteSpace(raw.TipoCompra))
                {
                    item.TipoCompraTextoExcel = raw.TipoCompra.Trim();
                    var tcMatch = tiposCompra.FirstOrDefault(t =>
                        t.Nombre.Trim().Equals(raw.TipoCompra.Trim(), StringComparison.OrdinalIgnoreCase) ||
                        t.Nombre.ToLower().Contains(raw.TipoCompra.ToLower()));
                    if (tcMatch != null)
                    {
                        item.IdTipoCompra = tcMatch.Id;
                        item.TipoCompraNombre = tcMatch.Nombre;
                        item.TipoCompraExiste = true;
                    }
                    else
                    {
                        item.TipoCompraExiste = false;
                    }
                }

                // Evaluación consolidada del Estado de Validación
                if (!item.InsumoExiste)
                {
                    item.EstadoValidacion = "INSUMO_NO_REGISTRADO";
                    item.MensajeError = "Insumo no registrado en el sistema. Puedes crearlo con un clic con los datos del Excel prellenados.";
                }
                else if (item.Cantidad <= 0)
                {
                    item.EstadoValidacion = "CANTIDAD_INVALIDA";
                    item.MensajeError = "La cantidad debe ser mayor a 0.";
                }
                else if (!item.IdUbicacion.HasValue)
                {
                    item.EstadoValidacion = "REQUIERE_UBICACION";
                    item.MensajeError = "Seleccione la ubicación de ingreso.";
                }
                else if (!item.ProveedorExiste)
                {
                    item.EstadoValidacion = "PROVEEDOR_NO_REGISTRADO";
                    item.MensajeError = $"El proveedor '{item.ProveedorTextoExcel}' no existe en el sistema.";
                }
                else if (!item.CategoriaExiste)
                {
                    item.EstadoValidacion = "CATEGORIA_NO_REGISTRADA";
                    item.MensajeError = $"La categoría '{item.CategoriaTextoExcel}' no existe en el sistema.";
                }
                else if (!item.EmpaquetamientoExiste)
                {
                    item.EstadoValidacion = "EMPAQUETAMIENTO_NO_REGISTRADO";
                    item.MensajeError = $"El empaquetamiento '{item.EmpaquetamientoTextoExcel}' no existe en el sistema.";
                }
                else
                {
                    item.EstadoValidacion = "OK";
                    response.TotalValidas++;
                }

                if (item.Cantidad > 0 && item.PrecioUnitario.HasValue && item.PrecioUnitario.Value > 0)
                {
                    response.TotalInversionEstimada += item.Cantidad * item.PrecioUnitario.Value;
                }

                response.Filas.Add(item);
            }

            response.TotalInversionEstimada = Math.Round(response.TotalInversionEstimada, 2);
            return OperationResult<IngresoPreviewResponseDto>.Ok(response);
        }

        #region Parsers Internos

        private class RawExcelRow
        {
            public string CodigoFabrica { get; set; } = string.Empty;
            public string? Descripcion { get; set; }
            public string? Categoria { get; set; }
            public string? Empaquetamiento { get; set; }
            public decimal? ValorMedida { get; set; }
            public string? UnidadMedida { get; set; }
            public int Cantidad { get; set; }
            public decimal? PrecioUnitario { get; set; }
            public string? Proveedor { get; set; }
            public string? TipoCompra { get; set; }
            public string? Observacion { get; set; }
        }

        private List<RawExcelRow> ParseXmlSpreadsheet(Stream stream)
        {
            var result = new List<RawExcelRow>();
            using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);
            var doc = XDocument.Load(reader);
            XNamespace ss = "urn:schemas-microsoft-com:office:spreadsheet";

            var worksheet = doc.Descendants(ss + "Worksheet").FirstOrDefault();
            if (worksheet == null) return result;

            var rows = worksheet.Descendants(ss + "Row").ToList();
            if (rows.Count == 0) return result;

            int headerRowIndex = -1;
            var colMap = new Dictionary<int, string>();

            // 1. Escaneo inteligente de fila de encabezados
            for (int r = 0; r < Math.Min(rows.Count, 15); r++)
            {
                var rowElem = rows[r];
                var tempMap = new Dictionary<int, string>();
                int colIdx = 0;

                foreach (var cell in rowElem.Elements(ss + "Cell"))
                {
                    var indexAttr = cell.Attribute(ss + "Index");
                    if (indexAttr != null && int.TryParse(indexAttr.Value, out int explicitIdx))
                    {
                        colIdx = explicitIdx - 1;
                    }

                    string cellVal = cell.Element(ss + "Data")?.Value ?? "";
                    string norm = NormalizeHeader(cellVal);
                    if (!string.IsNullOrEmpty(norm))
                    {
                        tempMap[colIdx] = norm;
                    }
                    colIdx++;
                }

                if (tempMap.Values.Contains("codigofabrica") && tempMap.Values.Contains("cantidad"))
                {
                    headerRowIndex = r;
                    colMap = tempMap;
                    break;
                }
            }

            if (headerRowIndex == -1 || colMap.Count == 0) return result;

            // 2. Extraer filas de datos posteriores al encabezado
            for (int r = headerRowIndex + 1; r < rows.Count; r++)
            {
                var rowElem = rows[r];
                var raw = new RawExcelRow();
                bool hasData = false;
                int colIdx = 0;

                foreach (var cell in rowElem.Elements(ss + "Cell"))
                {
                    var indexAttr = cell.Attribute(ss + "Index");
                    if (indexAttr != null && int.TryParse(indexAttr.Value, out int explicitIdx))
                    {
                        colIdx = explicitIdx - 1;
                    }

                    string val = (cell.Element(ss + "Data")?.Value ?? "").Trim();
                    if (colMap.TryGetValue(colIdx, out var header) && !string.IsNullOrEmpty(val))
                    {
                        hasData = true;
                        AssignField(raw, header, val);
                    }
                    colIdx++;
                }

                if (hasData && !string.IsNullOrWhiteSpace(raw.CodigoFabrica) && !IsNoteOrHeader(raw.CodigoFabrica))
                {
                    result.Add(raw);
                }
            }

            return result;
        }

        private List<RawExcelRow> ParseXlsx(Stream stream)
        {
            var result = new List<RawExcelRow>();
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);

            var sharedStrings = new List<string>();
            var sharedStringsEntry = archive.GetEntry("xl/sharedStrings.xml");
            if (sharedStringsEntry != null)
            {
                using var ssStream = sharedStringsEntry.Open();
                var ssDoc = XDocument.Load(ssStream);
                XNamespace ns = ssDoc.Root?.GetDefaultNamespace() ?? XNamespace.None;
                foreach (var si in ssDoc.Descendants(ns + "si"))
                {
                    var tElements = si.Descendants(ns + "t").Select(t => t.Value);
                    sharedStrings.Add(string.Concat(tElements));
                }
            }

            var sheetEntry = archive.GetEntry("xl/worksheets/sheet1.xml") ?? archive.Entries.FirstOrDefault(e => e.FullName.StartsWith("xl/worksheets/sheet"));
            if (sheetEntry == null) return result;

            using var sheetStream = sheetEntry.Open();
            var sheetDoc = XDocument.Load(sheetStream);
            XNamespace sheetNs = sheetDoc.Root?.GetDefaultNamespace() ?? XNamespace.None;

            var rows = sheetDoc.Descendants(sheetNs + "row").ToList();
            if (rows.Count == 0) return result;

            int headerRowIndex = -1;
            var colMap = new Dictionary<int, string>();

            // 1. Escaneo de encabezados
            for (int r = 0; r < Math.Min(rows.Count, 15); r++)
            {
                var rowElem = rows[r];
                var tempMap = new Dictionary<int, string>();

                foreach (var cell in rowElem.Elements(sheetNs + "c"))
                {
                    var rAttr = cell.Attribute("r")?.Value;
                    int colIdx = GetColumnIndexFromCellRef(rAttr);
                    string cellVal = GetCellValue(cell, sharedStrings, sheetNs);
                    string norm = NormalizeHeader(cellVal);
                    if (!string.IsNullOrEmpty(norm))
                    {
                        tempMap[colIdx] = norm;
                    }
                }

                if (tempMap.Values.Contains("codigofabrica") && tempMap.Values.Contains("cantidad"))
                {
                    headerRowIndex = r;
                    colMap = tempMap;
                    break;
                }
            }

            if (headerRowIndex == -1 || colMap.Count == 0) return result;

            // 2. Extraer datos
            for (int r = headerRowIndex + 1; r < rows.Count; r++)
            {
                var rowElem = rows[r];
                var cells = rowElem.Elements(sheetNs + "c").ToList();
                if (cells.Count == 0) continue;

                var raw = new RawExcelRow();
                bool hasData = false;

                foreach (var cell in cells)
                {
                    var rAttr = cell.Attribute("r")?.Value;
                    int colIdx = GetColumnIndexFromCellRef(rAttr);
                    string val = GetCellValue(cell, sharedStrings, sheetNs).Trim();

                    if (!colMap.TryGetValue(colIdx, out var header) || string.IsNullOrEmpty(val)) continue;

                    hasData = true;
                    AssignField(raw, header, val);
                }

                if (hasData && !string.IsNullOrWhiteSpace(raw.CodigoFabrica) && !IsNoteOrHeader(raw.CodigoFabrica))
                {
                    result.Add(raw);
                }
            }

            return result;
        }

        private List<RawExcelRow> ParseCsv(Stream stream)
        {
            var result = new List<RawExcelRow>();
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
            
            var lines = new List<string>();
            string? l;
            while ((l = reader.ReadLine()) != null)
            {
                lines.Add(l);
            }

            if (lines.Count == 0) return result;

            char sep = ',';
            foreach (var line in lines.Take(10))
            {
                if (line.Contains(';')) { sep = ';'; break; }
                if (line.Contains('\t')) { sep = '\t'; break; }
            }

            int headerLineIndex = -1;
            var colMap = new Dictionary<int, string>();

            for (int i = 0; i < Math.Min(lines.Count, 15); i++)
            {
                var cols = SplitCsvLine(lines[i], sep);
                var tempMap = new Dictionary<int, string>();
                for (int c = 0; c < cols.Count; c++)
                {
                    string norm = NormalizeHeader(cols[c]);
                    if (!string.IsNullOrEmpty(norm)) tempMap[c] = norm;
                }

                if (tempMap.Values.Contains("codigofabrica") && tempMap.Values.Contains("cantidad"))
                {
                    headerLineIndex = i;
                    colMap = tempMap;
                    break;
                }
            }

            if (headerLineIndex == -1) return result;

            for (int i = headerLineIndex + 1; i < lines.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(lines[i])) continue;
                var cols = SplitCsvLine(lines[i], sep);
                var raw = new RawExcelRow();
                bool hasData = false;

                for (int c = 0; c < Math.Min(colMap.Count, cols.Count); c++)
                {
                    if (colMap.TryGetValue(c, out var header))
                    {
                        string val = cols[c].Trim();
                        if (!string.IsNullOrEmpty(val))
                        {
                            hasData = true;
                            AssignField(raw, header, val);
                        }
                    }
                }

                if (hasData && !string.IsNullOrWhiteSpace(raw.CodigoFabrica) && !IsNoteOrHeader(raw.CodigoFabrica))
                {
                    result.Add(raw);
                }
            }

            return result;
        }

        private static void AssignField(RawExcelRow raw, string header, string val)
        {
            if (header == "codigofabrica")
            {
                raw.CodigoFabrica = val;
            }
            else if (header == "descripcion")
            {
                raw.Descripcion = val;
            }
            else if (header == "categoria")
            {
                raw.Categoria = val;
            }
            else if (header == "empaquetamiento")
            {
                raw.Empaquetamiento = val;
            }
            else if (header == "valormedida")
            {
                string cleanVal = val.Replace(" ", "").Replace(",", ".");
                if (decimal.TryParse(cleanVal, NumberStyles.Any, CultureInfo.InvariantCulture, out var vDec))
                    raw.ValorMedida = vDec;
            }
            else if (header == "unidadmedida")
            {
                raw.UnidadMedida = val;
            }
            else if (header == "cantidad")
            {
                string clean = val.Replace(" ", "").Replace(".", "").Replace(",", ".");
                if (decimal.TryParse(clean, NumberStyles.Any, CultureInfo.InvariantCulture, out var cDec))
                    raw.Cantidad = (int)cDec;
                else if (int.TryParse(clean, out var cInt))
                    raw.Cantidad = cInt;
            }
            else if (header == "preciounitario")
            {
                string cleanVal = val.Replace("$", "").Replace(" ", "").Replace("COP", "").Trim();
                if (cleanVal.Contains('.') && cleanVal.Contains(','))
                {
                    cleanVal = cleanVal.Replace(".", "").Replace(",", ".");
                }
                else if (cleanVal.Contains(','))
                {
                    cleanVal = cleanVal.Replace(",", ".");
                }

                if (decimal.TryParse(cleanVal, NumberStyles.Any, CultureInfo.InvariantCulture, out var pDec))
                    raw.PrecioUnitario = pDec;
            }
            else if (header == "proveedor")
            {
                raw.Proveedor = val;
            }
            else if (header == "tipocompra")
            {
                raw.TipoCompra = val;
            }
            else if (header == "observacion")
            {
                raw.Observacion = val;
            }
        }

        private static string GetCellValue(XElement cell, List<string> sharedStrings, XNamespace ns)
        {
            string type = cell.Attribute("t")?.Value ?? "";
            var vElem = cell.Element(ns + "v");
            if (vElem == null)
            {
                var isElem = cell.Element(ns + "is");
                return isElem?.Element(ns + "t")?.Value ?? "";
            }

            string val = vElem.Value;
            if (type == "s" && int.TryParse(val, out int ssIndex) && ssIndex >= 0 && ssIndex < sharedStrings.Count)
            {
                return sharedStrings[ssIndex];
            }

            return val;
        }

        private static int GetColumnIndexFromCellRef(string? cellRef)
        {
            if (string.IsNullOrEmpty(cellRef)) return 0;
            string colLetters = Regex.Replace(cellRef, @"[\d]", "");
            int colIndex = 0;
            foreach (char c in colLetters.ToUpperInvariant())
            {
                colIndex = (colIndex * 26) + (c - 'A' + 1);
            }
            return colIndex - 1;
        }

        private static string NormalizeHeader(string header)
        {
            if (string.IsNullOrWhiteSpace(header)) return "";
            if (header.Length > 35) return "";

            string clean = header.ToLowerInvariant()
                .Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u")
                .Replace(".", "").Replace("_", "").Replace(" ", "").Replace("-", "").Replace("*", "").Trim();

            if (clean == "codigofabrica" || clean == "codigo" || clean == "codfabrica" || clean == "referencia" || clean == "insumo" || clean == "codigodefabricante" || clean == "codigofabricante" || clean == "codfabricante")
                return "codigofabrica";
            if (clean == "descripcion" || clean == "descripcioninsumo" || clean == "nombre" || clean == "detalle")
                return "descripcion";
            if (clean == "categoria" || clean == "categoriainsumo" || clean == "cat")
                return "categoria";
            if (clean == "empaquetamiento" || clean == "empaque" || clean == "tipoempaquetamiento" || clean == "tipoempaque" || clean == "packaging")
                return "empaquetamiento";
            if (clean == "valormedida" || clean == "valormed" || clean == "medida" || clean == "valor" || clean == "dimension")
                return "valormedida";
            if (clean == "unidadmedida" || clean == "unidad" || clean == "unidaddemedida" || clean == "um")
                return "unidadmedida";
            if (clean == "cantidad" || clean == "cant" || clean == "unidades" || clean == "cantidadingreso")
                return "cantidad";
            if (clean == "preciounitario" || clean == "precio" || clean == "costo" || clean == "unitario" || clean == "valorunitario" || clean == "preciounit")
                return "preciounitario";
            if (clean == "proveedor" || clean == "nombreproveedor" || clean == "prov")
                return "proveedor";
            if (clean == "tipocompra" || clean == "tipodecompra" || clean == "compra" || clean == "tipo")
                return "tipocompra";
            if (clean == "observacion" || clean == "observaciones" || clean == "nota" || clean == "notas" || clean == "comentario" || clean == "comentarios")
                return "observacion";

            return "";
        }

        private static bool IsNoteOrHeader(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return true;
            string lower = text.Trim().ToLowerInvariant();
            if (lower.StartsWith("nota") || lower.StartsWith("importante") || lower.StartsWith("advertencia") || lower.StartsWith("plantilla oficial"))
                return true;
            return false;
        }

        private static List<string> SplitCsvLine(string line, char sep)
        {
            var list = new List<string>();
            bool inQuotes = false;
            var sb = new StringBuilder();

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == sep && !inQuotes)
                {
                    list.Add(sb.ToString().Trim('"'));
                    sb.Clear();
                }
                else
                {
                    sb.Append(c);
                }
            }
            list.Add(sb.ToString().Trim('"'));
            return list;
        }

        #endregion
    }
}
