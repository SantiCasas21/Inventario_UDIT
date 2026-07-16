/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id      : 'apps',
        title   : 'Inventario DIT',
        subtitle: 'Inventario unidad de Desarrollo, Innovación y Transferencia',
        type    : 'group',
        icon    : 'heroicons_outline:home',
        children: [
            {
                id   : 'empaquetamiento',
                title: 'Empaquetamiento',
                type : 'basic',
                icon : 'heroicons_outline:chart-pie',
                link : '/empaquetamiento'
            },
            {
                id   : 'estadoproyecto',
                title: 'Estado Proyecto',
                type : 'basic',
                icon : 'heroicons_outline:clipboard-document-list',
                link : '/estadoproyecto'
            },
            {
                id   : 'estadosalida',
                title: 'Estado Salida',
                type : 'basic',
                icon : 'heroicons_outline:clipboard-document-list',
                link : '/estadosalida'
            },
            {
                id   : 'ingresoinsumo',
                title: 'Ingreso Insumo',
                type : 'basic',
                icon : 'heroicons_outline:arrow-trending-up',
                link : '/ingresoinsumo'
            },
            {
                id   : 'insumos',
                title: 'Insumos',
                type : 'basic',
                icon : 'heroicons_outline:circle-stack',
                link : '/insumos'
            },
            {
                id   : 'nombreinsumo',
                title: 'Nombre Insumo',
                type : 'basic',
                icon : 'heroicons_outline:chart-pie',
                link : '/nombreinsumo'
            },
            {
                id   : 'personal',
                title: 'Personal',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/personal'
            },
            {
                id   : 'proveedores',
                title: 'Proveedores',
                type : 'basic',
                icon : 'heroicons_outline:truck',
                link : '/proveedores'
            },
            {
                id   : 'proyectos',
                title: 'Proyectos',
                type : 'basic',
                icon : 'heroicons_outline:folder',
                link : '/proyectos'
            },
            {
                id   : 'salidainsumos',
                title: 'Salida Insumos',
                type : 'basic',
                icon : 'heroicons_outline:arrow-trending-down',
                link : '/salidainsumos'
            },
            {
                id   : 'tipocompra',
                title: 'Tipo Compra',
                type : 'basic',
                icon : 'heroicons_outline:cube',
                link : '/tipocompra'
            }
            ,
            {
                id   : 'ubicaciones',
                title: 'Ubicaciones',
                type : 'basic',
                icon : 'heroicons_outline:map-pin',
                link : '/ubicaciones'
            }
        ]
    }
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
