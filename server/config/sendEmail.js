import { Resend } from 'resend';

import dotenv from 'dotenv'
dotenv.config()


if(process.env.RESEND_API){
    console.log("RESEND API  NOT PROVIDED ");
}

const resend = new Resend(process.env.RESEND_API);

const sendEmail =async ({sendTo,subject,html})=>{
    try {
        const { data, error } = await resend.emails.send({
            from: 'MERN <onboarding@resend.dev>',
            to: sendTo,
            subject: subject,
            html: html,
          });
          if (error) {
            return console.error({ error });
          }
        console.log("Email sent")
          return data
    }
    catch(error){
        console.log(error);
    }
}

export default sendEmail