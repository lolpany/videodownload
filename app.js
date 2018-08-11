const urlParse = require('url').parse;
const ytdl = require('ytdl-core');
const http = require('http');
const https = require('https');
const fb = require('fb-video-downloader');
const windows1251 = require('windows-1251');
// const ffmpeg = require("ffmpeg.js");

const proxyHost = '149.56.251.89';
const instagramTitleRegex = /.*?<meta property="og:title".*?content="(.*?)".*?>.*?/g;
const instagramThumbRegex = /.*?<meta property="og:image".*?content="(.*?)".*?>.*?/g;
const instagramUrlRegex = /.*?<meta property="og:video".*?content="(.*?)".*?>.*?/g;
const vkParamsRegex = /.*?"params":\[(.*)]}.*?/;
const vkTitleRegex = /.*?<!--\d+<!><!>\d+<!>\d+<!>\d+<!>(.*?)<!>.*?/g;
// const vkTitleRegex = /.*?<video.*?title="(.*?)".*?>.*?/g;
const vkThumbRegex = /.*?<video.*?poster="(.*?)".*?>.*?/g;
const vkUrlsRegex = /<source src="(.*?)" type="video\/mp4" \/>/g;
const odnoklassnikiRegex = /.*?data-options="(.*?)".*?/g;
const pluralSightTitleRegex = /.*?<a.*?id="course-title-link".*?>(.*?)<\/a>.*?/g;
const pluralSightUrlRegex = /.*?<video.*?src="(.*?)".*?>.*?/g;
// const instagramVideoRegex = /.*?<video.*?poster="(.*?)".*?src="(.*?)".*?>.*?/g;


const proxyMap = {
    'vk.com': 'vk'
};

window.onload = function () {
    window.onpopstate = processUrl;
    document.getElementById('url').addEventListener('input', validateUrl);
    // document.getElementById('url').addEventListener('paste', validateUrl);
    processUrl();
};

function processUrl() {
    // var stdout = "";
    // var stderr = "";
    // ffmpeg({
    //     MEMFS: [{name: "test.m3u8", data: testData}],
    //     arguments: [
    //         "-i", "https://video.twimg.com/amplify_video/836294479623553024/pl/1280x720/fGBvjHPJGgHBlhFc.m3u8", "-bsf:a", "aac_adtstoasc", "-vcodec", "copy", "-c", "copy", "-crf", "50", "file.mp4"
    //     ],
    //     print: function (data) {
    //         stdout += data + "\n";
    //     },
    //     printErr: function (data) {
    //         stderr += data + "\n";
    //     },
    //     onExit: function (code) {
    //         console.log("Process exited with code " + code);
    //         console.log(stdout);
    //     },
    // });
    var url = decodeURIComponent(window.location.search.substr(5));
    if (url != null && url != '') {
        drawDisabledVideos();
        drawDisabledAudios();
        document.getElementById('url').value = url;
        validateUrl();
    }
}

function validateUrl() {
    var url = document.getElementById('url').value;
    if (url != null) {
        history.pushState(null, null, window.location.href.split('?', 2)[0] + '?url=' + encodeURIComponent(url));
        var parsedUrl = new URL(url);
        if (parsedUrl.host == 'www.youtube.com' || parsedUrl.host == 'm.youtube.com') {
            fetchInfo(url);
        } else if (parsedUrl.host == 'www.facebook.com' || parsedUrl.host == 'm.facebook.com') {
            fb.getInfo(transformUrl(parsedUrl).toString()).then((info) => drawFacebook(info));
        } else if (parsedUrl.host == 'twitter.com') {
            parseTwitter(transformUrl(parsedUrl).toString());
        } else if (parsedUrl.host == 'www.instagram.com' || parsedUrl.host == 'm.instagram.com') {
            parseInstagram(transformUrl(parsedUrl).toString());
        } else if (parsedUrl.host == 'app.pluralsight.com') {
            parsePluralSight(transformUrl(parsedUrl).toString());
        } else if (parsedUrl.host == 'ok.ru') {
            parseOdnoklassniki(transformUrl(parsedUrl).toString());
        } else if (parsedUrl.host == 'vk.com') {
            parseVk(transformUrl(parsedUrl).toString());
        }
    }
}

