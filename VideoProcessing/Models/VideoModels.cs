using System.ComponentModel.DataAnnotations;

namespace VideoProcessing.Models
{
    public class VideoUploadViewModel
    {
        [Required]
        [Display(Name = "Video File")]
        public IFormFile VideoFile { get; set;}
        public string VideoFileName { get; set; }
        public string InferenceModelType { get; set; }
        public string OriginalVideoFilePath { get; set; }
        public string OverlayVideoFilePath { get; set; }
    }
    public class ImageModel
    {
        public IFormFile Image { get; set; }
        public string InferenceModelType { get;set; }
        public string ImagePath { get; set; }
    }
}
