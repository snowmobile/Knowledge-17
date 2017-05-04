// MARK: - User Stuff

function createUsersIfNeeded(users) {
	users.forEach(function(user) {
		var gr = new GlideRecord('sys_user');
		gr.addQuery('user_name', user.userName);
		gr.query();

		var hadNext = gr.next();

		if (!hadNext) {
			gr.initialize();
		}

		gr.user_name = user.userName;
		gr.first_name = user.firstName;
		gr.last_name = user.lastName;

		var department = new GlideRecord('cmn_department')
	    department.addQuery('name', 'Mobile');
	    department.query();
	    department.next();

	    if (user.userName !== 'admin') {
	    	gr.department = department.sys_id;
	    }

		if (!hadNext) {
			gr.insert();
			gs.log('Added User: ' + user.userName);
		} else {
			gs.log('Updated User: ' + user.userName);
			gr.update();
		}
	});
}

function addUserPhotos(users) {
	users.forEach(function(user) {
		var gr = new GlideRecord('sys_user');
		gr.addQuery('user_name', user.userName);
		gr.query();

		if (!gr.next()) {
			return;
		}

		updateProfilePhoto(gr);
	});
}

function removeOldLiveProfilesAndPhotos(users) {
	users.forEach(function(user) {
		var gr = new GlideRecord('sys_user');
		gr.addQuery('user_name', user.userName);
		gr.query();

		if (!gr.next()) {
			return;
		}

		removeOldLiveProfilesForUser(gr);
	});
}

function removeOldLiveProfilesForUser(userGR) {
	var userSysID = userGR.sys_id;
	var profile = new GlideRecord('live_profile')
    profile.addQuery('table', 'sys_user');
    profile.addQuery('document', userSysID);
    profile.query();

    while (profile.next()) {
    	var profileID = profile.sys_id;

    	profile.deleteRecord();

    	var attachmentGR = new GlideRecord('sys_attachment')
	    attachmentGR.addQuery('table_name', 'ZZ_YYlive_profile');
	    attachmentGR.addQuery('file_name', 'photo');
	    attachmentGR.addQuery('table_sys_id', profileID);
	    attachmentGR.query();

	    while (attachmentGR.next()) {
	    	attachmentGR.deleteRecord();
	    }
    }
}

function liveProfileIDForUser(userGR) {
	var userSysID = userGR.sys_id;
	var profile = new GlideRecord('live_profile')
    profile.addQuery('table', 'sys_user');
    profile.addQuery('document', userSysID);
    profile.query();

    if (!profile.next()) {
    	profile.initialize();
    	profile.name = userGR.first_name + ' ' + userGR.last_name;
    	profile.type = 'user';
    	profile.document = userSysID;
    	profile.table = 'sys_user';
    	profile.insert();
    }

    var profileID = profile.sys_id;

    return profileID;
}

function updateProfilePhoto(userGR) {
	var profileID = liveProfileIDForUser(userGR);
	var userName = userGR.user_name;

  try {
    var request  = new sn_ws.RESTMessageV2();        
    request.setHttpMethod('get');

    var table = 'live_profile';
    var filename = userName + '.png';

    request.setEndpoint('https://github.com/snowmobile/Knowledge-17/raw/master/assets/' + filename);        
    request.saveResponseBodyAsAttachment(table, profileID, filename);

    var response = request.execute();        
    var httpResponseStatus = response.getStatusCode();  

    var error = response.getErrorMessage();
    if (error) {
    	gs.error(error);
    }
      
    gs.log('Status: ' + httpResponseStatus + ' for ' + filename);

    // Update new attachment to the stupid ZZ_YY table magic
    // This allows it to be a "user" photo and not just an attachment on the record

    var gr = new GlideRecord('sys_attachment')
    gr.addQuery('table_name', table);
    gr.addQuery('file_name', filename);
    gr.addQuery('table_sys_id', profileID);
    gr.query();

    if (gr.next()) {
    	gr.table_name = 'ZZ_YY' + gr.table_name;
    	gr.file_name = 'photo';
    	gr.update();
    }

  } catch(ex) {
  	var message  = ex.getMessage();        
    gs.error(message);    
  }

}

