const API_BASE = "/api";
const MEDIA_BASE = "";

const FACEBOOK_ICON_SVG = `<svg class="icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.459h-1.26c-1.243 0-1.63.771-1.63 1.562v1.877h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94Z"/></svg>`;

function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${MEDIA_BASE}${pathOrUrl}`;
}

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ro", label: "Română", flag: "🇷🇴" }
];

const LOCALE_MAP = { en: "en-US", bg: "bg-BG", de: "de-DE", es: "es-ES", ro: "ro-RO" };

const I18N = {
  en: {
    "nav.home": "Home", "nav.about": "About", "nav.leisure": "Leisure", "nav.rooms": "Rooms", "nav.restaurant": "Restaurant",
    "nav.gallery": "Gallery", "nav.location": "Location",
    "nav.callUs": "Call Us", "nav.bookNow": "Book Now",
    "hero.eyebrow": "Boutique Mountain Retreat · Tryavna",
    "hero.title": "The Best Way to Experience Bulgaria",
    "hero.lede": "Our charming hotel in the heart of the Balkan Mountains offers a serene atmosphere, well-appointed rooms and high-end amenities, wrapped in the regional design charm of Tryavna — all backed by attentive, always-reachable service.",
    "hero.viewRooms": "View Rooms", "hero.callNow": "Call Us Now",
    "hero.stat1": "Room Types", "hero.stat2": "Local Experiences", "hero.stat3": "Avg. Reply Time", "hero.stat4": "Guest Rated",
    "info.callAnytime": "Call anytime", "info.findUs": "Find us", "info.restaurantHours": "Restaurant hours",
    "about.eyebrow": "About The Hotel",
    "about.title": "A harmonious blend of comfort and elegance",
    "about.text": "Our charming hotel in the heart of the Balkan Mountains offers a serene atmosphere, well-appointed rooms and high-end amenities, wrapped in the regional design charm of Tryavna. Set among the villages, wineries and hiking trails of the Balkan Mountains, we make it easy to explore markets, lakes and cultural sites nearby.",
    "about.point1": "Serene atmosphere & attentive service", "about.point2": "Well-appointed rooms with mountain views",
    "about.point3": "Regional design charm throughout", "about.seeLocation": "See Location",
    "amenities.eyebrow": "Things To Do", "amenities.title": "Everything the Balkans have to offer",
    "leisure.eyebrow": "Family & Leisure", "leisure.title": "Space to Play, Space to Unwind",
    "leisure.playTitle": "Kids' Adventure Playground",
    "leisure.playText": "A colorful outdoor playground built for adventure — climbing frames, rope courses and hanging hammock swings set right in the garden. There's also an open field for football and running around, so kids stay active and entertained while parents relax nearby.",
    "leisure.spaTitle": "Sunset Hot Tub",
    "leisure.spaText": "End the day the right way — soak in our outdoor hot tub as the sun sets behind the Balkan Mountains, glass of something sparkling in hand. A quiet, private way to unwind after a day of hiking or exploring Tryavna.",
    "amenities.subtitle": "From vineyard afternoons to mountain-trail mornings, our team can arrange it all — just ask at the front desk.",
    "amenities.underMaintenance": "Under Maintenance",
    "rooms.eyebrow": "Stay With Us", "rooms.title": "Rooms & Suites",
    "rooms.subtitle": "Four room types, each with balcony access and views over Tryavna — book directly for the best rate.",
    "rooms.guests": "guests", "rooms.perNight": "/ night", "rooms.inquire": "Inquire",
    "rooms.unavailable": "Rooms are temporarily unavailable — please call us at",
    "restaurant.title": "Restaurant", "restaurant.subtitle": "Local cuisine and wines from the Tryavna region.",
    "restaurant.workingHours": "Working Hours", "restaurant.menuTitle": "Menu",
    "restaurant.menuComingSoon": "Full menu coming soon.", "restaurant.reserveTable": "Reserve a Table",
    "gallery.eyebrow": "Gallery", "gallery.title": "A closer look around the hotel",
    "gallery.subtitle": "Lounge, restaurant, rooms and gardens — a preview of what's waiting for you.",
    "location.eyebrow": "Location", "location.title": "Find us in Tryavna",
    "location.subtitle": "Tucked in the Balkan Mountains, close to the old town's craft workshops, museums and riverside walks.",
    "location.address": "Address", "location.phone": "Phone", "location.getDirections": "Get Directions",
    "contact.phone": "Phone", "contact.address": "Address", "contact.followUs": "Follow us",
    "contact.errorGeneric": "Couldn't send right now — please call us instead.",
    "booking.eyebrow": "Book Now", "booking.title": "Request Your Stay",
    "booking.subtitle": "Pick your dates, choose a room, and we'll confirm availability by phone or email.",
    "booking.checkIn": "Check-in", "booking.checkOut": "Check-out", "booking.selectDate": "Select a date",
    "booking.room": "Room", "booking.selectRoom": "Select a room",
    "booking.fullName": "Full name", "booking.email": "Email", "booking.phone": "Phone",
    "booking.submit": "Request to Book", "booking.sending": "Sending...",
    "booking.legendAvailable": "Available", "booking.legendUnavailable": "Unavailable",
    "booking.legendInRange": "In range", "booking.legendSelected": "Selected",
    "booking.selectDatesError": "Please select check-in and check-out dates.",
    "booking.selectRoomError": "Please select a room.",
    "footer.tagline": "A boutique mountain retreat in Tryavna, Bulgaria — comfort, elegance and warm Balkan hospitality.",
    "footer.explore": "Explore", "footer.contact": "Contact", "footer.rights": "All rights reserved.",
    "footer.designNote": "Design concept v2 — built for a faster, friendlier experience.",
    "fab.callNow": "Call Now",
    "events.widgetTitle": "Upcoming Events", "events.seeMore": "See More Information"
  },
  bg: {
    "nav.home": "Начало", "nav.about": "За нас", "nav.leisure": "Отдих", "nav.rooms": "Стаи", "nav.restaurant": "Ресторант",
    "nav.gallery": "Галерия", "nav.location": "Локация",
    "nav.callUs": "Обадете се", "nav.bookNow": "Резервирай",
    "hero.eyebrow": "Бутиков планински хотел · Трявна",
    "hero.title": "Най-добрият начин да опознаете България",
    "hero.lede": "Нашият очарователен хотел в сърцето на Балкана предлага спокойна атмосфера, уютни стаи и първокласни удобства, съчетани с регионалния чар на Трявна — подкрепени от внимателно и винаги достъпно обслужване.",
    "hero.viewRooms": "Разгледай стаите", "hero.callNow": "Обадете се сега",
    "hero.stat1": "Вида стаи", "hero.stat2": "Локални изживявания", "hero.stat3": "Средно време за отговор", "hero.stat4": "Оценка от гости",
    "info.callAnytime": "Обадете се по всяко време", "info.findUs": "Намерете ни", "info.restaurantHours": "Работно време на ресторанта",
    "about.eyebrow": "За хотела",
    "about.title": "Хармония между комфорт и елегантност",
    "about.text": "Нашият очарователен хотел в сърцето на Балкана предлага спокойна атмосфера, уютни стаи и първокласни удобства, съчетани с регионалния чар на Трявна. Разположени сред села, лозя и туристически пътеки на Балкана, ние правим лесно откриването на пазари, езера и културни забележителности в района.",
    "about.point1": "Спокойна атмосфера и внимателно обслужване", "about.point2": "Уютни стаи с изглед към планината",
    "about.point3": "Регионален чар във всеки детайл", "about.seeLocation": "Виж локацията",
    "amenities.eyebrow": "Забавления", "amenities.title": "Всичко, което Балканът предлага",
    "leisure.eyebrow": "Семейство и отдих", "leisure.title": "Място за игри, място за отдих",
    "leisure.playTitle": "Детска площадка за приключения",
    "leisure.playText": "Цветна детска площадка на открито, създадена за приключения — съоръжения за катерене, въжени препятствия и висящи люлки-хамаци, разположени точно в градината. Има и открито игрище за футбол и тичане, така че децата да останат активни и забавлявани, докато родителите си почиват наблизо.",
    "leisure.spaTitle": "Джакузи „Залез“",
    "leisure.spaText": "Завършете деня по най-добрия начин — отпуснете се в нашата джакузи на открито, докато слънцето залязва зад Стара планина, с чаша пенливо питие в ръка. Тих и уединен начин да се отпуснете след ден, прекаран в разходки или опознаване на Трявна.",
    "amenities.subtitle": "От следобеди в лозя до сутрини по планински пътеки — нашият екип може да организира всичко, просто попитайте на рецепцията.",
    "amenities.underMaintenance": "В процес на поддръжка",
    "rooms.eyebrow": "Отседнете при нас", "rooms.title": "Стаи и апартаменти",
    "rooms.subtitle": "Четири вида стаи, всяка с балкон и изглед към Трявна — резервирайте директно за най-добра цена.",
    "rooms.guests": "гости", "rooms.perNight": "/ нощ", "rooms.inquire": "Запитване",
    "rooms.unavailable": "Стаите временно не са достъпни — моля обадете ни се на",
    "restaurant.title": "Ресторант", "restaurant.subtitle": "Локална кухня и вина от региона на Трявна.",
    "restaurant.workingHours": "Работно време", "restaurant.menuTitle": "Меню",
    "restaurant.menuComingSoon": "Пълното меню очаквайте скоро.", "restaurant.reserveTable": "Резервирай маса",
    "gallery.eyebrow": "Галерия", "gallery.title": "По-отблизо до хотела",
    "gallery.subtitle": "Лоби, ресторант, стаи и градини — вижте какво ви очаква.",
    "location.eyebrow": "Локация", "location.title": "Намерете ни в Трявна",
    "location.subtitle": "Разположени в Балкана, близо до занаятчийските работилници, музеите и разходките край реката в стария град.",
    "location.address": "Адрес", "location.phone": "Телефон", "location.getDirections": "Вижте маршрут",
    "contact.phone": "Телефон", "contact.address": "Адрес", "contact.followUs": "Последвайте ни",
    "contact.errorGeneric": "Не успяхме да изпратим съобщението — моля обадете се на посочения телефон.",
    "booking.eyebrow": "Резервация", "booking.title": "Заявете престой",
    "booking.subtitle": "Изберете дати и стая — ще потвърдим наличността по телефон или имейл.",
    "booking.checkIn": "Настаняване", "booking.checkOut": "Напускане", "booking.selectDate": "Изберете дата",
    "booking.room": "Стая", "booking.selectRoom": "Изберете стая",
    "booking.fullName": "Име и фамилия", "booking.email": "Имейл", "booking.phone": "Телефон",
    "booking.submit": "Изпрати заявка", "booking.sending": "Изпращане...",
    "booking.legendAvailable": "Свободно", "booking.legendUnavailable": "Заето",
    "booking.legendInRange": "В диапазона", "booking.legendSelected": "Избрано",
    "booking.selectDatesError": "Моля изберете дата на настаняване и напускане.",
    "booking.selectRoomError": "Моля изберете стая.",
    "footer.tagline": "Бутиков планински хотел в Трявна, България — комфорт, елегантност и топло балканско посрещане.",
    "footer.explore": "Разгледайте", "footer.contact": "Контакти", "footer.rights": "Всички права запазени.",
    "footer.designNote": "Дизайн концепция v2 — създадена за по-бързо и приятно преживяване.",
    "fab.callNow": "Обадете се",
    "events.widgetTitle": "Предстоящи събития", "events.seeMore": "Вижте повече информация"
  },
  de: {
    "nav.home": "Startseite", "nav.about": "Über uns", "nav.leisure": "Freizeit", "nav.rooms": "Zimmer", "nav.restaurant": "Restaurant",
    "nav.gallery": "Galerie", "nav.location": "Lage",
    "nav.callUs": "Anrufen", "nav.bookNow": "Jetzt buchen",
    "hero.eyebrow": "Boutique-Berghotel · Tryavna",
    "hero.title": "Der beste Weg, Bulgarien zu erleben",
    "hero.lede": "Unser charmantes Hotel im Herzen des Balkangebirges bietet eine ruhige Atmosphäre, gepflegte Zimmer und erstklassige Annehmlichkeiten mit dem regionalen Charme von Tryavna — begleitet von aufmerksamem, stets erreichbarem Service.",
    "hero.viewRooms": "Zimmer ansehen", "hero.callNow": "Jetzt anrufen",
    "hero.stat1": "Zimmertypen", "hero.stat2": "Lokale Erlebnisse", "hero.stat3": "Ø Antwortzeit", "hero.stat4": "Gästebewertung",
    "info.callAnytime": "Jederzeit erreichbar", "info.findUs": "So finden Sie uns", "info.restaurantHours": "Restaurant-Öffnungszeiten",
    "about.eyebrow": "Über das Hotel",
    "about.title": "Eine harmonische Verbindung aus Komfort und Eleganz",
    "about.text": "Unser charmantes Hotel im Herzen des Balkangebirges bietet eine ruhige Atmosphäre, gepflegte Zimmer und erstklassige Annehmlichkeiten mit dem regionalen Charme von Tryavna. Inmitten von Dörfern, Weingütern und Wanderwegen des Balkangebirges erkunden Sie Märkte, Seen und Kulturstätten in der Nähe ganz einfach.",
    "about.point1": "Ruhige Atmosphäre & aufmerksamer Service", "about.point2": "Gepflegte Zimmer mit Bergblick",
    "about.point3": "Regionaler Charme in jedem Detail", "about.seeLocation": "Lage ansehen",
    "amenities.eyebrow": "Unternehmungen", "amenities.title": "Alles, was der Balkan zu bieten hat",
    "leisure.eyebrow": "Familie & Freizeit", "leisure.title": "Platz zum Spielen, Platz zum Entspannen",
    "leisure.playTitle": "Abenteuerspielplatz für Kinder",
    "leisure.playText": "Ein farbenfroher Spielplatz im Freien, der zum Erleben von Abenteuern einlädt – Klettergerüste, Seilparcours und Hängeschaukeln direkt im Garten. Außerdem gibt es eine große Wiese zum Fußballspielen und Herumtollen, sodass die Kinder aktiv bleiben und Spaß haben, während sich die Eltern in der Nähe entspannen können.",
    "leisure.spaTitle": "Whirlpool bei Sonnenuntergang",
    "leisure.spaText": "Lassen Sie den Tag gebührend ausklingen – entspannen Sie sich in unserem Whirlpool im Freien, während die Sonne hinter dem Balkangebirge untergeht, und genießen Sie dabei ein Glas Sekt. Eine ruhige, ungestörte Art, nach einem Tag voller Wanderungen oder Erkundungstouren durch Tryavna die Seele baumeln zu lassen.",
    "amenities.subtitle": "Von Nachmittagen im Weinberg bis zu Wandermorgen — unser Team organisiert alles, fragen Sie einfach an der Rezeption.",
    "amenities.underMaintenance": "Wartungsarbeiten",
    "rooms.eyebrow": "Bei uns übernachten", "rooms.title": "Zimmer & Suiten",
    "rooms.subtitle": "Vier Zimmertypen, jedes mit Balkon und Blick über Tryavna — buchen Sie direkt für den besten Preis.",
    "rooms.guests": "Gäste", "rooms.perNight": "/ Nacht", "rooms.inquire": "Anfragen",
    "rooms.unavailable": "Zimmer sind vorübergehend nicht verfügbar — bitte rufen Sie uns an unter",
    "restaurant.title": "Restaurant", "restaurant.subtitle": "Regionale Küche und Weine aus der Region Tryavna.",
    "restaurant.workingHours": "Öffnungszeiten", "restaurant.menuTitle": "Speisekarte",
    "restaurant.menuComingSoon": "Vollständige Speisekarte folgt in Kürze.", "restaurant.reserveTable": "Tisch reservieren",
    "gallery.eyebrow": "Galerie", "gallery.title": "Ein näherer Blick ins Hotel",
    "gallery.subtitle": "Lounge, Restaurant, Zimmer und Garten — ein Vorgeschmack, was Sie erwartet.",
    "location.eyebrow": "Lage", "location.title": "So finden Sie uns in Tryavna",
    "location.subtitle": "Im Balkangebirge gelegen, nahe den Handwerkswerkstätten, Museen und Flussspaziergängen der Altstadt.",
    "location.address": "Adresse", "location.phone": "Telefon", "location.getDirections": "Route anzeigen",
    "contact.phone": "Telefon", "contact.address": "Adresse", "contact.followUs": "Folgen Sie uns",
    "contact.errorGeneric": "Senden derzeit nicht möglich — bitte rufen Sie uns stattdessen an.",
    "booking.eyebrow": "Jetzt buchen", "booking.title": "Aufenthalt anfragen",
    "booking.subtitle": "Wählen Sie Ihre Daten und ein Zimmer — wir bestätigen die Verfügbarkeit per Telefon oder E-Mail.",
    "booking.checkIn": "Anreise", "booking.checkOut": "Abreise", "booking.selectDate": "Datum wählen",
    "booking.room": "Zimmer", "booking.selectRoom": "Zimmer wählen",
    "booking.fullName": "Vollständiger Name", "booking.email": "E-Mail", "booking.phone": "Telefon",
    "booking.submit": "Buchung anfragen", "booking.sending": "Wird gesendet...",
    "booking.legendAvailable": "Verfügbar", "booking.legendUnavailable": "Nicht verfügbar",
    "booking.legendInRange": "Im Zeitraum", "booking.legendSelected": "Ausgewählt",
    "booking.selectDatesError": "Bitte wählen Sie An- und Abreisedatum.",
    "booking.selectRoomError": "Bitte wählen Sie ein Zimmer.",
    "footer.tagline": "Ein Boutique-Berghotel in Tryavna, Bulgarien — Komfort, Eleganz und herzliche Balkan-Gastfreundschaft.",
    "footer.explore": "Entdecken", "footer.contact": "Kontakt", "footer.rights": "Alle Rechte vorbehalten.",
    "footer.designNote": "Design-Konzept v2 — für ein schnelleres, freundlicheres Erlebnis entwickelt.",
    "fab.callNow": "Jetzt anrufen",
    "events.widgetTitle": "Kommende Veranstaltungen", "events.seeMore": "Weitere Informationen"
  },
  es: {
    "nav.home": "Inicio", "nav.about": "Sobre nosotros", "nav.leisure": "Ocio", "nav.rooms": "Habitaciones", "nav.restaurant": "Restaurante",
    "nav.gallery": "Galería", "nav.location": "Ubicación",
    "nav.callUs": "Llámanos", "nav.bookNow": "Reservar",
    "hero.eyebrow": "Retiro de montaña boutique · Tryavna",
    "hero.title": "La mejor manera de vivir Bulgaria",
    "hero.lede": "Nuestro encantador hotel en el corazón de los Balcanes ofrece un ambiente sereno, habitaciones bien equipadas y servicios de primer nivel, envueltos en el encanto regional de Tryavna, respaldado por un servicio atento y siempre disponible.",
    "hero.viewRooms": "Ver habitaciones", "hero.callNow": "Llamar ahora",
    "hero.stat1": "Tipos de habitación", "hero.stat2": "Experiencias locales", "hero.stat3": "Tiempo medio de respuesta", "hero.stat4": "Valoración de huéspedes",
    "info.callAnytime": "Llámenos cuando quiera", "info.findUs": "Encuéntrenos", "info.restaurantHours": "Horario del restaurante",
    "about.eyebrow": "Sobre el hotel",
    "about.title": "Una combinación armoniosa de confort y elegancia",
    "about.text": "Nuestro encantador hotel en el corazón de los Balcanes ofrece un ambiente sereno, habitaciones bien equipadas y servicios de primer nivel, envueltos en el encanto regional de Tryavna. Rodeados de pueblos, bodegas y rutas de senderismo de los Balcanes, facilitamos la exploración de mercados, lagos y sitios culturales cercanos.",
    "about.point1": "Ambiente sereno y servicio atento", "about.point2": "Habitaciones bien equipadas con vistas a la montaña",
    "about.point3": "Encanto regional en cada detalle", "about.seeLocation": "Ver ubicación",
    "amenities.eyebrow": "Qué hacer", "amenities.title": "Todo lo que ofrecen los Balcanes",
    "leisure.eyebrow": "Familia y ocio", "leisure.title": "Espacio para jugar, espacio para relajarse",
    "leisure.playTitle": "Parque infantil de aventuras",
    "leisure.playText": "Un colorido parque infantil al aire libre diseñado para la aventura: estructuras para trepar, circuitos de cuerdas y columpios de hamaca colgantes, todo ello en pleno jardín. También hay un campo abierto para jugar al fútbol y correr, de modo que los niños se mantienen activos y entretenidos mientras los padres se relajan cerca.",
    "leisure.spaTitle": "Jacuzzi al atardecer",
    "leisure.spaText": "Termina el día como es debido: relájate en nuestro jacuzzi al aire libre mientras el sol se pone tras las montañas de los Balcanes, con una copa de algo espumoso en la mano. Una forma tranquila y privada de desconectar tras un día de senderismo o de explorar Tryavna.",
    "amenities.subtitle": "Desde tardes de viñedo hasta mañanas de senderismo, nuestro equipo puede organizarlo todo — solo pregunte en recepción.",
    "amenities.underMaintenance": "En mantenimiento",
    "rooms.eyebrow": "Alójese con nosotros", "rooms.title": "Habitaciones y suites",
    "rooms.subtitle": "Cuatro tipos de habitación, todas con balcón y vistas a Tryavna — reserve directamente para la mejor tarifa.",
    "rooms.guests": "huéspedes", "rooms.perNight": "/ noche", "rooms.inquire": "Consultar",
    "rooms.unavailable": "Las habitaciones no están disponibles temporalmente — llámenos al",
    "restaurant.title": "Restaurante", "restaurant.subtitle": "Cocina local y vinos de la región de Tryavna.",
    "restaurant.workingHours": "Horario", "restaurant.menuTitle": "Menú",
    "restaurant.menuComingSoon": "Menú completo próximamente.", "restaurant.reserveTable": "Reservar mesa",
    "gallery.eyebrow": "Galería", "gallery.title": "Una mirada más de cerca al hotel",
    "gallery.subtitle": "Salón, restaurante, habitaciones y jardines — un adelanto de lo que le espera.",
    "location.eyebrow": "Ubicación", "location.title": "Encuéntrenos en Tryavna",
    "location.subtitle": "Ubicados en los Balcanes, cerca de los talleres artesanales, museos y paseos junto al río del casco antiguo.",
    "location.address": "Dirección", "location.phone": "Teléfono", "location.getDirections": "Cómo llegar",
    "contact.phone": "Teléfono", "contact.address": "Dirección", "contact.followUs": "Síganos",
    "contact.errorGeneric": "No pudimos enviarlo ahora — llámenos en su lugar.",
    "booking.eyebrow": "Reservar", "booking.title": "Solicite su estancia",
    "booking.subtitle": "Elija sus fechas y una habitación — confirmaremos la disponibilidad por teléfono o correo.",
    "booking.checkIn": "Entrada", "booking.checkOut": "Salida", "booking.selectDate": "Seleccione una fecha",
    "booking.room": "Habitación", "booking.selectRoom": "Seleccione una habitación",
    "booking.fullName": "Nombre completo", "booking.email": "Correo electrónico", "booking.phone": "Teléfono",
    "booking.submit": "Solicitar reserva", "booking.sending": "Enviando...",
    "booking.legendAvailable": "Disponible", "booking.legendUnavailable": "No disponible",
    "booking.legendInRange": "En el rango", "booking.legendSelected": "Seleccionado",
    "booking.selectDatesError": "Seleccione las fechas de entrada y salida.",
    "booking.selectRoomError": "Seleccione una habitación.",
    "footer.tagline": "Un retiro de montaña boutique en Tryavna, Bulgaria — confort, elegancia y cálida hospitalidad balcánica.",
    "footer.explore": "Explorar", "footer.contact": "Contacto", "footer.rights": "Todos los derechos reservados.",
    "footer.designNote": "Concepto de diseño v2 — creado para una experiencia más rápida y cercana.",
    "fab.callNow": "Llamar ahora",
    "events.widgetTitle": "Próximos Eventos", "events.seeMore": "Ver Más Información"
  },
  ro: {
    "nav.home": "Acasă", "nav.about": "Despre noi", "nav.leisure": "Timp liber", "nav.rooms": "Camere", "nav.restaurant": "Restaurant",
    "nav.gallery": "Galerie", "nav.location": "Locație",
    "nav.callUs": "Sună-ne", "nav.bookNow": "Rezervă acum",
    "hero.eyebrow": "Refugiu montan boutique · Tryavna",
    "hero.title": "Cel mai bun mod de a descoperi Bulgaria",
    "hero.lede": "Hotelul nostru fermecător din inima Munților Balcani oferă o atmosferă senină, camere bine amenajate și facilități de top, îmbrăcate în farmecul regional al orașului Tryavna — susținute de un serviciu atent, mereu disponibil.",
    "hero.viewRooms": "Vezi camerele", "hero.callNow": "Sună acum",
    "hero.stat1": "Tipuri de camere", "hero.stat2": "Experiențe locale", "hero.stat3": "Timp mediu de răspuns", "hero.stat4": "Rating oaspeți",
    "info.callAnytime": "Sunați oricând", "info.findUs": "Găsiți-ne", "info.restaurantHours": "Program restaurant",
    "about.eyebrow": "Despre hotel",
    "about.title": "O combinație armonioasă de confort și eleganță",
    "about.text": "Hotelul nostru fermecător din inima Munților Balcani oferă o atmosferă senină, camere bine amenajate și facilități de top, îmbrăcate în farmecul regional al orașului Tryavna. Situați între sate, crame și trasee de drumeție din Munții Balcani, facilităm explorarea piețelor, lacurilor și obiectivelor culturale din apropiere.",
    "about.point1": "Atmosferă senină și serviciu atent", "about.point2": "Camere bine amenajate cu vedere la munte",
    "about.point3": "Farmec regional în fiecare detaliu", "about.seeLocation": "Vezi locația",
    "amenities.eyebrow": "Ce poți face", "amenities.title": "Tot ce au de oferit Balcanii",
    "leisure.eyebrow": "Familie și timp liber", "leisure.title": "Un spațiu pentru joacă, un spațiu pentru relaxare",
    "leisure.playTitle": "Teren de joacă de aventură pentru copii",
    "leisure.playText": "Un loc de joacă în aer liber, plin de culoare, conceput pentru aventură — structuri de cățărare, trasee cu frânghii și leagăne suspendate sub formă de hamac, amplasate chiar în grădină. Există, de asemenea, un teren deschis pentru fotbal și alergat, astfel încât copiii să rămână activi și distrați, în timp ce părinții se relaxează în apropiere.",
    "leisure.spaTitle": "Jacuzzi la apus de soare",
    "leisure.spaText": "Încheiați ziua așa cum se cuvine — relaxați-vă în jacuzzi-ul nostru în aer liber, în timp ce soarele apune în spatele Munților Balcani, cu un pahar de băutură spumoasă în mână. O modalitate liniștită și intimă de a vă relaxa după o zi de drumeții sau de explorare a orașului Tryavna.",
    "amenities.subtitle": "De la după-amiezi la cramă la dimineți pe traseele montane, echipa noastră poate organiza totul — întrebați la recepție.",
    "amenities.underMaintenance": "În curs de întreținere",
    "rooms.eyebrow": "Stați cu noi", "rooms.title": "Camere și apartamente",
    "rooms.subtitle": "Patru tipuri de camere, fiecare cu balcon și vedere spre Tryavna — rezervați direct pentru cel mai bun preț.",
    "rooms.guests": "oaspeți", "rooms.perNight": "/ noapte", "rooms.inquire": "Întreabă",
    "rooms.unavailable": "Camerele nu sunt disponibile momentan — vă rugăm sunați-ne la",
    "restaurant.title": "Restaurant", "restaurant.subtitle": "Bucătărie locală și vinuri din regiunea Tryavna.",
    "restaurant.workingHours": "Program de funcționare", "restaurant.menuTitle": "Meniu",
    "restaurant.menuComingSoon": "Meniul complet va fi disponibil în curând.", "restaurant.reserveTable": "Rezervă o masă",
    "gallery.eyebrow": "Galerie", "gallery.title": "O privire mai atentă asupra hotelului",
    "gallery.subtitle": "Lounge, restaurant, camere și grădini — o previzualizare a ceea ce vă așteaptă.",
    "location.eyebrow": "Locație", "location.title": "Găsiți-ne în Tryavna",
    "location.subtitle": "Situați în Munții Balcani, aproape de atelierele de artizanat, muzeele și plimbările de pe malul râului din orașul vechi.",
    "location.address": "Adresă", "location.phone": "Telefon", "location.getDirections": "Vezi traseul",
    "contact.phone": "Telefon", "contact.address": "Adresă", "contact.followUs": "Urmăriți-ne",
    "contact.errorGeneric": "Nu am putut trimite acum — vă rugăm să ne sunați.",
    "booking.eyebrow": "Rezervă acum", "booking.title": "Solicită șederea",
    "booking.subtitle": "Alegeți datele și o cameră — vom confirma disponibilitatea prin telefon sau e-mail.",
    "booking.checkIn": "Check-in", "booking.checkOut": "Check-out", "booking.selectDate": "Selectați o dată",
    "booking.room": "Cameră", "booking.selectRoom": "Selectați o cameră",
    "booking.fullName": "Nume complet", "booking.email": "E-mail", "booking.phone": "Telefon",
    "booking.submit": "Trimite cererea", "booking.sending": "Se trimite...",
    "booking.legendAvailable": "Disponibil", "booking.legendUnavailable": "Indisponibil",
    "booking.legendInRange": "În interval", "booking.legendSelected": "Selectat",
    "booking.selectDatesError": "Selectați datele de check-in și check-out.",
    "booking.selectRoomError": "Selectați o cameră.",
    "footer.tagline": "Un refugiu montan boutique în Tryavna, Bulgaria — confort, eleganță și ospitalitate balcanică caldă.",
    "footer.explore": "Explorează", "footer.contact": "Contact", "footer.rights": "Toate drepturile rezervate.",
    "footer.designNote": "Concept de design v2 — creat pentru o experiență mai rapidă și mai prietenoasă.",
    "fab.callNow": "Sună acum",
    "events.widgetTitle": "Evenimente Viitoare", "events.seeMore": "Vezi Mai Multe Informații"
  }
};

const FALLBACK_SETTINGS = {
  hotelName: "Park Hotel Panorama",
  phoneNumber: "+359 897 820 065",
  phoneHref: "tel:+359897820065",
  address: "Tryavna, Bulgaria",
  mapQuery: "Park Hotel Panorama, Tryavna, Bulgaria",
  facebookUrl: "https://www.facebook.com/",
  restaurantHoursDays: "Mon – Sun",
  restaurantHoursText: "From 7:00 PM to 10:30 PM",
  aboutTitle: "",
  aboutText: "",
  tagline: "",
  copyrightYear: 2026,
  heroImage: "/images/gallery/lounge-lobby.webp",
  aboutImage: "/images/gallery/courtyard-garden.webp",
  aboutFloatImage: "/images/gallery/rose-garden.webp",
  restaurantImage: "/images/gallery/restaurant-hall.webp",
  heroStat1Value: "4",
  heroStat1Label: "",
  heroStat2Value: "6+",
  heroStat2Label: "",
  heroStat3Value: "< 2h",
  heroStat3Label: "",
  heroStat4Value: "5★",
  heroStat4Label: "",
  leisurePlayTitle: "",
  leisurePlayText: "",
  leisureSpaTitle: "",
  leisureSpaText: "",
  leisurePlayImage1: "/images/leisure/playground-1.webp",
  leisurePlayImage2: "/images/leisure/playground-2.webp",
  leisurePlayImage3: "/images/leisure/playground-3.webp",
  leisurePlayImage4: "/images/leisure/kids-football.webp",
  leisureSpaImage: "/images/leisure/hot-tub.webp"
};

const FALLBACK_AMENITIES = [];

let state = {
  lang: localStorage.getItem("php_lang") || "bg",
  settings: FALLBACK_SETTINGS,
  amenities: FALLBACK_AMENITIES,
  rooms: [],
  gallery: [],
  events: [],
  booking: { checkIn: null, checkOut: null, roomId: "", calendarMonth: startOfMonth(new Date()) }
};

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
}

// English content can be edited from the admin dashboard (Hotel Info); other
// languages keep their translated copy since admin editing isn't per-language.
function tOrSetting(key, settingValue) {
  return state.lang === "en" && settingValue ? settingValue : t(key);
}

// Admin-entered content (room/event/amenity names & descriptions) is stored
// as { en, bg, de, es, ro } once DeepL translation is set up on the backend.
// Falls back to English, then to whatever language is actually populated, so
// content saved before translation was configured still displays correctly.
function pickLocalized(value, lang) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.en || Object.values(value).find(Boolean) || "";
}

async function fetchJSON(path, fallback) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`${path} failed`);
    return await res.json();
  } catch (err) {
    console.warn(`API unavailable for ${path}, using fallback data.`, err);
    return fallback;
  }
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatDate(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(date) {
  if (!date) return t("booking.selectDate");
  return date.toLocaleDateString(LOCALE_MAP[state.lang] || "en-US", { day: "numeric", month: "short", year: "numeric" });
}

function isSameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function renderShell() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="topbar">
      <div class="container">
        <div class="topbar-links">
          <a href="tel:+359897820065"><span class="material-symbols-outlined">call</span> +359 897 820 065</a>
          <a href="#location"><span class="material-symbols-outlined">location_on</span> Tryavna, Bulgaria</a>
        </div>
        <div class="topbar-right">
          <div class="topbar-links">
            <a href="#restaurant">${t("info.restaurantHours")}: ${escapeHtml(state.settings.restaurantHoursDays)}</a>
          </div>
          <div class="lang-switch" id="langSwitch">
            <button class="lang-current" id="langToggle" type="button" aria-haspopup="listbox">
              <span class="flag">${LANGS.find((l) => l.code === state.lang).flag}</span>
              <span>${state.lang.toUpperCase()}</span>
              <span class="material-symbols-outlined caret">expand_more</span>
            </button>
            <ul class="lang-menu" id="langMenu" role="listbox">
              ${LANGS.map(
                (l) => `<li role="option" data-lang="${l.code}" class="${l.code === state.lang ? "active" : ""}">
                  <span class="flag">${l.flag}</span> ${l.label}
                </li>`
              ).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>

    <header class="site-header">
      <div class="container nav-row">
        <a href="#home" class="brand">
          <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
          <span>Park Hotel Panorama<small>Tryavna, Bulgaria</small></span>
        </a>
        <nav class="main-nav" id="mainNav">
          <a href="#home">${t("nav.home")}</a>
          <a href="#about">${t("nav.about")}</a>
          <a href="#leisure">${t("nav.leisure")}</a>
          <a href="#rooms">${t("nav.rooms")}</a>
          <a href="#restaurant">${t("nav.restaurant")}</a>
          <a href="#gallery">${t("nav.gallery")}</a>
          <a href="#location">${t("nav.location")}</a>
        </nav>
        <div class="nav-actions">
          <a class="nav-call" href="tel:+359897820065">
            <span class="material-symbols-outlined">call</span>
            <span class="label">${t("nav.callUs")}</span>
          </a>
          <a class="btn btn-line" href="#booking">${t("nav.bookNow")}</a>
          <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
            <span class="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
      <a href="#home" class="brand brand-pinned">
        <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
        <span>Park Hotel Panorama<small>Tryavna, Bulgaria</small></span>
      </a>
      <div class="nav-actions-pinned">
        <a class="nav-call" href="tel:+359897820065">
          <span class="material-symbols-outlined">call</span>
          <span class="label">${t("nav.callUs")}</span>
        </a>
        <a class="btn btn-line" href="#booking">${t("nav.bookNow")}</a>
      </div>
    </header>

    <main>
      <section class="hero" id="home">
        <div class="hero-media">
          <img src="${mediaUrl(state.settings.heroImage)}" alt="Hotel lounge with mountain views" />
        </div>
        <div class="container hero-content">
          <div class="eyebrow">${t("hero.eyebrow")}</div>
          <h1>${tOrSetting("hero.title", state.settings.tagline)}</h1>
          <p class="lede">${tOrSetting("hero.lede", state.settings.aboutText)}</p>
          <div class="hero-cta">
            <a class="btn btn-gold" href="#rooms"><span class="material-symbols-outlined">bed</span> ${t("hero.viewRooms")}</a>
            <a class="btn btn-outline" href="tel:+359897820065"><span class="material-symbols-outlined">call</span> ${t("hero.callNow")}</a>
          </div>
          <div class="hero-stats">
            <div><strong>${escapeHtml(state.settings.heroStat1Value)}</strong><span>${tOrSetting("hero.stat1", state.settings.heroStat1Label)}</span></div>
            <div><strong>${escapeHtml(state.settings.heroStat2Value)}</strong><span>${tOrSetting("hero.stat2", state.settings.heroStat2Label)}</span></div>
            <div><strong>${escapeHtml(state.settings.heroStat3Value)}</strong><span>${tOrSetting("hero.stat3", state.settings.heroStat3Label)}</span></div>
            <div><strong>${escapeHtml(state.settings.heroStat4Value)}</strong><span>${tOrSetting("hero.stat4", state.settings.heroStat4Label)}</span></div>
          </div>
        </div>
      </section>

      <section class="info-strip">
        <div class="container">
          <div class="info-item">
            <div class="icon-badge"><span class="material-symbols-outlined">call</span></div>
            <div><strong>${t("info.callAnytime")}</strong><span>${escapeHtml(state.settings.phoneNumber)}</span></div>
          </div>
          <div class="info-item">
            <div class="icon-badge"><span class="material-symbols-outlined">location_on</span></div>
            <div><strong>${t("info.findUs")}</strong><span>${escapeHtml(state.settings.address)}</span></div>
          </div>
          <div class="info-item">
            <div class="icon-badge"><span class="material-symbols-outlined">restaurant</span></div>
            <div><strong>${t("info.restaurantHours")}</strong><span>${escapeHtml(state.settings.restaurantHoursDays)}</span></div>
          </div>
        </div>
      </section>

      <section class="about" id="about">
        <div class="container">
          <div class="about-media">
            <div class="main-shot"><img src="${mediaUrl(state.settings.aboutImage)}" alt="Hotel courtyard and garden" loading="lazy" /></div>
            <div class="float-shot"><img src="${mediaUrl(state.settings.aboutFloatImage)}" alt="Rose garden" loading="lazy" /></div>
          </div>
          <div class="about-copy">
            <div class="eyebrow">${t("about.eyebrow")}</div>
            <h2>${tOrSetting("about.title", state.settings.aboutTitle)}</h2>
            <p>${tOrSetting("about.text", state.settings.aboutText)}</p>
            <ul class="about-points">
              <li><span class="material-symbols-outlined">check_circle</span> ${t("about.point1")}</li>
              <li><span class="material-symbols-outlined">check_circle</span> ${t("about.point2")}</li>
              <li><span class="material-symbols-outlined">check_circle</span> ${t("about.point3")}</li>
            </ul>
            <a class="btn btn-line" href="#location"><span class="material-symbols-outlined">map</span> ${t("about.seeLocation")}</a>
          </div>
        </div>
      </section>

      <section class="amenities" id="amenities">
        <div class="container">
          <div class="section-head center">
            <div class="eyebrow">${t("amenities.eyebrow")}</div>
            <h2>${t("amenities.title")}</h2>
            <p>${t("amenities.subtitle")}</p>
          </div>
          <div class="amenity-grid" id="amenityGrid"></div>
        </div>
      </section>

      <section class="leisure" id="leisure">
        <div class="container">
          <div class="section-head center">
            <div class="eyebrow">${t("leisure.eyebrow")}</div>
            <h2>${t("leisure.title")}</h2>
          </div>

          <div class="leisure-block">
            <div class="leisure-media leisure-grid">
              <img src="${mediaUrl(state.settings.leisurePlayImage1)}" alt="Kids' adventure playground" loading="lazy" />
              <img src="${mediaUrl(state.settings.leisurePlayImage2)}" alt="Kids' adventure playground" loading="lazy" />
              <img src="${mediaUrl(state.settings.leisurePlayImage3)}" alt="Kids' adventure playground" loading="lazy" />
              <img src="${mediaUrl(state.settings.leisurePlayImage4)}" alt="Kids playing football" loading="lazy" />
            </div>
            <div class="leisure-copy">
              <h3>${tOrSetting("leisure.playTitle", state.settings.leisurePlayTitle)}</h3>
              <p>${tOrSetting("leisure.playText", state.settings.leisurePlayText)}</p>
            </div>
          </div>

          <div class="leisure-block reverse">
            <div class="leisure-media single">
              <img src="${mediaUrl(state.settings.leisureSpaImage)}" alt="Outdoor hot tub at sunset" loading="lazy" />
            </div>
            <div class="leisure-copy">
              <h3>${tOrSetting("leisure.spaTitle", state.settings.leisureSpaTitle)}</h3>
              <p>${tOrSetting("leisure.spaText", state.settings.leisureSpaText)}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="rooms" id="rooms">
        <div class="container">
          <div class="section-head">
            <div class="eyebrow">${t("rooms.eyebrow")}</div>
            <h2>${t("rooms.title")}</h2>
            <p>${t("rooms.subtitle")}</p>
          </div>
          <div id="roomsContainer">
            <div class="rooms-skeleton">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="restaurant-banner" id="restaurant">
        <div class="container">
          <div class="eyebrow">${t("nav.restaurant")}</div>
          <h2>${t("restaurant.title")}</h2>
          <p>${t("restaurant.subtitle")}</p>
        </div>
      </section>

      <div class="restaurant-info">
        <div class="restaurant-photo">
          <img src="${mediaUrl(state.settings.restaurantImage)}" alt="Restaurant dining hall" loading="lazy" />
        </div>
        <div class="restaurant-hours">
          <div>
            <h3>${t("restaurant.workingHours")}</h3>
            <p>${escapeHtml(state.settings.restaurantHoursDays)}</p>
          </div>
        </div>
      </div>

      <div class="menu-block">
        <h3>${t("restaurant.menuTitle")}</h3>
        <p>${t("restaurant.menuComingSoon")}</p>
        <a class="btn btn-gold" href="#booking"><span class="material-symbols-outlined">restaurant_menu</span> ${t("restaurant.reserveTable")}</a>
      </div>

      <section class="gallery" id="gallery">
        <div class="container">
          <div class="section-head center">
            <div class="eyebrow">${t("gallery.eyebrow")}</div>
            <h2>${t("gallery.title")}</h2>
            <p>${t("gallery.subtitle")}</p>
          </div>
          <div id="galleryContainer">
            <div class="gallery-skeleton">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="location" id="location">
        <div class="container">
          <div class="location-panel">
            <div class="eyebrow">${t("location.eyebrow")}</div>
            <h2>${t("location.title")}</h2>
            <p>${t("location.subtitle")}</p>
            <div class="location-fact">
              <span class="material-symbols-outlined">location_on</span>
              <div><strong>${t("location.address")}</strong><span>${escapeHtml(state.settings.address)}</span></div>
            </div>
            <div class="location-fact">
              <span class="material-symbols-outlined">call</span>
              <div><strong>${t("location.phone")}</strong><span>${escapeHtml(state.settings.phoneNumber)}</span></div>
            </div>
            <a class="btn btn-gold" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(state.settings.mapQuery)}">
              <span class="material-symbols-outlined">directions</span> ${t("location.getDirections")}
            </a>
          </div>
          <div class="location-map">
            <iframe
              title="Park Hotel Panorama location map"
              loading="lazy"
              src="https://maps.google.com/maps?q=${encodeURIComponent(state.settings.mapQuery)}&output=embed">
            </iframe>
          </div>
        </div>
      </section>

      <section class="booking" id="booking">
        <div class="container">
          <div class="booking-columns">
            <div class="booking-intro">
              <div class="section-head">
                <div class="eyebrow">${t("booking.eyebrow")}</div>
                <h2>${t("booking.title")}</h2>
                <p>${t("booking.subtitle")}</p>
              </div>
              <div class="booking-contact-list">
                <a class="booking-contact-item" href="${state.settings.phoneHref}" aria-label="${t("contact.phone")}">
                  <span class="icon-badge"><span class="material-symbols-outlined">call</span></span>
                  <span>${escapeHtml(state.settings.phoneNumber)}</span>
                </a>
                <a class="booking-contact-item" href="#location" aria-label="${t("contact.address")}">
                  <span class="icon-badge"><span class="material-symbols-outlined">location_on</span></span>
                  <span>${escapeHtml(state.settings.address)}</span>
                </a>
                <a class="booking-contact-item" href="${state.settings.facebookUrl}" target="_blank" rel="noopener" aria-label="${t("contact.followUs")}">
                  <span class="icon-badge">${FACEBOOK_ICON_SVG}</span>
                  <span>${t("contact.followUs")}</span>
                </a>
              </div>
            </div>
            <div id="bookingWidgetRoot"></div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div>
            <div class="footer-brand">
              <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
              Park Hotel Panorama
            </div>
            <p>${t("footer.tagline")}</p>
            <div class="footer-social">
              <a href="${state.settings.facebookUrl}" target="_blank" rel="noopener" aria-label="Facebook">
                ${FACEBOOK_ICON_SVG}
              </a>
            </div>
          </div>
          <div class="footer-col">
            <h4>${t("footer.explore")}</h4>
            <ul>
              <li><a href="#about">${t("nav.about")}</a></li>
              <li><a href="#leisure">${t("nav.leisure")}</a></li>
              <li><a href="#rooms">${t("nav.rooms")}</a></li>
              <li><a href="#restaurant">${t("nav.restaurant")}</a></li>
              <li><a href="#gallery">${t("nav.gallery")}</a></li>
              <li><a href="#location">${t("nav.location")}</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>${t("footer.contact")}</h4>
            <ul>
              <li>${escapeHtml(state.settings.phoneNumber)}</li>
              <li>${escapeHtml(state.settings.address)}</li>
              <li>${escapeHtml(state.settings.restaurantHoursDays)}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${state.settings.copyrightYear} Park Hotel Panorama. ${t("footer.rights")}</span>
          <span>${t("footer.designNote")}</span>
        </div>
      </div>
    </footer>

    <a class="fab-call" href="tel:+359897820065">
      <span class="pulse"></span>
      <span class="label">${t("fab.callNow")}</span>
    </a>

    ${
      state.events.length
        ? `<div class="events-widget">
            <div class="events-widget-head">
              <span class="material-symbols-outlined">event</span>
              <strong>${t("events.widgetTitle")}</strong>
            </div>
            <div class="events-widget-list">
              ${state.events
                .slice(0, 2)
                .map(
                  (ev) => `
                <div class="events-widget-item">
                  ${ev.imageUrl ? `<img src="${mediaUrl(ev.imageUrl)}" alt="${escapeHtml(pickLocalized(ev.title, state.lang))}" />` : ""}
                  <div class="events-widget-item-text">
                    <strong>${escapeHtml(pickLocalized(ev.title, state.lang))}</strong>
                    <span>${formatDateLabel(new Date(ev.date))}</span>
                  </div>
                </div>`
                )
                .join("")}
            </div>
            <a class="btn btn-gold events-widget-btn" href="/events/" target="_blank" rel="noopener">
              ${t("events.seeMore")}
            </a>
          </div>`
        : ""
    }

    <div class="lightbox" id="lightbox">
      <button class="lightbox-close" id="lightboxClose"><span class="material-symbols-outlined">close</span></button>
      <button class="lightbox-nav prev" id="lightboxPrev"><span class="material-symbols-outlined">chevron_left</span></button>
      <img id="lightboxImg" src="" alt="" />
      <button class="lightbox-nav next" id="lightboxNext"><span class="material-symbols-outlined">chevron_right</span></button>
    </div>
  `;
}

