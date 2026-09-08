import { inject, Injectable } from '@angular/core';
import { UserService } from '@app/core/user/user.service';
import { ReporteService } from '@app/core/services/reporte.service';

export interface ExcelColumn {
  header: string;
  field: string;
  type?: 'string' | 'number' | 'currency' | 'date';
  width?: number;
}

export interface ExcelFilterItem {
  label: string;
  value: string;
}

export interface ExcelExportOptions {
  title: string;
  subtitle?: string;
  fileName: string;
  filters?: ExcelFilterItem[];
  columns: ExcelColumn[];
  data: any[];
  totalFields?: string[];
  totalLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  private userService = inject(UserService);
  private reporteService = inject(ReporteService);

  /**
   * Genera y descarga un archivo Excel (.xls compatible) con formato estructurado,
   * estilos de encabezado, tipado de datos y resumen, y registra la acción en auditoría.
   */
  exportToExcel(options: ExcelExportOptions): void {
    const { title, subtitle, fileName, filters, columns, data, totalFields, totalLabel } = options;

    const currentUser = this.userService.currentUser?.nombreCompleto || this.userService.currentUser?.username || 'Usuario del Sistema';
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Escapar XML
    const escapeXml = (unsafe: any): string => {
      if (unsafe === null || unsafe === undefined) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // 2. Construir Columnas y Anchos
    let columnsXml = '';
    columns.forEach(col => {
      const width = col.width || (col.header.length * 9 + 40);
      columnsXml += `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>\n`;
    });

    // 3. Encabezado institucional
    let rowsXml = '';
    rowsXml += `
      <Row ss:Height="24">
        <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Title">
          <Data ss:Type="String">INVENTARIO UDIT — ${escapeXml(title.toUpperCase())}</Data>
        </Cell>
      </Row>
      <Row ss:Height="18">
        <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Subtitle">
          <Data ss:Type="String">${escapeXml(subtitle || 'Reporte oficial generado desde el Sistema de Gestión de Inventario UDIT')}</Data>
        </Cell>
      </Row>
      <Row ss:Height="16">
        <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Subtitle">
          <Data ss:Type="String">Generado por: ${escapeXml(currentUser)} | Fecha de emisión: ${formattedDate}</Data>
        </Cell>
      </Row>
      <Row ss:Height="8"/>
    `;

    // 4. Bloque de Filtros
    if (filters && filters.length > 0) {
      rowsXml += `
        <Row ss:Height="18">
          <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="FilterHeader">
            <Data ss:Type="String">PARÁMETROS Y FILTROS APLICADOS</Data>
          </Cell>
        </Row>
      `;
      filters.forEach(f => {
        rowsXml += `
          <Row ss:Height="18">
            <Cell ss:StyleID="FilterLabel"><Data ss:Type="String">${escapeXml(f.label)}:</Data></Cell>
            <Cell ss:MergeAcross="${columns.length - 2}" ss:StyleID="FilterVal"><Data ss:Type="String">${escapeXml(f.value)}</Data></Cell>
          </Row>
        `;
      });
      rowsXml += `<Row ss:Height="10"/>`;
    }

    // 5. Encabezados de Tabla
    rowsXml += `<Row ss:Height="26">`;
    columns.forEach(col => {
      rowsXml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`;
    });
    rowsXml += `</Row>\n`;

    // 6. Filas de Datos
    data.forEach(item => {
      rowsXml += `<Row ss:Height="20">`;
      columns.forEach(col => {
        const val = item[col.field];
        const type = col.type || 'string';

        if (val === null || val === undefined || val === '') {
          rowsXml += `<Cell ss:StyleID="CellText"><Data ss:Type="String">-</Data></Cell>`;
        } else if (type === 'number') {
          const num = Number(val);
          if (isNaN(num)) {
            rowsXml += `<Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
          } else {
            rowsXml += `<Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${num}</Data></Cell>`;
          }
        } else if (type === 'currency') {
          const num = Number(val);
          if (isNaN(num)) {
            rowsXml += `<Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
          } else {
            rowsXml += `<Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">${num}</Data></Cell>`;
          }
        } else if (type === 'date') {
          let dateStr = String(val);
          if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
          rowsXml += `<Cell ss:StyleID="CellDate"><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>`;
        } else {
          rowsXml += `<Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
        }
      });
      rowsXml += `</Row>\n`;
    });

    // 7. Fila de Totales si aplica
    if (totalFields && totalFields.length > 0 && data.length > 0) {
      rowsXml += `<Row ss:Height="22">`;
      columns.forEach((col, idx) => {
        if (idx === 0) {
          rowsXml += `<Cell ss:StyleID="TotalRow"><Data ss:Type="String">${escapeXml(totalLabel || 'TOTAL')}</Data></Cell>`;
        } else if (totalFields.includes(col.field)) {
          const sum = data.reduce((acc, row) => acc + (Number(row[col.field]) || 0), 0);
          rowsXml += `<Cell ss:StyleID="TotalNumber"><Data ss:Type="Number">${sum}</Data></Cell>`;
        } else {
          rowsXml += `<Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>`;
        }
      });
      rowsXml += `</Row>\n`;
    }

    // 8. Construcción completa del XML Spreadsheet 2003
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${escapeXml(currentUser)}</Author>
  <Created>${now.toISOString()}</Created>
  <Company>Universidad Central - UDIT</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#111827"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#1E3A8A"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#6B7280"/>
  </Style>
  <Style ss:ID="FilterHeader">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#374151"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="FilterLabel">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#4B5563"/>
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="FilterVal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#111827"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E3A8A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2563EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2563EB"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellText">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F3F4F6"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9"/>
  </Style>
  <Style ss:ID="CellNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F3F4F6"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="CellCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F3F4F6"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9"/>
   <NumberFormat ss:Format="$#,##0.00"/>
  </Style>
  <Style ss:ID="CellDate">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F3F4F6"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E3A8A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#1E3A8A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E3A8A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#1E3A8A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(title.substring(0, Math.min(title.length, 30)))}">
  <Table ss:DefaultRowHeight="18">
   ${columnsXml}
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

    // 9. Descargar en el navegador
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const finalName = fileName.endsWith('.xls') ? fileName : `${fileName}.xls`;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // 10. Registrar en Auditoría
    const filterSummary = (filters || []).map(f => `${f.label}: ${f.value}`).join(' | ');
    this.reporteService.logExportacion(title, filterSummary).subscribe({
      next: () => console.log('[Auditoria] Exportación a Excel registrada con éxito.'),
      error: err => console.warn('[Auditoria] No se pudo registrar log de exportación:', err)
    });
  }
}
