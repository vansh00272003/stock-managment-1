import { Request, Response } from 'express';
import prisma from '../utils/db.js';

export const getStockLevels = async (req: Request, res: Response) => {
  try {
    const stockLevels = await prisma.stockLevel.findMany({
      include: {
        product: true,
        location: true,
      },
    });
    res.json(stockLevels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createStockMovement = async (req: Request, res: Response) => {
  try {
    const { productId, fromLocationId, toLocationId, quantity, type, reason } = req.body;
    const userId = (req as any).user.id; // From authMiddleware

    // Basic Validation
    if (!productId || !quantity || !type) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Start a transaction: Record Movement + Update Stock Levels
    const movement = await prisma.$transaction(async (tx: any) => {
      const movementRecord = await tx.stockMovement.create({
        data: {
          productId,
          fromLocationId,
          toLocationId,
          quantity,
          type,
          reason,
          userId,
        },
      });

      // Update Stock Levels based on movement type
      if (type === 'INBOUND' && toLocationId) {
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: { productId, locationId: toLocationId },
          },
          update: { quantity: { increment: quantity } },
          create: { productId, locationId: toLocationId, quantity },
        });
      } else if (type === 'OUTBOUND' && fromLocationId) {
        await tx.stockLevel.update({
          where: { productId_locationId: { productId, locationId: fromLocationId } },
          data: { quantity: { decrement: quantity } },
        });
      } else if (type === 'TRANSFER' && fromLocationId && toLocationId) {
        await tx.stockLevel.update({
          where: { productId_locationId: { productId, locationId: fromLocationId } },
          data: { quantity: { decrement: quantity } },
        });
        await tx.stockLevel.upsert({
          where: { productId_locationId: { productId, locationId: toLocationId } },
          update: { quantity: { increment: quantity } },
          create: { productId, locationId: toLocationId, quantity },
        });
      } else if (type === 'ADJUSTMENT' && toLocationId) {
        // Here we can assume adjustment sets the quantity or adds to it. We will add to it for simplicity.
        await tx.stockLevel.upsert({
          where: { productId_locationId: { productId, locationId: toLocationId } },
          update: { quantity: { increment: quantity } },
          create: { productId, locationId: toLocationId, quantity },
        });
      }

      return movementRecord;
    });

    res.status(201).json(movement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getLocations = async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    const { name, address } = req.body;
    const location = await prisma.location.create({ data: { name, address } });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateStockLevel = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { quantity } = req.body;
    const stockLevel = await prisma.stockLevel.update({
      where: { id },
      data: { quantity: Number(quantity) },
      include: { product: true, location: true }
    });
    res.json(stockLevel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteStockLevel = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.stockLevel.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
