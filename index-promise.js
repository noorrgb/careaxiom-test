var http = require('http');
var url = require("url");
var https = require("https");
var async = require("async");
var rp = require('request-promise');
var Promise = require("bluebird");

function isURL(str) {
    var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}

function renderSuccess(res, titles) {

    const arr = titles.map(title => `<li>${title}</li>`);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`<html>
<head></head>
<body>

    <h1> Following are the titles of given websites: </h1>
    <ul>
       ${arr}
    </ul>
</body>
</html>`);
    res.end();
}

function renderInvalidUrls(res, titles) {

    const arr = titles.map(title => `<li>${title}</li>`);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`<html>
<head></head>
<body>

    <h1> Following are invalid urls provided, please correct these first. </h1>
    <ul>
       ${arr}
    </ul>
</body>
</html>`);
    res.end();
}


http.createServer((req, res) => {

    var pathname = url.parse(req.url).pathname;


    if (pathname === '/I/want/title') {

        var queryString = url.parse(req.url).query;
        var queryParams = queryString.split('&');
        var urlsToVisit = queryParams.map(item => item.split('=')[1]);

        // prepending https if needed
        urlsToVisit = urlsToVisit.map(url => {
            if (url.includes('http://') || url.includes('https://')) {
                return url;
            }
            return 'https://' + url;
        });

        // validating urls
        var invalidUrls = urlsToVisit.filter(url => !isURL(url));
        if (invalidUrls.length) {
            return renderInvalidUrls(res, invalidUrls.map(item => `${item} - INVALID URL`));
        }

        var extractedTitles = [];

        var promises = urlsToVisit.map(url => rp(url));

        Promise.all(promises)
            .then(function(pages) {

                pages.forEach(page => {
                    var titleText = /\<title\>(.*)\<\/title\>/i.exec(page);
                    if (titleText) {
                        extractedTitles.push(titleText[1]);
                    } else {
                        extractedTitles.push(url + ' - NO RESPONSE (server denied request)');
                    }

                })

                renderSuccess(res, extractedTitles);
            })
            .catch(function() {

            })


    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.write('404 NOT FOUND');
        res.end();
    }

}).listen(8080);
console.log('Server running at http://127.0.0.1:8080/');