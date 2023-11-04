namespace VideoProcessing.Models
{
    public class Body25Config
    {
        public int InWidth { get; set; }
        public int InHeight { get; set; }
        public double threshold { get; set; }
        public int nPoints { get; set; }
        public string protoxPath { get; set; }
        public string weightsPath { get; set;}
        public Dictionary<string, int> BodyParts { get; set; }
        public int[,] PartPairs { get; set; }
        public double[][] Colors { get; set; }
    }
}
