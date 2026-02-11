import { readFileSync, writeFileSync } from "fs";

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, "utf-8"));
const eventName = process.env.GITHUB_EVENT_NAME!;
const repo = process.env.GITHUB_REPOSITORY!;
const issueNumber: number = event.issue.number;

async function gh(...args: string[]): Promise<string> {
  const proc = Bun.spawn(["gh", ...args], { stdout: "pipe", stderr: "inherit" });
  const stdout = await new Response(proc.stdout).text();
  await proc.exited;
  return stdout.trim();
}

let reactionId: string | null = null;
let reactionTarget: "comment" | "issue" = "issue";
let commentId: number | null = null;

try {
  if (eventName === "issue_comment") {
    commentId = event.comment.id;
    reactionId = await gh(
      "api", `repos/${repo}/issues/comments/${commentId}/reactions`,
      "-f", "content=eyes", "--jq", ".id"
    );
    reactionTarget = "comment";
  } else {
    reactionId = await gh(
      "api", `repos/${repo}/issues/${issueNumber}/reactions`,
      "-f", "content=eyes", "--jq", ".id"
    );
  }
} catch (e) {
  console.error("Failed to add reaction:", e);
}

// Write reaction state so main.ts can clean it up
writeFileSync("/tmp/reaction-state.json", JSON.stringify({
  reactionId,
  reactionTarget,
  commentId,
  issueNumber,
  repo,
}));
