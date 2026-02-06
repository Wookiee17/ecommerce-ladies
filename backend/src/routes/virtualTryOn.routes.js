const express = require('express');
const router = express.Router();
const virtualTryOnController = require('../controllers/virtualTryOn.controller');
const upload = require('../middleware/upload.middleware');

router.post(
  '/virtual-try-on',
  upload.fields([
    { name: 'userImage', maxCount: 1 },
    { name: 'productImage', maxCount: 1 },
  ]),
  virtualTryOnController.generate
);

module.exports = router;
