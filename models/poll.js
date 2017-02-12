var mongoose = require('mongoose'); 

var pollSchema = new mongoose.Schema({
	name: String,
	items: [
		 {
			label: String, 
			voteTotal: {type: Number, default: 0}
		}
	], 
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId, 
			ref: "User"
		}, 
		username: String
	}, 
	date_created: Date, 
	ips: [String]
});

module.exports = mongoose.model("Poll", pollSchema);