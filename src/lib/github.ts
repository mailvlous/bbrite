import yaml from "js-yaml";

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  content: string;
  isFile: boolean;
}

export interface Post {
  slug: string;
  title: string;
  content: string;
  frontmatter: {
    title: string;
    draft?: boolean;
    tags?: string[];
    [key: string]: any;
  };
  sha: string;
  path: string;
}

export class GitHubAPI {
  private owner: string;
  private repo: string;
  private branch: string;
  private contentPath: string;
  private token: string;
  private apiBase = "https://api.github.com";

  constructor(
    owner: string,
    repo: string,
    branch: string,
    contentPath: string,
    token: string
  ) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.contentPath = contentPath;
    this.token = token;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `token ${this.token}`,
      Accept: "application/vnd.github.v3.raw+json",
      "Content-Type": "application/json",
    };
  }

  async getFile(path: string): Promise<GitHubFile | null> {
    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`,
        { headers: this.headers() }
      );

      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

      const data = await response.json();

      return {
        name: data.name,
        path: data.path,
        sha: data.sha,
        content: data.content,
        isFile: data.type === "file",
      };
    } catch (error) {
      console.error("Error fetching from GitHub:", error);
      throw error;
    }
  }

  async listFiles(path: string): Promise<GitHubFile[]> {
    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`,
        { headers: this.headers() }
      );

      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

      const data = await response.json();

      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        content: "",
        isFile: item.type === "file",
      }));
    } catch (error) {
      console.error("Error listing files on GitHub:", error);
      throw error;
    }
  }

  parseFrontmatter(
    content: string
  ): { frontmatter: Record<string, any>; body: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!match) {
      return { frontmatter: {}, body: content };
    }

    const frontmatterText = match[1];
    const body = match[2];

    try {
      const frontmatter = yaml.load(frontmatterText) as Record<string, any>;
      return { frontmatter: frontmatter || {}, body };
    } catch (error) {
      console.error("Error parsing frontmatter:", error);
      return { frontmatter: {}, body: content };
    }
  }

  formatFrontmatter(frontmatter: Record<string, any>): string {
    return `---\n${yaml.dump(frontmatter, { lineWidth: -1 })}---\n`;
  }

  async getPost(slug: string): Promise<Post | null> {
    const path = `${this.contentPath}/${slug}.md`;

    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`,
        { headers: this.headers() }
      );

      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

      const data = await response.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");

      const { frontmatter, body } = this.parseFrontmatter(content);

      return {
        slug,
        title: frontmatter.title || slug,
        content: body,
        frontmatter,
        sha: data.sha,
        path: data.path,
      };
    } catch (error) {
      console.error(`Error fetching post ${slug}:`, error);
      return null;
    }
  }

  async listPosts(): Promise<Post[]> {
    const posts: Post[] = [];

    async function traverse(dirPath: string): Promise<void> {
      try {
        const files = await this.listFiles(dirPath);

        for (const file of files) {
          if (!file.isFile) {
            await traverse(file.path);
          } else if (file.name.endsWith(".md") && !file.name.startsWith(".")) {
            const fullContent = await this.getFile(file.path);
            if (fullContent) {
              const content = Buffer.from(
                fullContent.content,
                "base64"
              ).toString("utf-8");
              const { frontmatter, body } = this.parseFrontmatter(content);

              if (frontmatter.draft === true) continue;

              const slug = file.name.replace(/\.md$/, "");
              posts.push({
                slug,
                title: frontmatter.title || slug,
                content: body,
                frontmatter,
                sha: file.sha,
                path: file.path,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error traversing ${dirPath}:`, error);
      }
    }

    await traverse.call(this, this.contentPath);
    return posts.sort(
      (a, b) =>
        new Date(b.frontmatter.date || 0).getTime() -
        new Date(a.frontmatter.date || 0).getTime()
    );
  }

  async createFile(
    path: string,
    content: string,
    message: string
  ): Promise<{ sha: string }> {
    const response = await fetch(
      `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          branch: this.branch,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create file: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return { sha: data.content.sha };
  }

  async updateFile(
    path: string,
    content: string,
    sha: string,
    message: string
  ): Promise<{ sha: string }> {
    const response = await fetch(
      `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          sha,
          branch: this.branch,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update file: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return { sha: data.content.sha };
  }

  async deleteFile(path: string, sha: string, message: string): Promise<void> {
    const response = await fetch(
      `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`,
      {
        method: "DELETE",
        headers: this.headers(),
        body: JSON.stringify({
          message,
          sha,
          branch: this.branch,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete file: ${JSON.stringify(error)}`);
    }
  }
}

export function createGitHubAPI(env: any): GitHubAPI {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }

  return new GitHubAPI(
    env.GITHUB_OWNER || "mailvlous",
    env.GITHUB_REPO || "garden",
    env.GITHUB_BRANCH || "v4",
    env.CONTENT_PATH || "content",
    token
  );
}

export async function getPost(env: any, slug: string): Promise<Post | null> {
  const api = createGitHubAPI(env);
  return await api.getPost(slug);
}

export async function listPosts(env: any): Promise<Post[]> {
  const api = createGitHubAPI(env);
  return await api.listPosts();
}

export async function writePost(
  env: any,
  slug: string,
  content: string,
  message: string
): Promise<{ content: { sha: string } }> {
  const api = createGitHubAPI(env);
  const contentPath = env.CONTENT_PATH || "content";
  const path = `${contentPath}/${slug}.md`;
  
  try {
    // Try to get the existing file first to check if it exists
    const existing = await api.getPost(slug);
    if (existing) {
      const result = await api.updateFile(path, content, existing.sha, message);
      return { content: { sha: result.sha } };
    }
  } catch {
    // File doesn't exist, will create it
  }
  
  // Create the file if it doesn't exist
  const result = await api.createFile(path, content, message);
  return { content: { sha: result.sha } };
}
