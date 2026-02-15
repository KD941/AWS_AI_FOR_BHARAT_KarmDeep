# KarmDeep Platform - Deployment Guide

## Prerequisites

### Required Tools
- Node.js 18+ and npm 9+
- AWS CLI configured with appropriate credentials
- Terraform 1.5+
- Git

### AWS Account Requirements
- Active AWS account
- IAM user with administrator access (or specific permissions)
- AWS CLI configured: `aws configure`

### Required AWS Permissions
- Lambda (create, update, delete functions)
- DynamoDB (create, update tables)
- S3 (create, manage buckets)
- API Gateway (create, manage APIs)
- Cognito (create user pools)
- IAM (create roles and policies)
- CloudWatch (create log groups)
- SNS/SQS (create topics and queues)

---

## Step 1: Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd karmdeep-platform

# Install root dependencies
npm install

# Install backend dependencies
cd backend/shared && npm install && npm run build
cd ../services/vendor && npm install
cd ../services/tender && npm install
cd ../services/order && npm install
cd ../services/maintenance && npm install
cd ../services/analytics && npm install
```

---

## Step 2: Configure Environment

### Create Environment Files

```bash
# Development environment
cp infrastructure/environments/dev.tfvars.example infrastructure/environments/dev.tfvars

# Production environment
cp infrastructure/environments/prod.tfvars.example infrastructure/environments/prod.tfvars
```

### Edit Configuration

Edit `infrastructure/environments/dev.tfvars`:
```hcl
environment                   = "dev"
aws_region                    = "us-east-1"
vpc_cidr                      = "10.0.0.0/16"
availability_zones            = ["us-east-1a", "us-east-1b"]
enable_nat_gateway            = false
dynamodb_billing_mode         = "PAY_PER_REQUEST"
enable_point_in_time_recovery = false
cognito_mfa_configuration     = "OPTIONAL"
api_throttle_burst_limit      = 1000
api_throttle_rate_limit       = 2000
```

---

## Step 3: Deploy Infrastructure

### Initialize Terraform

```bash
cd infrastructure
terraform init
```

### Plan Deployment

```bash
# Review what will be created
terraform plan -var-file=environments/dev.tfvars
```

### Apply Infrastructure

```bash
# Deploy to AWS
terraform apply -var-file=environments/dev.tfvars

# Type 'yes' when prompted
```

### Save Outputs

```bash
# Save important outputs
terraform output > ../outputs.txt
```

---

## Step 4: Build Lambda Functions

```bash
cd ../backend

# Build shared library
cd shared
npm run build

# Build each service
cd ../services/vendor
npm run build
npm run package

cd ../tender
npm run build
npm run package

cd ../order
npm run build
npm run package

cd ../maintenance
npm run build
npm run package

cd ../analytics
npm run build
npm run package
```

---

## Step 5: Deploy Lambda Functions

### Using AWS CLI

```bash
# Get function names from Terraform outputs
VENDOR_FUNCTION=$(terraform output -raw vendor_function_name)
TENDER_FUNCTION=$(terraform output -raw tender_function_name)
ORDER_FUNCTION=$(terraform output -raw order_function_name)
MAINTENANCE_FUNCTION=$(terraform output -raw maintenance_function_name)
ANALYTICS_FUNCTION=$(terraform output -raw analytics_function_name)

# Deploy functions
aws lambda update-function-code \
  --function-name $VENDOR_FUNCTION \
  --zip-file fileb://backend/services/vendor/function.zip

aws lambda update-function-code \
  --function-name $TENDER_FUNCTION \
  --zip-file fileb://backend/services/tender/function.zip

aws lambda update-function-code \
  --function-name $ORDER_FUNCTION \
  --zip-file fileb://backend/services/order/function.zip

aws lambda update-function-code \
  --function-name $MAINTENANCE_FUNCTION \
  --zip-file fileb://backend/services/maintenance/function.zip

aws lambda update-function-code \
  --function-name $ANALYTICS_FUNCTION \
  --zip-file fileb://backend/services/analytics/function.zip
