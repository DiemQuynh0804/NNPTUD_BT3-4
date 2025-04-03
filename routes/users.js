var express = require('express');
var router = express.Router();
let userController = require('../controllers/users')
var { CreateSuccessRes, CreateErrorRes } = require('../utils/ResHandler')
let {check_authentication,check_authorization} = require('../utils/check_auth')
let constants = require('../utils/constants')
let {validate,validationCreateUser} = require('../utils/validator')

/* GET users listing. */
router.get('/',check_authentication,check_authorization(constants.ADMIN_PERMISSION), async function (req, res, next) {
  try {
    let users = await userController.GetAllUser();
    CreateSuccessRes(res, 200, users);
  } catch (error) {
    next(error)
  }
});
router.get('/:id',check_authentication,check_authorization(constants.MOD_PERMISSION), async function (req, res, next) {
  try {
    let user = await userController.GetUserById(req.params.id)
    CreateSuccessRes(res, 200, user);
  } catch (error) {
    CreateErrorRes(res, 404, error);
  }
});
router.post('/register', function(req, res) {
  res.json({ message: 'User registered successfully!' });
});

router.post('/',check_authentication,check_authorization(constants.ADMIN_PERMISSION),validationCreateUser,validate, async function (req, res, next) {
  try {
    let body = req.body
    let newUser = await userController.CreateAnUser(body.username, body.password, body.email, body.role);
    CreateSuccessRes(res, 200, newUser);
  } catch (error) {
    next(error);
  }
})

router.put('/:id', async function (req, res, next) {
  try {
    let updateUser = await userController.UpdateUser(req.params.id, req.body);
    CreateSuccessRes(res, 200, updateUser);
  } catch (error) {
    next(error);
  }
})

router.post('/forgot-password', async function (req, res, next) {
  try {
      let user = await userController.GetUserByEmail(req.body.email);
      if (!user) {
          return res.status(404).json({ success: false, message: "User not found" });
      }

      // Tạo token reset mật khẩu (ví dụ đơn giản)
      let resetToken = Math.random().toString(36).substring(2);
      
      // Lưu token vào user (bạn cần thêm field `resetToken` vào schema)
      user.resetToken = resetToken;
      await user.save();

      // Trả về phản hồi
      res.json({ success: true, message: "Reset password link sent", token: resetToken });

  } catch (error) {
      next(error);
  }
});

router.post('/reset-password', async function(req, res, next) {
  try {
    let { token, newPassword } = req.body;
    let userId = await userController.VerifyResetToken(token);
    if (!userId) {
      return CreateErrorRes(res, 400, "Invalid or expired token");
    }

    // Cập nhật mật khẩu mới
    await userController.UpdatePassword(userId, newPassword);

    CreateSuccessRes(res, 200, "Password reset successfully!");
  } catch (error) {
    next(error);
  }
});



module.exports = router;