const express = require('express');
const router = express.Router();
const { query } = require('../database/db');

// POST /api/cart/optimize - Carrito inteligente
router.post('/optimize', async (req, res) => {
  try {
    const { items } = req.body; // [{ producto_id, cantidad }]
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const productIds = items.map(i => i.producto_id);

    // Obtener todos los precios para los productos del carrito
    const preciosResult = await query(`
      SELECT
        pr.producto_id,
        p.nombre,
        p.categoria,
        pr.supermercado,
        pr.precio,
        pr.precio_anterior,
        pr.descuento_porcentaje
      FROM precios pr
      JOIN productos p ON p.id = pr.producto_id
      WHERE pr.producto_id = ANY($1::uuid[]) AND pr.disponible = true
      ORDER BY pr.producto_id, pr.precio ASC
    `, [productIds]);

    // Organizar precios por producto
    const preciosPorProducto = {};
    for (const row of preciosResult.rows) {
      if (!preciosPorProducto[row.producto_id]) {
        preciosPorProducto[row.producto_id] = {
          nombre: row.nombre,
          categoria: row.categoria,
          precios: []
        };
      }
      preciosPorProducto[row.producto_id].precios.push({
        supermercado: row.supermercado,
        precio: parseFloat(row.precio),
        precio_anterior: row.precio_anterior ? parseFloat(row.precio_anterior) : null,
        descuento_porcentaje: row.descuento_porcentaje
      });
    }

    // Calcular estrategias de compra
    const supermercados = ['supermaxi', 'megamaxi', 'aki', 'tia'];

    // Estrategia 1: Comprar TODO en el supermercado más barato total
    const totalesPorSupermercado = {};
    for (const sup of supermercados) {
      let total = 0;
      let productosDisponibles = 0;
      const detalles = [];

      for (const item of items) {
        const prod = preciosPorProducto[item.producto_id];
        if (!prod) continue;

        const precio = prod.precios.find(p => p.supermercado === sup);
        if (precio) {
          total += precio.precio * item.cantidad;
          productosDisponibles++;
          detalles.push({ nombre: prod.nombre, precio: precio.precio, cantidad: item.cantidad });
        }
      }

      totalesPorSupermercado[sup] = {
        total: Math.round(total * 100) / 100,
        productos_disponibles: productosDisponibles,
        detalles
      };
    }

    // Estrategia 2: Comprar cada producto donde está más barato (óptimo)
    const estrategiaOptima = {};
    let totalOptimo = 0;
    let ahorroPotencial = 0;

    for (const item of items) {
      const prod = preciosPorProducto[item.producto_id];
      if (!prod || prod.precios.length === 0) continue;

      const mejorPrecio = prod.precios[0]; // Ya ordenados por precio ASC
      const peorPrecio = prod.precios[prod.precios.length - 1];

      if (!estrategiaOptima[mejorPrecio.supermercado]) {
        estrategiaOptima[mejorPrecio.supermercado] = {
          productos: [],
          subtotal: 0
        };
      }

      estrategiaOptima[mejorPrecio.supermercado].productos.push({
        producto_id: item.producto_id,
        nombre: prod.nombre,
        cantidad: item.cantidad,
        precio: mejorPrecio.precio,
        subtotal: Math.round(mejorPrecio.precio * item.cantidad * 100) / 100,
        ahorro_vs_caro: Math.round((peorPrecio.precio - mejorPrecio.precio) * item.cantidad * 100) / 100
      });

      estrategiaOptima[mejorPrecio.supermercado].subtotal += mejorPrecio.precio * item.cantidad;
      totalOptimo += mejorPrecio.precio * item.cantidad;
      ahorroPotencial += (peorPrecio.precio - mejorPrecio.precio) * item.cantidad;
    }

    // Redondear subtotales
    for (const sup of Object.keys(estrategiaOptima)) {
      estrategiaOptima[sup].subtotal = Math.round(estrategiaOptima[sup].subtotal * 100) / 100;
    }

    // Encontrar el mejor supermercado único
    const mejorSupermercadoUnico = Object.entries(totalesPorSupermercado)
      .filter(([_, data]) => data.productos_disponibles === items.length)
      .sort((a, b) => a[1].total - b[1].total)[0];

    res.json({
      items_solicitados: items.length,
      por_supermercado: totalesPorSupermercado,
      estrategia_optima: {
        supermercados: estrategiaOptima,
        total: Math.round(totalOptimo * 100) / 100,
        ahorro_vs_mas_caro: Math.round(ahorroPotencial * 100) / 100,
        num_supermercados_necesarios: Object.keys(estrategiaOptima).length
      },
      mejor_supermercado_unico: mejorSupermercadoUnico ? {
        supermercado: mejorSupermercadoUnico[0],
        total: mejorSupermercadoUnico[1].total
      } : null,
      detalles_productos: Object.entries(preciosPorProducto).map(([id, data]) => ({
        producto_id: id,
        nombre: data.nombre,
        precios: data.precios
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al optimizar carrito' });
  }
});

module.exports = router;
