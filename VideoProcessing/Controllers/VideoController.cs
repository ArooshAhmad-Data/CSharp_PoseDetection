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


    }
}
