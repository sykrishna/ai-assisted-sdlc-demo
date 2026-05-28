output "bootstrap_status" {
  value       = "infrastructure-bootstrap-ready"
  description = "Indicates Terraform bootstrap files are present"
}

output "environment" {
  value       = var.environment
  description = "Active environment configured for this stack"
}

output "network_module_status" {
  value       = module.network.module_status
  description = "Status output from the network module"
}
