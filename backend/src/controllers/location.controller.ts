import { Request, Response } from 'express';
import prisma from '../utils/db.js';

export const getLocations = async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    const { name, address } = req.body;
    const location = await prisma.location.create({
      data: { name, address },
    });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    const location = await prisma.location.update({
      where: { id },
      data: { name, address },
    });
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.location.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
