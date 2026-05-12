## 1. Use an official lightweight  Node.js runtime as a base image
FROM node:20-alpine  
# 2. Set the working directory inside the container
WORKDIR /app
# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install 
# 4. Copy the rest of your app's source code
COPY . . 
# 5. Expose the port your app runs on (usually 3000 for Express)
EXPOSE 3000
# 6. Command to run your app
CMD ["npm", "start"] 
