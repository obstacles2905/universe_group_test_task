#!/bin/bash
set -euo pipefail

QUEUE_NAME=${QUEUE_NAME:-products-events}
AWS_REGION=${AWS_REGION:-us-east-1}

echo "Creating SQS queue ${QUEUE_NAME} in region ${AWS_REGION}"
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name "${QUEUE_NAME}" --attributes VisibilityTimeout=30 >/dev/null

echo "Queues available:"
aws --endpoint-url=http://localhost:4566 sqs list-queues || true

