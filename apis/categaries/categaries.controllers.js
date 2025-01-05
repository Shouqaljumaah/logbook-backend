const Categaries = require("../../models/Categories");

exports.getController = async (req, res) => {
  try {
    const categaries = await Categaries.find().populate("");
    res.json(categaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.newCategaryController = async (req, res) => {
  try {
    const newCategaries = await Categaries.create(req.body);
    res.status(201).json(newCategaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletenewCategaryController = async (req, res) => {
  const { categariestId } = req.params;
  try {
    const foundCategaries = await Categaries.findById(categariestId);
    if (foundCategaries) {
      await foundCategaries.deleteOne();
      res.status(204).json();
    } else {
      res.status(404).json({ message: "not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatenewCategaryController = async (req, res) => {
  const { categariestId } = req.params;
  try {
    const foundCategaries = await Categaries.findById(categariestId);
    if (foundCategaries) {
      await foundCategaries.updateOne(req.body);
      res.status(200).json({ message: "categaries Updated Successfully" });
    } else {
      res.status(404).json({ message: "categaries not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
