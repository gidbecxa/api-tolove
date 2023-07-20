const { TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = require("./configEnv");
const twilio = require("twilio");

/* const twilioClient = twilio(
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    { accountSid: TWILIO_ACCOUNT_SID }
); */

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

module.exports = twilioClient;