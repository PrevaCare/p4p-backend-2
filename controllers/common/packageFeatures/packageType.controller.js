const TypeSubtype = require("../../../models/common/types.subtypes.model");

// Get all package types (without subtypes data)
exports.getAllTypesBasic = async (req, res) => {
  try {
    // Only fetch the name, description, and isActive fields without subtypes
    const types = await TypeSubtype.find(
      {},
      { name: 1, description: 1, isActive: 1 }
    );
    return res.status(200).json({ success: true, data: types });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all package types with complete details (including subtypes)
exports.getAllTypes = async (req, res) => {
  try {
    const types = await TypeSubtype.find({});
    return res.status(200).json({ success: true, data: types });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single package type by ID
exports.getTypeById = async (req, res) => {
  try {
    const { typeId } = req.params;
    const type = await TypeSubtype.findById(typeId);

    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Package type not found" });
    }

    return res.status(200).json({ success: true, data: type });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new package type
exports.createType = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingType = await TypeSubtype.findOne({ name });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: "Package type with this name already exists",
      });
    }

    const newType = new TypeSubtype({
      name,
      description,
      subtypes: [],
    });

    await newType.save();
    return res.status(201).json({ success: true, data: newType });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update a package type
exports.updateType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name, description, isActive } = req.body;

    const type = await TypeSubtype.findById(typeId);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Package type not found" });
    }

    if (name !== type.name) {
      const existingType = await TypeSubtype.findOne({ name });
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: "Package type with this name already exists",
        });
      }
    }

    const updatedType = await TypeSubtype.findByIdAndUpdate(
      typeId,
      { name, description, isActive },
      { new: true }
    );

    return res.status(200).json({ success: true, data: updatedType });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a package type
exports.deleteType = async (req, res) => {
  try {
    const { typeId } = req.params;

    const type = await TypeSubtype.findById(typeId);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Package type not found" });
    }

    await TypeSubtype.findByIdAndDelete(typeId);
    return res
      .status(200)
      .json({ success: true, message: "Package type deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add a subtype to a package type
exports.addSubtype = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name, description } = req.body;

    const type = await TypeSubtype.findById(typeId);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Package type not found" });
    }

    // Check if subtype with the same name already exists
    const subtypeExists = type.subtypes.some(
      (subtype) => subtype.name === name
    );
    if (subtypeExists) {
      return res.status(400).json({
        success: false,
        message: "Subtype with this name already exists in this package type",
      });
    }

    type.subtypes.push({ name, description });
    await type.save();

    return res.status(201).json({ success: true, data: type });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update a subtype
exports.updateSubtype = async (req, res) => {
  try {
    const { typeId, subtypeId } = req.params;
    const { name, description, isActive } = req.body;

    const type = await TypeSubtype.findById(typeId);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Package type not found" });
    }

    const subtypeIndex = type.subtypes.findIndex(
      (st) => st._id.toString() === subtypeId
    );
    if (subtypeIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Subtype not found" });
    }

    // Check if new name conflicts with another subtype
    if (name !== type.subtypes[subtypeIndex].name) {
      const nameExists = type.subtypes.some(
        (st, idx) => idx !== subtypeIndex && st.name === name
      );
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: "Another subtype with this name already exists",
        });
      }
    }

    // Update the subtype
    if (name) type.subtypes[subtypeIndex].name = name;
    if (description !== undefined)
      type.subtypes[subtypeIndex].description = description;
    if (isActive !== undefined) type.subtypes[subtypeIndex].isActive = isActive;

    await type.save();
    return res.status(200).json({ success: true, data: type });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a subtype
exports.removeSubtype = async (req, res) => {
  try {
    const { typeId, subtypeId } = req.params;

    const type = await TypeSubtype.findById(typeId);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: "Package type not found" });
    }

    const subtypeIndex = type.subtypes.findIndex(
      (st) => st._id.toString() === subtypeId
    );
    if (subtypeIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Subtype not found" });
    }

    type.subtypes.splice(subtypeIndex, 1);
    await type.save();

    return res.status(200).json({
      success: true,
      message: "Subtype removed successfully",
      data: type,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
