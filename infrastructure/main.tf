provider "aws" {
  region = var.aws_region
}

module "network" {
  source = "./modules/network"
}
