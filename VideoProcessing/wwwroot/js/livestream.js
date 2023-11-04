const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const recordButton = document.getElementById("record");
const playButton = document.getElementById("play");
const liveVideo = document.getElementById("stream");
const frameCanvas = document.getElementById("frameCanvas");
const thumbnailContainer = document.getElementById("thumbnailContainer");
const ctx = frameCanvas.getContext("2d");

let isCameraOn = false;

let stream;
let mediaRecorder;
let recordedChunks = [];
let frames = [];
let points = {};
let currentFrameIndex = 0;
let selectedCircleIndex = -1;
let partsPairs = [
    [1, 0], [1, 2], [1, 5],
    [2, 3], [3, 4], [5, 6],
    [6, 7], [0, 15], [15, 17],
    [0, 16], [16, 18], [1, 8],
    [8, 9], [9, 10], [10, 11],
    [11, 22], [22, 23], [11, 24],
    [8, 12], [12, 13], [13, 14],
    [14, 19], [19, 20], [14, 21]
];
let refinedPairs = [
    [1, 0], [1, 2], [1, 5],
    [2, 3], [3, 4], [5, 6],
    [6, 7], [1, 8],
    [8, 9], [9, 10], [10, 11],
    [8, 12], [12, 13], [13, 14],
];
let excludedPoints = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24]

liveVideo.addEventListener("play", () => {
    const interval = 1000 / liveVideo.playbackRate;
    function captureFrame() {
        if (!liveVideo.paused && !liveVideo.ended) {
            ctx.drawImage(liveVideo, 0, 0, frameCanvas.width, frameCanvas.height);
            frames.push(frameCanvas.toDataURL("image/jpeg"));
            setTimeout(captureFrame, interval);
        }
    }
    captureFrame();
});
async function startCamera() {
    const constraints = {
        audio: true,
        video: { width: 640, height: 480 }
    };
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        liveVideo.srcObject = stream;
        isCameraOn = true;
        startButton.disabled = true;
        stopButton.disabled = recordButton.disabled = false;
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStop;
    } catch (e) {
        console.error('Error starting camera:', e);
    }
}
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        liveVideo.srcObject = null;
        isCameraOn = false;
        startButton.disabled = false;
        stopButton.disabled = recordButton.disabled = true;
    }
}
function toggleRecording() {
    if (!mediaRecorder) return;
    if (mediaRecorder.state === "inactive") {
        recordedChunks = [];
        mediaRecorder.start();
        recordButton.textContent = "Stop Recording";
        stopButton.disabled = true;
    } else {
        mediaRecorder.stop();
        recordButton.textContent = "Record";
        stopButton.disabled = false;
    }
}
function playRecording() {
    const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    const videoUrl = URL.createObjectURL(recordedBlob);
    liveVideo.src = videoUrl;
    liveVideo.play();
    playButton.disabled = true;
}
function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}
function handleStop() {
    playButton.disabled = false;
    processFrames();
    fetchFramePoints(0); 
}
function fetchFramePoints(frameIndex) {
    let url = "GetFrameBodyPoints";
    const frameBase64 = frames[frameIndex];

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(frameBase64 )
    };

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            points[frameIndex] = data;
            displayFrame(frameIndex); 
        })
        .catch(error => {
            console.error('Fetch Error:', error);
        })
        .finally(() => hideProcessingLoader());
}
function processFrames() {
    thumbnailContainer.innerHTML = '';
    frames.forEach((frameDataURL, index) => {
        let thumb = new Image();
        thumb.src = frameDataURL;
        thumb.classList.add('thumbnail');
        thumb.onclick = () => {
            currentFrameIndex = index;
            showProcessingLoader();
            fetchFramePoints(index);
        };
        thumbnailContainer.appendChild(thumb);
    });
    if (frames.length > 0) {
        currentFrameIndex = 0;
        showProcessingLoader();
        fetchFramePoints(0);
    }
}
function displayFrame(index) {
    let frameImage = new Image();
    frameImage.src = frames[index];
    frameImage.onload = () => {
        ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
        ctx.drawImage(frameImage, 0, 0, frameCanvas.width, frameCanvas.height);
        drawPoints(index);
    };
    document.querySelectorAll('.thumbnail').forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('active', index === thumbIndex);
    });
}

function showProcessingLoader() {
    processingLoader.style.display = "block"; // or "flex", depending on your loader's CSS
}
function hideProcessingLoader() {
    processingLoader.style.display = "none";
}
function drawPoints(index) {
    const currentFramePoints = points[index];
    if (!currentFramePoints) return;
    for (let i = 0; i < currentFramePoints.length; i++) {
        if (!excludedPoints.includes(i) && currentFramePoints[i] !== "0,0") {
            let [x, y] = currentFramePoints[i].split(",").map(Number);
            if (x !== 0 || y !== 0) {
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = selectedCircleIndex === i ? "blue" : "red";
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    drawLines(index);
    
}
function drawLines(index) {

    const currentFramePoints = points[index];
    ctx.beginPath();

    for (let [start, end] of refinedPairs) {
        if (!excludedPoints.includes(start) && !excludedPoints.includes(end)) {
            const [x1, y1] = currentFramePoints[start].split(",");
            const [x2, y2] = currentFramePoints[end].split(",");
            if (x1 !== "0" && y1 !== "0" && x2 !== "0" && y2 !== "0") {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
        }
    }
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.stroke();
}

startButton.onclick = startCamera;
stopButton.onclick = stopCamera;
recordButton.onclick = toggleRecording;
playButton.onclick = playRecording;
