const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
// const { exec } = require("child_process");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
app.set("view engine", "ejs");

const videoUploadDir = "public/storage/upload";
const videoProcessedDir = "public/storage/processed";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb("Please upload only videos.", false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100000000, // 100000000 Bytes = 100 MB
  },
});

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/video/process", upload.single("file"), async (req, res) => {
  try {
    const text = req.body.text;
    const video = req.file.filename;
    const videoPath = req.file.path;
    const videoName = req.file.filename.split(".")[0];
    const videoExtension = req.file.filename.split(".")[1];
    const videoOutput = `${videoProcessedDir}/${videoName}-output.${videoExtension}`;

    const videoOutputUrl = `/storage/processed/${videoName}-output.${videoExtension}`;
    const x = 10;
    const y = 10;
    const font = "font.ttf";
    const fontColor = "ffcc00";
    const fontSize = 40;

    try {
      // add text to video
      const { stdout, stderr } = await exec(
        `ffmpeg -i ${videoPath} -vf drawtext="fontfile=${font}:fontsize=${fontSize}:shadowx=2:shadowy=2:fontcolor=${fontColor}:x=1${x}:y=${y}:text='${text}'" ${videoOutput}`
      );
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    } catch (error) {
      console.error(error);
    }

    res.render("processed", { video: videoOutputUrl });
  } catch (error) {
    throw error;
  }
});

const port = process.env.PORT || 3000;
app.listen(Number(port), () => console.log(`Listening on port ${port}`));
