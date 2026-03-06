const express = require("express");
const {
  resgiterUser,
  loginUser,
  refreshTokenUser,
} = require("../controllers/identity-controller");

const router = express.Router();

router.post("/register", resgiterUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshTokenUser);


module.exports = router;