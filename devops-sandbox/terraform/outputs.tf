output "ec2_instance_ids" {
  description = "EC2 instance IDs"
  value       = module.ec2.instance_ids
}

output "ec2_private_ips" {
  description = "EC2 private IP addresses"
  value       = module.ec2.private_ips
}

output "ec2_public_ips" {
  description = "EC2 public IP addresses"
  value       = module.ec2.public_ips
}