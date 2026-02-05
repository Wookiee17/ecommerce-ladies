# AWS Deployment Guide for Evara

Complete step-by-step guide to deploy Evara e-commerce platform on AWS.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           AWS Cloud                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Route 53   │───▶│ CloudFront   │───▶│     S3       │      │
│  │    (DNS)     │    │    (CDN)     │    │  (Frontend)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                                      │
│         │    ┌─────────────────────────────────────────────┐   │
│         └───▶│              Application Load Balancer       │   │
│              └─────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┼───────────────┐                 │
│              │               │               │                  │
│         ┌────▼────┐    ┌────▼────┐    ┌────▼────┐             │
│         │  EC2    │    │  EC2    │    │  EC2    │             │
│         │(Backend)│    │(Backend)│    │(Backend)│             │
│         │Auto Sc │    │Auto Sc │    │Auto Sc │             │
│         └────┬────┘    └────┬────┘    └────┬────┘             │
│              │               │               │                  │
│              └───────────────┼───────────────┘                  │
│                              │                                   │
│                         ┌────▼────┐                             │
│                         │ DocumentDB│                            │
│                         │ (MongoDB) │                            │
│                         └─────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Domain name (optional but recommended)
- SSL Certificate (AWS Certificate Manager)

---

## Step 1: Setup AWS Infrastructure

### 1.1 Create VPC and Subnets

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=EvaraVPC}]'

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=EvaraIGW}]'

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway --internet-gateway-id <igw-id> --vpc-id <vpc-id>

# Create Public Subnets
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone ap-south-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=EvaraPublicSubnet1}]'
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 --availability-zone ap-south-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=EvaraPublicSubnet2}]'

# Create Private Subnets for Database
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.3.0/24 --availability-zone ap-south-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=EvaraPrivateSubnet1}]'
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.4.0/24 --availability-zone ap-south-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=EvaraPrivateSubnet2}]'
```

### 1.2 Create Security Groups

```bash
# Backend Security Group
aws ec2 create-security-group \
  --group-name EvaraBackendSG \
  --description "Security group for Evara backend" \
  --vpc-id <vpc-id>

# Add rules
aws ec2 authorize-security-group-ingress \
  --group-id <backend-sg-id> \
  --protocol tcp \
  --port 5000 \
  --source-group <alb-sg-id>

aws ec2 authorize-security-group-ingress \
  --group-id <backend-sg-id> \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# Database Security Group
aws ec2 create-security-group \
  --group-name EvaraDBSG \
  --description "Security group for Evara database" \
  --vpc-id <vpc-id>

aws ec2 authorize-security-group-ingress \
  --group-id <db-sg-id> \
  --protocol tcp \
  --port 27017 \
  --source-group <backend-sg-id>
```

---

## Step 2: Deploy Database (DocumentDB)

### 2.1 Create DocumentDB Cluster

```bash
# Create subnet group
aws docdb create-db-subnet-group \
  --db-subnet-group-name evara-docdb-subnet-group \
  --db-subnet-group-description "Subnet group for Evara DocumentDB" \
  --subnet-ids '["<private-subnet-1-id>","<private-subnet-2-id>"]'

# Create DocumentDB cluster
aws docdb create-db-cluster \
  --db-cluster-identifier evara-cluster \
  --engine docdb \
  --master-username evaraadmin \
  --master-user-password <strong-password> \
  --db-subnet-group-name evara-docdb-subnet-group \
  --vpc-security-group-ids <db-sg-id> \
  --backup-retention-period 7

# Create instance
aws docdb create-db-instance \
  --db-instance-identifier evara-instance \
  --db-cluster-identifier evara-cluster \
  --engine docdb \
  --db-instance-class db.t3.medium
```

---

## Step 3: Deploy Backend (EC2 with Auto Scaling)

### 3.1 Create Launch Template

```bash
aws ec2 create-launch-template \
  --launch-template-name EvaraBackendTemplate \
  --launch-template-data '{
    "ImageId": "ami-0f5ee92e2d63afc18",
    "InstanceType": "t3.medium",
    "KeyName": "evara-key",
    "SecurityGroupIds": ["<backend-sg-id>"],
    "UserData": "'$(base64 -w 0 user-data.sh)'",
    "IamInstanceProfile": {"Name": "EvaraEC2Role"}
  }'
```

Create `user-data.sh`:

```bash
#!/bin/bash
apt-get update
apt-get install -y nodejs npm nginx git

# Install PM2
npm install -g pm2

# Clone and setup application
cd /opt
git clone https://github.com/yourusername/evara.git
cd evara/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
NODE_ENV=production
MONGODB_URI=<your-docdb-connection-string>
JWT_SECRET=<your-jwt-secret>
FRONTEND_URL=https://your-domain.com
EOF

# Start application with PM2
pm2 start src/server.js --name evara-backend
pm2 startup
pm2 save

# Configure Nginx
cat > /etc/nginx/sites-available/evara << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/evara /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 3.2 Create Auto Scaling Group

