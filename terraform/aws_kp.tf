#creating ssh key
resource "aws_key_pair" "yarsa-key-tf" {
  key_name   = "yarsa-key-tf"
  public_key = file("${path.module}/id_rsa.pub")
}