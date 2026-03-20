import { Request, Response } from 'express';
import prisma from '../utils/db.js';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        stockLevels: { include: { location: true } },
      },
    });
    
    // Transform to include a total stock field for easier frontend consumption
    const productsWithTotalStock = products.map((p: any) => ({
      ...p,
      stock: p.stockLevels.reduce((sum: number, sl: any) => sum + sl.quantity, 0)
    }));
    
    res.json(productsWithTotalStock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ 
      where: { id: id as string },
      include: { 
        stockLevels: { include: { location: true } }
      }
    });
    
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    const productWithTotalStock = {
      ...product,
      stock: (product as any).stockLevels.reduce((sum: number, sl: any) => sum + sl.quantity, 0)
    };
    
    res.json(productWithTotalStock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const product = await prisma.product.update({ 
      where: { id: id as string }, 
      data 
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prodId = id as string;
    
    // First, delete related records that don't have cascade delete
    // OrderItems reference Product but don't cascade delete by default in schema
    await prisma.orderItem.deleteMany({ where: { productId: prodId } });
    
    // StockLevel and StockMovement have onDelete: Cascade in schema 
    // so they will be handled by Prisma/Database
    await prisma.product.delete({ where: { id: prodId } });
    
    res.status(204).send();
  } catch (error) {
    console.error('deleteProduct Error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
