import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productInCart = cart.find(product => product.id === productId);
      const stockResponse = await api.get(`stock/${productId}`);
      const stock = stockResponse.data as Stock;
      const cartItemsAmount = 1 + (productInCart ? productInCart?.amount : 0);
      if (stock.amount < cartItemsAmount) {
        toast.error('Quantidade solicitada fora de estoque');
      }
      else {
        if (productInCart) {
          productInCart.amount = cartItemsAmount;
        }
        else {
          const productResponse = await api.get(`products/${productId}`);
          const product = productResponse.data;
          if (product) {
            const newProduct = {
              ...product,
              amount: cartItemsAmount,
            }
            newCart.push(newProduct);
          }
          else {
            toast.error('Erro na adição do produto')
          }
        }
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch (e: any) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productInCart = newCart.findIndex(product => product.id === productId);

      if (productInCart >= 0) {
        newCart.splice(productInCart, 1);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
      else {
        toast.error('Erro na remoção do produto')
      }
    } catch {
      toast.error('Ocorreu um erro ao excluir o produto no carrinho.');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const productInCart = cart.find(product => product.id === productId);
      if (amount >= 1) {
        if (productInCart) {
          const stockResponse = await api.get(`stock/${productId}`);
          const stock = stockResponse.data as Stock;;
          if (stock.amount < amount) {
            toast.error('Quantidade solicitada fora de estoque');
          }
          else {
            productInCart.amount = amount;
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          }
        }
        else {
          toast.error('Erro na alteração de quantidade do produto');
        }
      }
      else {
        toast.error('Pelo menos um produto deve existir carrinho.');
      }
    } catch (e: any) {
      toast.error('Ocorreu um erro ao incluir o produto no carrinho.');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
