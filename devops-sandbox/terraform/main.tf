terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "local" {
    path = "/workspace/state/terraform.tfstate"
  }
}

provider "aws" {
  access_key                  = "test"
  secret_key                  = "test"
  region                      = var.aws_region
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    s3       = var.localstack_endpoint
    ec2      = var.localstack_endpoint
    iam      = var.localstack_endpoint
    dynamodb = var.localstack_endpoint
    sts      = var.localstack_endpoint
  }
}

module "vpc" {
  source             = "./modules/vpc"
  project_name       = var.project_name
  vpc_cidr           = var.vpc_cidr
  public_subnet_cidr = var.public_subnet_cidr
  availability_zone  = var.availability_zone
}

module "iam" {
  source       = "./modules/iam"
  project_name = var.project_name
}

module "ec2" {
  source            = "./modules/ec2"
  project_name      = var.project_name
  subnet_id         = module.vpc.public_subnet_id
  security_group_id = module.vpc.security_group_id
  instance_profile  = module.iam.instance_profile_name
  ami_id            = var.ami_id
  instance_type     = var.instance_type
}

module "s3" {
  source       = "./modules/s3"
  project_name = var.project_name
  environment  = var.environment
}

module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}
