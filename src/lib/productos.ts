import productosRaw from "@/data/productos.json";

/**
 * Para agregar productos nuevos: abre src/data/productos.json y agrega un
 * objeto más al arreglo, siguiendo este mismo esquema. No hace falta tocar
 * ningún componente — las góndolas y el grid se generan solos a partir de
 * este archivo. `imagen` es la ruta donde debe vivir la foto real del
 * producto (public/products/...); mientras no exista, las tarjetas muestran
 * una ilustración de reemplazo según el tipo de producto.
 */
export type TipoPromocion = "3x2" | "5x4" | "liquidacion";

export interface Producto {
  id: string;
  nombre: string;
  sustanciaActiva: string;
  marca: string;
  precio: number;
  promocion: {
    tipo: TipoPromocion;
    grupo: string;
    descuento?: number;
  };
  categoria: string;
  descripcionUso: string;
  imagen: string;
}

export const productos = productosRaw as Producto[];

export interface Gondola {
  grupo: string;
  tipo: TipoPromocion;
  productos: Producto[];
}

const ORDEN_GONDOLAS = [
  "Analgésicos y Antiinflamatorios",
  "Antihipertensivos / Cardiovascular",
  "Gastrointestinal",
  "Respiratorio / Alergias",
  "Diversos",
  "Insumos médicos",
  "Liquidación por caducidad",
];

export function getGondolas(): Gondola[] {
  const grupos = new Map<string, Gondola>();

  for (const producto of productos) {
    const { grupo, tipo } = producto.promocion;
    if (!grupos.has(grupo)) {
      grupos.set(grupo, { grupo, tipo, productos: [] });
    }
    grupos.get(grupo)!.productos.push(producto);
  }

  return [...grupos.values()].sort(
    (a, b) => ORDEN_GONDOLAS.indexOf(a.grupo) - ORDEN_GONDOLAS.indexOf(b.grupo)
  );
}
