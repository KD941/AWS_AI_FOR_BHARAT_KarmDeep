# KarmDeep Platform

A unified B2B SaaS platform for industrial machinery lifecycle management.

## Overview

KarmDeep automates the entire lifecycle of industrial machines (VMC, CNC, 3D printers, etc.) from discovery, comparison, tendering, purchase, delivery, installation, maintenance, resale, and analytics.

## Architecture

- **Cloud Provider**: AWS
- **Architecture**: Serverless-first, event-driven microservices
- **Infrastructure as Code**: Terraform
- **Backend**: Node.js with AWS Lambda
- **Database**: DynamoDB (NoSQL)
- **Storage**: S3
- **Authentication**: AWS Cognito
- **API**: AWS API Gateway (REST)

## Project Structure

```
karmdeep-platform/
├── infrastructure/          # Terraform IaC configurations
├── backend/                # Lambda functions and business logic
├── frontend/               # React web application
├── shared/                 # Shared utilities and types
├── docs/                   # Documentation
└── tests/                  # Test suites
```

## Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Terraform 1.5+
- AWS Account with appropriate permissions

### Installation

```bash
# Install dependencies
npm install

# Configure AWS credentials
aws configure

# Initialize Terraform
cd infrastructure
terraform init
```

## Development

See individual module READMEs for specific development instructions.

## License

Proprietary - All rights reserved
