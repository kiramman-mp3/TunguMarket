import AddressModel from '../models/addressModel.js';

class AddressController {
  static async getAddresses(req, res) {
    try {
      const addresses = await AddressModel.findByUserId(req.user.id);
      res.status(200).json({ data: addresses });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createAddress(req, res) {
    try {
      const { 
        city, main_street, secondary_street, neighborhood, house_number, postal_code, is_default 
      } = req.body;

      if (!city || !main_street || !secondary_street) {
        return res.status(400).json({ error: 'Ciudad y calles principal/secundaria son requeridas' });
      }

      const address = await AddressModel.create({
        userId: req.user.id,
        city,
        mainStreet: main_street,
        secondaryStreet: secondary_street,
        neighborhood,
        houseNumber: house_number,
        postalCode: postal_code,
        isDefault: is_default
      });

      res.status(201).json({ message: 'Dirección guardada', data: address });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteAddress(req, res) {
    try {
      const { id } = req.params;
      const success = await AddressModel.delete(id, req.user.id);
      if (success) {
        res.status(200).json({ message: 'Dirección eliminada' });
      } else {
        res.status(404).json({ error: 'Dirección no encontrada' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async setDefaultAddress(req, res) {
    try {
      const { id } = req.params;
      const address = await AddressModel.setDefault(id, req.user.id);
      if (address) {
        res.status(200).json({ message: 'Dirección predeterminada actualizada', data: address });
      } else {
        res.status(404).json({ error: 'Dirección no encontrada' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default AddressController;
