const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await knex("users").where({ uemail: email }).first();
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.user_deleted == 1) {
      return res.status(400).send({ message: "User account has been deleted" });
    }

    if (user.org_delete == 1) {
      return res.status(400).send({ message: "Organisation has been deleted" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    // const token = generateToken(user);
    // const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined;

    res.status(200).send({
      message: "Login successful",
      email: email ,
    });
  } catch (error) {
    console.log("Error in logging in user:", error);
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
