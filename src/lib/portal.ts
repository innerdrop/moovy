// Utility to detect which portal is being accessed based on subdomain
export type PortalType = 'client' | 'comercio' | 'conductor' | 'ops';

export function getPortalFromHost(host: string | null): PortalType {
    if (!host) return 'client';

    const cleanHost = host.toLowerCase().replace(':3000', '').replace(':3002', '');

    if (cleanHost.startsWith('comercios.')) return 'comercio';
    if (cleanHost.startsWith('conductores.')) return 'conductor';
    if (cleanHost.startsWith('ops.')) return 'ops';

    return 'client';
}

export function getPortalConfig(portal: PortalType) {
    const configs = {
        client: {
            name: 'Moovy',
            description: 'Tu tienda de delivery',
            loginPath: '/login',
            homePath: '/',
            allowedRoles: ['USER', 'ADMIN'],
            theme: 'red',
        },
        comercio: {
            name: 'Moovy Comercios',
            description: 'Panel para comercios y tiendas',
            loginPath: '/login',
            homePath: '/dashboard',
            allowedRoles: ['MERCHANT', 'ADMIN'],
            theme: 'blue',
        },
        conductor: {
            name: 'Moovy Conductores',
            description: 'Panel para repartidores',
            loginPath: '/login',
            homePath: '/dashboard',
            allowedRoles: ['DRIVER', 'ADMIN'],
            theme: 'green',
        },
        ops: {
            name: 'Moovy Ops',
            description: 'Centro de comando',
            loginPath: '/login',
            homePath: '/dashboard',
            allowedRoles: ['ADMIN'],
            theme: 'purple',
        },
    };

    return configs[portal];
}

export function isRoleAllowedForPortal(role: string | undefined, portal: PortalType): boolean {
    if (!role) return false;
    const config = getPortalConfig(portal);
    return config.allowedRoles.includes(role);
}
