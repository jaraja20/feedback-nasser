export const AREAS = [
  { value: 'ventas_cubiertas', label: 'Venta de cubiertas' },
  { value: 'autocentro', label: 'Autocentro / servicios' },
  { value: 'atencion', label: 'Atención al cliente' },
  { value: 'otro', label: 'Otro' },
]

export const ESTADOS = {
  nueva: { label: 'Nueva', badge: 'badge-new' },
  en_atencion: { label: 'En atención', badge: 'badge-progress' },
  resuelta: { label: 'Resuelta', badge: 'badge-done' },
}

// Las 5 sucursales de Nasser Cubiertas. El "value" es el slug que va en la
// URL de cada QR (ej. /queja/oasis) y se guarda tal cual en cada documento
// de Firestore, así que si en algún momento cambian de nombre hay que tener
// cuidado de no romper los QR ya impresos.
export const SUCURSALES = [
  { value: 'km6', label: 'Km 6 / Matriz' },
  { value: 'oasis', label: 'Oasis' },
  { value: 'minga_guazu', label: 'Minga Guazú' },
  { value: 'hernandarias', label: 'Hernandarias' },
  { value: 'ypane', label: 'Ypané' },
]

export function sucursalLabel(value) {
  return SUCURSALES.find((s) => s.value === value)?.label || value || '-'
}

// Roles del sistema:
// - administrador: control total (crea usuarios, borra, ve todo).
// - admin: ve todo (todas las sucursales) igual que administrador, pero
//          de solo lectura: no puede tomar/resolver/eliminar nada.
// - jefe: atiende quejas y valoraciones únicamente de su propia sucursal.
// - visor: monitoreo de solo lectura de todas las sucursales (dashboard +
//          casos en curso), sin acceso a relatorio ni usuarios.
export const ROLES = [
  { value: 'jefe', label: 'Jefe de sucursal', necesitaSucursal: true },
  { value: 'admin', label: 'Admin (lectura global, sin modificar)', necesitaSucursal: false },
  { value: 'visor', label: 'Visor (monitoreo, todas las sucursales)', necesitaSucursal: false },
  { value: 'administrador', label: 'Administrador (control total)', necesitaSucursal: false },
]

export function roleLabel(value) {
  return ROLES.find((r) => r.value === value)?.label || value || '-'
}

// Roles que ven datos de TODAS las sucursales (en vez de solo la propia).
export const ROLES_GLOBALES = ['administrador', 'admin', 'visor']
// Roles que pueden tomar/resolver casos (escritura).
export const ROLES_OPERATIVOS = ['administrador', 'jefe']
