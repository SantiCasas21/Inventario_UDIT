import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ReportCard {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  link: string;
  badge: string;
  features: string[];
}

@Component({
  selector: 'app-reportes-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './reportes-hub.component.html',
  styleUrls: ['./reportes-hub.component.scss']
})
export class ReportesHubComponent {
  reports: ReportCard[] = [
    {
      title: 'Kardex por Insumo',
      subtitle: 'Trazabilidad y Saldos',
      description: 'Historial cronológico completo de entradas, salidas, traslados y ajustes de un insumo específico con cálculo de saldo acumulado.',
      icon: 'receipt_long',
      color: '#4f46e5', // Indigo
      link: '/reportes/kardex',
      badge: 'Kardex Oficial',
      features: ['Búsqueda predictiva de insumos', 'Saldos acumulados paso a paso', 'Filtro por rango de fechas', 'Exportación Excel con fórmulas']
    },
    {
      title: 'Stock Crítico y Alertas',
      subtitle: 'Control de Mínimos',
      description: 'Detección temprana de insumos agotados o por debajo del umbral de seguridad para prevenir desabastecimiento.',
      icon: 'warning_amber',
      color: '#dc2626', // Red
      link: '/reportes/stock-critico',
      badge: 'Alertas en Vivo',
      features: ['Umbral de stock personalizable', 'Indicadores de estado crítico', 'Categorización por familia', 'Exportación Excel para compras']
    },
    {
      title: 'Movimientos por Período',
      subtitle: 'Auditoría y Flujo',
      description: 'Consolidado general de todos los movimientos registrados en el inventario durante un intervalo de tiempo seleccionado.',
      icon: 'calendar_month',
      color: '#0891b2', // Cyan
      link: '/reportes/movimientos',
      badge: 'Auditoría Global',
      features: ['Filtro obligatorio por fechas', 'Filtro opcional por insumo', 'Usuario responsable de cada registro', 'Desglose detallado exportable']
    },
    {
      title: 'Consumo por Proyecto',
      subtitle: 'Asignación de Recursos',
      description: 'Resumen de insumos retirados y entregados para proyectos académicos, de investigación y mantenimiento.',
      icon: 'folder_special',
      color: '#059669', // Emerald
      link: '/reportes/proyectos',
      badge: 'Proyectos & Obras',
      features: ['Filtro por proyecto específico', 'Total de unidades retiradas', 'Trazabilidad de destino', 'Reporte ejecutivo en Excel']
    }
  ];
}
