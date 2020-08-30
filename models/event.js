var mongoose = require("mongoose");

var EventSchema = new mongoose.Schema({
	title: { type : String , unique : false },
	groupId: { type: String },
	start: { type : String , unique : false },
	end: { type : String , unique : false }
});

module.exports = mongoose.model("Event", EventSchema);