function renderAmenities() {
  const grid = document.getElementById("amenityGrid");
  if (!grid) return;
  grid.innerHTML = state.amenities
    .map(
      (a) => `
      <div class="amenity-card${a.underMaintenance ? " is-maintenance" : ""}">
        ${a.underMaintenance ? `<span class="amenity-tag">${t("amenities.underMaintenance")}</span>` : ""}
        <div class="icon-badge"><span class="material-symbols-outlined">${a.icon}</span></div>
        <h3>${escapeHtml(pickLocalized(a.title, state.lang))}</h3>
        <p>${escapeHtml(pickLocalized(a.text, state.lang))}</p>
      </div>`
    )
    .join("");
}

function renderRooms() {
  const container = document.getElementById("roomsContainer");
  if (!container) return;
  if (!state.rooms.length) {
    container.innerHTML = `<p style="color:var(--ink-600)">${t("rooms.unavailable")} ${escapeHtml(state.settings.phoneNumber)}.</p>`;
    return;
  }
  container.innerHTML = `
    <div class="room-grid">
      ${state.rooms
        .map(
          (r) => `
        <div class="room-card">
          <div class="room-media">
            <img src="${mediaUrl(r.imageUrl)}" alt="${escapeHtml(pickLocalized(r.name, state.lang))}" loading="lazy" />
            <span class="room-tag">${escapeHtml(r.type)}</span>
          </div>
          <div class="room-body">
            <h3>${escapeHtml(pickLocalized(r.name, state.lang))}</h3>
            <div class="room-meta">
              <span><span class="material-symbols-outlined">group</span> ${r.capacity} ${t("rooms.guests")}</span>
              <span><span class="material-symbols-outlined">straighten</span> ${r.sizeSqm} m²</span>
            </div>
            <p class="room-desc">${escapeHtml(pickLocalized(r.description, state.lang))}</p>
            <div class="room-footer">
              <div class="room-price"><strong>€${r.basePricePerNight}</strong><span> ${t("rooms.perNight")}</span></div>
              <a class="btn btn-line" href="#booking" data-room-id="${r.id}">${t("rooms.inquire")}</a>
            </div>
          </div>
        </div>`
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll("[data-room-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.booking.roomId = btn.dataset.roomId;
      renderBookingWidget();
    });
  });
}

function renderGallery() {
  const container = document.getElementById("galleryContainer");
  if (!container) return;
  if (!state.gallery.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <div class="gallery-grid">
      ${state.gallery
        .map(
          (g, i) => `
        <button type="button" data-index="${i}" aria-label="Open ${escapeHtml(g.alt)}">
          <img src="${mediaUrl(g.imageUrl)}" alt="${escapeHtml(g.alt)}" loading="lazy" />
        </button>`
        )
        .join("")}
    </div>
  `;

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  let current = 0;

  const openAt = (i) => {
    current = (i + state.gallery.length) % state.gallery.length;
    lightboxImg.src = mediaUrl(state.gallery[current].imageUrl);
    lightboxImg.alt = state.gallery[current].alt;
    lightbox.classList.add("open");
  };

  container.querySelectorAll("[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => openAt(Number(btn.dataset.index)));
  });

  document.getElementById("lightboxClose").addEventListener("click", () => lightbox.classList.remove("open"));
  document.getElementById("lightboxPrev").addEventListener("click", () => openAt(current - 1));
  document.getElementById("lightboxNext").addEventListener("click", () => openAt(current + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") lightbox.classList.remove("open");
    if (e.key === "ArrowLeft") openAt(current - 1);
    if (e.key === "ArrowRight") openAt(current + 1);
  });
}

