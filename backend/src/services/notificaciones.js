const { query } = require('../database/db');
const logger = require('../utils/logger');

/**
 * Verifica alertas activas cuando baja un precio.
 * Guarda una notificación en la tabla para que el usuario la vea en su perfil.
 */
async function verificarAlertas(producto_id, supermercado, precio_nuevo) {
  try {
    // Obtener precio anterior ANTES del update (ya fue actualizado, lo leemos del historial)
    const historial = await query(`
      SELECT precio FROM historial_precios
      WHERE producto_id = $1 AND supermercado = $2
      ORDER BY fecha DESC LIMIT 1
    `, [producto_id, supermercado]);

    const precio_anterior = historial.rows[0] ? parseFloat(historial.rows[0].precio) : null;

    const alertas = await query(`
      SELECT a.id, a.usuario_id, a.precio_objetivo, a.descuento_minimo,
             u.email, u.nombre, p.nombre as producto_nombre
      FROM alertas a
      JOIN users u ON u.id = a.usuario_id
      JOIN productos p ON p.id = a.producto_id
      WHERE a.producto_id = $1 AND a.activa = true
    `, [producto_id]);

    const notificadas = [];

    for (const alerta of alertas.rows) {
      const cumplePrecioObjetivo = alerta.precio_objetivo && precio_nuevo <= parseFloat(alerta.precio_objetivo);
      const descReal = precio_anterior > 0 ? ((precio_anterior - precio_nuevo) / precio_anterior) * 100 : 0;
      const cumpleDescuento = descReal >= (alerta.descuento_minimo || 15);

      if (cumplePrecioObjetivo || cumpleDescuento) {
        // Guardar notificación en DB para mostrar en perfil
        await query(`
          INSERT INTO notificaciones (usuario_id, producto_id, tipo, mensaje, precio_nuevo, precio_anterior)
          VALUES ($1, $2, 'precio_bajo', $3, $4, $5)
        `, [
          alerta.usuario_id,
          producto_id,
          `¡Bajó el precio de ${alerta.producto_nombre}! Ahora $${precio_nuevo.toFixed(2)} en ${supermercado}${descReal > 0 ? ` (-${descReal.toFixed(1)}%)` : ''}`,
          precio_nuevo,
          precio_anterior
        ]);

        await query(`UPDATE alertas SET notificado_at = NOW() WHERE id = $1`, [alerta.id]);

        notificadas.push({
          usuario: alerta.nombre,
          email: alerta.email,
          producto: alerta.producto_nombre,
          descuento: descReal.toFixed(1)
        });

        logger.info(`🔔 Alerta: ${alerta.email} — ${alerta.producto_nombre} bajó a $${precio_nuevo} (-${descReal.toFixed(1)}%)`);
      }
    }

    return notificadas;
  } catch (err) {
    logger.error('Error verificarAlertas:', err.message);
    return [];
  }
}

module.exports = { verificarAlertas };
