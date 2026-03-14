# Deployment Guide (AWS ECR + EKS)

This guide explains how to deploy this system using Docker, Amazon ECR, and Amazon EKS in a way that is easy to follow for new team members.

## 1. Target Architecture

- API: Docker image in ECR, running in EKS (Kubernetes Deployment + Service)
- Ingress: AWS Load Balancer Controller (ALB)
- Database: Amazon RDS PostgreSQL (outside cluster)
- Frontend: static build hosted on S3 + CloudFront
- Secrets: AWS Secrets Manager or Kubernetes Secret (minimum)

Why this split:

- API gets Kubernetes scaling and rolling updates.
- Web stays cheap and fast as static hosting.
- DB remains managed and durable with backups.

## 2. Prerequisites

Install and configure:

- AWS CLI v2
- Docker
- kubectl
- eksctl (or Terraform, if your team prefers IaC)
- Helm (recommended for add-ons)

AWS requirements:

- An AWS account with permissions for ECR, EKS, IAM, EC2, VPC, ALB, RDS, S3, CloudFront.
- A hosted DNS zone (typically Route53) for API and web domains.

Set environment variables in your terminal:

```bash
export AWS_REGION=ap-southeast-1
export AWS_ACCOUNT_ID=<your-account-id>
export CLUSTER_NAME=management-system-eks
export ECR_REPO_API=management-system-api
export APP_NAMESPACE=management-system
```

## 3. Create ECR Repository

```bash
aws ecr create-repository \
	--repository-name "$ECR_REPO_API" \
	--region "$AWS_REGION"
```

Authenticate Docker to ECR:

```bash
aws ecr get-login-password --region "$AWS_REGION" | \
docker login --username AWS --password-stdin \
"$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
```

## 4. Build and Push API Image

From repository root:

```bash
docker build -t "$ECR_REPO_API:latest" ./api
docker tag "$ECR_REPO_API:latest" \
"$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_API:latest"
docker push \
"$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_API:latest"
```

For production, use immutable tags, for example Git SHA, instead of only latest.

## 5. Create EKS Cluster

Example with eksctl:

```bash
eksctl create cluster \
	--name "$CLUSTER_NAME" \
	--region "$AWS_REGION" \
	--nodes 2 \
	--node-type t3.medium \
	--managed
```

Update kubeconfig:

```bash
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
```

Create namespace:

```bash
kubectl create namespace "$APP_NAMESPACE"
```

## 6. Install AWS Load Balancer Controller

Install this controller so Kubernetes Ingress can provision an ALB.

Follow the official AWS EKS guide for:

- IAM OIDC provider for cluster
- IAM policy and service account for controller
- Helm install of aws-load-balancer-controller

Tip: do not skip IAM permissions. Most first-time ingress failures happen here.

## 7. Configure Database (RDS PostgreSQL)

Create RDS PostgreSQL instance and capture:

- host
- port
- username
- password
- database name

Allow inbound traffic from EKS worker node security group to RDS on 5432.

## 8. Create Kubernetes Secrets and Config

Minimum approach (Kubernetes Secret):

```bash
kubectl -n "$APP_NAMESPACE" create secret generic api-env \
	--from-literal=NODE_ENV=production \
	--from-literal=PORT=4000 \
	--from-literal=DB_HOST=<rds-endpoint> \
	--from-literal=DB_PORT=5432 \
	--from-literal=DB_USER=<db-user> \
	--from-literal=DB_PASSWORD=<db-password> \
	--from-literal=DB_NAME=<db-name> \
	--from-literal=DB_SSL=true
```

Recommended later: store secrets in AWS Secrets Manager and sync into cluster.

## 9. Deploy API to EKS

Create file k8s/api-deployment.yaml:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
	name: api
	namespace: management-system
spec:
	replicas: 2
	selector:
		matchLabels:
			app: api
	template:
		metadata:
			labels:
				app: api
		spec:
			containers:
				- name: api
					image: <account>.dkr.ecr.<region>.amazonaws.com/management-system-api:<tag>
					ports:
						- containerPort: 4000
					envFrom:
						- secretRef:
								name: api-env
					readinessProbe:
						httpGet:
							path: /api/v1/health
							port: 4000
						initialDelaySeconds: 10
						periodSeconds: 10
					livenessProbe:
						httpGet:
							path: /api/v1/health
							port: 4000
						initialDelaySeconds: 20
						periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
	name: api-service
	namespace: management-system
spec:
	selector:
		app: api
	ports:
		- port: 80
			targetPort: 4000
			protocol: TCP
```

Create file k8s/api-ingress.yaml:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
	name: api-ingress
	namespace: management-system
	annotations:
		kubernetes.io/ingress.class: alb
		alb.ingress.kubernetes.io/scheme: internet-facing
		alb.ingress.kubernetes.io/target-type: ip
spec:
	rules:
		- host: api.example.com
			http:
				paths:
					- path: /
						pathType: Prefix
						backend:
							service:
								name: api-service
								port:
									number: 80
```

Apply manifests:

```bash
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-ingress.yaml
```

Check rollout:

```bash
kubectl -n "$APP_NAMESPACE" rollout status deployment/api
kubectl -n "$APP_NAMESPACE" get ingress
```

## 10. Run Database Migrations

Important: run migrations before sending live traffic to new API versions that require schema changes.

Use one of these approaches:

- CI job running npm run typeorm:migrate with production env
- Kubernetes Job for migration per release

## 11. Deploy Web (S3 + CloudFront)

Build web:

```bash
cd web
npm ci
VITE_API_BASE_URL=https://api.example.com/api/v1 npm run build
```

Upload to S3 bucket and invalidate CloudFront cache:

```bash
aws s3 sync dist/ s3://<web-bucket-name> --delete
aws cloudfront create-invalidation \
	--distribution-id <distribution-id> \
	--paths "/*"
```

## 12. CI/CD Pipeline (Recommended)

On push to main:

1. Run tests and builds for api and web.
2. Build API image and push to ECR with immutable tag.
3. Deploy to EKS by updating image tag in Deployment.
4. Run migration step (if needed).
5. Build and publish web to S3 + CloudFront invalidation.
6. Run smoke tests against health and key business flows.

## 13. Autoscaling and Reliability

Recommended defaults:

- HorizontalPodAutoscaler for API (CPU and memory)
- Cluster Autoscaler enabled for node groups
- PodDisruptionBudget to avoid full outage during node maintenance
- At least 2 replicas in production

## 14. Rollback Playbook

API rollback:

```bash
kubectl -n "$APP_NAMESPACE" rollout undo deployment/api
```

Web rollback:

- Re-deploy previous dist artifact to S3
- Invalidate CloudFront cache

Database rollback:

- Prefer backward-compatible migrations
- If rollback is needed, execute safe down migration with maintenance procedure

## 15. Production Checklist

Before go-live:

1. HTTPS enabled for API and web domains.
2. DB security groups locked down.
3. Secrets not stored in Git.
4. Health endpoint reachable through ALB.
5. Logs and metrics visible in monitoring stack.
6. Backup and restore procedure tested.