/* ---------- Booking widget (calendar + form) ---------- */

function buildMonthMatrix(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), currentMonth: false });
    nextDay++;
  }
  return cells;
}

let roomSelectOutsideClickWired = false;

function wireRoomSelect() {
  const wrap = document.getElementById("roomSelect");
  if (!wrap) return;
  const toggle = document.getElementById("roomSelectToggle");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    wrap.classList.toggle("open");
  });

  wrap.querySelectorAll("[data-room-id]").forEach((li) => {
    li.addEventListener("click", () => {
      state.booking.roomId = li.dataset.roomId;
      renderBookingWidget();
    });
  });

  if (!roomSelectOutsideClickWired) {
    document.addEventListener("click", (e) => {
      const current = document.getElementById("roomSelect");
      if (current && !current.contains(e.target)) current.classList.remove("open");
    });
    roomSelectOutsideClickWired = true;
  }
}

function renderBookingWidget() {
  const root = document.getElementById("bookingWidgetRoot");
  if (!root) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { checkIn, checkOut, roomId, calendarMonth } = state.booking;
  const locale = LOCALE_MAP[state.lang] || "en-US";
  const monthLabel = calendarMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const cells = buildMonthMatrix(calendarMonth.getFullYear(), calendarMonth.getMonth());

  const mondayRef = new Date(2026, 7, 3); // a known Monday, for locale-aware weekday header labels
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayRef);
    d.setDate(mondayRef.getDate() + i);
    return d.toLocaleDateString(locale, { weekday: "short" }).toUpperCase();
  });

  const isPrevDisabled = calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() === today.getMonth();
  const selectedRoom = state.rooms.find((r) => r.id === roomId);
  const roomLabel = selectedRoom
    ? `${escapeHtml(pickLocalized(selectedRoom.name, state.lang))} — €${selectedRoom.basePricePerNight}${t("rooms.perNight")}`
    : t("booking.selectRoom");

  root.innerHTML = `
    <div class="booking-widget-row">
    <div class="booking-card">
      <div class="date-fields">
        <div class="date-field">
          <label>${t("booking.checkIn")}</label>
          <span>${escapeHtml(formatDateLabel(checkIn))}</span>
        </div>
        <div class="date-field">
          <label>${t("booking.checkOut")}</label>
          <span>${escapeHtml(formatDateLabel(checkOut))}</span>
        </div>
      </div>

      <div class="cal-header">
        <button class="cal-nav" id="calPrev" type="button" ${isPrevDisabled ? "disabled" : ""} aria-label="Previous month">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <h4>${escapeHtml(monthLabel)}</h4>
        <button class="cal-nav" id="calNext" type="button" aria-label="Next month">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div class="cal-weekdays">
        ${weekdayLabels.map((w) => `<span>${escapeHtml(w)}</span>`).join("")}
      </div>
      <div class="cal-grid">
        ${cells
          .map(({ date, currentMonth }) => {
            if (!currentMonth) return `<button type="button" class="cal-day muted" disabled>${date.getDate()}</button>`;
            const isPast = date < today;
            const isToday = isSameDay(date, today);
            const isStart = isSameDay(date, checkIn);
            const isEnd = isSameDay(date, checkOut);
            const inRange = checkIn && checkOut && date > checkIn && date < checkOut;
            const classes = ["cal-day"];
            if (isPast) classes.push("disabled");
            if (isToday) classes.push("today");
            if (inRange) classes.push("in-range");
            if (isStart || isEnd) classes.push("selected");
            if (isStart && checkOut) classes.push("range-start");
            if (isEnd && checkIn) classes.push("range-end");
            return `<button type="button" class="${classes.join(" ")}" data-date="${formatDate(date)}" ${isPast ? "disabled" : ""}>${date.getDate()}</button>`;
          })
          .join("")}
      </div>

      <div class="cal-legend">
        <span><span class="swatch available"></span>${t("booking.legendAvailable")}</span>
        <span><span class="swatch unavailable"></span>${t("booking.legendUnavailable")}</span>
        <span><span class="swatch range"></span>${t("booking.legendInRange")}</span>
        <span><span class="swatch selected-swatch"></span>${t("booking.legendSelected")}</span>
      </div>
    </div>

    <form class="contact-form booking-form" id="bookingForm">
      <div class="field">
        <label>${t("booking.room")}</label>
        <div class="room-select" id="roomSelect">
          <button type="button" class="room-select-toggle" id="roomSelectToggle" aria-haspopup="listbox">
            <span class="${selectedRoom ? "" : "placeholder"}">${roomLabel}</span>
            <span class="material-symbols-outlined caret">expand_more</span>
          </button>
          <ul class="room-select-menu" id="roomSelectMenu" role="listbox">
            ${state.rooms
              .map(
                (r) =>
                  `<li role="option" data-room-id="${r.id}" class="${r.id === roomId ? "active" : ""}">${escapeHtml(pickLocalized(r.name, state.lang))} — €${r.basePricePerNight}${t("rooms.perNight")}</li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
      <div class="field">
        <label for="bookingName">${t("booking.fullName")}</label>
        <input id="bookingName" name="name" type="text" required placeholder="Jane Doe" />
      </div>
      <div class="form-row">
        <div class="field">
          <label for="bookingEmail">${t("booking.email")}</label>
          <input id="bookingEmail" name="email" type="email" required placeholder="jane@example.com" />
        </div>
        <div class="field">
          <label for="bookingPhone">${t("booking.phone")}</label>
          <input id="bookingPhone" name="phone" type="tel" placeholder="+359 ..." />
        </div>
      </div>
      <button class="btn btn-gold" type="submit">
        <span class="material-symbols-outlined">event_available</span> ${t("booking.submit")}
      </button>
      <div class="form-status" id="bookingStatus"></div>
    </form>
    </div>
  `;

  document.getElementById("calPrev").addEventListener("click", () => {
    const m = state.booking.calendarMonth;
    state.booking.calendarMonth = new Date(m.getFullYear(), m.getMonth() - 1, 1);
    renderBookingWidget();
  });
  document.getElementById("calNext").addEventListener("click", () => {
    const m = state.booking.calendarMonth;
    state.booking.calendarMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    renderBookingWidget();
  });

  root.querySelectorAll(".cal-day:not(.muted):not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [y, m, d] = btn.dataset.date.split("-").map(Number);
      const clicked = new Date(y, m - 1, d);
      const b = state.booking;

      if (!b.checkIn || (b.checkIn && b.checkOut)) {
        b.checkIn = clicked;
        b.checkOut = null;
      } else if (clicked > b.checkIn) {
        b.checkOut = clicked;
      } else {
        b.checkIn = clicked;
        b.checkOut = null;
      }
      renderBookingWidget();
    });
  });

  wireRoomSelect();

  document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("bookingStatus");
    const b = state.booking;

    if (!b.checkIn || !b.checkOut) {
      status.textContent = t("booking.selectDatesError");
      status.className = "form-status error";
      return;
    }
    if (!b.roomId) {
      status.textContent = t("booking.selectRoomError");
      status.className = "form-status error";
      return;
    }

    status.textContent = t("booking.sending");
    status.className = "form-status";

    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.roomId = b.roomId;
    const room = state.rooms.find((r) => r.id === b.roomId);

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          roomName: room ? pickLocalized(room.name, state.lang) : "",
          checkIn: formatDate(b.checkIn),
          checkOut: formatDate(b.checkOut)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      status.textContent = data.message;
      status.className = "form-status success";
      form.reset();
      state.booking = { checkIn: null, checkOut: null, roomId: "", calendarMonth: startOfMonth(new Date()) };
      renderBookingWidget();
      document.getElementById("bookingStatus").textContent = data.message;
      document.getElementById("bookingStatus").className = "form-status success";
    } catch (err) {
      status.textContent = t("contact.errorGeneric");
      status.className = "form-status error";
    }
  });
}

function wireNav() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  const header = document.querySelector(".site-header");
  const menuIcon = toggle.querySelector(".material-symbols-outlined");

  const syncNavOffset = () => {
    nav.style.top = `${header.getBoundingClientRect().bottom}px`;
  };
  syncNavOffset();
  window.addEventListener("resize", syncNavOffset);

  toggle.addEventListener("click", () => {
    syncNavOffset();
    const isOpen = nav.classList.toggle("open");
    menuIcon.textContent = isOpen ? "close" : "menu";
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      menuIcon.textContent = "menu";
    })
  );
}

function wireLangSwitch() {
  const wrap = document.getElementById("langSwitch");
  const toggle = document.getElementById("langToggle");

  toggle.addEventListener("click", () => wrap.classList.toggle("open"));

  wrap.querySelectorAll("[data-lang]").forEach((li) => {
    li.addEventListener("click", () => {
      state.lang = li.dataset.lang;
      localStorage.setItem("php_lang", state.lang);
      renderAll();
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) wrap.classList.remove("open");
  });
}

// The events widget is fixed to the viewport, so once the page has more
// sections below the hero, whatever happens to scroll under it can get
// covered. Only show it while the hero is in view instead of at all times.
function wireEventsWidgetVisibility() {
  const widget = document.querySelector(".events-widget");
  const hero = document.getElementById("home");
  if (!widget || !hero) return;

  const observer = new IntersectionObserver(([entry]) => widget.classList.toggle("is-hidden", !entry.isIntersecting), {
    threshold: 0.15
  });
  observer.observe(hero);
}

function renderAll() {
  renderShell();
  wireNav();
  wireLangSwitch();
  wireEventsWidgetVisibility();
  renderAmenities();
  renderRooms();
  renderGallery();
  renderBookingWidget();
}

async function init() {
  renderAll();

  const [settings, amenities, rooms, gallery, events] = await Promise.all([
    fetchJSON("/settings", FALLBACK_SETTINGS),
    fetchJSON("/amenities", FALLBACK_AMENITIES),
    fetchJSON("/rooms", []),
    fetchJSON("/gallery", []),
    fetchJSON("/events", [])
  ]);

  state.settings = settings;
  state.amenities = amenities;
  state.rooms = rooms;
  state.gallery = gallery;
  state.events = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  renderAll();
}

init();
