/*------------------------------------
Express Config
--------------------------------------*/
const express = require("express");
const app = express();

/*------------------------------------
Firebase Config
--------------------------------------*/
const key = require("./key.json");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
initializeApp({
  credential: cert(key),
});
const db = getFirestore();

/*--------------------------------------------
External Functions
----------------------------------------------*/
const { addUser, authenticate, signout } = require("./src/user_service");
const errorHandler = require("./src/errorhandler");
const { requireAuth, checkUser } = require("./src/authMiddleware");
const { imageUpload } = require("./src/imageUpload");
const { imageDelete } = require("./src/imageDelete");

/*--------------------------------------
MiddleWares
----------------------------------------*/
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 8080;
const Multer = require("multer");
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, //2mb
  },
  extended: true,
});

const pdfparse = require("pdf-parse");
const pdfMulter = Multer({ dest: "uploads/", storage: Multer.memoryStorage() });

//-----------paths---------------------------
const path = require("path");
const staticPath = path.join(__dirname, "/public");
const templatePath = path.join(__dirname, "/templates");

//--------use & sets-------------------------------
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.static(staticPath));
//app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

//--------------------jwt-------------------------------
const jwt = require("jsonwebtoken");
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "resume2hire", {
    expiresIn: maxAge,
  });
};

/*-------------------------------------------
Endpoints
--------------------------------------------*/
//checkuser
app.get("*", checkUser);

//*-----------------------Home---------------------------------
app.get("/", async (req, res) => {
  res.sendFile(staticPath + "/home/index.html");
});

//----------------------Authentication----------------------------
//signup (get)
app.get("/signup", async (req, res) => {
  res.sendFile(staticPath + "/signup.html");
});

//signup (post)- create account
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResponse = await addUser(email, password);
    const token = createToken(email);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json(userResponse.user);
  } catch (error) {
    res.status(400).json({ error: errorHandler.handleErrors(error) });
  }
});

//signin (get)
app.get("/signin", async (req, res) => {
  res.sendFile(staticPath + "/signin.html");
});

//signin (post) - to account
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResponse = await authenticate(email, password);
    const token = createToken(userResponse.user.email);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json(userResponse.user);
  } catch (error) {
    res.status(400).json({ error: errorHandler.handleErrors(error) });
  }
});

//signout (get)
app.get("/signout", requireAuth, async (req, res) => {
  await signout
    .then(() => {
      res.cookie("jwt", "", { maxAge: 1 });
      res.status(200).send("OK");
    })
    .catch((error) => {
      res.status(400).json({ error: errorHandler.handleErrors(error) });
    });
});

//----------------------Hiring ----------------------------
//hiring (get)
app.get("/hiring", requireAuth, async (req, res) => {
  try {
    const jobPostsRef = db.collection("JobPosts");
    const jobPostedBy = jwt.verify(req.cookies.jwt, "resume2hire").id;
    const response = await jobPostsRef
      .where("jobPostedBy", "==", jobPostedBy)
      .get();
    let responseArray = [];
    response.forEach((doc) => {
      responseArray.push(doc.data());
    });
    res.render(templatePath + "/hiring.hbs", {
      jobposts: responseArray.reverse(),
    });
  } catch (error) {
    res.status(400).json({ error: errorHandler.handleErrors(error) });
  }
});

//add job post (get)
app.get("/addJobPost", requireAuth, async (req, res) => {
  res.sendFile(staticPath + "/addJobPost.html");
});

//image upload (post)
app.post(
  "/uploadCompanyLogo",
  requireAuth,
  multer.single("companyLogo"),
  imageUpload
);