function fetchInfo(url) {
    ytdl.getInfo(url, {requestOptions: {transform: transformUrl}}, (err, info) => {
        // if(err) {
        //     return;
        // }

        fetchYoutubeUrl(info, {quality: 'highestaudio'});
    });
}

function fetchYoutubeUrl(info, options) {
    options = options || {};
    var format = ytdl.chooseFormat(info.formats, options);
    // var link = document.getElementById('link');
    // link.setAttribute('href', format.url) ;
    // link.innerText = format.url;
    drawYouTube(info);
}

function transformUrl(url) {
    if (url.host == 'manifest.googlevideo.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/vid/' + url.href.split('/').slice(3).join('/');
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'www.youtube.com' || url.host == 'm.youtube.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/you/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'www.facebook.com'|| url.host == 'm.facebook.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/fb/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'twitter.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/tw/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'www.instagram.com'|| url.host == 'm.instagram.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/instagram/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'app.pluralsight.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/pluralsight/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'ok.ru') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/ok/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'vd48.mycdn.me') {
        url.path = '/cdnme/' + url.href.split('/').slice(3).join('/');
    } else if (proxyMap[url.host] != null) {
        url.path = '/' + proxyMap[url.host] + '/' + url.href.split('/').slice(3).join('/');
    }
    url.host = proxyHost;
    url.hostname = proxyHost;
    url.protocol = 'http:';
    url.href = 'http://' + proxyHost + url.path;
    return url;
}

function parseTwitter(url) {
    fetch(new Request(url)).then(function (response) {
        return response.text();
    }).then(function (text) {
        let myRegexp = /.*?data-config="(.*?).*?"/g;
        let match = myRegexp.exec(result.data);
        let json = match[1].replace(/&quot;/g, '"');
        let urlvid = JSON.parse(json).video_url;
        resolve(urlvid);
    });
}


function parseInstagram(url) {
    fetch(new Request(url.toString())).then(function (response) {
        return response.text();
    }).then(function (text) {
        var title = instagramTitleRegex.exec(text)[1];
        instagramTitleRegex.lastIndex = 0;
        var thumb = instagramThumbRegex.exec(text)[1];
        instagramThumbRegex.lastIndex = 0;
        var url = instagramUrlRegex.exec(text)[1];
        instagramUrlRegex.lastIndex = 0;
        drawInstagram({title: title, thumb: thumb, url: url});
    });
}

function parsePluralSight(url) {
    fetch(new Request(url.toString())).then(function (response) {
        return response.text();
    }).then(function (text) {
        var title = pluralSightTitleRegex.exec(text)[1];
        pluralSightTitleRegex.lastIndex = 0;
        var url = pluralSightUrlRegex.exec(text)[1];
        pluralSightUrlRegex.lastIndex = 0;
        drawPluralSight({title: title, thumb: null, url: url});
    });
}

function parseOdnoklassniki(url) {
    fetch(new Request(url.toString())).then(function (response) {
        return response.text();
    }).then(function (text) {
        var metadata = JSON.parse(JSON.parse(odnoklassnikiRegex.exec(text)[1].replace(/\&quot;/g, '"')).flashvars.metadata);
        odnoklassnikiRegex.lastIndex = 0;
        var title = metadata.movie.title;
        var thumb = metadata.movie.poster;
        var formats = metadata.videos.reverse();
        drawOdnoklassniki({title: title, thumb: thumb, formats: formats});
    });
}

function parseVk(url) {
    fetch(new Request('http://' + proxyHost + '/vk/al_video.php?act=show_inline&al=1&video=-' + url.split('-')[1]),
        {
            headers: {
                'User-Agent': ''
            }
        }
    ).then(function (response) {
        return response.text();
    }).then(function (text) {
        // var params = JSON.parse(vkParamsRegex.exec(text)[1]);
        // vkParamsRegex.lastIndex = 0;
        var title = windows1251.decode(vkTitleRegex.exec(text)[1]);
        vkTitleRegex.lastIndex = 0;
        var thumb = vkThumbRegex.exec(text)[1];
        vkThumbRegex.lastIndex = 0;
        var formats = [];
        var urlsMatch = vkUrlsRegex.exec(text);
        while (urlsMatch != null) {
            formats.push(urlsMatch[1]);
            urlsMatch = vkUrlsRegex.exec(text);
        }
        vkUrlsRegex.lastIndex = 0;
        drawVk({title: title, thumb: thumb, formats: formats});
    });
}

