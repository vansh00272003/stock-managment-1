import { Request, Response } from 'express';
import prisma from '../utils/db.js';

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        orderItems: { include: { product: true } },
        invoice: true,
      },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        orderItems: { include: { product: true } },
        invoice: true,
      },
    });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { type, items } = req.body;
    const userId = (req as any).user.id; // From authMiddleware

    if (!items || !items.length) {
      res.status(400).json({ message: 'Order must contain items' });
      return;
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        res.status(400).json({ message: `Product ${item.productId} not found` });
        return;
      }
      const unitPrice = type === 'SALES' ? product.price : product.cost;
      totalAmount += unitPrice * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const order = await prisma.order.create({
      data: {
        type,
        userId,
        totalAmount,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        orderItems: { include: { product: true } },
        invoice: true,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order Create Error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { type, items } = req.body;

    // Delete existing items and recreate
    await prisma.orderItem.deleteMany({ where: { orderId: id } });

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      totalAmount += item.unitPrice * item.quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        type,
        totalAmount,
        orderItems: { create: orderItemsData },
      },
      include: {
        orderItems: { include: { product: true } },
      },
    });

    res.json(order);
  } catch (error) {
    console.error('Order Update Error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
