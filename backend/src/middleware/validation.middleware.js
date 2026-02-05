const { validationResult } = require('express-validator');

exports.validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Return first error message
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    };
};

exports.reviewValidation = []; // Placeholder export if specific validation arrays are expected but not defined elsewhere
