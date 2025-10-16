#!/bin/bash

# BrightFlow ML Kubernetes Deployment Script
# Deploys competitive intelligence system to local kubeadm cluster

set -e

echo "🚀 Deploying BrightFlow ML Competitive Intelligence System"
echo "=========================================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Create configmap
echo "⚙️  Creating configuration..."
kubectl apply -f configmap.yaml

# Create app code configmap
echo "📝 Creating app code configmap..."
kubectl apply -f configmap-app-code.yaml

# Create secret (you'll need to update this with your actual GitHub token)
echo "🔐 Creating secrets..."
echo "⚠️  Please update the GitHub token in secret.yaml before proceeding"
read -p "Press Enter to continue after updating the secret..."

kubectl apply -f secret.yaml

# Create PVC
echo "💾 Creating persistent volume claim..."
kubectl apply -f pvc.yaml

# Wait for PVC to be bound
echo "⏳ Waiting for PVC to be bound..."
kubectl wait --for=condition=Bound pvc/brightflow-data-pvc -n brightflow-ml --timeout=60s

# Deploy applications
echo "🚀 Deploying applications..."

echo "   Deploying competitor monitor..."
kubectl apply -f competitor-monitor-deployment.yaml

echo "   Deploying ML learning system..."
kubectl apply -f ml-learning-deployment.yaml

echo "   Deploying site data reader..."
kubectl apply -f site-data-reader-deployment.yaml

echo "   Deploying cronjob..."
kubectl apply -f cronjob.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/competitor-monitor -n brightflow-ml --timeout=300s
kubectl wait --for=condition=available deployment/ml-learning -n brightflow-ml --timeout=300s
kubectl wait --for=condition=available deployment/site-data-reader -n brightflow-ml --timeout=300s

echo "✅ All deployments are ready!"

# Show status
echo ""
echo "📊 Deployment Status:"
echo "===================="
kubectl get pods -n brightflow-ml
echo ""
kubectl get services -n brightflow-ml
echo ""
kubectl get cronjobs -n brightflow-ml

echo ""
echo "🎉 BrightFlow ML Competitive Intelligence System deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Check pod logs: kubectl logs -f deployment/competitor-monitor -n brightflow-ml"
echo "2. Check cronjob: kubectl get cronjobs -n brightflow-ml"
echo "3. Run manual job: kubectl create job --from=cronjob/competitive-intelligence manual-run-$(date +%s) -n brightflow-ml"
echo "4. Check data: kubectl exec -it deployment/competitor-monitor -n brightflow-ml -- ls -la /data"
echo ""
echo "🌐 Your system is now running 24/7 in Kubernetes!"
echo "   - Competitor monitoring: Every 15 minutes"
echo "   - ML learning: Every 6 hours"
echo "   - Site data reading: Every 30 minutes"
echo "   - Full analysis: Every 6 hours via cronjob"
