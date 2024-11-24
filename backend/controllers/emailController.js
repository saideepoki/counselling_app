import { transporter } from "../lib/nodemailer.js";

export const sendPasscodeEmail = async (req , res) => {
    const {email, subject, text} = req.body;
    try {
        const mailOptions = {
            to: email,
            subject: subject,
            text: text,
        };

        const response = await transporter.sendMail(mailOptions);
        console.log(response);
        return res.status(200).json({
            message: 'message sent successfully'
        })
        }
        catch (error) {
        console.error('Error sending email:',error);
        return res.status(500).json({
            message: 'error sending message'
        })
    }
}