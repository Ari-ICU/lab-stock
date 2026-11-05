import { Request, Response } from 'express';
import { transferService } from '../services/transferService.js';
import { asyncHandler } from '../exceptions/errorHandler.js';

export const getTransfers = asyncHandler(async (_req: Request, res: Response) => {
  const transfers = await transferService.getAll();
  return res.status(200).json({
    status: 'ok',
    count: transfers.length,
    data: transfers,
  });
});

export const getTransferById = asyncHandler(async (req: Request, res: Response) => {
  const transfer = await transferService.getById(String(req.params.id));
  return res.status(200).json({
    status: 'ok',
    data: transfer,
  });
});

export const createTransfer = asyncHandler(async (req: Request, res: Response) => {
  const newTransfer = await transferService.create(req.body);
  return res.status(201).json({
    status: 'ok',
    message: 'Equipment relocated and registered successfully',
    data: newTransfer,
  });
});

