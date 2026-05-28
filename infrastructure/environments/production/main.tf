module "stack" {
  source = "../../"

  environment  = "production"
  aws_region   = var.aws_region
  project_name = var.project_name
  tags         = var.tags
}
