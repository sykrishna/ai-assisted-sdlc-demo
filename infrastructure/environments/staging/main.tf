module "stack" {
  source = "../../"

  environment  = "staging"
  aws_region   = var.aws_region
  project_name = var.project_name
  tags         = var.tags
}
