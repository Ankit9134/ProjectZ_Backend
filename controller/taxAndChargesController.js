const TaxAndChargesModel = require("../models/TaxAndCharges");

// Controller to add taxes
const addTax = async (req, res) => {
  try {
    const { countryName, taxType, taxRate, description } = req.body;
    const newTax = await TaxAndChargesModel.create({
      countryName: countryName,
      taxType: taxType,
      rate: taxRate,
      description: description,
    });

    if (!newTax) {
      return res.status(400).json({
        success: false,
        message: "Unable to create new Tax",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tax created and added successfully",
      data: newTax,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Controller to update taxes
const updateTax = async (req, res) => {
  try {
    const taxId = req.params.id;
    const { countryName, taxType, taxRate, description } = req.body;
    const updatedTax = await TaxAndChargesModel.findByIdAndUpdate(
      taxId,
      {
        countryName: countryName,
        taxType: taxType,
        rate: taxRate,
        description: description,
      },
      { new: true } // This returns the updated document instead of the original
    );

    if (!updatedTax) {
      return res.status(400).json({
        success: false,
        message: "Unable to update the Tax",
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully updated tax",
      data: updatedTax,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Controller to get taxes
const getTaxes = async (req, res) => {
  try {
    const taxes = await TaxAndChargesModel.find();

    if (!taxes || taxes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No taxes found in the database",
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully fetched taxes data from db",
      data: taxes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Controller to delete a tax by id
const deleteTax = async (req, res) => {
  try {
    const taxId = req.params.id;
    const deletedTax = await TaxAndChargesModel.findByIdAndDelete(taxId);

    if (!deletedTax) {
      return res.status(404).json({
        success: false,
        message: "Tax with given id is not found in the db",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tax with given id is deleted successfully",
      data: deletedTax,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addTax,
  updateTax,
  deleteTax,
  getTaxes,
};
