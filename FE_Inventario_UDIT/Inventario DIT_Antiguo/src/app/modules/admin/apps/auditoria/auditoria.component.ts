import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AuditoriaService, AuditoriaDto } from '@app/core/services/auditoria.service';
import { PagedResult } from '@app/core/models';
import { TipoMovimientoBadgePipe } from '@app/shared/pipes/tipo-movimiento-badge.pipe';
import { TipoMovimientoCantidadPipe } from '@app/shared/pipes/tipo-movimiento-cantidad.pipe';

export interface DateGroupedLogs {
  dateLabel: string;
  rawDate: string;
  count: number;
  logs: AuditoriaDto[];
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule,
    MatInputModule, MatSelectModule, MatIconModule, MatButtonModule,
    MatCardModule, MatTooltipModule, MatButtonToggleModule,
    ReactiveFormsModule, FormsModule,
    TipoMovimientoBadgePipe, TipoMovimientoCantidadPipe
  ],
  providers: [DatePipe],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss']
})
export class AuditoriaComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['fecha', 'usuario', 'modulo', 'accion', 'detalles'];
  dataSource = new MatTableDataSource<AuditoriaDto>();
  
  viewMode: 'timeline' | 'table' = 'timeline';
  groupedLogs: DateGroupedLogs[] = [];
  rawLogs: AuditoriaDto[] = [];
  
  totalCount = 0;
  pageSize = 20;
  currentPage = 1;
  isLoading = false;
  error: string | null = null;
  
  filterForm: FormGroup;
  modulos = ['Insumos', 'Movimientos', 'Reportes', 'Personal', 'Proyectos', 'Usuarios', 'Catálogos'];

  private readonly monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private auditoriaService: AuditoriaService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.filterForm = this.fb.group({
      textSearch: [''],
      modulo: ['']
    });
  }

  ngOnInit(): void {
    this.loadLogs();
    
    this.filterForm.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.currentPage = 1;
      if (this.paginator) this.paginator.pageIndex = 0;
      this.loadLogs();
    });
  }

  ngAfterViewInit() {
    // Initial pagination setup is handled by the template binding
  }

  loadLogs() {
    this.isLoading = true;
    this.error = null;
    const filters = this.filterForm.value;
    
    this.auditoriaService.getLogs(this.currentPage, this.pageSize, filters.textSearch, filters.modulo)
      .subscribe({
        next: (result: PagedResult<AuditoriaDto>) => {
          this.rawLogs = result.items || [];
          this.dataSource.data = this.rawLogs;
          this.groupedLogs = this.groupLogsByDate(this.rawLogs);
          this.totalCount = result.totalCount;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar auditoría: ' + (err.message || '');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  formatDate(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'dd/MM/yyyy HH:mm') || dateStr;
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private groupLogsByDate(logs: AuditoriaDto[]): DateGroupedLogs[] {
    const groupsMap = new Map<string, { dateLabel: string; rawDate: string; logs: AuditoriaDto[] }>();

    for (const log of logs) {
      const d = new Date(log.fecha);
      const rawDate = isNaN(d.getTime()) 
        ? (log.fecha ? log.fecha.substring(0, 10) : 'Sin fecha')
        : `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

      let label = rawDate;
      if (!isNaN(d.getTime())) {
        const month = this.monthsEs[d.getMonth()];
        const day = d.getDate().toString().padStart(2, '0');
        const year = d.getFullYear();
        label = `${month} ${day}, ${year}`;
      }

      if (!groupsMap.has(rawDate)) {
        groupsMap.set(rawDate, {
          dateLabel: label,
          rawDate: rawDate,
          logs: []
        });
      }

      groupsMap.get(rawDate)!.logs.push(log);
    }

    return Array.from(groupsMap.values()).map(g => ({
      dateLabel: g.dateLabel,
      rawDate: g.rawDate,
      count: g.logs.length,
      logs: g.logs
    }));
  }

  /** Retorna configuración visual para cada tipo de acción */
  getActionConfig(accion: string): {
    dotClass: string;
    badgeClass: string;
    icon: string;
    label: string;
  } {
    const a = (accion || '').toUpperCase().trim();

    if (a.includes('CREAR') || a.includes('INGRESO') || a.includes('REGISTRAR')) {
      return {
        dotClass: 'bg-emerald-500 ring-4 ring-emerald-100',
        badgeClass: 'badge-action-crear',
        icon: 'add_circle',
        label: accion
      };
    }

    if (a.includes('EDITAR') || a.includes('ACTUALIZAR') || a.includes('MODIFICAR')) {
      return {
        dotClass: 'bg-amber-500 ring-4 ring-amber-100',
        badgeClass: 'badge-action-editar',
        icon: 'edit',
        label: accion
      };
    }

    if (a.includes('ELIMINAR') || a.includes('DESACTIVAR') || a.includes('SALIDA') || a.includes('BORRAR')) {
      return {
        dotClass: 'bg-rose-500 ring-4 ring-rose-100',
        badgeClass: 'badge-action-eliminar',
        icon: 'delete',
        label: accion
      };
    }

    if (a.includes('ACTIVAR') || a.includes('REACTIVAR')) {
      return {
        dotClass: 'bg-teal-500 ring-4 ring-teal-100',
        badgeClass: 'badge-action-activar',
        icon: 'check_circle',
        label: accion
      };
    }

    if (a.includes('UNIFICAR') || a.includes('AJUSTE')) {
      return {
        dotClass: 'bg-purple-500 ring-4 ring-purple-100',
        badgeClass: 'badge-action-unificar',
        icon: 'merge_type',
        label: accion
      };
    }

    // CONSULTAR / default
    return {
      dotClass: 'bg-sky-500 ring-4 ring-sky-100',
      badgeClass: 'badge-action-consultar',
      icon: 'visibility',
      label: accion || 'CONSULTAR'
    };
  }

  /** Retorna configuración de icono y color para cada módulo */
  getModuleConfig(modulo: string): {
    icon: string;
    label: string;
    colorClass: string;
  } {
    const m = (modulo || '').toLowerCase().trim();

    if (m.includes('usuario')) {
      return { icon: 'manage_accounts', label: 'Usuarios', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (m.includes('reporte')) {
      return { icon: 'analytics', label: 'Reportes', colorClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (m.includes('insumo')) {
      return { icon: 'inventory_2', label: 'Insumos', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (m.includes('movimiento')) {
      return { icon: 'sync_alt', label: 'Movimientos', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (m.includes('proyecto')) {
      return { icon: 'apartment', label: 'Proyectos', colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    }
    if (m.includes('personal')) {
      return { icon: 'badge', label: 'Personal', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (m.includes('catálogo') || m.includes('catalogo') || m.includes('categor') || m.includes('unidad') || m.includes('ubicaci') || m.includes('empaque')) {
      return { icon: 'category', label: modulo || 'Catálogos', colorClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    }

    return { icon: 'layers', label: modulo || 'Sistema', colorClass: 'bg-gray-50 text-gray-700 border-gray-200' };
  }

  /** Retorna iniciales, clase de avatar y badge específico para cada usuario/rol */
  getUserConfig(usuario: string | null | undefined, rol?: string, avatarUrl?: string): {
    initials: string;
    avatarClass: string;
    badgeClass: string;
    roleLabel: string;
    avatarUrl?: string;
    customStyle?: Record<string, string>;
  } {
    const raw = (usuario || 'Sistema').trim();
    const lowerUser = raw.toLowerCase();
    const role = (rol || '').trim().toLowerCase();

    // 1. Rol Admin
    if (role === 'admin' || lowerUser.includes('admin')) {
      return {
        initials: this.extractInitials(raw),
        avatarClass: 'avatar-admin',
        badgeClass: 'badge-role-admin',
        roleLabel: 'Administrador',
        avatarUrl
      };
    }

    // 2. Rol Developer
    if (role === 'developer' || lowerUser.includes('developer') || lowerUser.includes('dev')) {
      return {
        initials: this.extractInitials(raw),
        avatarClass: 'avatar-developer',
        badgeClass: 'badge-role-developer',
        roleLabel: 'Developer',
        avatarUrl
      };
    }

    // 3. Rol Assistant / Asistente
    if (role === 'assistant' || lowerUser.includes('asistente') || lowerUser.includes('assistant')) {
      return {
        initials: this.extractInitials(raw),
        avatarClass: 'avatar-assistant',
        badgeClass: 'badge-role-assistant',
        roleLabel: 'Asistente',
        avatarUrl
      };
    }

    // 4. Rol User / Usuario
    if (role === 'user' || lowerUser.includes('user') || lowerUser.includes('usuario')) {
      return {
        initials: this.extractInitials(raw),
        avatarClass: 'avatar-user',
        badgeClass: 'badge-role-user',
        roleLabel: 'Usuario',
        avatarUrl
      };
    }

    // 5. Sistema
    if (lowerUser.includes('sistema') || lowerUser.includes('system') || lowerUser.includes('histórico') || lowerUser.includes('historico')) {
      return {
        initials: 'SYS',
        avatarClass: 'avatar-system',
        badgeClass: 'badge-role-system',
        roleLabel: 'Sistema'
      };
    }

    // Fallback genérico para otros usuarios
    const initials = this.extractInitials(raw);
    const palettes = [
      { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', text: '#1e40af', border: '#93c5fd' },
      { bg: 'linear-gradient(135deg, #ccfbf1 0%, #5eead4 100%)', text: '#115e59', border: '#2dd4bf' },
      { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', text: '#92400e', border: '#fcd34d' },
      { bg: 'linear-gradient(135deg, #f3e8ff 0%, #d8b4fe 100%)', text: '#6b21a8', border: '#c084fc' },
      { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', text: '#065f46', border: '#86efac' },
    ];

    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = raw.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = palettes[Math.abs(hash) % palettes.length];

    return {
      initials,
      avatarClass: '',
      badgeClass: 'badge-role-custom',
      roleLabel: rol || 'Usuario',
      avatarUrl,
      customStyle: {
        background: color.bg,
        color: color.text,
        border: `1.5px solid ${color.border}`
      }
    };
  }

  private extractInitials(name: string): string {
    const parts = name.split(/[\s_.-]+/).filter(p => p.length > 0);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, Math.min(2, name.length)).toUpperCase();
  }
}


