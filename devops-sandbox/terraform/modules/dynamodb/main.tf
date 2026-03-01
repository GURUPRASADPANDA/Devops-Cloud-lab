resource "aws_dynamodb_table" "main" {
  name           = "${var.project_name}-${var.environment}-state"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "${var.project_name}-state"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "app_data" {
  name           = "${var.project_name}-${var.environment}-app-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    Name        = "${var.project_name}-app-data"
    Project     = var.project_name
    Environment = var.environment
  }
}
