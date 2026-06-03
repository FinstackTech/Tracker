import dbConnect from '@/lib/db';
import { Project, Task, Issue, DailyLog, Transaction } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { jsonrpc, method, params, id } = body;

    if (jsonrpc !== '2.0') {
      return NextResponse.json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
        id: id || null
      }, { status: 400 });
    }

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: 'get_projects',
              description: 'Retrieve all project profiles, details, status summaries and clients.',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'get_tasks',
              description: 'Retrieve tasks for a specific project. Can filter optionally by owner or status.',
              inputSchema: {
                type: 'object',
                properties: {
                  projectId: { type: 'string', description: 'The hex ObjectId of the project' },
                  owner: { type: 'string', description: 'Filter by task owner name' },
                  status: { type: 'string', description: 'Filter by status (not-started, in-progress, done, etc.)' }
                },
                required: ['projectId']
              }
            },
            {
              name: 'get_issues',
              description: 'Retrieve issues / tickets reported for a specific project. Filter optionally by assignee.',
              inputSchema: {
                type: 'object',
                properties: {
                  projectId: { type: 'string', description: 'The hex ObjectId of the project' },
                  assignee: { type: 'string', description: 'Filter by assignee name' }
                },
                required: ['projectId']
              }
            },
            {
              name: 'get_daily_standups',
              description: 'Retrieve daily standups and logged hours for the team members. Filter optionally by date or employee name.',
              inputSchema: {
                type: 'object',
                properties: {
                  employeeName: { type: 'string', description: 'Name of the employee' },
                  date: { type: 'string', description: 'Target date (YYYY-MM-DD)' }
                }
              }
            },
            {
              name: 'get_financials',
              description: 'Retrieve all revenues and expenses recorded for a specific project.',
              inputSchema: {
                type: 'object',
                properties: {
                  projectId: { type: 'string', description: 'The hex ObjectId of the project' }
                },
                required: ['projectId']
              }
            }
          ]
        },
        id
      });
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      let resultData = null;

      switch (name) {
        case 'get_projects': {
          resultData = await Project.find({}).sort({ createdAt: -1 });
          break;
        }
        case 'get_tasks': {
          if (!args?.projectId) {
            return NextResponse.json({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Missing required parameter: projectId' },
              id
            }, { status: 400 });
          }
          const query = { projectId: args.projectId };
          if (args.owner) query.owner = args.owner;
          if (args.status) query.status = args.status;
          resultData = await Task.find(query).populate('epicId').sort({ order: 1, createdAt: 1 });
          break;
        }
        case 'get_issues': {
          if (!args?.projectId) {
            return NextResponse.json({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Missing required parameter: projectId' },
              id
            }, { status: 400 });
          }
          const query = { projectId: args.projectId };
          if (args.assignee) query.assignee = args.assignee;
          resultData = await Issue.find(query).populate('epicId').sort({ createdAt: -1 });
          break;
        }
        case 'get_daily_standups': {
          const query = {};
          if (args?.employeeName) query.employeeName = args.employeeName;
          if (args?.date) query.date = args.date;
          resultData = await DailyLog.find(query).sort({ date: -1, createdAt: -1 });
          break;
        }
        case 'get_financials': {
          if (!args?.projectId) {
            return NextResponse.json({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Missing required parameter: projectId' },
              id
            }, { status: 400 });
          }
          resultData = await Transaction.find({ projectId: args.projectId }).sort({ date: -1 });
          break;
        }
        default: {
          return NextResponse.json({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: Tool "${name}" does not exist` },
            id
          }, { status: 404 });
        }
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(resultData, null, 2)
            }
          ]
        },
        id
      });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32601, message: `Method not found: "${method}"` },
      id
    }, { status: 404 });

  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32000, message: error.message },
      id: null
    }, { status: 500 });
  }
}
