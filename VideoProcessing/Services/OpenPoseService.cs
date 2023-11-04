using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Dnn;
using Emgu.CV.Structure;
using System.Drawing;
using System.Text.RegularExpressions;
using VideoProcessing.Models;

namespace VideoProcessing.Services
{
    public class OpenPoseService
    {
        private readonly IWebHostEnvironment _webHostEnvironment;

        public OpenPoseService(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        private Body25Config GetBody25Config()
        {
            int InWidth = 368;
            int InHeight = 368;
            const double threshold = 0.1;
            const int nPoints = 25;

            var modelsPath = Path.Combine(_webHostEnvironment.WebRootPath, "posemodels");
            var protoFile = Path.Combine(modelsPath, "body25/pose_deploy.prototxt");
            var weightsFile = Path.Combine(modelsPath, "caffemodel/pose_iter_584000.caffemodel");

            var BodyParts = new Dictionary<string, int>()
            {
                     {"Nose",0},
                     {"Neck",1},
                     {"RShoulder",2},
                     {"RElbow",3},
                     {"RWrist",4},
                     {"LShoulder",5},
                     {"LElbow",6},
                     {"LWrist",7},
                     {"MidHip",8},
                     {"RHip",9},
                     {"RKnee",10},
                     {"RAnkle",11},
                     {"LHip",12},
                     {"LKnee",13},
                     {"LAnkle",14},
                     {"REye",15},
                     {"LEye",16},
                     {"REar",17},
                     {"LEar",18},
                     {"LBigToe",19},
                     {"LSmallToe",20},
                     {"LHeel",21},
                     {"RBigToe",22},
                     {"RSmallToe",23},
                     {"RHeel",24},
                     {"Background",25}
            };

            int[,] part_pairs = new int[,]
            {
                {1, 0}, {1, 2}, {1, 5},
                {2, 3}, {3, 4}, {5, 6},
                {6, 7}, {0, 15}, {15, 17},
                {0, 16}, {16, 18}, {1, 8},
                {8, 9}, {9, 10}, {10, 11},
                {11, 22}, {22, 23},{11, 24},
                {8, 12}, {12, 13}, {13, 14},
                {14, 19}, {19, 20}, {14, 21}
            };

            double[][] colors = new double[][] {
                new double[] {0, 100, 255},
                new double[] {0, 100, 255},
                new double[] {0, 255, 255},
                new double[] {0, 100, 255},
                new double[] {0, 255, 255},
                new double[] {0, 100, 255},
                new double[] {0, 255, 0},
                new double[] {255, 200, 100},
                new double[] {255, 0, 255},
                new double[] {0, 255, 0},
                new double[] {255, 200, 100},
                new double[] {255, 0, 255},
                new double[] {0, 0, 255},
                new double[] {255, 0, 0},
                new double[] {200, 200, 0},
                new double[] {255, 0, 0},
                new double[] {200, 200, 0},
                new double[] {0, 0, 0}
            };

            Body25Config config = new Body25Config
            {
                InWidth = InWidth,
                InHeight = InHeight,
                threshold = threshold,
                nPoints = nPoints,
                protoxPath = protoFile,
                weightsPath = weightsFile,
                BodyParts = BodyParts,
                PartPairs = part_pairs,
                Colors = colors,
            };

            return config;
        }

        public string DetectPoseBody25Image(ImageModel imageModel)
        {
            if (imageModel.Image == null || imageModel.Image.Length == 0)
            {
                return null;
            }

            try
            {
                var imagesPath = Path.Combine(_webHostEnvironment.WebRootPath, "images");
                var new_image = "image_" + Guid.NewGuid().ToString();
                var new_imagePath = Path.Combine(imagesPath, new_image + ".jpg"); 

                using (var stream = new MemoryStream())
                {
                    imageModel.Image.CopyTo(stream);

                    Mat image = new Mat();
                    CvInvoke.Imdecode(stream.ToArray(), ImreadModes.AnyColor, image);

                    Body25Config config = GetBody25Config();

                    var net = DnnInvoke.ReadNetFromCaffe(config.protoxPath, config.weightsPath);
                    var blob = DnnInvoke.BlobFromImage(image, 1.0 / 255.0, new Size(config.InWidth, config.InHeight), new MCvScalar(0, 0, 0));

                    net.SetInput(blob);
                    net.SetPreferableBackend(Emgu.CV.Dnn.Backend.OpenCV);

                    var output = net.Forward();

                    var H = output.SizeOfDimension[2];
                    var W = output.SizeOfDimension[3];

                    var HeatMap = output.GetData();

                    var points = new List<Point>();

                    for (int i = 0; i < config.nPoints; i++)
                    {
                        Matrix<float> matrix = new Matrix<float>(H, W);
                        for (int row = 0; row < H; row++)
                        {
                            for (int col = 0; col < W; col++)
                            {
                                matrix[row, col] = (float)HeatMap.GetValue(0, i, row, col);
                            }
                        }

                        double minVal = 0, maxVal = 0;
                        Point minLoc = default, maxLoc = default;

                        CvInvoke.MinMaxLoc(matrix, ref minVal, ref maxVal, ref minLoc, ref maxLoc);

                        var x = (image.Width * maxLoc.X) / W;
                        var y = (image.Height * maxLoc.Y) / H;


                        if (maxVal > config.threshold)
                        {
                            var point = new Point(x, y);
                            CvInvoke.Circle(image, point, 3, new MCvScalar(0, 0, 255), -1);
                            points.Add(point);
                            #region commented Line Logic
                            //if (points.Count % 2 == 0)
                            //{
                            //    int fromIdx = config.PartPairs[start, 0];
                            //    int toIdx = config.PartPairs[start, 1];
                            //    Point fromPoint = points[fromIdx];
                            //    Point toPoint = points[toIdx];
                            //    if (fromPoint != Point.Empty && toPoint != Point.Empty)
                            //    {
                            //        CvInvoke.Line(image, fromPoint, toPoint, new MCvScalar(0, 255, 0), 2);
                            //    }
                            //    start += 1;
                            //}
                            #endregion
                        }
                        else
                        {
                            points.Add(new Point(0, 0));
                        }
                    }

                    #region commented Circle Drawing Loop
                    //for (int j = 0; j < points.Count; j++)
                    //{
                    //    var p = points[j];
                    //    if (p != Point.Empty)
                    //    {
                    //        CvInvoke.Circle(image, p, 3, new MCvScalar(0, 0, 255), -1);
                    //    }
                    //}
                    #endregion

                    for (int i = 0; i < config.PartPairs.GetLength(0); i++)
                    {
                        int fromIdx = config.PartPairs[i, 0];
                        int toIdx = config.PartPairs[i, 1];

                        Point fromPoint = points[fromIdx];

                        Point toPoint = points[toIdx];

                        if (fromPoint != Point.Empty && toPoint != Point.Empty)
                        {
                            CvInvoke.Line(image, fromPoint, toPoint, new MCvScalar(0, 255, 0), 2);
                        }
                    }


                    CvInvoke.Imwrite(new_imagePath, image);

                    return new_image + ".jpg";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                return null;
            }
        }

        public void DetectPoseBody25Video(string inputVideoPath, string outputVideoPath)
        {

            Body25Config config = GetBody25Config();

            var net = DnnInvoke.ReadNetFromCaffe(config.protoxPath, config.weightsPath);

            using (VideoCapture cap = new VideoCapture(inputVideoPath))
            {
                if (!cap.IsOpened)
                {
                    Console.WriteLine("Unable to open input video.");
                    return;
                }

                int frameWidth = cap.Width;
                int frameHeight = cap.Height;

                using (VideoWriter writer = new VideoWriter(outputVideoPath, VideoWriter.Fourcc('H', '2', '6', '4'), 30, new Size(frameWidth, frameHeight), true))
                {
                    using (Mat frame = new Mat())
                    {
                        while (cap.Read(frame))
                        {
                            var blob = DnnInvoke.BlobFromImage(frame, 1.0 / 255.0, new Size(config.InWidth, config.InHeight), new MCvScalar(0, 0, 0));

                            net.SetInput(blob);
                            net.SetPreferableBackend(Emgu.CV.Dnn.Backend.OpenCV);

                            var output = net.Forward();

                            var H = output.SizeOfDimension[2];
                            var W = output.SizeOfDimension[3];

                            var HeatMap = output.GetData();

                            var points = new List<Point>();

                            for (int i = 0; i < config.nPoints; i++)
                            {
                                Matrix<float> matrix = new Matrix<float>(H, W);
                                for (int row = 0; row < H; row++)
                                {
                                    for (int col = 0; col < W; col++)
                                    {
                                        matrix[row, col] = (float)HeatMap.GetValue(0, i, row, col);
                                    }
                                }

                                double minVal = 0, maxVal = 0;
                                Point minLoc = default, maxLoc = default;

                                CvInvoke.MinMaxLoc(matrix, ref minVal, ref maxVal, ref minLoc, ref maxLoc);

                                var x = (frame.Width * maxLoc.X) / W;
                                var y = (frame.Height * maxLoc.Y) / H;

                                if (maxVal > config.threshold)
                                {
                                    points.Add(new Point(x, y));
                                }
                                else
                                {
                                    points.Add(new Point(0, 0));
                                }
                            }

                            for (int j = 0; j < points.Count; j++)
                            {
                                var p = points[j];
                                if (p != Point.Empty)
                                {
                                    CvInvoke.Circle(frame, p, 8, new MCvScalar(255, 0, 0), -1);
                                }
                            }

                            for (int i = 0; i < config.PartPairs.GetLength(0); i++)
                            {
                                int fromIdx = config.PartPairs[i, 0];
                                int toIdx = config.PartPairs[i, 1];

                                Point fromPoint = points[fromIdx];
                                Point toPoint = points[toIdx];

                                if (fromPoint != Point.Empty && toPoint != Point.Empty)
                                {
                                    CvInvoke.Line(frame, fromPoint, toPoint, new MCvScalar(0, 255, 255), 4);
                                }
                            }

                            writer.Write(frame);

                        }
                    }
                }
            }


        }

        public List<Point> DetectPoseBody25ImageBase64(string frameBase64, int height, int width)
        {
            List<Point> bodyPoints = new List<Point>();
            Match match = Regex.Match(frameBase64, @"data:image/[^;]+;base64,(.+)");
            if (match.Success)
            {
                string image = match.Groups[1].Value;

                byte[] imageBytes = Convert.FromBase64String(image);

                Mat mat = new Mat();
                CvInvoke.Imdecode(imageBytes, ImreadModes.Color, mat);

                if(height > 0)
                {
                    Mat resizedMat = new Mat();

                    CvInvoke.Resize(mat, resizedMat, new Size(width, height), interpolation: Inter.Cubic);
                    bodyPoints = GetKeyPoints(resizedMat);
                }
                else
                {
                    bodyPoints = GetKeyPoints(mat);
                }


                //CvInvoke.Imwrite("output.jpg", mat, new KeyValuePair<ImwriteFlags, int>(ImwriteFlags.JpegQuality,90));

            }
            return bodyPoints;
        }

        public List<Point> GetKeyPoints(Mat image)
        {
            Body25Config config = GetBody25Config();

            var net = DnnInvoke.ReadNetFromCaffe(config.protoxPath, config.weightsPath);

            var blob = DnnInvoke.BlobFromImage(image, 1.0 / 255.0, new Size(config.InWidth, config.InHeight), new MCvScalar(0, 0, 0));

            net.SetInput(blob);
            net.SetPreferableBackend(Emgu.CV.Dnn.Backend.OpenCV);

            var output = net.Forward();

            var H = output.SizeOfDimension[2];
            var W = output.SizeOfDimension[3];

            var HeatMap = output.GetData();

            var points = new List<Point>();

            for (int i = 0; i < config.nPoints; i++)
            {
                Matrix<float> matrix = new Matrix<float>(H, W);
                for (int row = 0; row < H; row++)
                {
                    for (int col = 0; col < W; col++)
                    {
                        matrix[row, col] = (float)HeatMap.GetValue(0, i, row, col);
                    }
                }

                double minVal = 0, maxVal = 0;
                Point minLoc = default, maxLoc = default;

                CvInvoke.MinMaxLoc(matrix, ref minVal, ref maxVal, ref minLoc, ref maxLoc);

                var x = (image.Width * maxLoc.X) / W;
                var y = (image.Height * maxLoc.Y) / H;

                if (maxVal > config.threshold)
                {
                    points.Add(new Point(x, y));
                }
                else
                {
                    points.Add(new Point(0, 0));
                }

            }

            return points;

        }

    }
}
