var request		= require('request'),
	dateformat  = require('dateformat'),
	cookie		= require('cookie'),
	querystring = require('querystring'),
	path		= require('path'),
	url			= require('url'),
	fs			= require('fs');

	app 		= express();

var authencation = {};

request({ //로그인
	method: 'POST',
	uri: 'https://oauth.secure.pixiv.net/auth/token',
	headers: {
		'Referer': 'http://www.pixiv.net/'
	},
	formData: {
		'username': {PixivAccountID},
		'password': {PixivAccountPassword},
		'grant_type': 'password',
		'client_id': 'bYGKuGVw91e0NMfPGp44euvGt59s',
		'client_secret': 'HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK'
	}
}, function(err, response, body) {
	authencation.session = cookie.parse(String(response.headers['set-cookie'])).PHPSESSID;
	authencation.userid = JSON.parse(body).response.user.id;
	authencation.access_token = JSON.parse(body).response.access_token;
});

var app_status = {
	'latest_date': dateformat(new Date() - 86400000, 'yyyy-mm-dd'),
	'data': {},
};

var target_date = app_status.latest_date;
if(app_status.latest_date !== dateformat(new Date() - 86400000, 'yyyy-mm-dd')) {
	target_date = dateformat(new Date() - 86400000, 'yyyy-mm-dd');
}

if(typeof app_status.data[target_date] !== 'object') {
	var request_option = {
		'image_sizes': ['px_128x128', 'px_480mw', 'large'].join(','),
		'include_stats': 'true',
		'conent': 'illust',
		'page': 1,
		'mode': 'daily',
		'per_page': 50,
		'profile_image_sizes': ['px_170x170', 'px_50x50'].join(','),
		'date': target_date
	};

	request({
		method: 'GET',
		uri: 'https://public-api.secure.pixiv.net/v1/ranking/all?' + querystring.stringify(request_option),
		headers: { //랭킹 가져오기
			'Referer': 'http://spapi.pixiv.net/',
			'User-Agent': 'PixivIOSApp/5.6.0',
			'Content-Type': 'application/x-www-form-urlencoded',
			'Cookie': 'PHPSESSID=' + authencation.session,
			'Authorization': 'Bearer ' + authencation.access_token
		}
	}, function(err, response, body) {
		var json = JSON.parse(body);
		if(json.pagination.total !== 0) {
			var list = json.response[0].works;
			for(var i in list) {
				var filename = path.basename(url.parse(list[i].work.image_urls.large).path);

				fs.stat(__dirname + '/images/' + filename, function(err, stats) {
					if(err) {
						request.get({
									url: list[i].work.image_urls.large,
									headers: {
										'Referer': 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + list[i].work.id
									}
						}).pipe(fs.createWriteStream(__dirname + '/images/' + filename));
					}
				});
			}
		}
	});
}