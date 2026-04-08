
# Technical Assessment Task

**Prepared by:** Reeya Manandhar

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technologies Used](#2-technologies-used)
3. [Application Development](#3-application-development)
4. [Docker: Reproducible & Secure Builds](#4-docker-reproducible--secure-builds)
5. [NGINX: Reverse Proxy Configuration](#5-nginx-reverse-proxy-configuration)
6. [Terraform: Provisioning the Server](#6-terraform-provisioning-the-server)
7. [Ansible: Configuration & Deployment](#7-ansible-configuration--deployment)
8. [Monitoring & Alerting](#8-monitoring--alerting)
9. [Stress Testing](#9-stress-testing)
10. [Step-by-Step Reproduction Guide](#10-step-by-step-reproduction-guide)
11. [Thought Process & Problem-Solving](#11-thought-process--problem-solving)
12. [Security Considerations](#12-security-considerations)
13. [Remaining Improvements / Future Work](#13-remaining-improvements--future-work)
14. [Conclusion](#14-conclusion)

---

## 1. Project Overview

This project demonstrates how a complete application lifecycle can be automated using modern DevOps practices — starting from development and ending with monitoring and alerting in production.

The main objective was to design a system that is:

- **Easy to reproduce**
- **Consistent across environments**
- **Automated** from infrastructure to deployment
- **Observable** and production-ready

Rather than focusing only on application code, the goal was to simulate how real production systems are built, deployed, and monitored.

### Project Goals

The assignment covers the full DevOps workflow:

1. Build a simple API service
2. Containerize the application
3. Provision infrastructure automatically
4. Configure servers using automation
5. Deploy the application consistently
6. Monitor logs, uptime, and system health

---

## 2. Technologies Used

### Application Layer
- Node.js (TypeScript)
- PostgreSQL

### DevOps & Infrastructure
- Docker
- Dev Containers
- Terraform
- Ansible
- Docker Swarm

### Monitoring & Logging
- Prometheus
- Grafana
- Loki
- Promtail
- Alertmanager
- Blackbox Exporter
- Node Exporter
- cAdvisor

---

## 3. Application Development

### Overview

Due to storage limitations on the local machine, a previously configured VM was reused for development and initial testing. To demonstrate the end-to-end workflow on a cloud environment, a new AWS EC2 instance was also provisioned.

The Ansible scripts were executed on both the AWS instance and the local VM to ensure:

- Infrastructure was consistently configured across different environments
- The application was deployed in a reproducible way
- The monitoring stack (Prometheus, Grafana, Loki, Promtail, and Alertmanager) was set up and functional on both environments

This highlights the flexibility and reliability of the automation setup — showing deployment works not only in a single controlled environment, but across different OS variants and infrastructures.

### Dev Container: Consistent Development Environment

A Dev Container is a pre-configured development environment that runs inside Docker. When a developer opens this project in VS Code or any compatible editor, the editor automatically starts a container with Node.js, PostgreSQL, and every required tool already installed — no local installation needed.

The key file is `.devcontainer/devcontainer.json`, which defines:

- Which Docker image to base the environment on
- Which VS Code extensions to automatically install
- Which ports to forward to the developer's browser
- Commands to run once the container starts (e.g., `npm install`)

---<img width="631" height="274" alt="Untitled 12" src="https://github.com/user-attachments/assets/8392b00e-c323-41fb-816e-6a9d37255f7d" />


## 4. Docker: Reproducible & Secure Builds

Docker packages the application and everything it needs to run into a single portable image. This image can be moved to any server and run identically, eliminating environment differences.

### 4.1 Multi-Stage Dockerfile

The Dockerfile uses **multi-stage builds**. Instead of one large image, the build process happens in two stages:

- **Stage 1 — Builder:** A full Node.js environment installs all packages (including developer tools) and compiles the TypeScript code into plain JavaScript.
- **Stage 2 — Runner:** Only the compiled output and production packages are copied into a minimal, clean image. No build tools, source maps, or secrets carry over.
  

### 4.2 Security Measures

| Measure | Why It Matters |
|---|---|
| **Non-root user** | The app runs as a low-privilege user (`appuser`). If compromised, an attacker cannot take over the system. |
| **Alpine base image** | Alpine Linux is minimal — fewer packages means fewer potential vulnerabilities. |
| **Multi-stage build** | No build tools (compilers, package managers) end up in the production image. |
| **`.dockerignore`** | Prevents secrets, local config files, and unnecessary data from being accidentally included. |

### 4.3 Docker Hub

The built Docker image is pushed to Docker Hub for centralized, accessible deployment.

- After building locally, the image is pushed to Docker Hub
- Other environments (servers, CI/CD pipelines) can pull the image directly using the image name and tag
- Ensures consistent and reliable deployments — no need to rebuild on every server
  
<img width="624" height="144" alt="d4" src="https://github.com/user-attachments/assets/dd484873-aef7-4628-8912-705fdb77fcb2" />

### 4.4 Docker Swarm (Instead of Docker Compose)

Docker Swarm is used for orchestration and deployment instead of plain `docker compose up`.

- Services are defined in a `docker-stack.yml` file (similar to `docker-compose.yml`)
- The stack is deployed using:
  ```bash
  docker stack deploy -c docker-stack.yml <stack_name>
  ```
- Swarm manages container scheduling, networking, and scaling automatically
  
<img width="625" height="113" alt="d6" src="https://github.com/user-attachments/assets/a8093497-66ac-4d03-8d6e-f3d4131835ef" />

---

## 5. NGINX: Reverse Proxy Configuration

- NGINX was installed and configured using Ansible, ensuring automated and reproducible setup
- Handles routing requests to the Node.js API application, providing a stable endpoint for users
- HTTPS is enabled using a self-signed certificate
- NGINX logs are collected alongside application logs and sent to the monitoring stack for centralized logging and visualization

---

## 6. Terraform: Provisioning the Server

Terraform creates the server where the application runs. The server's configuration is written as code, so it can be created, destroyed, or recreated reliably at any time.

### 6.1 What Terraform Does

The Terraform configuration provisions the required infrastructure on AWS:

- **EC2 Instance Creation** — Launches an EC2 instance as the target server for application deployment
- **Security Group Configuration** — Defines firewall rules to allow traffic only on required ports (SSH, HTTP, HTTPS, monitoring ports)
- **Output Generation** — Exposes the EC2 instance's public IP, which Ansible then uses as the target host

### 6.2 Project Structure

```
.
├── aws_kp.tf
├── aws_sg.tf
├── id_rsa
├── id_rsa.pub
├── instance.tf
├── provider.tf
├── terraform.tfstate
├── terraform.tfstate.backup
├── terraform.tfvars
└── variables.tf
```

### 6.3 Provisioning Commands

```bash
terraform init      # Download required providers (only needed once)
terraform validate  # Check if Terraform code is valid
terraform plan      # Preview what would be created/changed
terraform apply     # Create the server (asks for confirmation first)
terraform destroy   # Tear down everything Terraform created
```

---

## 7. Ansible: Configuration & Deployment

Once Terraform creates the server, Ansible takes over — connecting over SSH and running a playbook to install software and deploy the application. No manual SSH-ing or command-running is needed.

### 7.1 Ansible Roles

| Role | What It Does |
|---|---|
| `common` | Installs system updates, sets timezone, configures firewall, sets up a non-root deploy user |
| `firewall` | Configures firewall rules |
| `docker` | Installs Docker and Docker Compose, initializes swarm. Works on both Debian (apt) and Red Hat (dnf) |
| `swarm` | Initializes Docker Swarm |
| `app` | Copies the Docker Compose file, pulls the latest image, starts containers in swarm mode |
| `monitoring` | Deploys monitoring agents: Promtail, Node Exporter, cAdvisor |

> **Note:** Prometheus, Grafana, Loki, Alertmanager, and Blackbox Exporter were installed on the host machine.

### 7.2 Cross-Platform Compatibility

The playbooks work on multiple Linux distributions using Ansible's built-in conditional logic:

- Debian / Ubuntu
- RedHat / Rocky / CentOS / Fedora

Ansible automatically detects the OS and runs the correct package manager commands, ensuring deployment portability.

### 7.3 Running the Playbook

```bash
ansible-playbook site.yml --vault-password-file ~/.vault_pass
```

- `site.yml` — The main playbook entry point containing all roles, tasks, and configurations
- `--vault-password-file ~/.vault_pass` — Reads the vault password from a file instead of prompting interactively

---

## 8. Monitoring & Alerting

The monitoring stack provides full visibility into server and application health. It is entirely self-hosted and deployed alongside the application using Docker Compose (swarm mode).

The stack is split between host machine and VMs:

| Location | Components | Purpose |
|---|---|---|
| **Host Machine** | Prometheus, Grafana, Loki, Alertmanager, Blackbox Exporter | Centralized collection, visualization, and alerting |
| **Virtual Machines** | Promtail, Node Exporter, cAdvisor | Local agents collecting system metrics, container metrics, and logs |

**Benefits of this setup:**
1. Centralized monitoring and alerting — simplifies management and visualization
2. Lightweight agents on VMs — reduces resource usage on monitored servers
3. Scalable and flexible — new VMs or containers can be monitored without reconfiguring the host
4. Reliable alerting — host receives accurate metrics and logs from VM agents

<img width="625" height="299" alt="m1" src="https://github.com/user-attachments/assets/6900ff6c-f217-4468-bf02-476e1727f201" />


### 8.1 Prometheus: Server Metrics

Prometheus is a time-series database that regularly scrapes metrics from configured targets, paired with Node Exporter running on the server.

Metrics collected include:

- **CPU usage** — broken down by core and mode (idle, user, system, iowait)
- **Memory usage** — total, used, free, and swap
- **Disk usage** — space used/free per filesystem
- **Network I/O** — bytes sent and received per interface
- **Application uptime** — via the Blackbox Exporter HTTP probe

### 8.2 Grafana: Dashboards

Grafana provides the visual interface. Pre-configured dashboards imported:

- Node Exporter Full
- cAdvisor
- Prometheus Blackbox Exporter

### 8.3 Loki & Promtail: Application Logs

Loki is the log storage system. Promtail is the agent that collects logs and sends them to Loki, watching the Docker socket to automatically pick up log lines from application containers. Every log line appears in the Grafana logs dashboard within seconds — no manual log file access needed.

### 8.4 Alertmanager: Spike Notifications

Alertmanager receives alerts from Prometheus when thresholds are crossed and routes them to notification channels (email, Slack, PagerDuty).

#### Resource Spike Alerts

| Alert | Condition |
|---|---|
| High CPU Usage | Warning if CPU > 80% for 2 min |
| Critical CPU Usage | Critical if CPU > 95% for 1 min |
| High Memory Usage | Warning if memory > 85% for 2 min |
| Critical Memory Usage | Critical if memory > 95% for 1 min |
| High Disk Usage | Warning if disk > 80% full for 5 min |
| Critical Disk Usage | Critical if disk > 95% full for 2 min |

<img width="613" height="285" alt="alerts" src="https://github.com/user-attachments/assets/1eb2c917-f339-4c3a-9abc-d4eb4369150e" />


#### Uptime / Availability Alerts

| Alert | Condition |
|---|---|
| App Endpoint Down | Critical if HTTP probe fails for 1 min |
| App High Response Time | Warning if HTTP response > 2 seconds for 2 min |
| Node Exporter Down | Critical if node_exporter is unreachable for 1 min |

### 8.5 Blackbox Exporter: Uptime Monitoring

The Blackbox Exporter makes an HTTP request to the application's endpoint every 30 seconds. If the endpoint does not return HTTP 200, the uptime metric drops and an alert fires. Grafana shows total uptime as a percentage and human-readable duration.

### 8.6 cAdvisor

cAdvisor provides real-time container-level insights — CPU, memory, disk, and network usage per container — exposing these metrics for Prometheus to scrape.

---

## 9. Stress Testing

[`stress-ng`](https://github.com/ColinIanKing/stress-ng) was used to validate alert thresholds under CPU load.

```bash
sudo stress-ng --cpu 2 --cpu-method matrixprod --timeout 300s --metrics-brief
```

**What this does:**

1. Starts 2 CPU workers
2. Each worker performs matrix multiplication continuously
3. System is stressed for 5 minutes
4. After finishing, a brief summary of metrics is printed

<img width="1170" height="517" alt="Untitled 11" src="https://github.com/user-attachments/assets/7eba93e1-20cf-40a1-904f-83914d5d7528" />

---

## 10. Step-by-Step Reproduction Guide

### 10.1 Prerequisites

Install the following tools on your local machine:

- [Docker](https://docs.docker.com/get-docker/) / Docker Desktop (macOS)
- [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Terraform](https://developer.hashicorp.com/terraform/install)
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
- [Git](https://git-scm.com/)

### 10.2 Local Development (Dev Container)

```bash
# Step 1: Clone the repository
git clone <repo-url>
cd <repo-name>

# Step 2: Open in VS Code — the Dev Container will start automatically
code .

# Step 3: Run the application inside the container
npm run dev
```

The API will be available at `http://localhost:3001`.

### 10.3 Provisioning the Server (Terraform)

```bash
cd aws-instance-tf

terraform init
terraform validate
terraform plan
terraform apply
```

- If using a static server, copy its IP into `ansible/inventory/hosts.yml`
- If using AWS, reference the public IP dynamically: `aws_instance.<identifier>.public_ip`

### 10.4 Configuring and Deploying (Ansible)

The full workflow:

1. Terraform provisions EC2 and sets up networking, security groups, and required resources
2. Dynamic Ansible inventory automatically maps the EC2 public IP to the appropriate host group
3. Waits for SSH availability — ensures the instance is fully ready before configuration begins
4. Executes the Ansible playbook to install dependencies, deploy the application, and apply configuration best practices

```bash
ansible-playbook site.yml --vault-password-file ~/.vault_pass
```

### 10.5 Accessing the Monitoring Dashboards

Once Ansible completes, the following services are accessible:

| Service | URL |
|---|---|
| Grafana (dashboards) | `http://<server-ip>:3000` — Default login: `admin` / `admin` |
| Prometheus | `http://<server-ip>:9090` |
| Alertmanager | `http://<server-ip>:9093` |
| Application API | `http://<server-ip>:3001` |

### 10.6 Testing Alerts (Stress Test)

```bash
sudo stress-ng --cpu 2 --cpu-method matrixprod --timeout 300s --metrics-brief
```

This triggers the `HighCPUUsage` alert in Alertmanager within 1–2 minutes.

---

## 11. Thought Process & Problem-Solving

### 11.1 Why Start with the Dev Container?

The Dev Container was set up before writing any application code. The reasoning: if the development environment isn't consistent from the start, small differences accumulate and debugging becomes about environment issues rather than actual bugs. Starting with a locked-down container environment forced clarity about exactly what tools and versions were needed.

### 11.2 DevContainer / Local Development

**Challenge:** Node.js app connecting to a PostgreSQL container inside a DevContainer — hostnames changed and `localhost` no longer worked.

**Solution:** Used `host.docker.internal` or Docker networking for cross-container connectivity inside Dev Containers.

### 11.3 Ansible & Terraform Integration

**Challenge:** Passing dynamic AWS public IPs from Terraform to Ansible inventory, and ensuring EC2 instances are ready before running playbooks.

**Solution:**
1. Used `aws_instance.<identifier>.public_ip` for dynamic IP reference
2. Dynamic inventory maps the public IP automatically
3. Added SSH readiness check before executing playbooks
4. Combined Terraform + Ansible into a seamless, single workflow

---

## 12. Security Considerations

| Layer | Measure | Reason |
|---|---|---|
| Docker | Non-root container user | Limits damage if the application is compromised |
| Docker | Image scanning with Snyk | Verifies vulnerabilities in base images and dependencies |
| Server | Firewall (ufw/firewalld) | Only ports 22, 80, 443, and monitoring ports are open |
| Ansible | SSH key authentication | No passwords — keys are harder to brute-force |
| Terraform | No hardcoded secrets | Credentials come from environment variables, never the codebase |
| Application | Git repository scanning with Gitleaks | Scans all directories to verify no sensitive information or secrets are committed |

### 12.1 Snyk

[Snyk](https://snyk.io/) scans applications, dependencies, and Docker images for known vulnerabilities, covering:

- Application dependencies (npm, pip, Maven, etc.)
- Container images (base image and installed packages)
- Infrastructure as code (Terraform, Kubernetes configs)

It also suggests upgrades or patches and can monitor projects continuously for new risks.

> The root cause of identified vulnerabilities was an outdated Node.js base image. Upgrading to a newer base image along with a compatible npm version resolved the issue. Remaining vulnerabilities were primarily from underlying Alpine OS packages and npm's internal dependencies — these may persist even in newer npm versions.

### 12.2 GitLeaks

[Gitleaks](https://github.com/gitleaks/gitleaks) scans Git repositories for sensitive information or secrets:

- **Purpose:** Detects API keys, passwords, tokens, SSH keys, and other secrets accidentally committed to Git
- **How it works:** Scans commits, branches, and tags using regex rules to report potential secrets
- **Use case:** Prevents sensitive data from being pushed to public or private repos

```bash
gitleaks detect --source <repo-directory>/
```

---

## 13. Remaining Improvements / Future Work

- [ ] Spin up VMs dynamically using Terraform for fully reproducible infrastructure environments
- [ ] Add CI/CD pipeline integration to automate builds, tests, and deployments
- [ ] Use private Docker image repositories to prevent unauthorized access to proprietary code
- [ ] Improve Git workflow automation to enforce code quality and secure secret handling
- [ ] Finalize Firewalld automation via Ansible for better server security
- [ ] Expand Docker Swarm documentation and best practices for orchestration

---

## 14. Conclusion

This project demonstrates a complete DevOps workflow:

**Development → Containerization → Infrastructure → Deployment → Monitoring → Security**

The system is:

- ✅ **Reproducible** — Dev Containers and IaC ensure identical environments
- ✅ **Automated** — Terraform + Ansible eliminate manual server setup
- ✅ **Secure** — Non-root containers, SSH keys, firewall rules, and secret scanning
- ✅ **Observable** — Full metrics, logs, and alerting via the Prometheus/Grafana stack
- ✅ **Production-oriented** — Docker Swarm orchestration with health monitoring and alerting

The primary focus was not only making the application run, but ensuring it can be deployed, monitored, and maintained reliably in real-world environments.
