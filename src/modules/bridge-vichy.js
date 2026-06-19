/**
 * AF CHIAPAS - Bridge Vichy2026LaSalle
 * Gestiona la conexión con el repositorio satélite de movilidad.
 */
async function conectarProyectoVichy() {
    try {
        const response = await fetch('./config/satelites.json');
        const data = await response.json();
        const vichyRepo = data.proyectos_movilidad.find(p => p.id === 'vichy-lasalle-2026');
        
        console.log(`[AF Bridge] Conexión establecida con ecosistema: ${vichyRepo.titulo}`);
        return vichyRepo;
    } catch (error) {
        console.error("[AF Bridge] Error al conectar con el repositorio de movilidad.", error);
    }
}
