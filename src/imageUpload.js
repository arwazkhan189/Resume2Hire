const key = require("../key.json");
const jwt = require("jsonwebtoken");
const errorHandler = require("../src/errorhandler");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const storage = getStorage();

const imageUpload = async (req, res) => {
  try {
    const companyLogo = req.file;

    //name formatting
    const timestamp = Date.now();
    const tempName = jwt.verify(req.cookies.jwt, "resume2hire").id;
    const name = tempName.split("@")[0];
    const type = companyLogo.originalname.split(".")[1];
    const imageName = `${name}_${timestamp}.${type}`;
    const metaData = {
      contentType: `image/${type}`,
    };

    //image path setup
    const storageRef = ref(storage, key.storageImagePath + imageName);

    //image uplaod
    await uploadBytes(storageRef, companyLogo.buffer, metaData);

    //get image url
    const imageUrl = await getDownloadURL(storageRef);
    res.status(200).json({ imageUrl: imageUrl });
  } catch (error) {
    res.status(400).json({ error: errorHandler.handleErrors(error) });
  }
};

module.exports = { imageUpload };
