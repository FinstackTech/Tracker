/**
 * PPM Tracker - Automated API Integration Tester
 * Run: node src/scripts/test-app.js
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting Automated API Integration Tests...\n');
  
  // Helper to print test result
  const report = (name, success, errorMsg = '') => {
    if (success) {
      console.log(`✅ [PASS] ${name}`);
    } else {
      console.log(`❌ [FAIL] ${name} ${errorMsg ? `(${errorMsg})` : ''}`);
    }
  };

  try {
    // Check if server is running
    const pingRes = await fetch(`${BASE_URL}/api/projects`).catch(() => null);
    if (!pingRes) {
      console.error(`❌ Error: Next.js dev server is not running at ${BASE_URL}.`);
      console.error('Please ensure "npm run dev" is running in the background before starting tests!\n');
      process.exit(1);
    }

    // 1. GET /api/projects
    let projects = [];
    try {
      const res = await fetch(`${BASE_URL}/api/projects`);
      const data = await res.json();
      projects = data.data || [];
      report('GET /api/projects', data.success && Array.isArray(projects));
    } catch (e) {
      report('GET /api/projects', false, e.message);
    }

    // 2. POST /api/projects
    let testProject = null;
    try {
      const res = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Automated Test Project Workspace',
          code: 'AUTO-TEST',
          client: 'Test Runner',
          type: 'delivery',
          status: 'active'
        })
      });
      const data = await res.json();
      testProject = data.data;
      report('POST /api/projects (Create Project)', data.success && testProject && testProject._id);
    } catch (e) {
      report('POST /api/projects', false, e.message);
    }

    const targetProjId = testProject ? testProject._id : (projects[0] ? projects[0]._id : null);
    if (!targetProjId) {
      console.error('❌ Skipping dependent tests because no projectId is available.');
      process.exit(1);
    }

    // 3. POST /api/tasks
    let testTask = null;
    try {
      const res = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProjId,
          title: 'Automated Diagnostic Task Run',
          category: 'Testing',
          owner: 'Ilyas',
          status: 'in-progress',
          manDays: 2,
          priority: 'high',
          storyPoints: 5,
          notes: 'Test runner diagnostic entry'
        })
      });
      const data = await res.json();
      testTask = data.data;
      report('POST /api/tasks (Create Task)', data.success && testTask && testTask._id);
    } catch (e) {
      report('POST /api/tasks', false, e.message);
    }

    // 4. GET /api/tasks
    try {
      const res = await fetch(`${BASE_URL}/api/tasks?projectId=${targetProjId}`);
      const data = await res.json();
      report('GET /api/tasks (Query tasks)', data.success && Array.isArray(data.data));
    } catch (e) {
      report('GET /api/tasks', false, e.message);
    }

    // 5. POST /api/issues
    let testIssue = null;
    try {
      const res = await fetch(`${BASE_URL}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProjId,
          title: 'Automated Test Defect Entry',
          description: 'Automatic test runner issue validation',
          type: 'bug',
          priority: 'critical',
          status: 'open',
          assignee: 'Susanth',
          reporter: 'Test Runner'
        })
      });
      const data = await res.json();
      testIssue = data.data;
      report('POST /api/issues (Create Issue)', data.success && testIssue && testIssue._id);
    } catch (e) {
      report('POST /api/issues', false, e.message);
    }

    // 6. GET /api/issues
    try {
      const res = await fetch(`${BASE_URL}/api/issues?projectId=${targetProjId}`);
      const data = await res.json();
      report('GET /api/issues (Query issues)', data.success && Array.isArray(data.data));
    } catch (e) {
      report('GET /api/issues', false, e.message);
    }

    // 7. POST /api/epics
    let testEpic = null;
    try {
      const res = await fetch(`${BASE_URL}/api/epics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProjId,
          name: 'E2E Testing Module',
          color: '#8b5cf6'
        })
      });
      const data = await res.json();
      testEpic = data.data;
      report('POST /api/epics (Create Epic)', data.success && testEpic && testEpic._id);
    } catch (e) {
      report('POST /api/epics', false, e.message);
    }

    // 8. GET /api/epics
    try {
      const res = await fetch(`${BASE_URL}/api/epics?projectId=${targetProjId}`);
      const data = await res.json();
      report('GET /api/epics (Query epics)', data.success && Array.isArray(data.data));
    } catch (e) {
      report('GET /api/epics', false, e.message);
    }

    // 9. POST /api/financials
    let testTrans = null;
    try {
      const res = await fetch(`${BASE_URL}/api/financials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProjId,
          date: '2026-06-03',
          type: 'expense',
          category: 'Software license',
          description: 'Automated tests tools cost',
          amount: 250,
          status: 'paid'
        })
      });
      const data = await res.json();
      testTrans = data.data;
      report('POST /api/financials (Create Transaction)', data.success && testTrans && testTrans._id);
    } catch (e) {
      report('POST /api/financials', false, e.message);
    }

    // 10. GET /api/financials
    try {
      const res = await fetch(`${BASE_URL}/api/financials?projectId=${targetProjId}`);
      const data = await res.json();
      report('GET /api/financials (Query financials)', data.success && Array.isArray(data.data));
    } catch (e) {
      report('GET /api/financials', false, e.message);
    }

    // 11. GET /api/integrations
    try {
      const res = await fetch(`${BASE_URL}/api/integrations`);
      const data = await res.json();
      report('GET /api/integrations', data.success);
    } catch (e) {
      report('GET /api/integrations', false, e.message);
    }

    // 12. GET /api/leaves
    try {
      const res = await fetch(`${BASE_URL}/api/leaves`);
      const data = await res.json();
      report('GET /api/leaves', data.success && Array.isArray(data.data));
    } catch (e) {
      report('GET /api/leaves', false, e.message);
    }

    // 13. GET /api/notifications
    try {
      const res = await fetch(`${BASE_URL}/api/notifications?employeeName=Ilyas`);
      const data = await res.json();
      report('GET /api/notifications', data.success && Array.isArray(data.data));
    } catch (e) {
      report('GET /api/notifications', false, e.message);
    }

    // 14. GET /api/openapi
    try {
      const res = await fetch(`${BASE_URL}/api/openapi`);
      const data = await res.json();
      report('GET /api/openapi Schema', data.openapi === '3.0.0');
    } catch (e) {
      report('GET /api/openapi', false, e.message);
    }

    // 15. POST /api/mcp (Tools List)
    try {
      const res = await fetch(`${BASE_URL}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 'test-123'
        })
      });
      const data = await res.json();
      report('POST /api/mcp (JSON-RPC tools/list)', data.jsonrpc === '2.0' && data.result && Array.isArray(data.result.tools));
    } catch (e) {
      report('POST /api/mcp', false, e.message);
    }

    // 16. POST /api/gitea Webhook Auto-Resolve
    if (testTask) {
      try {
        const res = await fetch(`${BASE_URL}/api/gitea`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repository: { name: 'PPM-Tracker-Repo' },
            ref: 'refs/heads/main',
            commits: [
              {
                id: '9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a',
                message: `fixes #${testTask._id} resolves task`,
                author: { name: 'Ilyas' }
              }
            ]
          })
        });
        const data = await res.json();
        report('POST /api/gitea (Webhook Auto-Resolve Task)', data.success && data.message.includes('Auto-Resolved: 1'));
      } catch (e) {
        report('POST /api/gitea', false, e.message);
      }
    }

    // Clean up temporary Task, Epic, Issue, Transaction, and Project
    console.log('\n🧹 Cleaning up temporary test records...');
    
    if (testTask) {
      const res = await fetch(`${BASE_URL}/api/tasks?id=${testTask._id}`, { method: 'DELETE' });
      const data = await res.json();
      report('DELETE /api/tasks Cleanup', data.success);
    }

    if (testEpic) {
      const res = await fetch(`${BASE_URL}/api/epics?id=${testEpic._id}`, { method: 'DELETE' });
      const data = await res.json();
      report('DELETE /api/epics Cleanup', data.success);
    }

    if (testIssue) {
      const res = await fetch(`${BASE_URL}/api/issues?id=${testIssue._id}`, { method: 'DELETE' });
      const data = await res.json();
      report('DELETE /api/issues/ Cleanup', data.success);
    }

    if (testTrans) {
      const res = await fetch(`${BASE_URL}/api/financials?id=${testTrans._id}`, { method: 'DELETE' });
      const data = await res.json();
      report('DELETE /api/financials Cleanup', data.success);
    }

    if (testProject) {
      const res = await fetch(`${BASE_URL}/api/projects?id=${testProject._id}`, { method: 'DELETE' });
      const data = await res.json();
      report('DELETE /api/projects Cleanup', data.success);
    }

    console.log('\n🌟 Integration testing validation sequence finished!\n');

  } catch (err) {
    console.error('Fatal Integration Test Runner Failure:', err);
  }
}

runTests();
