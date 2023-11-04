const videoInput = document.getElementById("videoInput");
const frameCanvas = document.getElementById("frameCanvas");
const loadingIndicator = document.getElementById("loadingIndicator")
const processingLoader = document.getElementById("processingLoader");
const ctx = frameCanvas.getContext("2d");

const thumbnailSlider = document.getElementById("thumbnailSlider");
const thumbnailContainer = document.getElementById("thumbnailContainer");


let video = document.createElement("video");
let frames = [];
let currentFrameIndex = 0;
let selectedCircleIndex = -1;

let points = {}
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

videoInput.addEventListener("change", () => {

    const file = videoInput.files[0];

    if (file) {
        frames = []
        points = {}

        ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height)

        video.src = URL.createObjectURL(file);
        video.load();
        video.play();
        showLoadingIndicator();
        hideThumbnailSlider();
    }
});

video.addEventListener("play", () => {

    const interval = 1 / video.playbackRate;
    function captureFrame() {
        if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
            frames.push(frameCanvas.toDataURL("image/jpeg"));
            setTimeout(captureFrame, interval);

        }
    }

    captureFrame();

    video.onended = () => {
        hideLoadingIndicator()
        showThumbnailSlider()
        getThumbnailImages();
    }

    currentFrameIndex = 0;

});
function renderFrame() {

    const frameDataURL = frames[currentFrameIndex];
    const frameImage = new Image();
    frameImage.src = frameDataURL;
    frameImage.onload = () => {
        ctx.drawImage(frameImage, 0, 0, frameCanvas.width, frameCanvas.height);

        if (points[currentFrameIndex]) {
            drawPoints(currentFrameIndex);
        }
    };
}
function showLoadingIndicator() {
    loadingIndicator.style.display = "block";
}
function hideLoadingIndicator() {
    removeBlackFrames();
    currentFrameIndex = 1;
    loadingIndicator.style.display = "none";
}

var black = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAFoAoADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k="

function removeBlackFrames() {
    frames = frames.filter(frame => frame !== black)
}
function GetKeyPoints() {

    if (points[currentFrameIndex]) {
        drawPoints(currentFrameIndex);
        return;
    }

    showProcessingLoader();

    let url = "GetFrameBodyPoints"
    const image = frames[currentFrameIndex]

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(image)
    };

    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) throw new Error("Request was unsuccessful!!");
            return response.json();
        })
        .then(data => {
            points[currentFrameIndex] = data;
            drawPoints(currentFrameIndex);
        })
        .catch(error => console.error('Fetch Error:', error))
        .finally(() => hideProcessingLoader());
}
function drawPoints(index) {

    const currentFramePoints = points[index];

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
function showProcessingLoader() {
    processingLoader.style.display = "flex";
}
function hideProcessingLoader() {
    processingLoader.style.display = "none";
}

function getThumbnailImages() {

    thumbnailContainer.innerHTML = "";

    for (let i = 0; i < frames.length; i++) {
        const thumbnail = document.createElement("img");
        thumbnail.src = frames[i];
        thumbnail.style.width = "80px";
        thumbnail.style.height = "40px";
        thumbnail.className = "thumbnail";
        thumbnail.addEventListener("click", () => renderSelectedFrame(i));
        thumbnailContainer.appendChild(thumbnail);
    }

    // render the first frame initially
    renderSelectedFrame(0);
}

// render a frame with a specific index
function renderSelectedFrame(frameIndex) {
    currentFrameIndex = frameIndex;
    GetKeyPoints();
    ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);

    renderFrame();
}

function showThumbnailSlider() {
    thumbnailSlider.style.display = "none";
}

function hideThumbnailSlider() {
    thumbnailSlider.style.display = "block";
}