//add job post (post)
app.post("/addJobPost", requireAuth, async (req, res) => {
  try {
    const jobPostId = `${
      jwt.verify(req.cookies.jwt, "resume2hire").id
    }_${Date.now()}`;
    const jobPostJson = {
      jobPostedBy: jwt.verify(req.cookies.jwt, "resume2hire").id,
      jobPostId: jobPostId,
      jobTitle: req.body.jobTitle,
      jobId: req.body.jobId,
      companyName: req.body.companyName,
      companyLogoUrl: req.body.companyLogoUrl,
      jobType: req.body.jobType,
      jobFunction: req.body.jobFunction,
      jobLocation: req.body.jobLocation,
      jobMode: req.body.jobMode,
      salary: req.body.salary,
      experienceLevel: req.body.experienceLevel,
      yearOfExperience: req.body.yearOfExperience,
      skillsRequired: req.body.skillsRequired,
      emailHR: req.body.emailHR,
      hiringLink: req.body.hiringLink,
      jobDescription: req.body.jobDescription,
    };
    const response = await db
      .collection("JobPosts")
      .doc(jobPostId)
      .set(jobPostJson);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: errorHandler.handleErrors(error) });
  }
});

//edit job post (get)
app.get("/editJobPost/:id", requireAuth, async (req, res) => {
  try {
    const jobPostRef = db.collection("JobPosts").doc(req.params.id);
    const response = await jobPostRef.get();
    res.render(templatePath + "/editJobPost.hbs", response.data());
  } catch (error) {
    res.send("error: " + error);
  }
});

//edit a job post(put)
app.post("/editJobPost/:id", requireAuth, async (req, res) => {
  try {
    const jobPostJson = {
      jobTitle: req.body.jobTitle,
      jobId: req.body.jobId,
      companyName: req.body.companyName,
      jobType: req.body.jobType,
      jobLocation: req.body.jobLocation,
      jobFunction: req.body.jobFunction,
      experienceLevel: req.body.experienceLevel,
      jobMode: req.body.jobMode,
      salary: req.body.salary,
      yearOfExperience: req.body.yearOfExperience,
      skillsRequired: req.body.skillsRequired,
      emailHR: req.body.emailHR,
      hiringLink: req.body.hiringLink,
      jobDescription: req.body.jobDescription,
    };
    const response = await db
      .collection("JobPosts")
      .doc(req.params.id)
      .update(jobPostJson);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: errorHandler.handleErrors(error) });
  }
});

//delete a job post (delete)
app.post("/deleteJobPost/:id", requireAuth, async (req, res) => {
  try {
    imageDelete(req.body.imageUrl);
    const response = await db
      .collection("JobPosts")
      .doc(req.params.id)
      .delete();
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: errorHandler.handleErrors(error) });
  }
});

//---------------------Jobs---------------------------------
// read all job posts
app.get("/readJobPost/all", async (req, res) => {
  try {
    const jobPostsRef = db.collection("JobPosts");
    const response = await jobPostsRef.get();
    let responseArray = [];
    response.forEach((doc) => {
      responseArray.push(doc.data());
    });
    res.render(templatePath + "/jobs.hbs", {
      jobposts: responseArray.reverse(),
    });
  } catch (error) {
    res.send("error: " + error);
  }
});

// read  job post by id
app.get("/readJobPost/:id", async (req, res) => {
  try {
    const jobPostRef = db.collection("JobPosts").doc(req.params.id);
    const response = await jobPostRef.get();
    res.render(templatePath + "/jobpost.hbs", response.data());
  } catch (error) {
    res.send("error: " + error);
  }
});

//----------------------Screening-----------------------------
app.get("/screening", async (req, res) => {
  res.sendFile(staticPath + "/screening.html");
});

/*---------------------------------
extract resume text
------------------------------------*/
app.post("/extractResumeText", pdfMulter.single("resume"), async (req, res) => {
  if (!req.file) {
    res.sendStatus(400);
    res.end();
  }
  await pdfparse(req.file.buffer).then((result) => {
    res.send(result.text);
  });
});

/*---------------------------------
app listen
------------------------------------*/
app.listen(PORT, () => {
  console.log(`Server is running on PORT http://localhost:${PORT}`);
});
