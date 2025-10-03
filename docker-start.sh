#!/bin/bash

# AI Act Navigator - Docker Startup Script
# This script manages the Docker deployment of the AI Act Navigator

set -e

echo "🐳 AI Act Navigator - Docker Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

print_success "docker-compose is available"

# Stop existing containers if they exist
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove existing containers and volumes if requested
if [[ "$1" == "--clean" ]]; then
    print_warning "Cleaning up existing data..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
fi

# Build and start the services
print_status "Building and starting AI Act Navigator..."
docker-compose up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."

# Wait for PostgreSQL
print_status "Waiting for PostgreSQL..."
timeout=60
while ! docker-compose exec -T postgres pg_isready -U ai_act_admin -d ai_act_navigator > /dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL failed to start within 60 seconds"
        docker-compose logs postgres
        exit 1
    fi
    sleep 2
    timeout=$((timeout-2))
done
print_success "PostgreSQL is ready"

# Wait for the application
print_status "Waiting for AI Act Navigator application..."
timeout=120
while ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        print_error "Application failed to start within 120 seconds"
        docker-compose logs app
        exit 1
    fi
    sleep 3
    timeout=$((timeout-3))
done
print_success "AI Act Navigator is ready"

# Show status
print_status "Deployment completed successfully!"
echo ""
echo "🌐 Application URL: http://localhost:5000"
echo "🗄️ Database: PostgreSQL on localhost:5432"
echo "📊 Redis: localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    docker-compose down"
echo "  Restart:          docker-compose restart"
echo "  Database shell:   docker-compose exec postgres psql -U ai_act_admin -d ai_act_navigator"
echo "  App shell:        docker-compose exec app sh"
echo ""
print_success "AI Act Navigator is now running!"
