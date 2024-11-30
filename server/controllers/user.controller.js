import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import sendEmail from '../config/sendEmail.js'
import verifyEmailtemplate from '../utils/verifyEmailTemplate.js'
import generateAccessToken from '../utils/generateAccessToken.js'
import generateRefreshToken from '../utils/generateRefreshToken.js'
export async function registeruserController(req,res){

try{

    const {name , email,password} = req.body

    if(!name  || !email || !password ){
        return res.status(400).json({
            message :"Fill all the fields ",
            error : true,
            success : false
        })
    }

const user = await UserModel.findOne({email})
if(user){
    return res.json({
        message : "Already registered email ",
        error : true,
        success : false 
    })
}

const salt = await bcryptjs.genSalt(10)
const hashPassword = await bcryptjs.hash(password,salt)

const payLoad = {
    name, 
    email,
     password : hashPassword
}
const newuser =new UserModel(payLoad)

const save = await newuser.save()

const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

const verifyEmail = await sendEmail({
    sendTo : email, 
    subject : "Verification  Email from MERN",
    html : verifyEmailtemplate({
        name,
        url : verifyEmailUrl
    })

})

return res.json({

    message : "User Registered Successfully",
    error : false,
    success : true,
    data : save
})


}catch(error){


    return res.status(500).json({
        message : error.message || error,
        error : true,
        success : false
    })
}

}

export async function verifyEmailController(req,res){

    try{
        const {code }= req.body

        const user = await  UserModel.findOne({_id : code})
        if(!user){
           return res.status(400).json({
                message : "Invalid Code",
                error : true,
                success : false
            })
        }
        const updateUser = await UserModel.updateOne({ _id : code }, {verify_email : true})
        return res.json({

            message : "verification of email done",
            success : true,
            error : false
        })


    }catch(error){
        return res.status(500).json({

            message : error.message || error,
            error : true,
            success : true

        })
    }
}

//logincontroller

export async function loginController(req,res){

    try{

        const {email,password } = req.body


        if(!email || !password ){

            return res.status(400).json({
                message : " Provide email and password",
                success : false,
                error : true
            })
        }
        const user = await UserModel.findOne({email})
        if(!user){

            return res.status(500).json({
                message : "User not registered ",
                success : false,
                error : true
            })
        }
        if(user.status != "Active"){
            return res.status(400).json({
                message : "Contact Admin ",
                error : true,
                success : false
            })
        }
        const checkPassword = await bcryptjs.compare(password , user.password)
        if(!checkPassword){
            return res.status(400).json({
                message : "Check Password",
                success : false,
                error : true
            })
        }
        console.log(user._id)

        const accessToken = await generateAccessToken(user._id)
        const refreshToken = await generateRefreshToken(user._id)


            const cookiesOption = {
                httpOnly : true , 
                secure : true,
                sameSite : "None"
            }
        res.cookie('accesToken', accessToken,cookiesOption)
        res.cookie('refreshToken', refreshToken,cookiesOption)
        return res.status(200).json({
            message : "Login Successful ",
            error : false , 
            success : true,
            data : {
                accessToken,
                refreshToken
            }
        })


    }catch(error){

        return res.status(500).json({
            message : error.message || error ,
            success : false,
             error : true
        })
    }
}


export async function logoutController(req,res) {
    try{
        const cookieOption = {
            httpOnly : true , 
            secure : true,
            sameSite : "None"
        }
res.clearCookie('accessToken',cookieOption)
res.clearCookie('refreshToken',cookieOption)


return res.json({
    message : "Log out sduccessfully ",
    error : false , 
    success : true
})

    }
    catch(error){
        return res.status(500).json({
            message : error.message || error ,
            success : true,
            error : false  
        })
    }
}