```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name EvaraBackendASG \
  --launch-template LaunchTemplateName=EvaraBackendTemplate,Version=1 \
  --min-size 2 \
  --max-size 6 \
  --desired-capacity 2 \
  --vpc-zone-identifier "<public-subnet-1-id>,<public-subnet-2-id>" \
  --target-group-arns <target-group-arn> \
  --health-check-type ELB \
  --health-check-grace-period 300

# Create scaling policies
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name EvaraBackendASG \
  --policy-name ScaleUpPolicy \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://scale-up-config.json
```

`scale-up-config.json`:
```json
{
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ASGAverageCPUUtilization"
  },
  "TargetValue": 70.0
}
```

---

## Step 4: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name EvaraALB \
  --subnets <public-subnet-1-id> <public-subnet-2-id> \
  --security-groups <alb-sg-id> \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create Target Group
aws elbv2 create-target-group \
  --name EvaraBackendTG \
  --protocol HTTP \
  --port 5000 \
  --vpc-id <vpc-id> \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create Listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>

# HTTP to HTTPS redirect
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

---

## Step 5: Deploy Frontend (S3 + CloudFront)

### 5.1 Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://evara-frontend-prod --region ap-south-1

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket evara-frontend-prod \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'

# Set bucket policy for CloudFront access
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "CanonicalUser": "<cloudfront-oai-canonical-user-id>"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::evara-frontend-prod/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket evara-frontend-prod \
  --policy file://bucket-policy.json
```

### 5.2 Create CloudFront Distribution

```bash
# Create Origin Access Identity
aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config '{
    "CallerReference": "evara-oai",
    "Comment": "OAI for Evara Frontend"
  }'

# Create CloudFront distribution
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "evara-distribution-$(date +%s)",
  "Comment": "Evara Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-evara-frontend",
        "DomainName": "evara-frontend-prod.s3.ap-south-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/<oai-id>"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-evara-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "PriceClass": "PriceClass_100",
  "Enabled": true,
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": false,
    "ACMCertificateArn": "<certificate-arn>",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": 200,
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF

aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 5.3 Deploy Frontend Code

```bash
# Build frontend
cd frontend
npm install
npm run build

# Sync to S3
aws s3 sync dist/ s3://evara-frontend-prod/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

---

## Step 6: Configure Route 53

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Create A record for root domain
aws route53 change-resource-record-sets \
  --hosted-zone-id <hosted-zone-id> \
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "yourdomain.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "<cloudfront-domain-name>",
            "EvaluateTargetHealth": false
          }
        }
      }
    ]
  }'

# Create A record for API subdomain
aws route53 change-resource-sets \
  --hosted-zone-id <hosted-zone-id> \
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.yourdomain.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "<alb-hosted-zone-id>",
            "DNSName": "<alb-dns-name>",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'
```

---

## Step 7: CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Deploy to EC2
        run: |
          aws ssm send-command \
            --instance-ids ${{ secrets.EC2_INSTANCE_ID }} \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=["cd /opt/evara/backend && git pull && npm install && pm2 restart evara-backend"]'

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://evara-frontend-prod/ --delete
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## Step 8: Monitoring and Logging

### 8.1 Setup CloudWatch

```bash
# Create CloudWatch log group
aws logs create-log-group --log-group-name /evara/backend

# Set retention
aws logs put-retention-policy \
  --log-group-name /evara/backend \
  --retention-in-days 30
```

### 8.2 Setup Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name EvaraHighCPU \
  --alarm-description "CPU utilization high" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=AutoScalingGroupName,Value=EvaraBackendASG \
  --evaluation-periods 2
```

---

## Cost Estimation (Monthly)

| Service | Instance/Config | Cost (USD) |
|---------|-----------------|------------|
| EC2 (2 instances) | t3.medium | ~$60 |
| DocumentDB | db.t3.medium | ~$50 |
| ALB | - | ~$20 |
| S3 | 10GB | ~$0.50 |
| CloudFront | 100GB transfer | ~$10 |
| Route 53 | 1 hosted zone | ~$0.50 |
| Data Transfer | - | ~$10 |
| **Total** | | **~$150/month** |

---

## Security Checklist

- [ ] Enable MFA for AWS root account
- [ ] Use IAM roles instead of access keys where possible
- [ ] Enable CloudTrail for audit logging
- [ ] Configure AWS Config for compliance
- [ ] Enable GuardDuty for threat detection
- [ ] Use AWS WAF for additional protection
- [ ] Regular security audits
- [ ] Enable encryption at rest and in transit

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs evara-backend

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues
```bash
# Test connectivity
telnet <docdb-endpoint> 27017

# Check security group rules
aws ec2 describe-security-groups --group-ids <db-sg-id>
```

### Frontend not loading
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket evara-frontend-prod

# Check CloudFront distribution status
aws cloudfront get-distribution --id <distribution-id>
```

---

## Support

For issues or questions:
- AWS Documentation: https://docs.aws.amazon.com/
- AWS Support: https://console.aws.amazon.com/support/
