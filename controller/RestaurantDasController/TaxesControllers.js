const Tax = require("../../models/RestaurantsDasModel/Taxes.js");

// Utility function for calculation order
const getCalculationOrder = (type) => {
    switch (type) {
        case "gst":
            return 1;
        case "state":
            return 3;
        case "municipal":
            return 4;
        default:
            return 5;
    }
};


exports.getTaxes = async (req, res) => {
    try {
        // Populate category and subCategory references if needed
        const taxes = await Tax.find().populate("category subCategory");
        res.json(taxes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTaxById = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id).populate("category subCategory");
        if (!tax) {
            return res.status(404).json({ message: "Tax not found" });
        }
        res.json(tax);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTax = async (req, res) => {
    try {
        const {
            name,
            rate,
            type,
            applicableFor,
            effectiveFrom,
            effectiveTo,
            exemptions,
            category,
            subCategory,
        } = req.body;

        // Validate required fields
        if (!name || rate <= 0 || !effectiveFrom) {
            return res
                .status(400)
                .json({ message: "Please provide a valid tax name, rate and effectiveFrom date" });
        }
        if (effectiveTo && new Date(effectiveFrom) > new Date(effectiveTo)) {
            return res
                .status(400)
                .json({ message: "Effective from date must be before effective to date" });
        }

        const tax = new Tax({
            name,
            rate,
            type,
            applicableFor,
            effectiveFrom,
            effectiveTo: effectiveTo || null,
            exemptions: exemptions || [],
            category: category || null,
            subCategory: subCategory || null,
            isApplicable: true,
            isDefault: false,
            isCompulsory: type === "gst",
            calculationOrder: getCalculationOrder(type),
        });

        const savedTax = await tax.save();
        res.status(201).json(savedTax);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ message: "Tax not found" });
        }
        // Prevent editing default taxes
        if (tax.isDefault) {
            return res.status(403).json({ message: "Default taxes cannot be edited" });
        }

        const {
            name,
            rate,
            type,
            applicableFor,
            effectiveFrom,
            effectiveTo,
            exemptions,
            category,
            subCategory,
        } = req.body;

        if (!name || rate <= 0 || !effectiveFrom) {
            return res
                .status(400)
                .json({ message: "Please provide a valid tax name, rate and effectiveFrom date" });
        }
        if (effectiveTo && new Date(effectiveFrom) > new Date(effectiveTo)) {
            return res
                .status(400)
                .json({ message: "Effective from date must be before effective to date" });
        }

        // Update fields
        tax.name = name;
        tax.rate = rate;
        tax.type = type;
        tax.applicableFor = applicableFor;
        tax.effectiveFrom = effectiveFrom;
        tax.effectiveTo = effectiveTo || null;
        tax.exemptions = exemptions || [];
        tax.category = category || null;
        tax.subCategory = subCategory || null;
        tax.calculationOrder = getCalculationOrder(type);
        tax.isCompulsory = type === "gst";

        const updatedTax = await tax.save();
        res.json(updatedTax);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ message: "Tax not found" });
        }
        if (tax.isDefault) {
            return res.status(403).json({ message: "Default taxes cannot be deleted" });
        }
        // await tax.remove();
        await Tax.findByIdAndDelete(req.params.id); 
        res.json({ message: "Tax deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ message: "Tax not found" });
        }
        if (tax.isCompulsory) {
            return res
                .status(403)
                .json({ message: "Compulsory taxes cannot be toggled" });
        }
        tax.isApplicable = !tax.isApplicable;
        const updatedTax = await tax.save();
        res.json(updatedTax);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};