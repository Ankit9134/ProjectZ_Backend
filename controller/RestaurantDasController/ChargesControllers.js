const Charges = require("../../models/RestaurantsDasModel/Charges");
const DeliveryCharges = require("../../models/RestaurantsDasModel/DeliveryCharges");

//Charges Routes
const predefinedCharges = [
    { name: 'Service Fee', type: 'percentage', value: 5, isApplicable: true, isDefault: true },
    { name: 'Packaging Fee (Per 1 Meal Type)', type: 'flat', value: 10, isApplicable: true, isDefault: true },
    { name: 'Convenience Fee', type: 'percentage', value: 2, isApplicable: false, isDefault: true },
    { name: 'Handling Charges', type: 'flat', value: 15, isApplicable: true, isDefault: true },
];

exports.addCharge = async (req, res) => {
    try {
        const { name, value, isApplicable, type } = req.body;

        if (!name || value == null || !type) {
            return res.status(400).json({ error: "Name, value, and type are required." });
        }

        const newCharge = new Charges({
            name,
            value,
            type,
            isApplicable: isApplicable ?? true,
            isDefault: false
        });

        await newCharge.save();

        res.status(201).json(newCharge);
    } catch (error) {
        console.error("Add charge error:", error);
        res.status(500).json({ error: error.message });
    }
};


exports.getCharges = async (req, res) => {
    try {
        let charges = await Charges.find();

  
        if (charges.length === 0) {
            await Charges.insertMany(predefinedCharges);
            charges = await Charges.find(); // Fetch again after inserting
        }

        res.status(200).json(charges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateCharge = async (req, res) => {
    try {
        const { name, value, isApplicable, type } = req.body;

        const updatedCharge = await Charges.findByIdAndUpdate(
            req.params.id,
            { name, value, type, isApplicable },
            { new: true } // Returns the updated document
        );

        if (!updatedCharge) {
            return res.status(404).json({ message: "Charge not found" });
        }

        res.status(200).json(updatedCharge);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.deleteCharge = async (req, res) => {
    try {
        const chargeToDelete = await Charges.findById(req.params.id);

        if (!chargeToDelete) {
            return res.status(404).json({ message: "Charge not found" });
        }

        if (chargeToDelete.isDefault) {
            return res.status(403).json({ message: "Default charges cannot be deleted" });
        }

        await Charges.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Charge deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Delivery Ranges


// Get all delivery ranges
exports.getDeliveryRanges = async (req, res) => {
    try {
        const deliveryRanges = await DeliveryCharges.find().sort({ minDistance: 1 });
        res.json(deliveryRanges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new delivery range
exports.addDeliveryRange = async (req, res) => {
    const { minDistance, maxDistance, charge } = req.body;

    // Check if all required fields are provided
    if (minDistance === undefined || maxDistance === undefined || charge === undefined) {
        return res.status(400).json({ message: "All fields (minDistance, maxDistance, charge) are required." });
    }

    try {
        const newRange = new DeliveryCharges({
            minDistance,
            maxDistance,
            charge,
            isActive: true
        });

        await newRange.save();
        
        // Return all ranges after adding new one
        const updatedRanges = await DeliveryCharges.find().sort({ minDistance: 1 });
        res.status(201).json(updatedRanges);
    } catch (error) {
        console.error("Error saving delivery range:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Update a delivery range
exports.updateDeliveryRange = async (req, res) => {
    try {
        const { id } = req.params;
        const { minDistance, maxDistance, charge } = req.body;

        const updatedRange = await DeliveryCharges.findByIdAndUpdate(
            id,
            { 
                minDistance, 
                maxDistance, 
                charge,
                updatedAt: Date.now()
            },
            { new: true }  // This returns the updated document
        );

        if (!updatedRange) {
            return res.status(404).json({ message: "Delivery range not found" });
        }

        res.json(updatedRange);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a delivery range
exports.deleteDeliveryRange = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedRange = await DeliveryCharges.findByIdAndDelete(id);
        
        if (!deletedRange) {
            return res.status(404).json({ message: "Delivery range not found" });
        }

        res.json({ message: "Delivery range deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle delivery range status
exports.toggleDeliveryRangeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        const updatedRange = await DeliveryCharges.findByIdAndUpdate(
            id,
            { 
                isActive,
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        if (!updatedRange) {
            return res.status(404).json({ message: "Delivery range not found" });
        }

        res.json(updatedRange);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Bulk create/update delivery ranges
exports.bulkCreateUpdateDeliveryRanges = async (req, res) => {
    try {
        const { ranges } = req.body;
        
        // Delete all existing ranges
        await DeliveryCharges.deleteMany({});
        
        // Create new ranges
        const newRanges = await DeliveryCharges.insertMany(
            ranges.map(range => ({
                minDistance: range.minDistance,
                maxDistance: range.maxDistance,
                charge: range.charge,
                isActive: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }))
        );
        
        res.status(201).json(newRanges);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Calculate delivery fee
exports.calculateDeliveryFee = async (req, res) => {
    try {
        const { distance } = req.params;
        const parsedDistance = parseFloat(distance);
        
        const applicableRange = await DeliveryCharges.findOne({
            isActive: true,
            minDistance: { $lte: parsedDistance },
            maxDistance: { $gte: parsedDistance }
        });

        if (!applicableRange) {
            return res.status(404).json({ message: "No delivery range found for this distance" });
        }

        res.json({ distance: parsedDistance, deliveryFee: applicableRange.charge });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
