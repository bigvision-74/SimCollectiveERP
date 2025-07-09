const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");

const {
  allArchiveData,
  permanentDelete,
  recoverData,
  updateDataOrg,
  updateLessonModule,
  getAllVideoModules,
  updateModuleCourse
} = require("../controllers/archiveController");

router.get("/allArchiveData", authenticate, allArchiveData);
router.delete("/permanentDelete", authenticate, permanentDelete);
router.put("/recoverData", authenticate, recoverData);
router.put("/updateDataOrg", authenticate, updateDataOrg)
router.put("/updateModuleCourse", authenticate, updateModuleCourse)
router.put("/updateLessonModule", authenticate, updateLessonModule)
router.get("/getAllVideoModules", authenticate, getAllVideoModules)

module.exports = router;
