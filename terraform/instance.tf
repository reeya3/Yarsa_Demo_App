#datasouce for image ami
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = [var.image_name]
  }
  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

#creating instance
resource "aws_instance" "yarsa-app" {
  # ami                    = var.instance_image_id
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.yarsa-key-tf.key_name
  vpc_security_group_ids = [aws_security_group.allow_tls.id]
  associate_public_ip_address = true

  tags = {
    name = "yarsa-ec2-instance"
  }
}
#############################
# Dynamic Ansible Inventory
#############################
resource "local_file" "ansible_inventory" {
  depends_on = [aws_instance.yarsa_app]
  filename   = "${path.module}/inventory.ini"

  content = <<EOT
[app_servers]
app1 ansible_host=${aws_instance.yarsa_app.public_ip} ansible_user=ubuntu ansible_ssh_private_key_file="${path.module}/id_rsa"
EOT
}

#############################
# Wait for SSH Availability
#############################
resource "null_resource" "wait_for_ssh" {
  depends_on = [aws_instance.yarsa_app]

  provisioner "local-exec" {
    command = <<EOT
      echo "Waiting for SSH to be available..."
      for i in {1..30}; do
        ssh -o StrictHostKeyChecking=no -i ${path.module}/id_rsa ubuntu@${aws_instance.yarsa_app.public_ip} echo "SSH ready" && exit 0
        echo "SSH not ready, retrying... ($i/30)"
        sleep 10
      done
      echo "SSH not available after 5 minutes"
      exit 1
    EOT
  }
}

#############################
# Run Ansible Playbook Automatically
#############################
resource "null_resource" "ansible_provision" {
  depends_on = [local_file.ansible_inventory, null_resource.wait_for_ssh]

  triggers = {
    inventory_content = local_file.ansible_inventory.content
    instance_ip       = aws_instance.yarsa_app.public_ip
  }

  provisioner "local-exec" {
    command = <<EOT
      echo "Running Ansible Playbook with Vault..."
      ansible-playbook -i ${local_file.ansible_inventory.filename} ${path.module}/../ansible/site.yml \
      --vault-password-file ${pathexpand(var.vault_password_file)} -u ubuntu --private-key ${path.module}/id_rsa
    EOT

    environment = {
      ANSIBLE_HOST_KEY_CHECKING = "False"
    }
  }
}

# Outputs
output "app_server_ip" {
  value = aws_instance.yarsa_app.public_ip
}

output "ssh_command" {
  value = "ssh ubuntu@${aws_instance.yarsa_app.public_ip} -i ${pathexpand("${path.module}/id_rsa")}"
}

