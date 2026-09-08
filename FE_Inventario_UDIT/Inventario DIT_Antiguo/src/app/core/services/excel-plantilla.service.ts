import { Injectable } from '@angular/core';
import { CatalogoDto } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ExcelPlantillaService {

  /**
   * Genera y descarga la plantilla oficial de Excel para el ingreso masivo de insumos,
   * incluyendo 11 columnas técnicas completas y una hoja de opciones válidas sincronizada
   * en tiempo real con la base de datos (Categorías, Empaquetamientos, Unidades, Tipos de Compra y Proveedores).
   */
  descargarPlantillaOficial(
    categorias: CatalogoDto[] = [],
    empaquetamientos: CatalogoDto[] = [],
    unidades: any[] = [],
    tiposCompra: CatalogoDto[] = [],
    proveedores: CatalogoDto[] = []
  ): void {
    const escapeXml = (unsafe: any): string => {
      if (unsafe === null || unsafe === undefined) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Máximo número de filas para la hoja de catálogos
    const maxLen = Math.max(
      categorias.length,
      empaquetamientos.length,
      unidades.length,
      tiposCompra.length,
      proveedores.length,
      1
    );

    let catalogosRowsXml = '';
    for (let i = 0; i < maxLen; i++) {
      const cat = categorias[i]?.nombre || '';
      const emp = empaquetamientos[i]?.nombre || '';
      const uni = unidades[i]?.nombre || '';
      const tc = tiposCompra[i]?.nombre || '';
      const prov = proveedores[i]?.nombre || '';

      catalogosRowsXml += `
       <Row>
        <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(cat)}</Data></Cell>
        <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(emp)}</Data></Cell>
        <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(uni)}</Data></Cell>
        <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(tc)}</Data></Cell>
        <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(prov)}</Data></Cell>
       </Row>
      `;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1A171B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#636F03" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderSubtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#7A8904" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ColHeaderReq">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#636F03"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ColHeaderOpt">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#64748B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#475569" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataString">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="DataNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="DataCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#059669"/>
   <NumberFormat ss:Format="$#,##0.00"/>
  </Style>
  <Style ss:ID="ExampleNote">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- HOJA 1: INGRESO DE INSUMOS -->
 <Worksheet ss:Name="Ingreso_Insumos">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="160"/>
   <Column ss:Index="2" ss:Width="230"/>
   <Column ss:Index="3" ss:Width="180"/>
   <Column ss:Index="4" ss:Width="160"/>
   <Column ss:Index="5" ss:Width="100"/>
   <Column ss:Index="6" ss:Width="110"/>
   <Column ss:Index="7" ss:Width="100"/>
   <Column ss:Index="8" ss:Width="130"/>
   <Column ss:Index="9" ss:Width="180"/>
   <Column ss:Index="10" ss:Width="140"/>
   <Column ss:Index="11" ss:Width="250"/>
   
   <!-- Titulo -->
   <Row ss:Height="26">
    <Cell ss:MergeAcross="10" ss:StyleID="HeaderTitle">
     <Data ss:Type="String">PLANTILLA OFICIAL DE CARGA MASIVA DE INGRESOS — INVENTARIO UDIT</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="10" ss:StyleID="HeaderSubtitle">
     <Data ss:Type="String">Diligencie las columnas respetando el código de fabricante y las cantidades mayores a 0.</Data>
    </Cell>
   </Row>
   <Row ss:Height="6"/>

   <!-- Encabezados de Columna -->
   <Row ss:Height="24">
    <Cell ss:StyleID="ColHeaderReq"><Data ss:Type="String">CodigoFabrica *</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">Descripcion</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">Categoria</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">Empaquetamiento</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">ValorMedida</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">UnidadMedida</Data></Cell>
    <Cell ss:StyleID="ColHeaderReq"><Data ss:Type="String">Cantidad *</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">PrecioUnitario</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">Proveedor</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">TipoCompra</Data></Cell>
    <Cell ss:StyleID="ColHeaderOpt"><Data ss:Type="String">Observacion</Data></Cell>
   </Row>

   <!-- Filas de Ejemplo con datos reales de catálogo -->
   <Row>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">NE555P</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">Temporizador analógico de precisión</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(categorias[0]?.nombre || 'Circuitos Integrados')}</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(empaquetamientos[0]?.nombre || 'DIP-8')}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">8</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(unidades[0]?.nombre || 'Pines')}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">50</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">1200</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(proveedores[0]?.nombre || 'Proveedor Ejemplo')}</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(tiposCompra[0]?.nombre || 'Normal')}</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">Lote compra semestral</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">RES-10K-0805</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">Resistencia SMD 10K 5%</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(categorias[1]?.nombre || categorias[0]?.nombre || 'Pasivos')}</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(empaquetamientos[1]?.nombre || empaquetamientos[0]?.nombre || '0805')}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">10</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">kΩ</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">200</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">150</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(proveedores[1]?.nombre || proveedores[0]?.nombre || 'Proveedor Ejemplo')}</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">${escapeXml(tiposCompra[1]?.nombre || tiposCompra[0]?.nombre || 'Urgente')}</Data></Cell>
    <Cell ss:StyleID="DataString"><Data ss:Type="String">Carrete de resistencias</Data></Cell>
   </Row>

   <Row ss:Height="12"/>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="10" ss:StyleID="ExampleNote">
     <Data ss:Type="String">Notas: Las columnas con (*) son obligatorias. Si el insumo no existe, los campos técnicos (Descripción, Categoría, Empaquetamiento, Medida) se autocompletarán al crearlo.</Data>
    </Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- HOJA 2: CATÁLOGOS DE REFERENCIA CON OPCIONES VÁLIDAS -->
 <Worksheet ss:Name="Opciones_Validas">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="220"/>
   <Column ss:Index="2" ss:Width="200"/>
   <Column ss:Index="3" ss:Width="160"/>
   <Column ss:Index="4" ss:Width="180"/>
   <Column ss:Index="5" ss:Width="240"/>

   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="HeaderTitle">
     <Data ss:Type="String">CATÁLOGO DE OPCIONES VÁLIDAS EN EL SISTEMA (SINCRONIZADO EN TIEMPO REAL)</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="4" ss:StyleID="HeaderSubtitle">
     <Data ss:Type="String">Copie o escriba estos nombres exactos en la hoja 'Ingreso_Insumos' para una vinculación inmediata</Data>
    </Cell>
   </Row>
   <Row ss:Height="6"/>

   <Row ss:Height="22">
    <Cell ss:StyleID="ColHeaderReq"><Data ss:Type="String">Categorías Válidas</Data></Cell>
    <Cell ss:StyleID="ColHeaderReq"><Data ss:Type="String">Empaquetamientos</Data></Cell>
    <Cell ss:StyleID="ColHeaderReq"><Data ss:Type="String">Unidades Medida</Data></Cell>
    <Cell ss:StyleID="ColHeaderReq"><Data ss:Type="String">Tipos de Compra</Data></Cell>
    <Cell ss:StyleID="ColHeaderReq"><Data ss:Type="String">Proveedores</Data></Cell>
   </Row>

   ${catalogosRowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plantilla_Ingreso_Masivo_UDIT_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
