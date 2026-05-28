module "network" {
  source = "./modules/network"

  environment  = var.environment
  project_name = var.project_name
  tags         = local.common_tags
}

module "security_baseline" {
  source = "./modules/security-baseline"
}

module "observability_baseline" {
  source = "./modules/observability-baseline"
}

module "compute_baseline" {
  source = "./modules/compute-baseline"
}
