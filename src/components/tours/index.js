import portfolioTour from "./portfolio"
import galeriesTour from "./galerias"
import compartirTour from "./compartir"
import ventasTour from "./ventas"

// Para agregar un tour nuevo:
// 1. Crear src/components/tours/mi-tour.js con la misma estructura
// 2. Importarlo acá
// 3. Agregarlo al array TOURS

const TOURS = [
    portfolioTour,
    galeriesTour,
    compartirTour,
    ventasTour,
]

export default TOURS