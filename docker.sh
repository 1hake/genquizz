#!/bin/bash

# GenQuizz Docker Management Script

case "$1" in
  "dev")
    echo "Starting development environment..."
    docker-compose up --build
    ;;
  "dev-detached")
    echo "Starting development environment in detached mode..."
    docker-compose up -d --build
    ;;
  "prod-build")
    echo "Building production image..."
    docker build -t genquizz:latest --target production .
    ;;
  "swarm-deploy")
    echo "Deploying to Docker Swarm..."
    docker stack deploy -c docker-compose.swarm.yml genquizz
    ;;
  "swarm-remove")
    echo "Removing from Docker Swarm..."
    docker stack rm genquizz
    ;;
  "logs")
    echo "Following logs..."
    docker-compose logs -f
    ;;
  "stop")
    echo "Stopping containers..."
    docker-compose down
    ;;
  "clean")
    echo "Cleaning up containers and images..."
    docker-compose down --volumes --rmi all
    ;;
  *)
    echo "Usage: $0 {dev|dev-detached|prod-build|swarm-deploy|swarm-remove|logs|stop|clean}"
    echo ""
    echo "Commands:"
    echo "  dev           - Start development environment"
    echo "  dev-detached  - Start development environment in background"
    echo "  prod-build    - Build production Docker image"
    echo "  swarm-deploy  - Deploy to Docker Swarm"
    echo "  swarm-remove  - Remove from Docker Swarm"
    echo "  logs          - Follow container logs"
    echo "  stop          - Stop all containers"
    echo "  clean         - Stop containers and remove volumes/images"
    exit 1
    ;;
esac