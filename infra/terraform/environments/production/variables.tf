variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "bonsai"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = "mikhail.waddell@gmail.com"
}