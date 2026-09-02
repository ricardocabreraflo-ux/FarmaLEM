import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Ayuda / tutoriales del equipo. El contenido (pasos, capturas) vive aquí en
 * código — cambia poco y así queda versionado con el resto de la app. Lo
 * único que se guarda en Supabase (tabla `tutorial_settings`) es si
 * administración lo dejó visible para el equipo o no.
 */

export interface TutorialStep {
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  cue?: string;
  cueTone?: "ok" | "warn";
}

export interface Tutorial {
  slug: string;
  title: string;
  audience: string;
  summary: string;
  minutes: number;
  visible: boolean;
  steps: TutorialStep[];
}

type TutorialContent = Omit<Tutorial, "visible">;

const TUTORIALS: TutorialContent[] = [
  {
    slug: "como-entrar",
    title: "Cómo entrar al panel",
    audience: "Todo el equipo",
    summary: "La pantalla de turno, tu contraseña la primera vez y tu PIN después.",
    minutes: 1,
    steps: [
      {
        title: "Elige tu turno",
        body: "Al abrir el acceso directo aparece esta pantalla con los dos turnos de la farmacia. Cada botón muestra el nombre de quien está asignado a ese turno.",
        image: "/tutoriales/entrar-01-elegir-turno.png",
        imageAlt: "Pantalla para elegir tu turno",
        cue: "Toca tu turno, por ejemplo “MATUTINO”",
      },
      {
        title: "Primera vez en esa computadora: tu contraseña",
        body: "Solo la primera vez. Escribes tu contraseña normal para que esa computadora “aprenda” quién marca ese turno — no hace falta repetirlo después.",
        image: "/tutoriales/entrar-03-contrasena-lista.png",
        imageAlt: "Pantalla pidiendo la contraseña",
        cue: "Escribe tu contraseña y toca “Entrar”",
      },
      {
        title: "Llegas a Inicio",
        body: "Tu meta de ventas de la semana, tu última marca del reloj y un botón directo para ir a marcar.",
        image: "/tutoriales/entrar-04-inicio.png",
        imageAlt: "Pantalla de Inicio",
        cue: "Toca “Ir al reloj checador” o “Capturar corte”",
      },
      {
        title: "La próxima vez: solo tu PIN",
        body: "Esa misma computadora ya “reconoce” tu turno después de la primera vez: en vez de tu contraseña completa, solo pide tu PIN corto (el mismo del reloj checador).",
        image: "/tutoriales/entrar-05-pin-reconocida.png",
        imageAlt: "Pantalla de PIN, computadora ya reconocida",
        cue: "Marca tu PIN y toca “OK”",
      },
    ],
  },
  {
    slug: "reloj-checador",
    title: "Cómo usar el reloj checador",
    audience: "Mostrador",
    summary: "Marcar tu entrada y tu salida — un solo botón, sin volver a pedir tu PIN.",
    minutes: 1,
    steps: [
      {
        title: "Antes de marcar",
        body: "La pantalla te dice claramente si ya marcaste hoy o no. El botón siempre dice qué vas a marcar a continuación.",
        image: "/tutoriales/reloj-01-antes-de-marcar.png",
        imageAlt: "Reloj checador antes de marcar",
        cue: "Toca “Marcar mi Entrada”",
      },
      {
        title: "Entrada registrada",
        body: "Confirma tu nombre y la hora exacta. El botón cambia solo a “Marcar mi Salida” para cuando termines tu turno.",
        image: "/tutoriales/reloj-02-entrada-marcada.png",
        imageAlt: "Entrada registrada",
        cue: "Tu asistencia del día ya quedó como “Asistió”",
        cueTone: "ok",
      },
      {
        title: "Al terminar tu turno: marca tu salida",
        body: "Mismo botón, mismo lugar. Si no marcas tu salida, tu horario del día queda incompleto en los reportes.",
        image: "/tutoriales/reloj-03-salida-marcada.png",
        imageAlt: "Salida registrada",
        cue: "No cierres el turno sin marcarla",
        cueTone: "warn",
      },
    ],
  },
  {
    slug: "capturar-corte",
    title: "Cómo capturar el corte del día",
    audience: "Mostrador",
    summary: "Venta total, tarjeta, el conteo de efectivo por denominación y guardar.",
    minutes: 3,
    steps: [
      {
        title: "Abre Capturar corte",
        body: "La fecha ya viene en hoy y tu turno ya viene puesto — no necesitas elegir nada.",
        image: "/tutoriales/corte-01-formulario-vacio.png",
        imageAlt: "Formulario de Capturar corte vacío",
      },
      {
        title: "Venta total y tarjeta",
        body: "Escribe la venta total del día y cuánto fue con tarjeta o transferencia. El efectivo se calcula solo.",
        image: "/tutoriales/corte-02-venta-y-tarjeta.png",
        imageAlt: "Venta total y tarjeta capturados",
      },
      {
        title: "Cuenta el efectivo por denominación",
        body: "Es obligatorio: el botón de guardar no se activa hasta que cuentes billete por billete y moneda por moneda.",
        image: "/tutoriales/corte-04-contar-efectivo-lleno.png",
        imageAlt: "Ventana de contar efectivo llena",
        cue: "Coincide con lo esperado",
        cueTone: "ok",
      },
      {
        title: "Guarda el corte",
        body: "Queda registrado con estado “Por revisar” hasta que administración lo apruebe.",
        image: "/tutoriales/corte-06-guardado-en-lista.png",
        imageAlt: "Corte guardado en la lista de Cortes",
      },
    ],
  },
];

async function visibilityMap(): Promise<Map<string, boolean>> {
  const { data, error } = await supabaseAdmin().from("tutorial_settings").select("slug, visible");
  if (error) throw new Error(`No se pudo leer la configuración de Ayuda: ${error.message}`);
  return new Map((data ?? []).map((row) => [row.slug as string, row.visible as boolean]));
}

/** Sin fila en tutorial_settings todavía = visible por default (recién agregado y nadie lo ha apagado). */
function isVisible(slug: string, map: Map<string, boolean>): boolean {
  return map.get(slug) ?? true;
}

export async function listTutorials(includeHidden: boolean): Promise<Tutorial[]> {
  const map = await visibilityMap();
  const all = TUTORIALS.map((t) => ({ ...t, visible: isVisible(t.slug, map) }));
  return includeHidden ? all : all.filter((t) => t.visible);
}

export async function getTutorial(slug: string): Promise<Tutorial | null> {
  const content = TUTORIALS.find((t) => t.slug === slug);
  if (!content) return null;
  const map = await visibilityMap();
  return { ...content, visible: isVisible(slug, map) };
}

export async function setTutorialVisibility(slug: string, visible: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("tutorial_settings").upsert({ slug, visible, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar el cambio: ${error.message}`);
}
