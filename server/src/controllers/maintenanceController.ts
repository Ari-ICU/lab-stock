import { Request, Response } from 'express';
import { maintenanceModel } from '../models/maintenanceModel.js';

export async function getMaintenanceRecords(req: Request, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const records = await maintenanceModel.findAll(status);
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch maintenance records',
    });
  }
}

export async function getMaintenanceById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const record = await maintenanceModel.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
      });
    }
    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve maintenance record',
    });
  }
}

export async function createMaintenanceRecord(req: Request, res: Response) {
  try {
    const { asset_id, asset_name, serial_number, type, date, technician, status, notes } = req.body;
    if (!asset_name || !serial_number || !type || !technician) {
      return res.status(400).json({
        success: false,
        message: 'Asset name, serial number, service type, and technician are required.',
      });
    }

    const created = await maintenanceModel.create({
      asset_id,
      asset_name,
      serial_number,
      type,
      date: date || new Date().toISOString().split('T')[0],
      technician,
      status: status || 'Pending',
      notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: created,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create maintenance record',
    });
  }
}

export async function updateMaintenanceRecord(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const updated = await maintenanceModel.update(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update maintenance record',
    });
  }
}

export async function deleteMaintenanceRecord(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const deleted = await maintenanceModel.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete maintenance record',
    });
  }
}