function disableAll() {
    var youtube = document.getElementById('youtubeDownloadButtons');
    youtube.classList.remove('enabled');
    youtube.classList.add('disabled');
    var facebook = document.getElementById('facebookDownloadButtons');
    facebook.classList.remove('enabled');
    facebook.classList.add('disabled');
    var instagram = document.getElementById('instagramDownloadButtons');
    instagram.classList.remove('enabled');
    instagram.classList.add('disabled');
    var odnoklassniki = document.getElementById('odnoklassnikiDownloadButtons');
    odnoklassniki.classList.remove('enabled');
    odnoklassniki.classList.add('disabled');
    var pluralSight = document.getElementById('pluralSightDownloadButtons');
    pluralSight.classList.remove('enabled');
    pluralSight.classList.add('disabled');
}

function drawFacebook(info) {
    disableAll();
    var facebook = document.getElementById('facebookDownloadButtons');
    facebook.classList.remove('disabled');
    facebook.classList.add('enabled');
    drawDisabledVideos();
    document.getElementById('previewImg').setAttribute('src', info.thumb);
    document.getElementById('previewImg').style.height = 'auto';
    var facebookButtons = document.getElementById('facebookDownloadButtons').children;
    for (let i in facebookButtons) {
        let url = info.download[Object.keys(info.download)[i]];
        if (url != null) {
            let button = facebookButtons[i];
            button.style.visibility = 'visible';
            button.classList.remove('disabled');
            button.children[0].setAttribute('href', url);
            button.children[0].setAttribute('download', info.title);
        }
    }
}

function drawInstagram(info) {
    disableAll();
    var instagram = document.getElementById('instagramDownloadButtons');
    instagram.classList.remove('disabled');
    instagram.classList.add('enabled');
    drawDisabledVideos();
    document.getElementById('previewImg').setAttribute('src', info.thumb);
    document.getElementById('previewImg').style.height = 'auto';
    var instagramButton = instagram.children[0];
    instagramButton.style.visibility = 'visible';
    instagramButton.classList.remove('disabled');
    instagramButton.children[0].setAttribute('href', info.url);
    instagramButton.children[0].setAttribute('download', info.title);
}

function drawOdnoklassniki(info) {
    disableAll();
    drawDisabledVideos();
    // var videoLabel = document.getElementById('videoLabel');
    // videoLabel.classList.remove('disabled');
    document.getElementById('previewImg').setAttribute('src', info.thumb);
    document.getElementById('previewImg').style.height = 'auto';
    var odnoklassniki = document.getElementById('odnoklassnikiDownloadButtons');
    odnoklassniki.classList.remove('disabled');
    odnoklassniki.classList.add('enabled');
    var buttons = odnoklassniki.children;
    for (let i = 0; i < info.formats.length; i++) {
        var button = buttons[i];
        button.style.visibility = 'visible';
        button.classList.remove('disabled');
        button.children[0].setAttribute('href', info.formats[i].url);
        button.children[0].setAttribute('download', info.title);
    }
}

function drawPluralSight(info) {
    disableAll();
    var pluralSight = document.getElementById('pluralSightDownloadButtons');
    pluralSight.classList.remove('disabled');
    pluralSight.classList.add('enabled');
    drawDisabledVideos();
    // document.getElementById('previewImg').setAttribute('src', info.thumb);
    // document.getElementById('previewImg').style.height = 'auto';
    var instagramButton = pluralSight.children[0];
    instagramButton.style.visibility = 'visible';
    instagramButton.classList.remove('disabled');
    instagramButton.children[0].setAttribute('href', info.url);
    instagramButton.children[0].setAttribute('download', info.title);
}

function drawPluralSight(info) {
    disableAll();
    var instagram = document.getElementById('instagramDownloadButtons');
    instagram.classList.remove('disabled');
    instagram.classList.add('enabled');
    drawDisabledVideos();
    document.getElementById('previewImg').setAttribute('src', info.thumb);
    document.getElementById('previewImg').style.height = 'auto';
    var instagramButton = instagram.children[0];
    instagramButton.style.visibility = 'visible';
    instagramButton.classList.remove('disabled');
    instagramButton.children[0].setAttribute('href', info.url);
    instagramButton.children[0].setAttribute('download', info.title);
}

