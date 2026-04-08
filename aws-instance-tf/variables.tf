variable "ports" {
  type = list(number)
}

variable "aws_region" {
  type = string
}

variable "instance_image_id" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "vault_password_file" {
  type        = string
  description = "Path to the Ansible Vault password file"
  default     = "~/.vault_pass"
}

#variable "access_key" {
#  type = string
#}

#variable "secret_key" {
#  type = string
#}