function createMobileDepartmentIfNeeded() {
	var gr = new GlideRecord('cmn_department')
    gr.addQuery('name', 'Mobile');
    gr.query();

    var hadNext = gr.next();

    if (!hadNext) {
    	gr.initialize()
    }

    gr.name = 'Mobile';
    gr.id = '8888';

    if (hadNext) {
    	gr.update();
    } else {
    	gr.insert();
    }

    return gr.sys_id;
}

// MARK: Main

var users = [
	{
		userName: 'mark.grossman',
		firstName: 'Mark',
		lastName: 'grossman'
	},
	{
		userName: 'michael.borowiec',
		firstName: 'Michael',
		lastName: 'Borowiec'
	},
	{
		userName: 'daniel.whiting',
		firstName: 'Daniel',
		lastName: 'Whiting'
	},
	{
		userName: 'jerry.jones',
		firstName: 'Jerry',
		lastName: 'Jones'
	},
	{
		userName: 'tim.paulman',
		firstName: 'Tim',
		lastName: 'Paulman'
	},
	{
		userName: 'brian.zimmerman',
		firstName: 'Brian',
		lastName: 'Zimmerman'
	},
	{
		userName: 'aaron.shoal',
		firstName: 'Aaron',
		lastName: 'Shoal'
	},
	{
		userName: 'bob.mason',
		firstName: 'Bob',
		lastName: 'Mason'
	},
	{
		userName: 'daniel.cascais',
		firstName: 'Daniel',
		lastName: 'Cascais'
	},
	{
		userName: 'sunee.waleetorn',
		firstName: 'Sunee',
		lastName: 'Waleetorncheepsawat'
	},
	{
		userName: 'zahara.jivani',
		firstName: 'Zahara',
		lastName: 'Jivani'
	},
	{
		userName: 'will.lisac',
		firstName: 'Will',
		lastName: 'Lisac'
	},
	{
		userName: 'admin',
		firstName: 'System',
		lastName: 'Administrator'
	}
]

createMobileDepartmentIfNeeded();
createUsersIfNeeded(users);
removeOldLiveProfilesAndPhotos(users);

addUserPhotos(users);






















// MARK: - Helpers

function userSysIDForUserName(userName) {
	var gr = new GlideRecord('sys_user');
	gr.addQuery('user_name', userName);
	gr.query();
	if (gr.next()) {
		return gr.sys_id;
	}
	return null;
}

// MARK: - Favorites

function resetFavoritesForUserID(userID) {
	var gr = new GlideRecord('sys_ui_bookmark');
	gr.addQuery('user', userID);
	gr.query();
	gr.deleteMultiple();
}

function addFavoritesForUserID(favorites, userID) {
	favorites.forEach(function(favorite, index) {
		var gr = new GlideRecord('sys_ui_bookmark');
		gr.user = userID;
		gr.title = favorite.title;
		gr.url = favorite.url;
		gr.icon = favorite.icon;
		gr.color = favorite.color;
		gr.order = index;
		gr.insert();
	});
}

function addVisualizationsForUserID(visualizations, userID) {
	visualizations.forEach(function(visualization, index) {
		var favorite = new GlideRecord('sys_ui_bookmark');
		favorite.addQuery('user', userID);
		favorite.addQuery('title', visualization.favoriteName);
		favorite.query();

		if (!favorite.next()) {
			gs.log('Failed for find favorite with name: ' + visualization.favoriteName);
			return;
		}

		var gr = new GlideRecord('sys_ui_mobile_visualization');
		gr.user = userID;
		gr.document_table = 'sys_ui_bookmark';
		gr.document = favorite.sys_id;
		gr.type = visualization.type;
		gr.group_by_column = visualization.groupByColumn;
		gr.insert();
	});
}

// MARK: - Visualizations

