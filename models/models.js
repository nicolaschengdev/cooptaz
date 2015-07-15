
module.exports = function(mongoose, mongodb_address) {

	mongoose.connect('mongodb://' + mongodb_address + '/cooptaz');

	var module = {};

	var ScoreSchema = mongoose.Schema({
		name: String,
		img_url: String,
		points: Number,
		modified_date: Date,
		install_id: String
	});

	var FeedbackSchema = mongoose.Schema({
		note: Number,
		message: String,
		app_version: String,
		app_build: String,
		created_date: Date,
		contributor_email: String
	});

	var ContributorSchema = mongoose.Schema({
		firstname: String,
		lastname: String,
		email: String,
		unit: String,
		install_id: String
	});

	var ContactSchema = mongoose.Schema({
		civility: String,
		firstname: String,
		lastname: String,
		email: String,
		phone: String,
		zip: String,
		city: String,
		is_colleague: Boolean
	});

	var RecommendationSchema = mongoose.Schema({
		short_id: String,
		
		contributor_firstname: String,
		contributor_lastname: String,
		contributor_email: String,
		contributor_unit: String,
		contributor_install_id: String,

		contact_civility: String,
        contact_firstname: String,
        contact_lastname: String,
        contact_phone: String,
        contact_email: String,
        contact_zip: String,
        contact_city: String,
        contact_is_colleague: String,
		
		submitted_date: Date,
		attributed_date: Date,
		completed_date: Date,
		canceled_date: Date,

		agent_email: String,
		agent_firstname: String,
		agent_lastname: String,
		agent_network_name: String,
		agent_message: String,
		agent_has_contacted: String,

		env: String,
		needs_description: String,
		type_of_callback: String,
		status: String
	});

	/*
	var DispatcherSchema = mongoose.Schema({
		name: String,
		email: String
	});
	*/

	var AgentSchema = mongoose.Schema({
		firstname: String,
		lastname: String,
		email: String,
		network_name: String
	});

	var MessageSchema = mongoose.Schema({
		title: String,
		created_datestring: String,
		message: String,
		//agent_id: mongoose.Schema.Types.ObjectId,
		install_id: String
	});

	module.Score = mongoose.model('Score', ScoreSchema);
	module.Feedback = mongoose.model('Feedback', FeedbackSchema);
	module.Contributor = mongoose.model('Contributor', ContributorSchema);
	module.Contact = mongoose.model('Contact', ContactSchema);
	module.Recommendation = mongoose.model('Recommendation', RecommendationSchema);
	//module.Dispatcher = mongoose.model('Dispatcher', DispatcherSchema);
	module.Agent = mongoose.model('Agent', AgentSchema);
	module.Message = mongoose.model('Message', MessageSchema);

	return module;
}