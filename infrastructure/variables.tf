variable "aws_region" {
  description = "AWS region for infrastructure resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
}

variable "project_name" {
  description = "Project name used in naming and tagging conventions"
  type        = string
  default     = "ai-assisted-sdlc-demo"
}

variable "tags" {
  description = "Additional tags to merge into the default tag set"
  type        = map(string)
  default     = {}
}
