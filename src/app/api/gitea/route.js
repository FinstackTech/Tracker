import dbConnect from '@/lib/db';
import { Task, Issue, Notification } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const payload = await request.json();
    
    // Gitea Webhook Pushes
    const repo = payload.repository || {};
    const commits = payload.commits || [];
    const ref = payload.ref || '';
    const branch = ref.replace('refs/heads/', '');
    
    if (commits.length === 0) {
      return NextResponse.json({ success: true, message: "No commits to process." });
    }

    let linkedCount = 0;
    let resolvedCount = 0;

    // Process all commits in the push payload
    for (const commit of commits) {
      const msg = commit.message || '';
      
      // Regex to detect pattern: keyword #ID (where ID is 24 hex chars)
      // e.g. "fixes #64821a8d052d921350a41d99"
      const regex = /\b(fixes|resolves|closes|fixed|resolved|closed)?\s*#([0-9a-fA-F]{24})/gi;
      let match;
      
      while ((match = regex.exec(msg)) !== null) {
        const keyword = match[1] ? match[1].toLowerCase() : null;
        const targetId = match[2];
        const isResolution = !!keyword;
        
        // 1. Try to find Task
        const task = await Task.findById(targetId);
        if (task) {
          linkedCount++;
          const shortSha = commit.id ? commit.id.substring(0, 7) : 'commit';
          const authorName = commit.author ? commit.author.name : 'developer';
          
          let historyAction = `Gitea: Commit [${shortSha}] pushed to branch [${branch}] by ${authorName}: "${msg.trim()}"`;
          
          if (isResolution) {
            task.status = 'done';
            historyAction += ' (Auto-Resolved Task)';
            resolvedCount++;
            
            // Send Alert notification
            await Notification.create({
              employeeName: task.owner || 'Team',
              actor: 'Gitea',
              message: `Auto-resolved task "${task.title}" via commit [${shortSha}]`,
              link: 'tasks'
            });
          }
          
          task.history.push({
            actor: 'Gitea Webhook',
            action: historyAction,
            createdAt: new Date()
          });
          
          await task.save();
        } else {
          // 2. Try to find Issue
          const issue = await Issue.findById(targetId);
          if (issue) {
            linkedCount++;
            const shortSha = commit.id ? commit.id.substring(0, 7) : 'commit';
            const authorName = commit.author ? commit.author.name : 'developer';
            
            let historyAction = `Gitea: Commit [${shortSha}] pushed to branch [${branch}] by ${authorName}: "${msg.trim()}"`;
            
            if (isResolution) {
              issue.status = 'resolved';
              issue.resolutionNotes = `Auto-resolved via Gitea commit [${shortSha}] by ${authorName}`;
              historyAction += ' (Auto-Resolved Issue)';
              resolvedCount++;
              
              // Send Alert notification
              await Notification.create({
                employeeName: issue.assignee || 'Team',
                actor: 'Gitea',
                message: `Auto-resolved issue "${issue.title}" via commit [${shortSha}]`,
                link: 'issues'
              });
            }
            
            issue.history.push({
              actor: 'Gitea Webhook',
              action: historyAction,
              createdAt: new Date()
            });
            
            await issue.save();
          }
        }
      }
    }

    // Broadcast a general activity alert in the tracker dashboard notification center
    const leadAuthor = commits[0]?.author?.name || 'Developer';
    const totalCommits = commits.length;
    await Notification.create({
      employeeName: 'Team',
      actor: 'Gitea',
      message: `${leadAuthor} pushed ${totalCommits} commit(s) to repo "${repo.name || 'tracker'}" [${branch}]`,
      link: 'dashboard'
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${totalCommits} commits. Linked: ${linkedCount}, Auto-Resolved: ${resolvedCount}`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 550 });
  }
}
