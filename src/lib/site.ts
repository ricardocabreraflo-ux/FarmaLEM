/**
 * Datos reales de contacto y presencia de FarmaLEM. Centralizados aquí para
 * que un solo cambio (ej. nuevo horario o número) se propague a todo el sitio.
 */
export const site = {
  // Una vez que el sitio tenga dominio propio, define NEXT_PUBLIC_SITE_URL
  // en el hosting (ej. https://farmalem.mx) — todo lo que use esta URL
  // (metadata, Open Graph, sitemap, robots.txt) lo toma de aquí.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  nombre: "FarmaLEM",
  slogan: "Siéntete bien con nosotros",
  telefono: "5567996736",
  telefonoDisplay: "55 6799 6736",
  whatsappUrl: "https://wa.me/525567996736",
  tiendaEnLineaUrl: "https://farmalem.sicarx.shop",
  facebookUrl: "https://www.facebook.com/share/1EhiGRtFyv/?mibextid=wwXIfr",
  instagramUrl: "https://www.instagram.com/farmacia_farmalem",
  direccion: "Av. Primavera 19, Col. Pueblo de Sta. María Aztahuacan, Iztapalapa, 09500 CDMX",
  sucursal: "Sucursal Iztapalapa",
  horario: "Lun–Sáb 8:00–21:00, Dom 9:00–15:00",
  googleMapsUrl: "https://maps.app.goo.gl/hct9N73TB7yF3gcx6",
  mapCoords: { lat: 19.3446, lon: -99.0128 },
  avisoLegal:
    "Consulta a tu médico o farmacéutico. Precios y promociones sujetos a cambio sin previo aviso. Vigencia limitada. FarmaLEM no sustituye el diagnóstico ni la receta de un profesional de la salud.",
};
