// src/services/api/index.ts
import aiToolsService from './ai-tools-service';
import candidatesService from './candidates-service';
import companiesService from './companies-service';
import jobsService from './jobs-service';
import messagesService from './messages-service';
import officesService from './offices-service';
import skillsService from './skills-service';
import usersService from './users-service';
import { fetcher, handleResponse, extractPaginatedItems } from './http-client';
import apiClient from './axios-client';
import * as config from './config';

// Main API service object
export const api = {
  // Core services
  candidates: candidatesService,
  companies: companiesService,
  jobs: jobsService,
  users: usersService,
  messages: messagesService,
  skills: skillsService,
  offices: officesService,
  
  // AI tools
  ...aiToolsService,

  // Expose raw clients for advanced usage if needed
  client: {
    fetch: fetcher,
    axios: apiClient,
    config
  },
  
  // Helpers
  utils: {
    handleResponse,
    extractPaginatedItems
  }
};

export default api;