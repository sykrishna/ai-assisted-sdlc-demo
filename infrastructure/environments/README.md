# Terraform Environments

Each environment folder (`dev`, `staging`, `production`) contains:

- `main.tf`: environment wrapper for the root infrastructure module.
- `variables.tf`: environment input contract.
- `terraform.tfvars.example`: non-sensitive defaults and tagging examples.
- `backend.hcl.example`: remote state backend placeholders.

## Usage Pattern

1. Copy `backend.hcl.example` to `backend.hcl`.
2. Copy `terraform.tfvars.example` to `terraform.tfvars`.
3. Run `terraform init -backend-config=backend.hcl`.
4. Run `terraform validate` and `terraform plan`.

No real resources are provisioned by this bootstrap scaffold.
