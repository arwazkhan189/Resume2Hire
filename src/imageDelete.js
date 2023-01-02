const key = require("../key.json");
const errorHandler = require("../src/errorhandler");
const { getStorage, ref, deleteObject } = require("firebase/storage");
const storage = getStorage();

exports.imageDelete = async (imageUrl) => {
  try {
    //get imageName from iamge url
    const imageName = imageUrl.split("%2F", 2)[1].split("?")[0];

    //get image path
    const storageRef = ref(storage, key.storageImagePath + imageName);

    //delete image
    await deleteObject(storageRef);
  } catch (error) {
    console.log(error);
  }
};
