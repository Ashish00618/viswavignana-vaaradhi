const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
    logger.error(`Error: ${error.message}`);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
};

module.exports = errorHandler;