variable "aws_region" {
  description = "AWS region for the dev environment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used in resource naming"
  type        = string
  default     = "ai-assisted-sdlc-demo"
}

variable "tags" {
  description = "Additional environment-specific tags"
  type        = map(string)
  default     = {}
}
