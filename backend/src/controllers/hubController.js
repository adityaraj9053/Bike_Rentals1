import { HubModel } from '../models/Hub.js';

export async function getAllHubs(req, res) {
  try {
    const hubs = await HubModel.find({ isActive: true }).sort({ city: 1 }).lean();
    return res.status(200).json({ success: true, count: hubs.length, data: hubs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch hubs.' });
  }
}

export async function createHub(req, res) {
  try {
    const { city, hubName, address, pincode, coordinates = [72.8777, 19.0760], openingTime, closingTime, contactPhone } = req.body;
    const hub = await HubModel.create({
      city,
      hubName,
      address,
      pincode,
      location: { type: 'Point', coordinates },
      openingTime: openingTime || '07:00',
      closingTime: closingTime || '22:00',
      contactPhone,
      isActive: true,
    });
    return res.status(201).json({ success: true, data: hub });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create hub.' });
  }
}

