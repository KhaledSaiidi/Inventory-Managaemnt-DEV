# Use an official OpenJDK 17 runtime as a parent image
FROM openjdk:17-jdk-slim

# Install curl
RUN apt-get update && apt-get install -y curl

# Set the working directory in the container
WORKDIR /app

# Copy the built jar file
COPY target/*.jar /app/config-server.jar

# Copy the wait-for scripts
COPY wait-for-keycloak.sh /usr/local/bin/wait-for-keycloak.sh
COPY wait-for-eureka.sh /usr/local/bin/wait-for-eureka.sh

# Make the scripts executable
RUN chmod +x /usr/local/bin/wait-for-keycloak.sh
RUN chmod +x /usr/local/bin/wait-for-eureka.sh

# Expose the port on which the app runs
EXPOSE 8888

# Set environment variable for Keycloak hostname (default value 'localhost')
ENV KEYCLOAK_HOSTNAME keycloak


# Run the jar file
ENTRYPOINT ["sh", "-c", "/usr/local/bin/wait-for-keycloak.sh && /usr/local/bin/wait-for-eureka.sh && exec java -jar /app/config-server.jar"]
