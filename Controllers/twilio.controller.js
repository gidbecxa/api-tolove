const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SECRET, TWILIO_API_KEY_SID } = require("../configEnv");
const logger = require("../logger");
const twilioClient = require("../twilioClient");

const { v4: uuidv4 } = require("uuid");
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;


const findOrCreateRoom = async (roomName) => {
    try {
        // see if the room exists already. If it doesn't, this will throw
        // error 20404.
        await twilioClient.video.v1.rooms(roomName).fetch();
    } catch (error) {
        // the room was not found, so create it
        if (error.code === 20404) {
            await twilioClient.video.v1.rooms.create({
                uniqueName: roomName,
                type: "go",
            });
        } else {
            // let other errors bubble up
            // throw error;
            logger.error(error);
        }
    }
};

const getAccessToken = (roomName) => {
    // create an access token
    const token = new AccessToken(
        TWILIO_ACCOUNT_SID,
        TWILIO_API_KEY_SID,
        TWILIO_API_KEY_SECRET,
        // generate a random unique identity for this participant
        { identity: uuidv4() }
    );
    // create a video grant for this specific room
    const videoGrant = new VideoGrant({
        room: roomName,
    });

    // add the video grant
    token.addGrant(videoGrant);
    // serialize the token and return it
    return token.toJwt();
};

module.exports = {
    joinRoom: async (req, res) => {
        console.log(req.body);
        // return 400 if the request has an empty body or no roomName
        if (!req.body || !req.body.roomName) {
            return res.status(400).send("Must include roomName argument.");
        }

        const roomName = req.body.roomName;
        // find or create a room with the given roomName
        await findOrCreateRoom(roomName);
        // generate an Access Token for a participant in this room
        const token = getAccessToken(roomName);
        console.log("Token generated for joining video room:", token);

        res.send({
            token: token,
        });
    },
}