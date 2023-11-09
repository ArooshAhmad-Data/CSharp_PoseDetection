using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Drawing;
using VideoProcessing.Models;
using VideoProcessing.Services;

namespace VideoProcessing.Controllers
{
    public class VideoController : Controller
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly OpenPoseService _openPoseService;

        public VideoController(IWebHostEnvironment hostingEnvironment, OpenPoseService openPoseService)
        {
            _hostingEnvironment = hostingEnvironment;
            _openPoseService = openPoseService;
        }

        public IActionResult ImageForm(ImageModel model)
        {
            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage(ImageModel imageFile)
        {
            var imagePath = "";
            if (imageFile.InferenceModelType == "body25")
            {
                imagePath = _openPoseService.DetectPoseBody25Image(imageFile);
            }

            ImageModel imageModel = new ImageModel
            {
                ImagePath = imagePath
            };

            return View("ImageForm", imageModel);
        }

        public IActionResult VideoForm()
        {
            var videosPath = Path.Combine(_hostingEnvironment.WebRootPath, "videos");
            var videoFiles = Directory.GetFiles(videosPath)
                                       .Select(Path.GetFileName);

            var model = new VideoUploadViewModel
            {
                VideoFileName = videoFiles.FirstOrDefault()
            };

            return View(model);
        }
       
        [HttpPost]
        public async Task<IActionResult> UploadVideo(VideoUploadViewModel model)
        {
            if (model.VideoFile != null)
            {     
                var uploadsPath = Path.Combine(_hostingEnvironment.WebRootPath, "videos");
                var uniqueFileName = Guid.NewGuid().ToString() + ".mp4"; 

                var originalVideoPath = Path.Combine(uploadsPath, "orig_" +uniqueFileName);
                var overlayVideoPath = Path.Combine(uploadsPath, "overlay_" + uniqueFileName); 

                using (var stream = new FileStream(originalVideoPath, FileMode.Create))
                {
                    await model.VideoFile.CopyToAsync(stream);
                }

                {
                    _openPoseService.DetectPoseBody25Video(originalVideoPath, overlayVideoPath);
                }

                model.OriginalVideoFilePath = "orig_" + uniqueFileName;
                model.OverlayVideoFilePath = "overlay_" + uniqueFileName;
                
                return View("VideoForm", model);

            }

            return View("VideoForm", new VideoUploadViewModel { VideoFileName = null });

        }
        public IActionResult VideoExperiment2()
        {
            return View();
        }
        public IActionResult ImageExperiment2()
        {
            return View();
        }
        public IActionResult LiveStream()
        {
            return View();
        }

        [HttpPost]
        public IActionResult GetFrameBodyPoints([FromBody] string frameBase64)
        {
            var height = 360;
            var width = 640;
            List<Point> keyPoints = _openPoseService.DetectPoseBody25ImageBase64(frameBase64, height, width);
            return Ok(JsonConvert.SerializeObject(keyPoints));
        }

        [HttpPost]
        public async Task<IActionResult> ProcessVideoForDownload(IFormFile video)
        {
            if (video == null || video.Length == 0)
            {
                return BadRequest("Upload a file.");
            }

            var uploadsFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "videos");
            var fileName = Path.GetRandomFileName() + Path.GetExtension(video.FileName);
            var filePath = Path.Combine(uploadsFolderPath, fileName);

            if (!Directory.Exists(uploadsFolderPath))
            {
                Directory.CreateDirectory(uploadsFolderPath);
            }

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await video.CopyToAsync(stream);
            }

            //var outputFileName = Path.GetFileNameWithoutExtension(fileName) + "_processed" + Path.GetExtension(fileName);
            var outputFileName = Path.GetFileNameWithoutExtension(fileName) + "_processed.mp4";
            var outputFilePath = Path.Combine(uploadsFolderPath, outputFileName);
            _openPoseService.DetectPoseBody25Video(filePath, outputFilePath);

            System.IO.File.Delete(filePath);

            var memory = new MemoryStream();
            await using (var output = new FileStream(outputFilePath, FileMode.Open))
            {
                await output.CopyToAsync(memory);
            }
            memory.Position = 0;

            Response.OnCompleted(async () =>
            {
                await Task.Delay(10000);
                if (System.IO.File.Exists(outputFilePath))
                {
                    System.IO.File.Delete(outputFilePath);
                }
            });

            return File(memory, "application/octet-stream", outputFileName);
        }

    }
}
