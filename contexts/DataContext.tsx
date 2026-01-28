
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, ServiceProvider, CartItem, MartOrder, DeliveryRequest } from '../types';
import { api } from '../services/data';

interface DataContextType {
  products: Product[];
  services: ServiceProvider[];
  cart: CartItem[];
  orders: MartOrder[];
  deliveries: DeliveryRequest[];
  
  loading: {
    products: boolean;
    services: boolean;
    orders: boolean;
    deliveries: boolean;
  };
  errors: {
    products: string | null;
    services: string | null;
    orders: string | null;
    deliveries: string | null;
  };

  fetchProducts: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchOrders: (userId: string) => Promise<void>;
  fetchDeliveries: (userId: string) => Promise<void>;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; // Exposed for backward compatibility

  createOrder: (order: Partial<MartOrder>) => Promise<{ success: boolean; orderId?: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceProvider[]>([]);
  const [orders, setOrders] = useState<MartOrder[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kubwa_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState({
    products: false,
    services: false,
    orders: false,
    deliveries: false
  });

  const [errors, setErrors] = useState<{
    products: string | null;
    services: string | null;
    orders: string | null;
    deliveries: string | null;
  }>({
    products: null,
    services: null,
    orders: null,
    deliveries: null
  });

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('kubwa_cart', JSON.stringify(cart.slice(0, 10)));
    } catch (e) {
      console.warn("Cart persistence failed", e);
    }
  }, [cart]);

  // Actions
  const fetchProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const data = await api.getProducts();
      // Sort: Promoted first
      const sorted = [...data].sort((a, b) => (b.isPromoted ? 1 : 0) - (a.isPromoted ? 1 : 0));
      setProducts(sorted);
      setErrors(prev => ({ ...prev, products: null }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, products: err.message || 'Failed to fetch products' }));
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(prev => ({ ...prev, services: true }));
    try {
      const data = await api.getProviders();
      setServices(data);
      setErrors(prev => ({ ...prev, services: null }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, services: err.message || 'Failed to fetch services' }));
    } finally {
      setLoading(prev => ({ ...prev, services: false }));
    }
  }, []);

  const fetchOrders = useCallback(async (userId: string) => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const data = await api.orders.getMyOrders(userId);
      setOrders(data);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, orders: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  }, []);

  const fetchDeliveries = useCallback(async (userId: string) => {
    setLoading(prev => ({ ...prev, deliveries: true }));
    try {
      const data = await api.getDeliveries(userId);
      setDeliveries(data);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, deliveries: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, deliveries: false }));
    }
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const createOrder = useCallback(async (orderData: Partial<MartOrder>) => {
    try {
      const result = await api.orders.placeOrder(orderData);
      return result;
    } catch (e) {
      return { success: false };
    }
  }, []);

  return (
    <DataContext.Provider value={{
      products, services, cart, orders, deliveries,
      loading, errors,
      fetchProducts, fetchServices, fetchOrders, fetchDeliveries,
      addToCart, removeFromCart, clearCart, setCart,
      createOrder
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
