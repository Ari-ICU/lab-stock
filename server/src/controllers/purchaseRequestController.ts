import { Request, Response } from 'express';
import { purchaseRequestModel } from '../models/purchaseRequestModel.js';

export async function getPurchaseRequests(req: Request, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const records = await purchaseRequestModel.findAll(status);
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch purchase requests',
    });
  }
}

export async function getPurchaseRequestById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const record = await purchaseRequestModel.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found',
      });
    }
    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve purchase request',
    });
  }
}

export async function createPurchaseRequest(req: Request, res: Response) {
  try {
    const {
      id,
      title,
      category,
      target_room,
      targetRoom,
      quantity,
      unit,
      estimated_cost,
      estimatedCost,
      priority,
      reason,
      image_url,
      imageUrl,
      notes,
    } = req.body;

    if (!title || !category || (!target_room && !targetRoom) || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, target room, and reason are required.',
      });
    }

    const user = (req as any).user;
    const requested_by = user?.name || req.body.requested_by || req.body.requestedBy || 'Thoeurn Ratha';
    const requester_role = user?.role || req.body.requester_role || req.body.requesterRole || 'Faculty Lecturer';

    const reqId = id || `REQ-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const created = await purchaseRequestModel.create({
      id: reqId,
      title,
      category,
      target_room: target_room || targetRoom,
      quantity: Number(quantity) || 1,
      unit: unit || 'Units',
      estimated_cost: estimated_cost || estimatedCost,
      priority: priority || 'medium',
      status: 'pending',
      reason,
      requested_by,
      requester_role,
      request_date: new Date().toISOString().split('T')[0],
      image_url: image_url || imageUrl,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase request submitted successfully',
      data: created,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create purchase request',
    });
  }
}

export async function updatePurchaseRequest(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const body = req.body;
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.target_room !== undefined || body.targetRoom !== undefined) {
      updateData.target_room = body.target_room || body.targetRoom;
    }
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.estimated_cost !== undefined || body.estimatedCost !== undefined) {
      updateData.estimated_cost = body.estimated_cost || body.estimatedCost;
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.image_url !== undefined || body.imageUrl !== undefined) {
      updateData.image_url = body.image_url !== undefined ? body.image_url : body.imageUrl;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await purchaseRequestModel.update(id, updateData);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Purchase request updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update purchase request',
    });
  }
}

export async function updatePurchaseRequestStatus(req: Request, res: Response) {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.',
      });
    }

    const id = String(req.params.id);
    const updated = await purchaseRequestModel.updateStatus(id, status, notes);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Purchase request status updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update purchase request status',
    });
  }
}

export async function deletePurchaseRequest(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const deleted = await purchaseRequestModel.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Purchase request deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete purchase request',
    });
  }
}
