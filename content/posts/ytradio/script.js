/* -------- 1) Load the track list -------- */
let songs = [];
let current = 0;          // index of the song we're on
let player = null;        // YT.Player instance

console.log('starting...');

fetch('songs.json')
    .then(res => res.json())
    .then(json => { songs = json; loadYouTubeAPI(); })
    .catch(err => console.error('Could not load songs.json:', err));

/* -------- 2) Dynamically inject YouTube IFrame API -------- */
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    // The API will call this global when it’s ready:
    window.onYouTubeIframeAPIReady = initPlayer;

    console.log('YouTube API script injected');
}

/* -------- 3) Create the player & start first song -------- */
function initPlayer() {
    console.log('initializing player...');

    if (!songs.length) { console.warn('No songs found'); return; }

    player = new YT.Player('player-container', {
        videoId: songs[0].videoId,
        width: '100%',                    // full width of container
        playerVars: {                     // basic options
            autoplay: 1,
            controls: 1,
            rel: 0,                         // hide “related” at end
            modestbranding: 1
        },
        events: { onStateChange: handleStateChange }
    });
}

/* -------- 4) Advance when a video ends -------- */
function handleStateChange(e) {
    const ENDED = YT.PlayerState.ENDED;
    if (e.data === ENDED) {
        current += 1;
        if (current < songs.length) {
            player.loadVideoById(songs[current].videoId);
        } else {
            console.log('🎉  Playlist finished');
            // Optional: loop or restart
            // current = 0; player.loadVideoById(songs[0].videoId);
        }
    }
}