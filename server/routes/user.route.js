import {Router} from 'express'
import { registeruserController,verifyEmailController,loginController } from '../controllers/user.controller.js'

const userRouter = Router()

userRouter.post('/register',registeruserController)
userRouter.post('/verify-email',verifyEmailController)
userRouter.post('/login',loginController)

export default userRouter