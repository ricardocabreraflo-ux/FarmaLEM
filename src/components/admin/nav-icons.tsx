const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconAsistencia({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <polyline points="8,14 10.5,16.5 16,11" />
    </svg>
  );
}

export function IconBonoExtra({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <polygon points="12,3 14.35,8.76 20.56,9.22 15.80,13.24 17.29,19.28 12,16 6.71,19.28 8.20,13.24 3.44,9.22 9.65,8.76" />
    </svg>
  );
}

export function IconBonoSemanal({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="8" width="18" height="12" rx="1" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="8" x2="12" y2="20" />
      <circle cx="9" cy="5" r="1.6" />
      <circle cx="15" cy="5" r="1.6" />
    </svg>
  );
}

export function IconVentas({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <line x1="4" y1="20" x2="4" y2="4" />
      <line x1="4" y1="20" x2="21" y2="20" />
      <rect x="7" y="14" width="3" height="6" />
      <rect x="12" y="10" width="3" height="10" />
      <rect x="17" y="6" width="3" height="14" />
    </svg>
  );
}

export function IconCortes({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="2" y="7" width="20" height="10" rx="1.5" />
      <circle cx="12" cy="12" r="2.3" />
      <line x1="5" y1="10" x2="5" y2="14" />
      <line x1="19" y1="10" x2="19" y2="14" />
    </svg>
  );
}

export function IconEmpleados({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="8" r="3" />
      <polyline points="3,20 3,17 8,14 13,17 13,20" />
      <circle cx="17" cy="9" r="2.3" />
      <polyline points="13,20 13,18 17,16 21,18 21,20" />
    </svg>
  );
}

export function IconFinanzas({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function IconHistorial({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="12" x2="12" y2="7" />
      <line x1="12" y1="12" x2="16" y2="14" />
    </svg>
  );
}

export function IconInventario({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <polyline points="3,7 12,3 21,7 12,11 3,7" />
      <line x1="3" y1="7" x2="3" y2="17" />
      <line x1="21" y1="7" x2="21" y2="17" />
      <polyline points="3,17 12,21 21,17" />
      <line x1="12" y1="11" x2="12" y2="21" />
    </svg>
  );
}

export function IconPedidos({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <polyline points="7,8 7,5 9,3 15,3 17,5 17,8" />
      <rect x="4" y="8" width="16" height="13" rx="1" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

export function IconProveedores({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="2" y="10" width="12" height="8" />
      <polyline points="14,13 18,13 21,16 21,18 14,18" />
      <circle cx="7" cy="20" r="1.8" />
      <circle cx="18" cy="20" r="1.8" />
      <line x1="2" y1="18" x2="4" y2="18" />
    </svg>
  );
}

export function IconCompras({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <polyline points="4,13 4,20 20,20 20,13" />
      <polyline points="4,13 9,13 9,16 15,16 15,13 20,13" />
      <line x1="12" y1="2" x2="12" y2="10" />
      <polyline points="8,7 12,11 16,7" />
    </svg>
  );
}

export function IconSalidas({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <line x1="2" y1="11" x2="22" y2="11" />
      <circle cx="17" cy="14.5" r="1.3" />
      <polyline points="18,2 22,2 22,6" />
      <line x1="22" y1="2" x2="16" y2="8" />
    </svg>
  );
}

export function IconLogout({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="3" width="10" height="18" rx="1" />
      <line x1="20" y1="12" x2="9" y2="12" />
      <polyline points="15,8 20,12 15,16" />
    </svg>
  );
}

export function IconSueldos({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16.5" fontSize="11" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="700">
        $
      </text>
    </svg>
  );
}
