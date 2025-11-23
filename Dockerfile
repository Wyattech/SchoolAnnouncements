# School Announcements Display - Docker Image
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy application files
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY config.js /usr/share/nginx/html/

# Copy JavaScript modules
COPY js/ /usr/share/nginx/html/js/

# Create a health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Expose port 80
EXPOSE 80

# nginx will run in foreground
CMD ["nginx", "-g", "daemon off;"]
