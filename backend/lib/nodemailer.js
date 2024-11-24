import nodemailer from 'nodemailer';
import { globalConfig } from '../utils/config.js';
import { SMTPClient } from 'emailjs';

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'deeps2657@gmail.com',
      pass: 'gxsxlcbanlsbikxe',
    },
  });

// export const client = new SMTPClient({
//   user : globalConfig.nodemailerUser,
//   password : globalConfig.nodemailerPass,
//   host : 'smtp.gmail.com',
//   ssl : true
// })

