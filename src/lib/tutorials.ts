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
  /** Ancho/alto reales (px) de `image` — por default 420x860 (pantalla completa del celular); las capturas recortadas de una sola sección traen su propia medida. */
  imageWidth?: number;
  imageHeight?: number;
  imageDesktop?: string;
  /** Ancho/alto reales (px) de imageDesktop — por default 1440x900 (pantalla completa); las capturas recortadas de una sola sección traen su propia medida. */
  imageDesktopWidth?: number;
  imageDesktopHeight?: number;
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
        imageDesktop: "/tutoriales/entrar-01-elegir-turno-desktop.png",
        imageDesktopHeight: 900,
        imageAlt: "Pantalla para elegir tu turno",
        cue: "Toca tu turno, por ejemplo “MATUTINO”",
      },
      {
        title: "¿Ya llegaste pero aún no puedes entrar?",
        body: "Justo debajo de los turnos hay un enlace “¿Ya llegaste pero aún no puedes entrar? Marca tu entrada aquí”. Es para cuando ya llegaste a trabajar pero, por ejemplo, tu compañera sigue usando la computadora para capturar su corte. Te lleva a una pantalla aparte donde marcas tu entrada con tu turno y tu PIN, sin necesidad de abrir tu sesión — el paso a paso completo está en el tutorial “Cómo usar el reloj checador”, en la sección “Marcar a otro turno”.",
      },
      {
        title: "Primera vez en esa computadora: tu contraseña",
        body: "Solo la primera vez. Escribes tu contraseña normal para que esa computadora “aprenda” quién marca ese turno — no hace falta repetirlo después.",
        image: "/tutoriales/entrar-03-contrasena-lista.png",
        imageDesktop: "/tutoriales/entrar-03-contrasena-lista-desktop.png",
        imageDesktopHeight: 900,
        imageAlt: "Pantalla pidiendo la contraseña",
        cue: "Escribe tu contraseña y toca “Entrar”",
      },
      {
        title: "Llegas a Inicio",
        body: "Tu meta de ventas de la semana, tu última marca del reloj y un botón directo para ir a marcar.",
        image: "/tutoriales/entrar-04-inicio.png",
        imageDesktop: "/tutoriales/entrar-04-inicio-desktop.png",
        imageDesktopHeight: 760,
        imageAlt: "Pantalla de Inicio",
        cue: "Toca “Ir al reloj checador” o “Capturar corte”",
      },
      {
        title: "La próxima vez: solo tu PIN",
        body: "Esa misma computadora ya “reconoce” tu turno después de la primera vez: en vez de tu contraseña completa, solo pide tu PIN corto (el mismo del reloj checador).",
        image: "/tutoriales/entrar-05-pin-reconocida.png",
        imageDesktop: "/tutoriales/entrar-05-pin-reconocida-desktop.png",
        imageDesktopHeight: 900,
        imageAlt: "Pantalla de PIN, computadora ya reconocida",
        cue: "Marca tu PIN y toca “OK”",
      },
    ],
  },
  {
    slug: "inicio",
    title: "Cómo usar Inicio",
    audience: "Mostrador",
    summary: "La meta de la semana, tus ventas por día, tu racha de cortes y los niveles de bono.",
    minutes: 2,
    steps: [
      {
        title: "Meta de la semana",
        body: "Arriba de todo ves cuánto llevas vendido esta semana (de lunes a domingo) contra la meta, incluyendo los cortes que ya capturaste aunque administración todavía no los apruebe. Debajo, tu última marca del reloj checador y cuántos días has trabajado esta semana.",
        image: "/tutoriales/inicio-01-meta.png",
        imageWidth: 312,
        imageHeight: 497,
        imageDesktop: "/tutoriales/inicio-01-meta-desktop.png",
        imageDesktopWidth: 868,
        imageDesktopHeight: 306,
        imageAlt: "Sección Meta de la semana en Inicio",
      },
      {
        title: "Ventas por día y racha de cortes",
        body: "La gráfica muestra cuánto vendiste cada día y las líneas punteadas son el promedio diario que necesitas para cada nivel de bono. Debajo, “Cortes capturados esta semana” te dice de un vistazo qué días ya quedaron registrados: una palomita verde es que ya está capturado, un “!” rojo es un turno que ya se trabajó pero todavía no tiene corte.",
        image: "/tutoriales/inicio-02-antes.png",
        imageWidth: 312,
        imageHeight: 794,
        imageDesktop: "/tutoriales/inicio-02-antes-desktop.png",
        imageDesktopWidth: 868,
        imageDesktopHeight: 436,
        imageAlt: "Ventas por día y racha de cortes, con un turno sin capturar",
        cue: "El “!” en rojo significa: falta capturar ese corte",
        cueTone: "warn",
      },
      {
        title: "En cuanto capturas el corte, la racha se pone verde",
        body: "Justo debajo está el reloj checador (para marcar tu entrada/salida o marcar a otro turno) y el botón “Capturar corte”. En cuanto guardas el corte del día, su casilla en la racha cambia a palomita verde de inmediato — así confirmas que ya quedó, sin tener que ir a la lista de Cortes a revisar.",
        image: "/tutoriales/inicio-02-despues.png",
        imageWidth: 312,
        imageHeight: 794,
        imageDesktop: "/tutoriales/inicio-02-despues-desktop.png",
        imageDesktopWidth: 868,
        imageDesktopHeight: 436,
        imageAlt: "Racha de cortes ya completa, todos los turnos en verde",
        cue: "4 de 4 turnos capturados",
        cueTone: "ok",
      },
      {
        title: "Niveles de bono",
        body: "Aquí ves los dos niveles de bono de tu turno: cuánto hay que vender en la semana para alcanzar cada uno y cuánto es el bono. “Vas en el Nivel…” te dice dónde estás parada ahora mismo con lo que llevas vendido.",
        image: "/tutoriales/inicio-03-bonos.png",
        imageWidth: 312,
        imageHeight: 188,
        imageDesktop: "/tutoriales/inicio-03-bonos-desktop.png",
        imageDesktopWidth: 868,
        imageDesktopHeight: 169,
        imageAlt: "Sección Niveles de bono en Inicio",
      },
    ],
  },
  {
    slug: "reloj-checador",
    title: "Cómo usar el reloj checador",
    audience: "Mostrador",
    summary: "Marcar tu entrada y tu salida — un solo botón, sin volver a pedir tu PIN.",
    minutes: 2,
    steps: [
      {
        title: "Antes de marcar",
        body: "La pantalla te dice claramente si ya marcaste hoy o no. El botón siempre dice qué vas a marcar a continuación.",
        image: "/tutoriales/reloj-01-antes-de-marcar.png",
        imageDesktop: "/tutoriales/reloj-01-antes-de-marcar-desktop.png",
        imageDesktopHeight: 434,
        imageAlt: "Reloj checador antes de marcar",
        cue: "Toca “Marcar mi Entrada”",
      },
      {
        title: "Entrada registrada",
        body: "Confirma tu nombre y la hora exacta. El botón cambia solo a “Marcar mi Salida” para cuando termines tu turno.",
        image: "/tutoriales/reloj-02-entrada-marcada.png",
        imageDesktop: "/tutoriales/reloj-02-entrada-marcada-desktop.png",
        imageDesktopHeight: 434,
        imageAlt: "Entrada registrada",
        cue: "Tu asistencia del día ya quedó como “Asistió”",
        cueTone: "ok",
      },
      {
        title: "Al terminar tu turno: marca tu salida",
        body: "Mismo botón, mismo lugar. Si no marcas tu salida, tu horario del día queda incompleto en los reportes.",
        image: "/tutoriales/reloj-03-salida-marcada.png",
        imageDesktop: "/tutoriales/reloj-03-salida-marcada-desktop.png",
        imageDesktopHeight: 434,
        imageAlt: "Salida registrada",
        cue: "No cierres el turno sin marcarla",
        cueTone: "warn",
      },
      {
        title: "¿Llegó tu compañera y tú sigues capturando? Marca a otro turno",
        body: "Desde Inicio (o desde el enlace en la pantalla de turno) hay un botón “Marcar a otro turno”. Sirve para marcar la entrada o salida de alguien más sin cerrar tu sesión — por ejemplo si llega quien te releva y tú sigues capturando el corte. Solo pide qué turno llegó.",
        image: "/tutoriales/marcar-01-elegir-turno.png",
        imageDesktop: "/tutoriales/marcar-01-elegir-turno-desktop.png",
        imageDesktopHeight: 900,
        imageAlt: "Pantalla Marcar Entrada/Salida, elegir turno",
        cue: "Toca el turno que llegó, por ejemplo “VESPERTINO”",
      },
      {
        title: "Su PIN corto",
        body: "Igual que en el reloj checador normal, solo pide el PIN corto de esa persona — no su contraseña ni la tuya.",
        image: "/tutoriales/marcar-02-pin.png",
        imageDesktop: "/tutoriales/marcar-02-pin-desktop.png",
        imageDesktopHeight: 900,
        imageAlt: "Pantalla pidiendo el PIN corto",
        cue: "Marca su PIN y toca “OK”",
      },
      {
        title: "Confirmación",
        body: "Muestra su nombre, la hora y si quedó como entrada o salida. “Marcar otra persona” te regresa a elegir turno por si hace falta marcar a alguien más; “Regresar” te lleva de vuelta a la pantalla de turno sin afectar tu sesión.",
        image: "/tutoriales/marcar-03-confirmacion.png",
        imageDesktop: "/tutoriales/marcar-03-confirmacion-desktop.png",
        imageDesktopHeight: 900,
        imageAlt: "Confirmación de entrada registrada",
        cue: "Quedó registrada, sin tocar tu propia sesión",
        cueTone: "ok",
      },
    ],
  },
  {
    slug: "capturar-corte",
    title: "Cómo capturar el corte del día",
    audience: "Mostrador",
    summary: "Venta total, tarjeta, el conteo de efectivo por denominación y guardar.",
    minutes: 4,
    steps: [
      {
        title: "Abre Capturar corte",
        body: "La fecha ya viene en hoy y tu turno ya viene puesto — no necesitas elegir nada.",
        image: "/tutoriales/corte-01-formulario-vacio.png",
        imageDesktop: "/tutoriales/corte-01-formulario-vacio-desktop.png",
        imageDesktopHeight: 702,
        imageAlt: "Formulario de Capturar corte vacío",
      },
      {
        title: "Venta total y tarjeta",
        body: "Escribe la venta total del día y cuánto fue con tarjeta o transferencia. El efectivo se calcula solo.",
        image: "/tutoriales/corte-02-venta-y-tarjeta.png",
        imageDesktop: "/tutoriales/corte-02-venta-y-tarjeta-desktop.png",
        imageDesktopHeight: 702,
        imageAlt: "Venta total y tarjeta capturados",
      },
      {
        title: "Cuenta el efectivo por denominación",
        body: "Es obligatorio: el botón de guardar no se activa hasta que cuentes billete por billete y moneda por moneda.",
        image: "/tutoriales/corte-04-contar-efectivo-lleno.png",
        imageDesktop: "/tutoriales/corte-04-contar-efectivo-lleno-desktop.png",
        imageDesktopHeight: 746,
        imageAlt: "Ventana de contar efectivo llena",
        cue: "Coincide con lo esperado",
        cueTone: "ok",
      },
      {
        title: "Guarda el corte",
        body: "Verás “✓ Corte guardado correctamente.” arriba de la lista. Tu corte queda registrado con estado “Por revisar” hasta que administración lo apruebe.",
        image: "/tutoriales/corte-06-guardado-en-lista.png",
        imageHeight: 1007,
        imageDesktop: "/tutoriales/corte-06-guardado-en-lista-desktop.png",
        imageAlt: "Corte guardado en la lista de Cortes",
      },
      {
        title: "Si la pantalla se recarga a medio capturar",
        body: "No pierdes lo que ya escribiste: FarmaLEM guarda un borrador en tu celular o computadora mientras capturas. Si la página se llega a recargar sola (por ejemplo por una actualización del panel), al volver a abrir “Capturar corte” verás el aviso “Recuperamos lo que tenías escrito de un intento anterior — revísalo antes de guardar.” con tus datos ya puestos.",
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