function drawYouTube(info) {
    disableAll();
    var youtube = document.getElementById('youtubeDownloadButtons');
    youtube.classList.remove('disabled');
    youtube.classList.add('enabled');
    processVideos(info, info.formats);
    processAudios(info.title, info.formats);
}

function processVideos(info, formats) {
    var resolutions = Array.from(new Set(formats.filter(format => format.resolution != null && format.resolution.endsWith('p')).map(format => format.resolution)
    )).sort(function (a, b) {
        return parseInt(b) - parseInt(a)
    });
    var videos = [];
    for (var i in resolutions) {
        videos.push(formats.filter(format => format.resolution != null && format.resolution == resolutions[i])
            .sort(function (a, b) {
                if (a.audioBitrate != null && a.container == 'mp4') {
                    return -1;
                } else if (b.audioBitrate != null && b.container == 'mp4') {
                    return 1;
                } else if (a.audioBitrate != null) {
                    return -1;
                } else if (b.audioBitrate != null) {
                    return 1;
                } else {
                    return -1;
                }
            })[0]
        );
    }
    var fulls = formats.filter(format => format.resolution != null && format.audioBitrate != null && format.container != 'webm'
    ).sort(function (a, b) {
        return parseInt(b.resolution) - parseInt(a.resolution)
    });
    var highestVideos = formats.filter(format => format.resolution != null
    ).sort(function (a, b) {
        return parseInt(b.resolution) - parseInt(a.resolution)
    });
    for (var i in highestVideos) {
        if (!fulls.includes(highestVideos[i])) {
            fulls.unshift(highestVideos[i]);
        }
    }
    drawVideos(info, videos);
}

function drawVideos(info, videos) {
    drawDisabledVideos();
    // var videoLabel = document.getElementById('videoLabel');
    // videoLabel.classList.remove('disabled');
    var thumbs = info.player_response.videoDetails.thumbnail.thumbnails;
    document.getElementById('previewImg').setAttribute('src', thumbs[thumbs.length - 1].url);
    document.getElementById('previewImg').style.height = 'auto';
    for (let i = 0; i < videos.length; i++) {
        var button = document.getElementById('p' + videos[i].resolution.substr(0, videos[i].resolution.length - 1));
        button.style.visibility = 'visible';
        button.classList.remove('disabled');
        button.children[0].setAttribute('href', videos[i].url);
        button.children[0].setAttribute('download', info.title);
        if (videos[i].audioBitrate == null) {
            Object.assign(button.style, {'background-image': "url('./no-sound.png')"});
        }
    }
}

function drawDisabledVideos() {
    document.getElementById('preview').style.display = 'flex';
    var previewImg = document.getElementById('previewImg');
    previewImg.src = '//:0';
    previewImg.style.height = 0;
    if (!previewImg.classList.contains('disabled')) {
        previewImg.classList.add('disabled')
    }
    var videoButtons = document.getElementsByClassName('videoButton');
    for (var i in Object.keys(videoButtons)) {
        videoButtons[i].style.visibility = 'visible';
        setVideoButtonDisabled(videoButtons[i]);
        Object.assign(videoButtons[i].style, {'background-image': "none"});
    }
}

// function download(url) {
//     var link = document.createElement("a");
//     link.download = name;
//     link.href = url;
//     link.click();
// }

function setVideoButtonDisabled(button) {
    button.classList.remove('disabled');
    button.classList.add('disabled');
}

function processAudios(title, formats) {
    var audios = formats.filter(format => format.resolution == null && format.audioBitrate != null
    ).sort(function (a, b) {
        return parseInt(b.audioBitrate) - parseInt(a.audioBitrate)
    });
    drawAudios(title, audios);
}

function drawAudios(title, audios) {
    drawDisabledAudios();
    for (let i = 0; i < audios.length; i++) {
        var button = document.getElementById('kb' + audios[i].audioBitrate);
        button.style.visibility = 'visible';
        button.classList.remove('disabled');
        button.children[0].setAttribute('href', audios[i].url);
        button.children[0].setAttribute('download', title);
    }
}


function drawDisabledAudios() {
    // var audioLabel = document.getElementById('audioLabel');
    // audioLabel.classList.remove('disabled');
    var audioButtons = document.getElementsByClassName('audioButton');
    for (var i in Object.keys(audioButtons)) {
        audioButtons[i].style.visibility = 'visible';
        setVideoButtonDisabled(audioButtons[i]);
    }
}