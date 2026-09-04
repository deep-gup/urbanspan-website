import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const GST_RATE = 0.18; // 18% GST for commercial steel products

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('urbanspan_buyer_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse cart from localStorage:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('urbanspan_buyer_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 25) => {
    if (!product || !product.id) return;
    const qty = Math.max(0.001, Number(quantity) || 25);
    const basePrice = Number(product.base_price) || 0;
    const unit = product.unit || 'Metric Ton';

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id || (item.sku && item.sku === product.sku));
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.round((updated[existingIdx].quantity + qty) * 1000) / 1000;
        const lineSubtotal = Math.round(newQty * (updated[existingIdx].base_price || basePrice) * 100) / 100;
        const lineGst = Math.round(lineSubtotal * GST_RATE * 100) / 100;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineSubtotal,
          lineGst,
          lineTotal: lineSubtotal + lineGst
        };
        return updated;
      } else {
        const image = (Array.isArray(product.images) && product.images[0]) || product.image_url || '/images/tmt_rebars.jpg';
        const lineSubtotal = Math.round(qty * basePrice * 100) / 100;
        const lineGst = Math.round(lineSubtotal * GST_RATE * 100) / 100;
        const newItem = {
          id: product.id,
          sku: product.sku || '',
          name: product.name,
          category: product.category || 'Steel',
          image,
          base_price: basePrice,
          unit,
          quantity: qty,
          gst_rate: GST_RATE,
          lineSubtotal,
          lineGst,
          lineTotal: lineSubtotal + lineGst,
          specs: product.specs || {}
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const qty = Math.max(0.001, Number(newQuantity) || 0.001);
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === productId || item.sku === productId) {
          const lineSubtotal = Math.round(qty * item.base_price * 100) / 100;
          const lineGst = Math.round(lineSubtotal * GST_RATE * 100) / 100;
          return {
            ...item,
            quantity: qty,
            lineSubtotal,
            lineGst,
            lineTotal: lineSubtotal + lineGst
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId && item.sku !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const totalCount = cartItems.length;
  const totalQuantity = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.lineSubtotal) || 0), 0);
  const totalGst = subtotal * GST_RATE;
  const grandTotal = subtotal + totalGst;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalQuantity,
        subtotal,
        totalGst,
        grandTotal,
        gstRate: GST_RATE
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
