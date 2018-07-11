const ytdl = require('ytdl-core');

window.onload = function() {
    window.onpopstate = processUrl;
    document.getElementById('url').addEventListener('change', validateUrl);
    processUrl();
};

function processUrl() {
    var url = decodeURIComponent(window.location.search.substr(5));
    if (url != null && url != '') {
        drawDisabledVideos();
        drawDisabledAudios();
        document.getElementById('url').value = url;
        fetchInfo(url);
    }
}

function validateUrl() {
    var url = document.getElementById('url').value;
    if (url != null) {
        history.pushState(null, null, window.location.href.split('?', 2)[0] + '?url=' + encodeURIComponent(url));
        fetchInfo(url);
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
        url.host = 'ec2-18-216-128-220.us-east-2.compute.amazonaws.com';
        url.hostname = 'ec2-18-216-128-220.us-east-2.compute.amazonaws.com';
        url.port = 81;
        url.protocol = 'http:';
        url.href = 'http://ec2-18-216-128-220.us-east-2.compute.amazonaws.com:81/' + url.href.split('/').slice(3).join('/')
    }
    return url;
}

function drawButtons(info, formats) {
    processVideos(info, formats);
    processAudios(info.title, formats);
}

function processVideos(info, formats) {
    var resolutions = Array.from(new Set(formats.filter(format => format.resolution != null && format.resolution.endsWith('p')).
    map(format => format.resolution))).sort(function(a, b) {return parseInt(b) - parseInt(a)});
    var videos = [];
    for (var i in resolutions) {
        videos.push(formats.filter(format => format.resolution != null && format.resolution == resolutions[i])
            .sort(function(a, b) {
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
            })[0]);
    }
    var fulls = formats.filter(format => format.resolution != null && format.audioBitrate != null && format.container != 'webm').
    sort(function(a, b) {return parseInt(b.resolution) - parseInt(a.resolution)});
    var highestVideos = formats.filter(format => format.resolution != null).sort(function(a, b) {
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
        button.style.visibility  = 'visible';
        button.classList.remove('disabled');
        button.children[0].setAttribute('href', videos[i].url);
        button.children[0].setAttribute('download', info.title);
        if (videos[i].audioBitrate == null) {
            Object.assign(button.style, {'background-image' : "url('./no-sound.png')"});
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
        Object.assign(videoButtons[i].style, {'background-image' : "none"});
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
    var audios = formats.filter(format => format.resolution == null && format.audioBitrate != null).
    sort(function(a, b) {return parseInt(b.audioBitrate) - parseInt(a.audioBitrate)});
    drawAudios(title, audios);
}

function drawAudios(title, audios) {
    drawDisabledAudios();
    for (let i = 0; i < audios.length; i++) {
        var button = document.getElementById('kb' + audios[i].audioBitrate);
        button.style.visibility  = 'visible';
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