import { NextResponse } from 'next/server';

export async function GET() {
  const schema = {
    openapi: "3.0.0",
    info: {
      title: "PPM Workspace Tracker API",
      description: "REST API endpoints for querying and modifying projects, tasks, issues, daily standups, and financials in the Enterprise Collaboration Tracker.",
      version: "1.0.0"
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server"
      }
    ],
    paths: {
      "/api/projects": {
        "get": {
          "summary": "Fetch all project profiles",
          "operationId": "getProjects",
          "responses": {
            "200": {
              "description": "Returns list of projects",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": { "type": "boolean" },
                      "data": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "_id": { "type": "string" },
                            "name": { "type": "string" },
                            "code": { "type": "string" },
                            "client": { "type": "string" },
                            "type": { "type": "string" },
                            "status": { "type": "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "post": {
          "summary": "Create a new project profile",
          "operationId": "createProject",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["name", "code"],
                  "properties": {
                    "name": { "type": "string" },
                    "code": { "type": "string", "description": "Short code e.g. DIB-CORE" },
                    "client": { "type": "string" },
                    "type": { "type": "string", "enum": ["delivery", "maintenance"] }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Project created successfully"
            }
          }
        }
      },
      "/api/tasks": {
        "get": {
          "summary": "Fetch tasks for a specific project",
          "operationId": "getTasks",
          "parameters": [
            {
              "name": "projectId",
              "in": "query",
              "required": true,
              "schema": { "type": "string" },
              "description": "Project Object ID"
            },
            {
              "name": "owner",
              "in": "query",
              "required": false,
              "schema": { "type": "string" },
              "description": "Filter by task owner"
            }
          ],
          "responses": {
            "200": {
              "description": "List of tasks"
            }
          }
        },
        "post": {
          "summary": "Create a new task",
          "operationId": "createTask",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["projectId", "title"],
                  "properties": {
                    "projectId": { "type": "string" },
                    "title": { "type": "string" },
                    "owner": { "type": "string" },
                    "status": { "type": "string" },
                    "storyPoints": { "type": "number" },
                    "dueDate": { "type": "string" },
                    "priority": { "type": "string" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Task created successfully"
            }
          }
        }
      },
      "/api/issues": {
        "get": {
          "summary": "Fetch support issues and bugs for a project",
          "operationId": "getIssues",
          "parameters": [
            {
              "name": "projectId",
              "in": "query",
              "required": true,
              "schema": { "type": "string" },
              "description": "Project Object ID"
            }
          ],
          "responses": {
            "200": {
              "description": "List of issues"
            }
          }
        },
        "post": {
          "summary": "File a new issue or bug",
          "operationId": "createIssue",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["projectId", "title"],
                  "properties": {
                    "projectId": { "type": "string" },
                    "title": { "type": "string" },
                    "description": { "type": "string" },
                    "priority": { "type": "string", "enum": ["lowest", "low", "medium", "high", "critical"] },
                    "type": { "type": "string", "enum": ["bug", "incident", "vulnerability", "support"] },
                    "assignee": { "type": "string" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Issue created successfully"
            }
          }
        }
      },
      "/api/logs": {
        "get": {
          "summary": "Fetch daily standup logs",
          "operationId": "getDailyLogs",
          "parameters": [
            {
              "name": "employeeName",
              "in": "query",
              "schema": { "type": "string" }
            },
            {
              "name": "date",
              "in": "query",
              "schema": { "type": "string" },
              "description": "YYYY-MM-DD"
            }
          ],
          "responses": {
            "200": {
              "description": "List of logs"
            }
          }
        },
        "post": {
          "summary": "Log a daily activity standup entry",
          "operationId": "createDailyLog",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["employeeName", "projectId", "taskDescription", "hoursSpent", "date"],
                  "properties": {
                    "employeeName": { "type": "string" },
                    "projectId": { "type": "string" },
                    "taskDescription": { "type": "string" },
                    "hoursSpent": { "type": "number" },
                    "date": { "type": "string" },
                    "status": { "type": "string", "enum": ["in-progress", "completed", "blocked"] },
                    "blockers": { "type": "string" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Standup logged"
            }
          }
        }
      }
    }
  };

  return NextResponse.json(schema);
}
