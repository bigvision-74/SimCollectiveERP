const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

// exports.Login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await knex("users").where({ uemail: email }).first();
//     if (!user) {
//       return res.status(404).send({ message: "User not found" });
//     }

//     if (user.user_deleted == 1) {
//       return res.status(400).send({ message: "User account has been deleted" });
//     }

//     if (user.org_delete == 1) {
//       return res.status(400).send({ message: "Organisation has been deleted" });
//     }

//     const isValid = await bcrypt.compare(password, user.password);
//     if (!isValid) {
//       return res.status(401).send({ message: "Invalid email or password" });
//     }

//     // const token = generateToken(user);
//     // const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined;

//     res.status(200).send({
//       message: "Login successful",
//       email: email ,
//     });
//   } catch (error) {
//     console.log("Error in logging in user:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Fetch user by email
    const user = await knex("users").where({ uemail: email }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Check if user or organisation is deleted
    if (user.user_deleted == 1) {
      return res.status(400).json({ message: "User account has been deleted" });
    }

    if (user.org_delete == 1) {
      return res.status(400).json({ message: "Organisation has been deleted" });
    }

    // 4. Check user role
    if (user.role !== "User") {
      return res.status(403).json({ message: "Access denied: not a user" });
    }

    // 5. Validate password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Email and password do not match" });
    }

    // 6. Successful login
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        username: user.username,
        uemail: user.uemail,
        role: user.role,
        verification_code: user.verification_code,
        user_thumbnail: user.user_thumbnail,
        organisation_id: user.organisation_id,
      }
    });
  } catch (error) {
    console.error("Error in logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getAllPatients = async (req, res) => {
  try {
    const patientRecords = await knex("patient_records")
      .select("patient_records.*")
      // .where("type", "private")
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .orderBy("id", "desc");

    res.status(200).send(patientRecords);
  } catch (error) {
    console.log("Error in fetching patients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPatientReport = async (req, res) => {
  try {
  } catch (error) {
    console.log("Error in fetching patient report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
