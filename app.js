const urlParse = require('url').parse;
const ytdl = require('ytdl-core');
const http = require('http');
const https = require('https');
const scrape = require('metatag-crawler');
const rest = require('restling');
const Promise = require('bluebird');
const fb = require('fb-video-downloader');

const proxyHost = '149.56.251.89';
const instagramTitleRegex = /.*?<meta property="og:title".*?content="(.*?)".*?>.*?/g;
const instagramThumbRegex = /.*?<meta property="og:image".*?content="(.*?)".*?>.*?/g;
const instagramUrlRegex = /.*?<meta property="og:video".*?content="(.*?)".*?>.*?/g;
// const instagramVideoRegex = /.*?<video.*?poster="(.*?)".*?src="(.*?)".*?>.*?/g;

window.onload = function () {
    window.onpopstate = processUrl;
    document.getElementById('url').addEventListener('input', validateUrl);
    // document.getElementById('url').addEventListener('paste', validateUrl);
    processUrl();
};

function processUrl() {
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
        if (parsedUrl.host == 'www.youtube.com') {
            fetchInfo(url);
        } else if (parsedUrl.host == 'www.facebook.com') {
            fb.getInfo(transformUrl(parsedUrl).toString()).then((info) => drawFacebook(info));
        } else if (parsedUrl.host == 'twitter.com') {
            var a = parseTwitter(transformUrl(parsedUrl).toString());
        } else if (parsedUrl.host == 'www.instagram.com') {
            var a = parseInstagram(transformUrl(parsedUrl).toString());
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
    drawButtons(info, info.formats);
}

function transformUrl(url) {
    if (url.host == 'manifest.googlevideo.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/vid/' + url.href.split('/').slice(3).join('/');
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'www.youtube.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/you/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    } else if (url.host == 'www.facebook.com') {
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
    } else if (url.host == 'www.instagram.com') {
        url.host = proxyHost;
        url.hostname = proxyHost;
        url.protocol = 'http:';
        url.path = '/instagram/' + url.href.split('/').slice(3).join('/')
        url.href = 'http://' + proxyHost + url.path;
    }
    return url;
}

function parseTwitter(url) {
    return new Promise((resolve, reject) => {
        scrape(url, (err, data) => {
            rest.get(transformUrl(new URL(data.og.videos[0].url)).toString()).then(function (result) {
                let myRegexp = /data-config=\"(.*?)\"/g;
                let match = myRegexp.exec(result.data);
                let json = match[1].replace(/\&quot;/g, '"');
                let urlvid = JSON.parse(json).video_url;
                resolve(urlvid);
            }, function (error) {
                if (error.response) {
                    reject(error.response);
                }
            });
        });
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

function drawButtons(info, formats) {
    disableAll();
    var youtube = document.getElementById('youtubeDownloadButtons');
    youtube.classList.remove('disabled');
    youtube.classList.add('enabled');
    processVideos(info, formats);
    processAudios(info.title, formats);
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