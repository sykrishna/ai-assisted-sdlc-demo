locals {
  common_tags = merge(
    {
      project     = var.project_name
      environment = var.environment
      managed_by  = "terraform"
      repo        = "ai-assisted-sdlc-demo"
    },
    var.tags
  )
}