function resetVisualizationsForUserID(userID) {
	var gr = new GlideRecord('sys_ui_mobile_visualization');
	gr.addQuery('user', userID);
	gr.query();
	gr.deleteMultiple();
}

var userFavoriteSysID = userSysIDForUserName('michael.borowiec');
var departmentSysID = createMobileDepartmentIfNeeded()

// MARK: Main

var favorites = [
	{
		title: 'Active',
		url: '/incident_list.do?sysparm_clear_stack=true&sysparm_query=active%3Dtrue%5EORDERBYDESCopened_at',
		color: 'fuschia',
		icon: 'list'
	},
	{
		title: 'Critical',
		url: '/incident_list.do?sysparm_clear_stack=true&sysparm_query=active%3Dtrue%5Epriority%3D1%5EORDERBYDESCopened_at',
		color: 'burnt-orange',
		icon: 'list'
	},
	{
		title: 'Requests',
		url: '/sc_req_item_list.do?sysparm_clear_stack=true&sysparm_query=opened_by%3Djavascript:gs.user_id()%5EORDERBYDESCnumber',
		color: 'purple',
		icon: 'article-document'
	},
	{
		title: 'My Approvals',
		url: '/sysapproval_approver_list.do?sysparm_clear_stack=true&sysparm_query=approver%3Djavascript:gs.getUserID();%5EORDERBYorder',
		color: 'green',
		icon: 'check-circle'
	},
	{
		title: 'High Priority',
		url: '/incident_list.do?sysparm_clear_stack=true&sysparm_query=active%3Dtrue%5Eassigned_to%3Djavascript:gs.user_id()%5EORDERBYDESCopened_at',
		color: 'fuschia',
		icon: 'list'
	},
	{
		title: 'Reports',
		url: 'report_home.do',
		color: 'yellow',
		icon: 'book-open'
	},
	{
		title: 'Michael Borowiec',
		url: '/sys_user.do?sys_id=' + userFavoriteSysID,
		color: 'cyan',
		icon: 'article-document'
	},
	{
		title: 'My Incidents',
		url: '/incident_list.do?sysparm_clear_stack=true&sysparm_query=active%3Dtrue%5Ecaller_id%3Djavascript:gs.user_id()%5EORDERBYDESCopened_at',
		color: 'orange',
		icon: 'user'
	},
	{
		title: 'Mobile Team',
		url: '/sys_user_list.do?sysparm_clear_stack=true&sysparm_query=department%3D' + departmentSysID + '%5EORDERBYname',
		color: 'blue',
		icon: 'user-group'
	},
	{
		title: 'Service Portal',
		url: '/sp?',
		color: 'red',
		icon: 'cards'
	},
	{
		title: 'Groups',
		url: '/sys_user_group_list.do?sysparm_query=ORDERBYname',
		color: 'aquamarine',
		icon: 'catalog'
	},
	{
		title: 'Departments',
		url: '/cmn_department_list.do?sysparm_query=ORDERBYname',
		color: 'cyan',
		icon: 'tree'
	},
	// {
	// 	title: 'Location',
	// 	url: '/$m.do#/location/share',
	// 	color: 'red',
	// 	icon: 'list'
	// },
	// {
	// 	title: 'Connect',
	// 	url: '/$c.do',
	// 	color: 'cyan',
	// 	icon: 'view'
	// }
]

var visualizations = [
	{
		favoriteName: 'Active',
		type: 'bar_chart',
		groupByColumn: 'category'
	}, 
	{
		favoriteName: 'Michael Borowiec',
		type: 'user'
	},
	{
		favoriteName: 'Critical',
		type: 'count'
	}
]

var userName = 'admin'

var userID = userSysIDForUserName(userName);
if (userID == null) {
	gs.log('Did not find user for' + userName);
}

resetFavoritesForUserID(userID);
resetVisualizationsForUserID(userID);

addFavoritesForUserID(favorites, userID);
addVisualizationsForUserID(visualizations, userID);