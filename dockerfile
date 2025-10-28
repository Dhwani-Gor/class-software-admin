# 1. Use the official Node.js image as the base image
FROM node:20-alpine

# 2. Set the working directory in the container
WORKDIR /app

# 3. Copy only the package.json and package-lock.json first
COPY package*.json ./

# 4. Install dependencies
RUN npm install --legacy-peer-deps

# 5. Copy the rest of your application code
COPY . .

# 6. Build the Next.js app
RUN npm run build

# 7. Expose port 3000 (container's internal port)
EXPOSE 13000

# 8. Start the app
CMD ["npm", "start"]
