const multer = require("multer");

const storage = multer.diskStorage({
  destination: "./media",
  filename: (req, file, cb) => {
    cb(null, `${+new Date()}${file.originalname}`);
  },
});

// Initialize upload variable
const upload = multer({
  storage,
});

module.exports = upload;
