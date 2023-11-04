const imageInput = document.getElementById("imageInput");
const imageCanvas = document.getElementById("imageCanvas");
const ctx = imageCanvas.getContext("2d");

const loadingText = document.getElementById("loadingText");
const drawingText = document.getElementById("drawingText");

let points = []

let bodyPartsObj = 
{
    "Nose" : 0 ,
    "Neck": 1 ,
    "RShoulder": 2 ,
    "RElbow": 3 ,
    "RWrist": 4 ,
    "LShoulder": 5,
    "LElbow": 6 ,
    "LWrist": 7 ,
    "MidHip": 8 ,
    "RHip": 9 ,
    "RKnee": 10 ,
    "RAnkle": 11 ,
    "LHip": 12 ,
    "LKnee": 13 ,
    "LAnkle": 14 ,
    "REye": 15 ,
    "LEye": 16 ,
    "REar": 17 ,
    "LEar": 18 ,
    "LBigToe": 19 ,
    "LSmallToe": 20 ,
    "LHeel": 21 ,
    "RBigToe": 22 ,
    "RSmallToe": 23 ,
    "RHeel": 24 ,
    "Background": 25 
}

let bodyParts = Object.values(bodyPartsObj);

let partsPairs = [
                    [ 1, 0 ], [ 1, 2 ], [ 1, 5 ],
                    [ 2, 3 ], [ 3, 4 ], [ 5, 6 ],
                    [ 6, 7 ], [ 0, 15 ], [ 15, 17 ],
                    [ 0, 16 ], [ 16, 18 ], [ 1, 8 ],
                    [ 8, 9 ], [ 9, 10 ], [ 10, 11 ],
                    [ 11, 22 ], [ 22, 23 ], [ 11, 24 ],
                    [ 8, 12 ], [ 12, 13 ], [ 13, 14 ],
                    [ 14, 19 ], [ 19, 20 ], [ 14, 21 ]
                ];

let refinedPairs = [
                    [1, 0], [1, 2], [1, 5],
                    [2, 3], [3, 4], [5, 6],
                    [6, 7], [1, 8],
                    [8, 9], [9, 10], [10, 11],
                    [8, 12], [12, 13], [13, 14],
];

let excludedPoints = [15,16,17,18,19,20,21,22,23,24]

let images = [];
let currentImageIndex = 0;
let selectedCircleIndex = -1; 
function updateCirclePosition(index, newX, newY){
    if (index >= 0 && index < points.length) {
        const [oldX, oldY] = points[index].split(",");
        points[index] = `${newX},${newY}`;
        //console.log("Points now are : ", points)
        //console.log(`Updated point ${index}: (${oldX},${oldY}) -> (${newX},${newY})`);
    }
}

imageInput.addEventListener("change", () => {
    images = [];
    loadingText.style.display = "block"; 
    const file = imageInput.files[0];
    if (file) {
        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = () => {
            images.push(image);
            loadingText.style.display = "none"; 
            drawingText.style.display = "block"; 
        };

        const reader = new FileReader();

        reader.onload = function () {
            const base64 = reader.result;
            getImagePoints(base64);
        };

        reader.readAsDataURL(file);
    }
});
function renderImage(index) {
    if (images[index]) {
        const image = images[index];
        ctx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);

        for (let i = 0; i < refinedPairs.length; i++) {
            let fromIndex = refinedPairs[i][0];
            let toIndex = refinedPairs[i][1];

            let [fromPointx, fromPointy] = points[fromIndex].split(",").map(Number);
            let [toPointx, toPointy] = points[toIndex].split(",").map(Number);

            if (!excludedPoints.includes(fromIndex) && fromPointx !== 0 && fromPointy !== 0 &&
                !excludedPoints.includes(toIndex) && toPointx !== 0 && toPointy !== 0) {
                drawLine(ctx, fromPointx, fromPointy, toPointx, toPointy);
            }
        }

        for (let i = 0; i < points.length; i++) {
            if (!excludedPoints.includes(i)) {
                let [x, y] = points[i].split(",").map(Number);
                if (x !== 0 || y !== 0) {
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = selectedCircleIndex === i ? "blue" : "red";
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
    }
}

function drawLine(ctx, x1, y1, x2, y2, stroke = 'yellow', width = 3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
}

imageCanvas.addEventListener('mousedown', (e) => {
    const rect = imageCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i].split(",");
        const dx = mouseX - x;
        const dy = mouseY - y;
        if (dx * dx + dy * dy <= 4 * 4) { 
            selectedCircleIndex = i;
            renderImage(currentImageIndex);
            break;
        }
    }
});

imageCanvas.addEventListener('mousemove', (e) => {
    if (selectedCircleIndex >= 0) {
        const rect = imageCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        updateCirclePosition(selectedCircleIndex, mouseX, mouseY);
        renderImage(currentImageIndex);
    }
});

imageCanvas.addEventListener('mouseup', () => {
    selectedCircleIndex = -1; 
});
function getImagePoints(image) {

    let url = "GetFrameBodyPoints";

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(image)
    }

    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error("Request was unsuccessful!!");
            }

            return response.json();
        })
        .then(data => {
            points = data;
            renderImage(currentImageIndex);
        })
        .catch(error => {
            console.error('Fetch Error : ', error);
        })
        .finally(() => {
            drawingText.style.display = "none"; // Hide drawing message
        });
}


