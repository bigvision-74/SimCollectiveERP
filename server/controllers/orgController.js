const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const path = require("path");
const admin = require("firebase-admin");
const sendMail = require("../helpers/mailHelper");
require("dotenv").config();
const { uploadFile, deleteObject } = require("../services/S3_Services");

exports.createOrg = async (req, res) => {
  const { orgName, email, icon } = req.body;

  if (!orgName && !email) {
    return res
      .status(400)
      .json({ message: "Org name and email are required." });
  }

  async function generateOrganisationId(length = 12) {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  const organisation_id = await generateOrganisationId();

  try {
    const existingOrg = await knex("organisations")
      .where({ org_email: email })
      .first();

    if (existingOrg) {
      return res
        .status(400)
        .json({ message: "Email already associated with an organization" });
    }

    await knex("organisations").insert({
      name: orgName,
      organisation_id: organisation_id,
      org_email: email,
      organisation_icon: icon,
      organisation_deleted: false
    });

    res.status(201).json({ message: "Organisation added successfully" });
  } catch (error) {
    console.error("Error creating organisation:", error);
    res.status(500).json({ message: "Error creating organisation" });
  }
};

exports.getAllOrganisation = async (req, res) => {
  try {
    const organisations = await knex("organisations")
      .select(
        "organisations.*",
        // knex.raw(`
        //   (SELECT COUNT(DISTINCT users.id) 
        //    FROM users 
        //    WHERE users.organisation_id = organisations.id 
        //    AND (users.user_deleted = 0 OR users.user_deleted IS NULL)
        //   ) as user_count
        // `),
        // knex.raw(`
        //   (SELECT COUNT(DISTINCT devices_names.id) 
        //    FROM devices_names 
        //    WHERE devices_names.organisation_id = organisations.id
        //   ) as device_count
        // `),
        // knex.raw(`
        //   (SELECT COUNT(DISTINCT courses1.id) 
        //    FROM courses1 
        //    WHERE courses1.organisation_id = organisations.id 
        //    AND (courses1.course_deleted = 0 OR courses1.course_deleted IS NULL)
        //   ) as course_count
        // `)
      )
      .where(function () {
        this.where("organisation_deleted", "<>", 'deleted')
          .orWhereNull("organisation_deleted")
          .orWhere("organisation_deleted", "");
      })
      .orderBy("organisations.id", "desc");

    res.status(200).send(organisations);
  } catch (error) {
    console.log("Error getting organisations", error);
    res.status(500).send({ message: "Error getting organisations" });
  }
};

exports.deleteOrganisation = async (req, res) => {
  try {
    const ids = req.query.ids;

    if (!ids) {
      return res.status(400).json({ error: "No IDs provided for deletion." });
    }

    const idsArray = Array.isArray(ids) ? ids : ids.split(",");

    const idsToDelete = idsArray.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    if (idsToDelete.length === 0) {
      return res.status(400).json({ error: "Invalid IDs provided for deletion." });
    }
    const result = await knex("organisations").whereIn("id", idsToDelete).update({ organisation_deleted: 'deleted' });

    // await knex("courses1").whereIn("organisation_id", idsToDelete).update({ org_delete: 1 });
    // await knex("users") .whereIn("organisation_id", idsToDelete) .update({ org_delete: 1 });

    if (result > 0) {
      res.status(200).json({ message: "Organisation(s) deleted successfully." });
    } else {
      res.status(404).json({ message: "No organisations found with the provided IDs." });
    }

  } catch (error) {
    console.error("Error deleting organisation:", error);
    res.status(500).json({ message: "An error occurred while deleting the organisation." });
  }
};

exports.getOrg = async (req, res) => {
  try {
    const id = req.params.id;

    const org = await knex("organisations")
      .where(function () {
        this.where("id", id).orWhere("organisation_id", id);
      })
      .andWhere(function () {
        this.where("organisation_deleted", "<>", 'deleted')
          .orWhereNull("organisation_deleted")
          .orWhere("organisation_deleted", "");
      })
      .first();

    if (!org) {
      return res.status(404).json({ message: "Organisation not found." });
    }

    res.status(200).json(org);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching organisation." });
  }
};

exports.editOrganisation = async (req, res) => {
  const { name, organisation_id, org_email, id, organisation_icon } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Organisation ID is required" });
  }

  if (!name || !organisation_id || !org_email) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const dataToUpdate = {
    name,
    org_email,
    updated_at: new Date(),
  };

  if (organisation_icon) {
    const prevData = await knex("organisations").where("id", id).first();
    const key = prevData.organisation_icon.split("/").pop();
    const deleteResult = await deleteObject(key);

    dataToUpdate.organisation_icon = organisation_icon;
  }

  try {
    const updatedRows = await knex("organisations")
      .where({ id })
      .update(dataToUpdate);
    if (updatedRows) {
      res.status(200).json({ message: "Organisation updated successfully" });
    } else {
      res.status(404).json({ error: "Organisation not found" });
    }
  } catch (error) {
    console.error("Error updating organisation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUsersByOrganisation = async (req, res) => {
  try {
    const id = req.params.id;

    const users = await knex("users")
      .where("organisation_id", id)
      .andWhere(function () {
        this.where("user_deleted", "<>", 1)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      })
      .andWhere(function () {
        this.where("org_delete", "<>", 1)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "");
      })
      .andWhere('role', "!=", 'Superadmin')
      .orderBy("users.id", "desc");

    if (!users) {
      return res.status(404).json({ message: "Organisation not found." });
    }

    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching organisation." });
  }
};

