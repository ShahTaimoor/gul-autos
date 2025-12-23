const express = require('express');
const secureUserController = require('../controllers/SecureUserController');
const { isAuthorized } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  signupSchema,
  loginSchema,
  updateProfileSchema
} = require('../validators/secureUserValidators');

const router = express.Router();

router.post(
  '/signup',
  validate(signupSchema),
  secureUserController.signup
);

router.post(
  '/login',
  validate(loginSchema),
  secureUserController.login
);

router.put(
  '/profile',
  isAuthorized,
  validate(updateProfileSchema),
  secureUserController.updateProfile
);

router.post(
  '/logout',
  secureUserController.logout
);

router.get(
  '/profile',
  isAuthorized,
  secureUserController.getProfile
);

module.exports = router;
