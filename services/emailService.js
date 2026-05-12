const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Creates the transporter based on environment variables.
 * Prioritizes Gmail if credentials exist, else falls back to Ethereal for testing.
 */
const createTransporter = () => {
    // 1. Gmail Production Setup (Forced if credentials exist)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // use STARTTLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            logger: true,
            debug: true,
        });
    }

    // 2. Ethereal Testing Fallback (Only if no credentials provided)
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'mose.bechtelar30@ethereal.email',
            pass: '6JzYJ7yXwXf87yXwXf',
        },
    });
};

exports.sendEmail = async ({ to, subject, html }, retries = 3) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const transporter = await createTransporter();
            const info = await transporter.sendMail({
                from: `"Connect Platform" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                attachments: [{
                    filename: 'logo.png',
                    path: path.join(__dirname, '../../connect-frontend/public/logo.png'),
                    cid: 'connectlogo'
                }]
            });

            console.log('----------------------------------------------------');
            console.log(`📧 Email Dispatched to: ${to} (Attempt ${attempt + 1})`);
            console.log(`📡 Subject: ${subject}`);
            console.log('----------------------------------------------------');

            return info;
        } catch (error) {
            attempt++;
            console.warn(`⚠️ Email Dispatch Failed (Attempt ${attempt}/${retries}). Retrying in ${attempt * 2}s...`);
            console.error('❌ Error Details:', error.message);
            
            if (attempt >= retries) {
                console.error('❌ Max retries reached. Email failed permanently for:', to);
                return null;
            }
            // Exponential backoff: 2s, 4s, 6s...
            await new Promise(res => setTimeout(res, attempt * 2000));
        }
    }
};