```

### Using AWS Console

1. Go to AWS Lambda Console
2. Find each function
3. Upload the corresponding `function.zip` file
4. Click "Deploy"

---

## Step 6: Configure Cognito

### Create User Pool

```bash
# Get Cognito User Pool ID from Terraform outputs
USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@karmdeep.com \
  --user-attributes Name=email,Value=admin@karmdeep.com Name=custom:role,Value=ADMIN \
  --temporary-password TempPass123!
```

---

## Step 7: Test Deployment

### Get API Gateway URL

```bash
API_URL=$(terraform output -raw api_gateway_url)
echo "API URL: $API_URL"
```

### Test Health Endpoint

```bash
curl $API_URL/health
```

### Test Authentication

```bash
# Get JWT token from Cognito
# (Use AWS Console or Cognito SDK)

# Test authenticated endpoint
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  $API_URL/vendors
```

---

## Step 8: Configure CloudWatch Alarms

### Create Alarms

```bash
# Lambda errors alarm
aws cloudwatch put-metric-alarm \
  --alarm-name karmdeep-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name karmdeep-api-5xx-errors \
  --alarm-description "Alert on API 5xx errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## Step 9: Setup Monitoring

### Enable X-Ray Tracing

```bash
# Enable X-Ray for Lambda functions
aws lambda update-function-configuration \
  --function-name $VENDOR_FUNCTION \
  --tracing-config Mode=Active
```

### Create CloudWatch Dashboard

1. Go to CloudWatch Console
2. Create new dashboard: "KarmDeep-Platform"
3. Add widgets for:
   - Lambda invocations
   - API Gateway requests
   - DynamoDB read/write capacity
   - Error rates

---

## Step 10: Configure CI/CD (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy with Terraform
        run: |
          cd infrastructure
          terraform init
          terraform apply -auto-approve -var-file=environments/prod.tfvars
```

---

## Rollback Procedure

### Rollback Lambda Functions

```bash
# List function versions
aws lambda list-versions-by-function --function-name $VENDOR_FUNCTION

# Rollback to previous version
aws lambda update-alias \
  --function-name $VENDOR_FUNCTION \
  --name production \
  --function-version <previous-version>
```

### Rollback Infrastructure

```bash
cd infrastructure
terraform apply -var-file=environments/dev.tfvars -target=<resource>
```

---

## Troubleshooting

### Lambda Function Errors

```bash
# View logs
aws logs tail /aws/lambda/$VENDOR_FUNCTION --follow

# Check function configuration
aws lambda get-function-configuration --function-name $VENDOR_FUNCTION
```

### API Gateway Issues

```bash
# Test API Gateway
aws apigateway test-invoke-method \
  --rest-api-id <api-id> \
  --resource-id <resource-id> \
  --http-method GET
```

### DynamoDB Issues

```bash
# Check table status
aws dynamodb describe-table --table-name KarmDeepMainTable

# View table metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=KarmDeepMainTable \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## Cost Optimization

### Monitor Costs

```bash
# Get cost and usage
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

### Optimization Tips

1. **Lambda**: Use provisioned concurrency only for critical functions
2. **DynamoDB**: Use on-demand billing for unpredictable workloads
3. **S3**: Enable lifecycle policies to move old data to cheaper storage
4. **API Gateway**: Enable caching for frequently accessed endpoints
5. **CloudWatch**: Set log retention periods appropriately

---

## Security Checklist

- [ ] Enable MFA for AWS root account
- [ ] Use IAM roles with least privilege
- [ ] Enable CloudTrail for audit logging
- [ ] Enable AWS Config for compliance
- [ ] Encrypt all data at rest and in transit
- [ ] Enable AWS WAF for API Gateway
- [ ] Set up AWS GuardDuty for threat detection
- [ ] Regular security audits
- [ ] Rotate credentials regularly
- [ ] Enable VPC Flow Logs

---

## Production Checklist

- [ ] Infrastructure deployed successfully
- [ ] All Lambda functions deployed and tested
- [ ] Cognito user pool configured
- [ ] API Gateway endpoints tested
- [ ] CloudWatch alarms configured
- [ ] X-Ray tracing enabled
- [ ] Backup and recovery tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained on operations
- [ ] Monitoring dashboard created
- [ ] Incident response plan documented
- [ ] CI/CD pipeline configured

---

## Support

For issues or questions:
- Email: support@karmdeep.com
- Slack: #karmdeep-platform
- Documentation: https://docs.karmdeep.com
