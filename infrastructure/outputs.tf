output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "dynamodb_table_name" {
  description = "DynamoDB main table name"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB main table ARN"
  value       = module.dynamodb.table_arn
}

output "s3_documents_bucket" {
  description = "S3 documents bucket name"
  value       = module.s3.documents_bucket_name
}

output "s3_media_bucket" {
  description = "S3 media bucket name"
  value       = module.s3.media_bucket_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.api_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = module.api_gateway.api_id
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain"
  value       = module.cloudfront.distribution_domain
}
