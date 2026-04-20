import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Store del carrito
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (producto) => {
        const items = get().items;
        const existing = items.find(i => i.id === producto.id);
        if (existing) {
          set({ items: items.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i) });
        } else {
          set({ items: [...items, { ...producto, cantidad: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
      updateQty: (id, cantidad) => {
        if (cantidad <= 0) {
          set({ items: get().items.filter(i => i.id !== id) });
        } else {
          set({ items: get().items.map(i => i.id === id ? { ...i, cantidad } : i) });
        }
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((acc, i) => acc + (i.min_precio || 0) * i.cantidad, 0)
    }),
    { name: 'ahorraya-cart' }
  )
);

// Store de autenticación
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } }))
    }),
    { name: 'ahorraya-auth' }
  )
);

// Store de búsqueda/filtros
export const useSearchStore = create((set) => ({
  query: '',
  categoria: '',
  supermercado: '',
  soloOfertas: false,
  orden: 'precio_asc',
  setQuery: (query) => set({ query }),
  setFiltros: (filtros) => set(filtros),
  resetFiltros: () => set({ categoria: '', supermercado: '', soloOfertas: false, orden: 'precio_asc' })
}));
