resource "aws_s3_bucket" "main" {
  bucket        = "${var.project_name}-${var.environment}-artifacts"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-artifacts"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}
